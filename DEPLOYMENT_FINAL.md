# 🚀 Final Deployment Guide

This guide covers the exact steps to deploy your Digital Human Avatar to [Render.com](https://render.com).

## 1. Prepare Your Repository
Ensure you have committed and pushed all recent changes to your GitHub/GitLab repository.

## 2. Create Web Service on Render
1.  Log in to the [Render Dashboard](https://dashboard.render.com/).
2.  Click **New +** and select **Web Service**.
3.  Connect your repository (`ProWellAvatar` or similar).

## 3. Service Configuration
Use the following settings **exactly** to ensure the dual Node.js + Python environment works:

| Setting | Value |
| :--- | :--- |
| **Name** | `prowell-avatar` (or your choice) |
| **Region** | Singapore / Oregon (Any) |
| **Branch** | `main` (or your working branch) |
| **Runtime** | **Node** |
| **Build Command** | `./render-build.sh` |
| **Start Command** | `npm start` |

> **Note:** The `./render-build.sh` script handles installing Python, Edge TTS, FFmpeg, and building the Frontend automatically.

## 4. Environment Variables
Navigate to the **Environment** tab and add the following keys:

| Key | Value | Description |
| :--- | :--- | :--- |
| `PYTHON_VERSION` | `3.10.12` | (Or `3.9.0`) Ensures Python is available. |
| `GEMINI_API_KEY` | `...` | Your Google Gemini API Key. |

*(Add any other keys you use, such as Firebase credentials, if applicable.)*

## 5. Deploy
1.  Click **Create Web Service**.
2.  Watch the logs. You should see:
    - `Installing Node dependencies...`
    - `Installing Python dependencies...` (verifying `edge_tts`)
    - `Building Frontend...`
3.  Once the deploy is "Live", click the URL (e.g., `https://prowell-avatar.onrender.com`).

## 6. Troubleshooting
- **Build Fails?** Check the logs. If `pip` fails, ensure `PYTHON_VERSION` is set.
- **No Audio?** Check the browser console. If using a custom domain, standard HTTPS rules apply.
- **Backend Error?** Go to the "Logs" tab in Render to see if the Python script failed to start.

## 7. Local Run (Testing)
To run locally before deploying:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).
