# Digital Human Avatar - Windows Deployment Guide

## Prerequisites
1.  **Node.js**: Install the latest LTS version from [nodejs.org](https://nodejs.org/).
2.  **Python**: Install Python 3.10 or newer from [python.org](https://www.python.org/).
    *   **Important**: Check the box "Add Python to PATH" during installation.
3.  **FFmpeg**: Download FFmpeg build and add `bin` folder to your System PATH variables.

## How to Run (One-Click)
1.  Double-click `run_windows_server.bat`.
2.  Wait for the script to:
    *   Install all libraries.
    *   Build the website (Frontend).
    *   Start the server.
3.  Open your browser to `http://localhost:3000`.

## Architecture
This setup runs as a monolithic service:
*   The **Frontend** allows users to interact with the avatar. It is compiled into static files (`dist` folder).
*   The **Backend** (Node.js) serves these static files AND handles API requests (`/tts`, `/sts`, `/chat`).
*   **AI Services**: The backend spawns background Python processes for Speech-to-Text and Text-to-Speech.

## Troubleshooting
*   **TTS Error / 500**: The system automatically attempts **Edge TTS** -> **Google TTS** -> **Windows System Voice**. If you hear a robotic voice, it means the internet services failed and it fell back to local offline mode.
*   **Python Errors**: Ensure `pip` is in your PATH. Run `pip install -r apps/backend/requirements.txt` manually if needed.
