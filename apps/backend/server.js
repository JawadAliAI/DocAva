import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { lipSync } from "./modules/lip-sync.mjs";
import customAPI from "./modules/customAPI.mjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

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
    console.log(`Received message: ${userMessage} from user: ${userId}`);

    // 1. Get Chat Response from Custom API
    const botResponseText = await customAPI.chat(userMessage, userId);
    console.log(`Bot response: ${botResponseText}`);

    // 2. Construct Message Object
    // Intelligently select animations and facial expressions based on message content
    const selectedAnimation = selectAnimation(botResponseText);
    const selectedExpression = selectFacialExpression(botResponseText);

    console.log(`Selected animation: ${selectedAnimation}, expression: ${selectedExpression}`);

    const messages = [
      {
        text: botResponseText,
        facialExpression: selectedExpression,
        animation: selectedAnimation,
      },
    ];

    // 3. Generate Audio & LipSync
    const syncedMessages = await lipSync({ messages });

    console.log("Sending response to frontend...");
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
    // 1. Convert Speech to Text
    const userMessage = await customAPI.stt(audioData);
    console.log(`User said (STT): ${userMessage}`);

    // 2. Get Chat Response
    const botResponseText = await customAPI.chat(userMessage, userId);
    console.log(`Bot response: ${botResponseText}`);

    // 3. Construct Message Object
    const selectedAnimation = selectAnimation(botResponseText);
    const selectedExpression = selectFacialExpression(botResponseText);

    console.log(`Selected animation: ${selectedAnimation}, expression: ${selectedExpression}`);

    const messages = [
      {
        text: botResponseText,
        facialExpression: selectedExpression,
        animation: selectedAnimation,
      },
    ];

    // 4. Generate Audio & LipSync
    const syncedMessages = await lipSync({ messages });

    console.log("Sending STS response to frontend...");
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
