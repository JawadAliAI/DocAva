import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { spawn, exec } from "child_process";
import { fileURLToPath } from "url";

dotenv.config();

const API_BASE_URL = "https://prowellchatdoc.onrender.com";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let sttService = null;
let sttServiceReady = false;
let sttQueue = [];

const startSttService = () => {
    if (sttService) return;

    console.log("Starting Persistent STT Service (Whisper)...");
    const pythonCommand = process.platform === "win32" ? "python" : "python3";
    const scriptPath = path.join(__dirname, "..", "utils", "stt_whisper_service.py");

    // Define pylib path and add to PYTHONPATH
    const pylibPath = path.join(__dirname, "..", "..", "..", "pylib");
    const env = { ...process.env, PYTHONPATH: process.env.PYTHONPATH ? `${process.env.PYTHONPATH}${path.delimiter}${pylibPath}` : pylibPath };

    sttService = spawn(pythonCommand, [scriptPath], { env });

    sttService.stdout.on("data", (data) => {
        const lines = data.toString().split("\n");
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed === "READY") {
                console.log("✅ STT Service is READY");
                sttServiceReady = true;
                processQueue();
            } else {
                // Assume it's a JSON response
                try {
                    const response = JSON.parse(trimmed);
                    const currentRequest = sttQueue[0]; // Peek
                    if (currentRequest && currentRequest.started) {
                        sttQueue.shift(); // Remove now
                        if (currentRequest.timeoutId) clearTimeout(currentRequest.timeoutId);

                        if (response.error) {
                            currentRequest.reject(new Error(response.error));
                        } else {
                            currentRequest.resolve(response.text);
                        }
                        // Trigger next
                        processQueue();
                    }
                } catch (e) {
                    console.error("STT Service Parse Error (or debug output):", trimmed);
                }
            }
        }
    });

    sttService.stderr.on("data", (data) => {
        console.error(`STT process stderr: ${data}`);
    });

    sttService.on("close", (code) => {
        console.error(`STT Service exited with code ${code}. Restarting...`);
        sttService = null;
        sttServiceReady = false;
        // Reject all pending
        while (sttQueue.length > 0) {
            const req = sttQueue.shift();
            if (req.timeoutId) clearTimeout(req.timeoutId);
            req.reject(new Error("STT Service died"));
        }
        // Restart after delay
        setTimeout(startSttService, 1000);
    });
};

const processQueue = () => {
    if (!sttServiceReady || sttQueue.length === 0) return;
    const req = sttQueue[0];
    if (req.started) return; // Wait for current to finish

    req.started = true;
    // Timeout safety
    req.timeoutId = setTimeout(() => {
        console.error("STT Job Timeout - Aborting");
        // Remove this job if it is still head
        if (sttQueue.length > 0 && sttQueue[0] === req) {
            sttQueue.shift();
            req.reject(new Error("Voice processing timed out"));
            // Process next
            processQueue();
        }
    }, 15000); // 15 seconds

    sttService.stdin.write(req.path + "\n");
};

// Start the service immediately
startSttService();

