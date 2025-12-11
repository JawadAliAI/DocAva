import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { lipSync } from "./modules/lip-sync.mjs";
import customAPI from "./modules/customAPI.mjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from apps/backend directory
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, "../frontend/dist")));

const port = process.env.PORT || 3000;

// Helper function to select animation based on message content
const selectAnimation = (message) => {
  const talkingAnimations = ["TalkingOne", "TalkingTwo", "Talking"];

  // Check for emotional keywords to use specific animations
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("happy") || lowerMessage.includes("great") || lowerMessage.includes("wonderful")) {
    return "HappyIdle";
  }
  if (lowerMessage.includes("sad") || lowerMessage.includes("sorry") || lowerMessage.includes("unfortunate")) {
    return "SadIdle";
  }
  if (lowerMessage.includes("angry") || lowerMessage.includes("upset")) {
    return "Angry";
  }
  if (lowerMessage.includes("surprised") || lowerMessage.includes("wow") || lowerMessage.includes("amazing")) {
    return "Surprised";
  }

  // Default to random talking animation
  return talkingAnimations[Math.floor(Math.random() * talkingAnimations.length)];
};

// Helper function to select facial expression
const selectFacialExpression = (message) => {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("happy") || lowerMessage.includes("great") || lowerMessage.includes("wonderful")) {
    return "smile";
  }
  if (lowerMessage.includes("sad") || lowerMessage.includes("sorry")) {
    return "sad";
  }
  if (lowerMessage.includes("angry") || lowerMessage.includes("upset")) {
    return "angry";
  }
  if (lowerMessage.includes("surprised") || lowerMessage.includes("wow")) {
    return "surprised";
  }
  if (lowerMessage.includes("crazy") || lowerMessage.includes("wild")) {
    return "crazy";
  }

  // Random default expressions
  const defaultExpressions = ["smile", "default", "funnyFace"];
  return defaultExpressions[Math.floor(Math.random() * defaultExpressions.length)];
};

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/voices", async (req, res) => {
  // Return empty or dummy voices if frontend requests it
  res.send([]);
});

app.post("/tts", async (req, res) => {
  const userMessage = req.body.message;
  const userId = req.body.userId;

  if (!userMessage) {
    res.send({ messages: [] });
    return;
  }

  try {
    const pipelineStart = performance.now();
    console.log("--- Starting Inference Pipeline (TTS Only) ---");
    console.log(`Received message: ${userMessage} from user: ${userId}`);

    // 1. Get Chat Response from Custom API
    const llmStart = performance.now();
    const botResponseText = await customAPI.chat(userMessage, userId);
    console.log(`[Timing] LLM (Chat): ${(performance.now() - llmStart).toFixed(2)}ms`); // LLM End
    console.log(`Bot response: ${botResponseText}`);

    // 2. Construct Message Object
    // Intelligently select animations and facial expressions based on message content
    const selectedAnimation = selectAnimation(botResponseText);
    const selectedExpression = selectFacialExpression(botResponseText);

    console.log(`Selected animation: ${selectedAnimation}, expression: ${selectedExpression}`);

    // Split text into sentences for better pacing
    // Match periods, exclamation marks, or question marks followed by space or end of string.
    // Keep the delimiter.
    const sentences = botResponseText.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) || [botResponseText];

    const messages = sentences.map((sentence, index) => ({
      text: sentence.trim(),
      facialExpression: selectedExpression,
      animation: index === 0 ? selectedAnimation : "Talking", // Keep animation dynamic or simple for subsequent parts
    })).filter(m => m.text.length > 0);

    console.log(`Split response into ${messages.length} messages.`);

    // 3. Generate Audio & LipSync
    const lipSyncStart = performance.now();
    const syncedMessages = await lipSync({ messages });
    console.log(`[Timing] TTS + LipSync Wrapper: ${(performance.now() - lipSyncStart).toFixed(2)}ms`);

    console.log("Sending response to frontend...");

    const pipelineEnd = performance.now();
    console.log(`[Timing] ⏱️ TOTAL PIPELINE TIME: ${(pipelineEnd - pipelineStart).toFixed(2)}ms`);
    console.log("--------------------------------------------------");

    res.send({ messages: syncedMessages, userMessage });
  } catch (error) {
    console.error("Error in /tts:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

app.post("/sts", async (req, res) => {
  const base64Audio = req.body.audio;
  const userId = req.body.userId;

  if (!base64Audio) {
    res.status(400).send({ error: "No audio provided" });
    return;
  }

  const audioData = Buffer.from(base64Audio, "base64");

  try {
    const pipelineStart = performance.now();
    console.log("--- Starting Inference Pipeline (STS) ---");

    // 1. Convert Speech to Text
    const sttStart = performance.now();
    const userMessage = await customAPI.stt(audioData);
    console.log(`[Timing] STT (Whisper): ${(performance.now() - sttStart).toFixed(2)}ms`); // STT End
    console.log(`User said (STT): ${userMessage}`);

    // 2. Get Chat Response
    const llmStart = performance.now();
    const botResponseText = await customAPI.chat(userMessage, userId);
    console.log(`[Timing] LLM (Chat): ${(performance.now() - llmStart).toFixed(2)}ms`); // LLM End
    console.log(`Bot response: ${botResponseText}`);

    // 3. Construct Message Object
    const animStart = performance.now();
    const selectedAnimation = selectAnimation(botResponseText);
    const selectedExpression = selectFacialExpression(botResponseText);
    // console.log(`[Timing] Animation Logic: ${(performance.now() - animStart).toFixed(2)}ms`); // Usually neglible

    console.log(`Selected animation: ${selectedAnimation}, expression: ${selectedExpression}`);

    // Split text into sentences for better pacing
    const sentences = botResponseText.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) || [botResponseText];

    const messages = sentences.map((sentence, index) => ({
      text: sentence.trim(),
      facialExpression: selectedExpression,
      animation: index === 0 ? selectedAnimation : "Talking", // Keep animation dynamic or simple for subsequent parts
    })).filter(m => m.text.length > 0);

    console.log(`Split response into ${messages.length} messages.`);

    // 4. Generate Audio & LipSync
    const lipSyncStart = performance.now();
    const syncedMessages = await lipSync({ messages });
    const lipSyncTime = performance.now() - lipSyncStart;
    console.log(`[Timing] TTS + LipSync Wrapper: ${lipSyncTime.toFixed(2)}ms`);

    console.log("Sending STS response to frontend...");

    const pipelineEnd = performance.now();
    console.log(`[Timing] ⏱️ TOTAL PIPELINE TIME: ${(pipelineEnd - pipelineStart).toFixed(2)}ms`);
    console.log("-----------------------------------------");

    res.send({ messages: syncedMessages, userMessage });
  } catch (error) {
    console.error("Error in /sts:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// Catch-all route to serve the frontend index.html for any non-API requests
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

app.listen(port, () => {
  console.log(`Jack is listening on port ${port}`);
});
// Server ready
