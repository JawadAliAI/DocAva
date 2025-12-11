import sys
import os
import json
import time
from faster_whisper import WhisperModel

# Load the model once at startup
MODEL_SIZE = "base.en"  # Optimized for speed (English only)
print(f"Loading Whisper model: {MODEL_SIZE}...", file=sys.stderr)
start_load = time.time()

try:
    # Use GPU if available
    import torch
    device = "cuda" if torch.cuda.is_available() else "cpu"
    compute_type = "float16" if device == "cuda" else "int8"
    
    print(f"Loading Whisper model on {device} ({compute_type})...", file=sys.stderr)
    model = WhisperModel(MODEL_SIZE, device=device, compute_type=compute_type)
    print(f"Model loaded in {time.time() - start_load:.2f}s", file=sys.stderr)
except Exception as e:
    print(f"Error loading Whisper model: {e}", file=sys.stderr)
    sys.exit(1)

# Signal ready
print("READY", flush=True)

# Process incoming audio files
for line in sys.stdin:
    audio_path = line.strip()
    
    if not audio_path:
        continue
    
    try:
        if not os.path.exists(audio_path):
            result = {"error": f"Audio file not found: {audio_path}"}
            print(json.dumps(result), flush=True)
            continue
        
        # Transcribe the audio
        segments, info = model.transcribe(
            audio_path,
            beam_size=1,    # Optimize for speed
            language="en",  # Force English
            condition_on_previous_text=False
        )
        
        # Collect all text segments
        full_text = ""
        for segment in segments:
            full_text += segment.text + " "
        
        full_text = full_text.strip()
        
        # Return the result
        result = {
            "text": full_text,
            "language": info.language,
            "language_probability": info.language_probability
        }
        
        print(json.dumps(result), flush=True)
        
    except Exception as e:
        result = {"error": str(e)}
        print(json.dumps(result), flush=True)