const customAPI = {
    chat: async (message, userId) => {
        try {
            const effectiveUserId = userId || "demo_user_123";
            console.log(`Sending Chat request to ${API_BASE_URL}/chat for user: ${effectiveUserId}`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: message,
                    user_id: effectiveUserId,
                    language: "en"
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Chat API error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();

            // The API returns the message in the 'reply' field
            const botResponse = data.reply || data.response || data.message || "I didn't get a reply.";

            return botResponse;
        } catch (error) {
            console.error("Chat API Error:", error);
            return "I'm having trouble connecting to the doctor right now. Please try again later.";
        }
    },

    tts: async (text) => {
        return new Promise((resolve, reject) => {
            try {
                console.log(`Generating local TTS (Edge) for text: "${text.substring(0, 20)}..."`);

                const ttsScript = path.join(__dirname, "..", "utils", "tts_edge.py");
                const tempFile = path.join(__dirname, "..", "tmp", `tts_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`);

                // Ensure tmp dir exists
                const tmpDir = path.dirname(tempFile);
                if (!fs.existsSync(tmpDir)) {
                    fs.mkdirSync(tmpDir, { recursive: true });
                }

                const pythonCommand = process.platform === "win32" ? "python" : "python3";
                // PYTHONPATH is usually handled by dev environment or not needed for installed packages, but keeping it safe
                const pylibPath = path.join(__dirname, "..", "..", "..", "pylib");
                const env = { ...process.env, PYTHONPATH: process.env.PYTHONPATH ? `${process.env.PYTHONPATH}${path.delimiter}${pylibPath}` : pylibPath };

                const voice = "en-GB-ThomasNeural"; // Male voice (British)
                const pythonProcess = spawn(pythonCommand, [ttsScript, text, tempFile, voice], { env });

                let errorOutput = "";
                pythonProcess.stderr.on("data", (data) => { errorOutput += data.toString(); });

                pythonProcess.on("close", async (code) => {
                    if (code !== 0) {
                        console.error(`Edge TTS Error: ${errorOutput}`);
                        resolve({ audio: Buffer.alloc(1024), timings: [] }); // Fallback
                        return;
                    }

                    try {
                        const audioBuffer = await fs.promises.readFile(tempFile);
                        const timingsFile = tempFile + ".json";
                        let timings = [];
                        if (fs.existsSync(timingsFile)) {
                            const timingsData = await fs.promises.readFile(timingsFile, "utf-8");
                            timings = JSON.parse(timingsData);
                            // Cleanup timings file
                            fs.unlink(timingsFile, () => { });
                        }

                        // Cleanup audio file
                        fs.unlink(tempFile, () => { });

                        resolve({ audio: audioBuffer, timings });
                    } catch (err) {
                        console.error("Error reading TTS files:", err);
                        resolve({ audio: Buffer.alloc(1024), timings: [] });
                    }
                });
            } catch (error) {
                console.error("TTS Wrapper Error:", error);
                resolve({ audio: Buffer.alloc(1024), timings: [] });
            }
        });
    },

    stt: async (audioBuffer) => {
        return new Promise((resolve, reject) => {
            try {
                console.log(`Processing local STT (Whisper). Buffer size: ${audioBuffer.length}`);

                const tempInput = path.join(__dirname, "..", "tmp", `stt_in_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`);
                const tempOutput = path.join(__dirname, "..", "tmp", `stt_out_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`);

                const tmpDir = path.dirname(tempInput);
                if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

                fs.writeFileSync(tempInput, Buffer.from(audioBuffer));

                // Convert to 16kHz Mono WAV (Vosk requirement)
                // Added -vn to ignore video stream if present (e.g. from some recorders)
                const ffmpegCommand = `ffmpeg -y -i "${tempInput}" -vn -ac 1 -ar 16000 -f wav "${tempOutput}"`;

                exec(ffmpegCommand, (error, stdout, stderr) => {
                    if (error) {
                        console.error("FFmpeg conversion error:", stderr);
                        resolve("");
                        return;
                    }

                    // Enqueue request to persistent service
                    sttQueue.push({
                        path: tempOutput,
                        resolve: (text) => {
                            console.log(`STT Result: "${text}"`);
                            // Cleanup
                            try {
                                if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
                                if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
                            } catch (e) { }
                            resolve(text);
                        },
                        reject: (err) => {
                            console.error("STT Job Error:", err);
                            try {
                                if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
                                if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
                            } catch (e) { }
                            resolve(""); // Fallback to empty on error
                        },
                        started: false
                    });

                    // Trigger processing
                    processQueue();
                });

            } catch (error) {
                console.error("Local STT Error:", error);
                resolve("");
            }
        });
    },
};

export default customAPI;
