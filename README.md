# DocAva - AI Medical Consultation Avatar

A fully local, GPU-accelerated AI avatar for medical consultations with real-time speech-to-text, text-to-speech, and lip-sync capabilities.

## Features

- 🎤 **Local Speech-to-Text**: GPU-accelerated Whisper for fast, accurate transcription
- 🗣️ **Local Text-to-Speech**: Piper TTS with persistent process for low-latency voice synthesis
- 💬 **Local LLM Integration**: Connect to your local language model endpoint
- 👄 **Fast Lip-Sync**: Phonetic-based lip synchronization for natural mouth movements
- 🎭 **Animated Avatar**: Emotion-aware animations and facial expressions
- 🔒 **100% Private**: All processing happens locally - no cloud dependencies

## Tech Stack

### Backend
- **Node.js** + Express
- **Python** for AI services
- **Whisper** (faster-whisper) for STT with CUDA support
- **Piper TTS** for voice synthesis
- **Phonetic Lip-Sync** for mouth animation

### Frontend
- **React** + Vite
- **Three.js** for 3D avatar rendering
- **Tailwind CSS** for styling

## Prerequisites

- **Node.js** 18+ and npm/yarn
- **Python** 3.8+
- **NVIDIA GPU** with CUDA support (recommended for best performance)
- **FFmpeg** installed and in PATH
- **Local LLM** endpoint (default: `http://127.0.0.1:8000`)

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/DocAva.git
cd DocAva
```

### 2. Install Backend Dependencies
```bash
cd apps/backend
npm install
pip install -r requirements.txt
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 4. Download Piper TTS Binary and Models

**Download Piper Binary:**
```bash
cd ../backend
# The binary will be downloaded automatically on first run
# Or manually download from: https://github.com/rhasspy/piper/releases
```

**Download Voice Models:**
The application uses `en_US-danny-low` by default. Download it from:
- https://huggingface.co/rhasspy/piper-voices/tree/v1.0.0/en/en_US/danny/low

Place the `.onnx` and `.onnx.json` files in `apps/backend/models/piper/`

### 5. Configure Environment

Create `apps/backend/.env`:
```env
PORT=3000
# Add any other environment variables as needed
```

### 6. Setup Local LLM

Ensure your local LLM is running at `http://127.0.0.1:8000` or update the endpoint in `apps/backend/modules/customAPI.mjs`

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd apps/backend
node server.js
```

**Terminal 2 - Frontend:**
```bash
cd apps/frontend
npm run dev
```

Access the application at `http://localhost:5173`

### Production Mode

```bash
# Build frontend
cd apps/frontend
npm run build

# Start backend (serves built frontend)
cd ../backend
node server.js
```

Access the application at `http://localhost:3000`

## Configuration

### Change TTS Voice

Edit `apps/backend/utils/tts_service.py`:
```python
PIPER_MODEL_PATH = os.path.join(MODELS_DIR, "piper", "en_US-your-voice.onnx")
```

### Change LLM Endpoint

Edit `apps/backend/modules/customAPI.mjs`:
```javascript
const API_BASE_URL = "http://your-llm-endpoint:port";
```

### Adjust Whisper Model

Edit `apps/backend/utils/stt_whisper_service.py`:
```python
MODEL_SIZE = "base.en"  # Options: tiny, base, small, medium, large
```

## Performance Optimization

- **GPU Acceleration**: Ensure CUDA is properly installed for Whisper STT
- **Persistent Piper**: The TTS service keeps the model loaded in memory for fast inference
- **Sentence Splitting**: Long responses are split into sentences for faster perceived response time
- **Fast Lip-Sync**: Uses phonetic mapping instead of audio analysis for ~10x faster processing

## Project Structure

```
DocAva/
├── apps/
│   ├── backend/
│   │   ├── modules/          # Core logic (API, lip-sync)
│   │   ├── utils/            # Services (TTS, STT)
│   │   ├── models/           # AI model files
│   │   ├── audios/           # Generated audio files
│   │   └── server.js         # Express server
│   └── frontend/
│       ├── src/
│       │   ├── components/   # React components
│       │   └── hooks/        # Custom hooks
│       └── public/           # Static assets
└── package.json
```

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### CUDA Not Detected
- Verify NVIDIA drivers are installed
- Install `onnxruntime-gpu` for Piper: `pip install onnxruntime-gpu`
- Install CUDA-enabled PyTorch for Whisper

### Slow Performance
- Use "low" quality Piper models instead of "medium"
- Use smaller Whisper models (tiny, base)
- Ensure GPU is being utilized (check task manager/nvidia-smi)

## License

MIT License - See LICENSE file for details

## Acknowledgments

- [Piper TTS](https://github.com/rhasspy/piper) - Fast, local neural text-to-speech
- [Faster Whisper](https://github.com/guillaumekln/faster-whisper) - Optimized Whisper implementation
- [Rhubarb Lip Sync](https://github.com/DanielSWolf/rhubarb-lip-sync) - Lip-sync tool (optional)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
