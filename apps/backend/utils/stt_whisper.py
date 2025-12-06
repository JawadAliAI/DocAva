import sys
import os
import time
from faster_whisper import WhisperModel

def transcribe(audio_path, model_size="small"):
    if not os.path.exists(audio_path):
        print(f"Error: Audio file '{audio_path}' does not exist.", file=sys.stderr)
        sys.exit(1)

    print(f"Loading Whisper model: {model_size}...", file=sys.stderr)
    start_load = time.time()
    
    # Run on CPU with INT8 quantization for broad compatibility and speed
    # If GPU is available and drivers are set, one could use device="cuda"
    try:
        model = WhisperModel(model_size, device="cpu", compute_type="int8")
    except Exception as e:
        print(f"Error loading model: {e}", file=sys.stderr)
        sys.exit(1)
        
    print(f"Model loaded in {time.time() - start_load:.2f}s", file=sys.stderr)

    segments, info = model.transcribe(audio_path, beam_size=5)

    print(f"Detected language '{info.language}' with probability {info.language_probability}", file=sys.stderr)

    full_text = ""
    for segment in segments:
        full_text += segment.text + " "

    print(full_text.strip())

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python stt_whisper.py <audio_file> [model_size]")
        sys.exit(1)

    audio_file = sys.argv[1]
    model_size = sys.argv[2] if len(sys.argv) > 2 else "small"
    
    transcribe(audio_file, model_size)
