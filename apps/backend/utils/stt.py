import sys
import os
import json
import wave
from vosk import Model, KaldiRecognizer

def transcribe(audio_path, model_path):
    if not os.path.exists(model_path):
        print(f"Error: Model path '{model_path}' does not exist.", file=sys.stderr)
        sys.exit(1)

    model = Model(model_path)
    
    if not os.path.exists(audio_path):
        print(f"Error: Audio file '{audio_path}' does not exist.", file=sys.stderr)
        sys.exit(1)

    wf = wave.open(audio_path, "rb")
    if wf.getnchannels() != 1 or wf.getsampwidth() != 2 or wf.getcomptype() != "NONE":
        print("Error: Audio file must be WAV format mono PCM.", file=sys.stderr)
        sys.exit(1)

    rec = KaldiRecognizer(model, wf.getframerate())
    rec.SetWords(True)

    results = []
    while True:
        data = wf.readframes(4000)
        if len(data) == 0:
            break
        if rec.AcceptWaveform(data):
            pass
            # part_result = json.loads(rec.Result())
            # results.append(part_result.get("text", ""))
        else:
            pass
            # part_result = json.loads(rec.PartialResult())

    final_result = json.loads(rec.FinalResult())
    print(final_result.get("text", ""))

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python stt.py <audio_file> <model_path>")
        sys.exit(1)

    audio_file = sys.argv[1]
    model_path = sys.argv[2]
    
    transcribe(audio_file, model_path)
