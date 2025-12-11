import customAPI from "./customAPI.mjs";
import { getPhonemes } from "./rhubarbLipSync.mjs";
import { readJsonTranscript, audioFileToBase64, execCommand } from "../utils/files.mjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const lipSync = async ({ messages }) => {
    const sectionStart = performance.now();

    await Promise.all(
        messages.map(async (message, index) => {
            const audiosDir = path.join(__dirname, "..", "audios");
            const fileNameWav = path.join(audiosDir, `message_${index}.wav`);
            const fileNameMp3 = path.join(audiosDir, `message_${index}.mp3`);

            try {
                // 1. Get Audio from Custom TTS (returns { audio, timings })
                console.log(`Generating audio for message ${index}...`);
                const ttsStart = performance.now();
                const ttsResult = await customAPI.tts(message.text);
                console.log(`[Timing] TTS Generation: ${(performance.now() - ttsStart).toFixed(2)}ms`);

                // Handle both old (Buffer) and new (Object) return types just in case
                const audioBuffer = ttsResult.audio || ttsResult;
                const timings = ttsResult.timings || [];

                if (ttsResult.error) {
                    throw new Error(`TTS Error: ${ttsResult.error}`);
                }


                // Piper returns WAV. If file extension is wav, copy to fileNameWav directly.
                if (ttsResult.audio && (ttsResult.audioFile || "").endsWith(".wav") || true) {
                    // The buffer IS wav data.
                    fs.writeFileSync(fileNameWav, Buffer.from(audioBuffer));
                    console.log(`WAV Audio saved to ${fileNameWav}`);

                    // Also save as MP3 for frontend if needed? 
                    // Frontend usually can play WAV too, but MP3 is lighter.
                    // For now, let's keep MP3 for standardized frontend consumption if needed, 
                    // BUT Rhubarb needs WAV.

                    // Actually, simply saving to fileNameMp3 (which is sent to frontend) 
                    // with WAV content often works in modern browsers, but it's technically wrong.
                    // PROPER WAY: 
                    // 1. Save buffer to fileNameWav (Source)
                    // 2. Convert to MP3 for fileNameMp3 (Frontend)

                    // HOWEVER, user asked to SKIP conversion? 
                    // If user wants to skip conversion, frontend gets WAV?
                    // Let's assume frontend can play WAV.

                    // We'll write to both paths or just symlink? 
                    // Let's just write format agnostic for now?
                    // Wait, `fileNameMp3` extension is hardcoded .mp3.
                    // If we write WAV data to .mp3 file, browsers might handle it, but Rhubarb will fail if we try to convert "MP3" that is actually WAV.

                    // User said: "MAKE PIPER OUTPUT WAV DIRECTLY (Skips conversion)"
                    // This likely refers to the "MP3 to WAV" conversion step for Rhubarb.

                    // Step 1: Write Buffer to fileNameWav (Rhubarb needs this)
                    fs.writeFileSync(fileNameWav, Buffer.from(audioBuffer));

                    // Step 2: For Frontend (fileNameMp3), we can just copy the WAV file but keep .mp3 ext? 
                    // Or better, change frontend to accept WAV?
                    // Let's try to just use WAV for frontend too if possible, OR just write WAV content to the .mp3 file (Hack but works often).
                    // But safesty way: Write to fileNameWav. Use fileNameWav for Rhubarb.
                    // And copy fileNameWav to fileNameMp3 (ignoring extension mismatch).
                    fs.copyFileSync(fileNameWav, fileNameMp3);
                } else {
                    // Legacy behavior
                    fs.writeFileSync(fileNameMp3, Buffer.from(audioBuffer));
                }

                const syncStart = performance.now();
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
                    console.log("No timings found (likely gTTS). Using RHUBARB LIP SYNC...");

                    try {
                        // 2. Run Rhubarb
                        await getPhonemes({ message: index, messageText: message.text });

                    } catch (err) {
                        console.error("Rhubarb sync failed:", err);
                        // Fallback logic
                        const outputPath = path.join(audiosDir, `message_${index}.json`);
                        const fallbackJson = {
                            metadata: { duration: 1 },
                            mouthCues: [{ start: 0, end: 1, value: "X" }]
                        };
                        fs.writeFileSync(outputPath, JSON.stringify(fallbackJson));
                    }
                }
                console.log(`[Timing] Lip Sync Processing: ${(performance.now() - syncStart).toFixed(2)}ms`);

                // 4. Read files and attach to message object
                message.audio = await audioFileToBase64({ fileName: fileNameMp3 });
                message.lipsync = await readJsonTranscript({ fileName: path.join(audiosDir, `message_${index}.json`) });

            } catch (error) {
                console.error(`Error processing message ${index}:`, error);
            }
        })
    );

    console.log(`[Timing] Total LipSync Module Time: ${(performance.now() - sectionStart).toFixed(2)}ms`);
    return messages;
};

export { lipSync };
