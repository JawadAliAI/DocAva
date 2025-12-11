# 🤖 Digital Human Avatar (DocAva) - Complete Setup & Deployment Guide

Welcome to the **Digital Human Avatar** project! This is a state-of-the-art conversational AI system that combines a 3D animated frontend with a powerful backend intelligence.

---

## 🌟 Features Overview

| Feature | Technology | Description |
| :--- | :--- | :--- |
| **Interactive 3D User Interface** | **React + Three.js** | A high-quality 3D avatar that responds to you in real-time. |
| **Generative AI Brain** | **Google Gemini** | Uses advanced Large Language Models (LLM) to understand context and provide intelligent replies. |
| **Voice Cloning (TTS)** | **Edge TTS** | High-quality, neural text-to-speech generation that sounds nearly human. |
| **Speech Recognition (STT)** | **Whisper AI** | Transcribes your voice into text accurately using OpenAI's Whisper model (running locally). |
| **Realistic Lip Sync** | **Rhubarb** | Automatically synchronizes the avatar's mouth movements with the generated audio. |

---

## 📂 Project Architecture

The project is a "Monorepo" containing both frontend and backend:

*   **`apps/frontend`**:
    *   Built with Vite, React, and React-Three-Fiber.
    *   Handles the 3D scene, microphone input, and visualizing the "Thinking" state.
*   **`apps/backend`**:
    *   Built with Node.js and Express.
    *   **Server**: Listens for API requests (`/chat`, `/tts`, `/sts`).
    *   **Orchestrator**: Calls Python scripts for heavy AI tasks (TTS/STT).
*   **`apps/backend/utils`**:
    *   Contains Python scripts (`tts_edge.py`, `stt_whisper.py`) that do the heavy lifting.
*   **Root Files**:
    *   `render-build.sh`: A custom script that installs Python, FFmpeg, and Rhubarb on the cloud.
    *   `start_local_clean.ps1`: One-click script to run everything on Windows.

---

## 💻 Local Development Guide (Windows)

Use this section to run the application on your own computer for testing or development.

### 1. Prerequisites (Install These First)
1.  **Node.js (v18 or higher)**
    *   Download: [https://nodejs.org/](https://nodejs.org/)
    *   *Check*: Open terminal and run `node -v`
2.  **Python (v3.10 or v3.11)**
    *   Download: [https://www.python.org/downloads/](https://www.python.org/downloads/)
    *   ⚠️ **CRITICAL**: Check the box **"Add Python to PATH"** in the installer.
    *   *Check*: Run `python --version`
3.  **FFmpeg (Required for Audio Processing)**
    *   Download: [https://www.gyan.dev/ffmpeg/builds/](https://www.gyan.dev/ffmpeg/builds/) (Get the "essentials" build).
    *   Action: Extract the zip, copy the path to the `bin` folder (e.g., `C:\ffmpeg\bin`), and add it to your System Environment Variables -> Path.
    *   *Check*: Run `ffmpeg -version`

### 2. Installation Steps
Open **PowerShell** in the `DocAva` folder and run:
```powershell
# 1. Install root dependencies
npm install

# 2. Install Frontend dependencies
cd apps/frontend
npm install

# 3. Install Backend dependencies
cd ../backend
npm install

# 4. Install Python AI Libraries
pip install -r requirements.txt
```

### 3. Running the Application
We have a simplified script that handles everything:
```powershell
.\start_local_clean.ps1
```
*   This will start the **Backend** (on port 3000).
*   This will start the **Frontend** (on port 5173).
*   It will automatically open your browser to `http://localhost:5173`.

---

## ☁️ Deployment Guide: Publishing to the Web (Self-Hosted via Cloudflare Tunnel)

This is the fastest and easiest way to share your application with the world entirely for **FREE**.

Instead of uploading your code to a slow cloud server, we use a "Tunnel" to securely expose the application running on your powerful local computer to the internet.

### Advantages
*   **Zero Cost**: No server fees.
*   **High Performance**: Uses your local GPU/CPU (much faster for AI).
*   **Instant Updates**: Changes you make locally are instantly live.

### Step-by-Step Guide

#### 1. Requirements
*   Ensure the application works locally first (see above).
*   No account signup is strictly required for testing (Quick Tunnels).

#### 2. Start the Public Tunnel
We have created a specialized script for this. Open PowerShell and run:

```powershell
.\start_public_test.ps1
```

#### 3. What Happens Next?
1.  The script stops any old processes to ensure a clean slate.
2.  It re-installs/checks Python dependencies.
3.  It builds the Frontend for production (optimized speed).
4.  It starts the Backend server.
5.  **Finally**, it launches a **Cloudflare Tunnel** and gives you a randomly generated URL.

#### 4. Accessing Your App
*   Look at the terminal output or the `public_tunnel.log` file.
*   Find the **Public URL**, which looks like:
    `https://random-words-here.trycloudflare.com`
*   **Share this link**! Anyone can open it on their phone or laptop to chat with your avatar.

#### 5. Important Notes
*   **Keep the Window Open**: If you close the PowerShell window, the website goes down.
*   **Temporary URL**: The URL changes every time you restart the script. (To get a permanent URL, you need a free Cloudflare account and use `cloudflared login`).


---

## 🛠 Troubleshooting & Maintenance

### Common Deployment Errors

**1. "Permission Denied" on `./render-build.sh`**
*   **Cause**: The script file lost its executable permission in Git.
*   **Fix**: Run this locally in Git Bash: `git update-index --chmod=+x render-build.sh`, then commit and push.

**2. "ModuleNotFoundError: No module named 'edge_tts' or 'faster_whisper'"**
*   **Cause**: The Python packages installed in the build step aren't being found.
*   **Fix**: Ensure your `Build Command` is exactly `./render-build.sh`. This script installs packages to a local `pylib` folder, which the server uses.

**3. "FFmpeg not found"**
*   **Cause**: FFmpeg static build failed to download or extract.
*   **Fix**: Check the build logs. We download a static Linux binary of FFmpeg. If the download URL changed, update `render-build.sh`.

### Modifying the Avatar
*   To change the 3D model, replace `apps/frontend/public/models/avatar.glb`.
*   Ensure the expanded GLB file has the required Morph Targets (`viseme_aa`, `viseme_E`, etc.) compatible with the RPM standard.

---

## 📜 License
This project is open-source. Feel free to use and modify!
