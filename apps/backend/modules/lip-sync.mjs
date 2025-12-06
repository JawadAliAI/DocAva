import customAPI from "./customAPI.mjs";
import { getPhonemes } from "./rhubarbLipSync.mjs";
import { readJsonTranscript, audioFileToBase64, execCommand } from "../utils/files.mjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const lipSync = async ({ messages }) => {
    await Promise.all(
        messages.map(async (message, index) => {
            const audiosDir = path.join(__dirname, "..", "audios");
            const fileNameWav = path.join(audiosDir, `message_${index}.wav`);
            const fileNameMp3 = path.join(audiosDir, `message_${index}.mp3`);

            try {
                // 1. Get Audio from Custom TTS (returns { audio, timings })
                console.log(`Generating audio for message ${index}...`);
                const ttsResult = await customAPI.tts(message.text);

                // Handle both old (Buffer) and new (Object) return types just in case
                const audioBuffer = ttsResult.audio || ttsResult;
                const timings = ttsResult.timings || [];

                // Save as MP3 first (since ElevenLabs/Edge returns MP3)
                fs.writeFileSync(fileNameMp3, Buffer.from(audioBuffer));
                console.log(`Audio saved to ${fileNameMp3}`);

                // Check if we have timings for fast phoneme sync
                if (timings && timings.length > 0) {
                    console.log(`✅ Using Edge TTS Timings + Phoneme Sync (Text -> Phonemes -> Rhubarb)...`);
                    const timingsPath = path.join(audiosDir, `timings_${index}.json`);
                    const outputPath = path.join(audiosDir, `message_${index}.json`);

                    fs.writeFileSync(timingsPath, JSON.stringify(timings));

                    const pythonCommand = process.platform === "win32" ? "python" : "python3";
                    const syncScript = path.join(__dirname, "..", "utils", "phoneme_sync.py");

                    try {
                        await execCommand({
                            command: `${pythonCommand} "${syncScript}" "${timingsPath}" "${outputPath}"`
                        });
                    } catch (err) {
                        console.error("Phoneme sync failed, falling back to audio analysis:", err);
                        // Fallback logic
                        await execCommand({ command: `ffmpeg -y -i "${fileNameMp3}" "${fileNameWav}"` });
                        await getPhonemes({ message: index, messageText: message.text });
                    }

                    // Cleanup
                    if (fs.existsSync(timingsPath)) fs.unlinkSync(timingsPath);

                } else {
                    // Fallback to minimal audio analysis
                    console.log("No timings found, falling back to Rhubarb audio analysis...");
                    // 2. Convert MP3 to WAV for Rhubarb (it needs WAV)
                    try {
                        await execCommand({
                            command: `ffmpeg -y -i "${fileNameMp3}" "${fileNameWav}"`,
                        });
                        console.log(`Converted to ${fileNameWav}`);
                    } catch (error) {
                        console.warn(`⚠️ FFmpeg conversion failed: ${error.message}. Proceeding to phonetic fallback...`);
                    }

                    // 3. Generate Lip Sync (Rhubarb or Phonetic Fallback)
                    await getPhonemes({ message: index, messageText: message.text });
                }

                // 4. Read files and attach to message object
                message.audio = await audioFileToBase64({ fileName: fileNameMp3 });
                message.lipsync = await readJsonTranscript({ fileName: path.join(audiosDir, `message_${index}.json`) });

            } catch (error) {
                console.error(`Error processing message ${index}:`, error);
            }
        })
    );

    return messages;
};

export { lipSync };
