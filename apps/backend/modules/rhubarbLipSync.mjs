import { execCommand } from "../utils/files.mjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getPhonemes = async ({ message, messageText = "Hello" }) => {
    try {
        const time = new Date().getTime();
        console.log(`Starting lip sync for message ${message}`);

        const audiosDir = path.join(__dirname, "..", "audios");
        const wavFile = path.join(audiosDir, `message_${message}.wav`);
        const mp3File = path.join(audiosDir, `message_${message}.mp3`);
        const jsonFile = path.join(audiosDir, `message_${message}.json`);

        // Check if WAV exists, if not convert MP3 to WAV
        if (!fs.existsSync(wavFile)) {
            console.log(`Converting MP3 to WAV for message ${message}...`);
            await execCommand(
                { command: `ffmpeg -y -i "${mp3File}" "${wavFile}"` }
            );
        } else {
            console.log(`WAV file already exists, skipping conversion.`);
        }

        console.log(`Conversion done in ${new Date().getTime() - time}ms`);

        // Resolve path to Rhubarb executable
        // On Render (Linux), it's installed in root/bin/rhubarb-lip-sync/rhubarb
        // On Local (Windows), it's in root/Rhubarb-Lip-Sync-1.14.0-Windows/rhubarb.exe

        let rhubarbPath;
        if (process.platform === "win32") {
            // Absolute path as requested by User
            rhubarbPath = "C:\\Users\\JAY\\Music\\DocAva\\Rhubarb-Lip-Sync-1.14.0-Windows\\rhubarb.exe";
        } else {
            // Render / Linux
            rhubarbPath = path.resolve(__dirname, "../../../bin/rhubarb-lip-sync/rhubarb");
        }

        console.log(`Looking for Rhubarb at: ${rhubarbPath}`);

        let useRhubarb = fs.existsSync(rhubarbPath);

        if (!useRhubarb) {
            console.warn(`⚠️ Rhubarb executable not found at ${rhubarbPath}. Will use phonetic fallback.`);
        }

        if (useRhubarb) {
            try {
                // Try to run Rhubarb
                // Clean text for command line (basic escaping)
                const safeText = messageText.replace(/"/g, '\\"').replace(/\n/g, " ");

                // Try to run Rhubarb with Dialog for better accuracy
                await execCommand({
                    command: `"${rhubarbPath}" -f json -o "${jsonFile}" "${wavFile}" -d "${safeText}"`,
                });
                console.log(`✅ Rhubarb lip sync done in ${new Date().getTime() - time}ms`);
                return; // Success, exit early
            } catch (error) {
                console.warn("⚠️ Rhubarb execution failed. Using phonetic lip sync fallback...");
                console.warn(error.message);
            }
        }

        // Fallback: Use phonetic lip sync
        console.log("Using phonetic lip sync fallback...");

        // Import the phonetic lip sync generator
        const { generatePhoneticLipSyncFile } = await import("./phoneticLipSync.mjs");

        // Get the audio duration using ffprobe
        let audioDuration = 1.0;
        try {
            const ffprobeResult = await execCommand({
                command: `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${wavFile}"`
            });
            audioDuration = parseFloat(ffprobeResult.stdout.trim());
            console.log(`📏 Audio duration: ${audioDuration}s`);
        } catch (e) {
            console.warn("⚠️ Could not get audio duration, estimating from text");
            // Rough estimate: ~0.15 seconds per character
            audioDuration = messageText.length * 0.15;
        }

        // Generate phonetic lip sync based on text
        generatePhoneticLipSyncFile({
            text: messageText,
            duration: audioDuration,
            outputPath: jsonFile
        });

        console.log(`✅ Phonetic lip sync generated in ${new Date().getTime() - time}ms`);
    } catch (error) {
        console.error(`❌ Error generating phonemes for message ${message}:`, error);
    }
};
export { getPhonemes };
