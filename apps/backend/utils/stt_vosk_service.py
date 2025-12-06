import sys
import os
import time
import json
import wave
from vosk import Model, KaldiRecognizer

def main():
    print("Loading Vosk model...", file=sys.stderr)
    start_load = time.time()
    
    # Path to the model provided by the user
    # Ideally this should be relative, but using the absolute path as requested/confirmed
    model_path = r"d:\ProWellAvatar\vosk-model-en-us-0.42-gigaspeech"
    
    if not os.path.exists(model_path):
        # Fallback to local 'models' dir if the absolute path fails
        model_path = os.path.join(os.path.dirname(__file__), "..", "models", "vosk-model-en-us-0.42-gigaspeech")
        
    try:
        if not os.path.exists(model_path):
             raise FileNotFoundError(f"Vosk model not found at {model_path}")

        model = Model(model_path)
        print(f"Model loaded in {time.time() - start_load:.2f}s", file=sys.stderr)
        print("READY", flush=True) 
    except Exception as e:
        print(f"Error loading model: {e}", file=sys.stderr)
        sys.exit(1)

    while True:
        try:
            audio_path = sys.stdin.readline().strip()
            if not audio_path:
                break
            
            if not os.path.exists(audio_path):
                print(json.dumps({"error": f"File not found: {audio_path}"}), flush=True)
                continue

            # Vosk requires WAV (16kHz, Mono)
            # The node layer ALREADY converts input to 16kHz mono WAV, so we just read it.
            
            wf = wave.open(audio_path, "rb")
            if wf.getnchannels() != 1 or wf.getsampwidth() != 2 or wf.getcomptype() != "NONE":
                 # Should already be handled by ffmpeg in customAPI, but acceptable warning
                 pass

            rec = KaldiRecognizer(model, wf.getframerate())
            results = ""
            
            while True:
                data = wf.readframes(4000)
                if len(data) == 0:
                    break
                if rec.AcceptWaveform(data):
                    # We usually don't need partial results here for a single file
                    pass
            
            final_res = json.loads(rec.FinalResult())
            text = final_res.get("text", "")

            print(json.dumps({"text": text, "language": "en"}), flush=True)
            wf.close()

        except Exception as e:
            print(json.dumps({"error": str(e)}), flush=True)

if __name__ == "__main__":
    main()
