import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { spawn, exec } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from apps/backend (parent) directory
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Chat API URL - Pro Well production server
const API_BASE_URL = "http://127.0.0.1:8000";

// --- Persistent STT Service (Whisper) ---
let sttService = null;
let sttServiceReady = false;
let sttQueue = [];

const startSttService = () => {
    if (sttService) return;

    console.log("Starting Persistent STT Service (Whisper)...");
    const pythonCommand = process.platform === "win32" ? "python" : "python3";
    const scriptPath = path.join(__dirname, "..", "utils", "stt_whisper_service.py");

    // Add pylib to PYTHONPATH
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
                try {
                    const response = JSON.parse(trimmed);
                    const currentRequest = sttQueue[0];
                    if (currentRequest && currentRequest.started) {
                        sttQueue.shift();
                        if (currentRequest.timeoutId) clearTimeout(currentRequest.timeoutId);

                        if (response.error) {
                            currentRequest.reject(new Error(response.error));
                        } else {
                            currentRequest.resolve(response.text);
                        }
                        processQueue();
                    }
                } catch (e) {
                    // console.error("STT Service Parse Error:", trimmed);
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
        setTimeout(startSttService, 1000);
    });
};

const processQueue = () => {
    if (!sttServiceReady || sttQueue.length === 0) return;
    const req = sttQueue[0];
    if (req.started) return;

    req.started = true;
    req.timeoutId = setTimeout(() => {
        if (sttQueue.length > 0 && sttQueue[0] === req) {
            sttQueue.shift();
            req.reject(new Error("Voice processing timed out"));
            processQueue();
        }
    }, 15000);

    sttService.stdin.write(req.path + "\n");
};

startSttService();

// --- Persistent TTS Service (ElevenLabs) ---
let ttsService = null;
let ttsServiceReady = false;
let ttsQueue = [];

const startTtsService = () => {
    if (ttsService) return;

    console.log("Starting Persistent TTS Service (Local/Piper)...");
    const pythonCommand = process.platform === "win32" ? "python" : "python3";

    // Pointing to tts_service.py which handles Piper/Edge TTS
    const scriptPath = path.join(__dirname, "..", "utils", "tts_service.py");

    const pylibPath = path.join(__dirname, "..", "..", "..", "pylib");
    const env = { ...process.env, PYTHONPATH: process.env.PYTHONPATH ? `${process.env.PYTHONPATH}${path.delimiter}${pylibPath}` : pylibPath };

    ttsService = spawn(pythonCommand, [scriptPath], { env });

    ttsService.stdout.on("data", (data) => {
        const lines = data.toString().split("\n");
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed === "READY") {
                console.log("✅ TTS Service is READY");
                ttsServiceReady = true;
                processTtsQueue();
            } else {
                try {
                    const response = JSON.parse(trimmed);
                    const currentRequest = ttsQueue[0];
                    if (currentRequest && currentRequest.started) {
                        ttsQueue.shift();
                        if (currentRequest.timeoutId) clearTimeout(currentRequest.timeoutId);

                        if (response.error) {
                            currentRequest.resolve({ error: response.error });
                        } else {
                            // Read audio and resolve with timings
                            fs.promises.readFile(currentRequest.tempFile)
                                .then(audioBuffer => {
                                    // Cleanup temp file
                                    fs.unlink(currentRequest.tempFile, () => { });
                                    currentRequest.resolve({
                                        audio: audioBuffer,
                                        timings: response.timings || [] // Use timings from ElevenLabs
                                    });
                                })
                                .catch(err => {
                                    currentRequest.resolve({ error: "Failed to read generated audio file" });
                                });
                        }
                        processTtsQueue();
                    }
                } catch (e) {
                    console.error("TTS Service Parse Error:", trimmed);
                }
            }
        }
    });

    ttsService.stderr.on("data", (data) => {
        console.error(`TTS Service stderr: ${data}`);
    });

    ttsService.on("close", (code) => {
        console.error(`TTS Service exited with code ${code}. Restarting...`);
        ttsService = null;
        ttsServiceReady = false;
        setTimeout(startTtsService, 1000);
    });
};

const processTtsQueue = () => {
    if (!ttsServiceReady || ttsQueue.length === 0) return;
    const req = ttsQueue[0];
    if (req.started) return;

    req.started = true;
    req.timeoutId = setTimeout(() => {
        if (ttsQueue.length > 0 && ttsQueue[0] === req) {
            ttsQueue.shift();
            req.resolve({ error: "TTS processing timed out" });
            processTtsQueue();
        }
    }, 20000);

    const requestPayload = JSON.stringify({
        text: req.text,
        output_file: req.tempFile,
        voice: "piper" // Use Piper TTS
    });
    ttsService.stdin.write(requestPayload + "\n");
};

startTtsService();


const customAPI = {
    chat: async (message, userId) => {
        try {
            const effectiveUserId = userId || "demo_user_123";
            console.log(`Sending Chat request to ${API_BASE_URL}/chat for user: ${effectiveUserId}`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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
            return data.reply || data.response || data.message || "I didn't get a reply.";
        } catch (error) {
            console.error(`Chat API Error accessing ${API_BASE_URL}/chat:`, error);
            if (error.cause) console.error("Caused by:", error.cause);
            return "I'm having trouble connecting to the doctor right now. Please try again later.";
        }
    },

    tts: async (text) => {
        return new Promise((resolve, reject) => {
            const tempFile = path.join(__dirname, "..", "tmp", `tts_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`);

            const tmpDir = path.dirname(tempFile);
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

            console.log(`Queuing TTS for text: "${text.substring(0, 20)}..."`);

            ttsQueue.push({
                text,
                tempFile,
                resolve,
                started: false
            });

            processTtsQueue();
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

                let ffmpegPath = "ffmpeg";
                if (process.platform === "win32") {
                    const localFfmpeg = path.join(__dirname, "..", "..", "..", "bin", "ffmpeg.exe");
                    if (fs.existsSync(localFfmpeg)) ffmpegPath = localFfmpeg;
                }

                const ffmpegCommand = `"${ffmpegPath}" -y -i "${tempInput}" -vn -ac 1 -ar 16000 -f wav "${tempOutput}"`;

                exec(ffmpegCommand, (error, stdout, stderr) => {
                    if (error) {
                        console.error("FFmpeg conversion error:", stderr);
                        resolve("");
                        return;
                    }

                    sttQueue.push({
                        path: tempOutput,
                        resolve: (text) => {
                            console.log(`STT Result: "${text}"`);
                            try {
                                if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
                                if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
                            } catch (e) { }
                            resolve(text);
                        },
                        reject: (err) => {
                            console.error("STT Job Error:", err);
                            resolve("");
                        },
                        started: false
                    });
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
