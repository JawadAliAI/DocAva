
import os
import sys
import wave
from piper import PiperVoice

model_path = r"c:\Users\JAY\Music\DocAva\apps\backend\models\piper\en_US-amy-medium.onnx"
config_path = r"c:\Users\JAY\Music\DocAva\apps\backend\models\piper\en_US-amy-medium.onnx.json"
output_file = "test_piper_debug.wav"

try:
    if not os.path.exists(model_path):
        print(f"Model missing: {model_path}")
        sys.exit(1)

    print("Loading voice...")
    voice = PiperVoice.load(model_path, config_path=config_path)
    print("Voice loaded.")

    text = "Hello, this is a test of Piper TTS running on GPU."
    print(f"Synthesizing: {text}")

    with wave.open(output_file, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(22050)
        voice.synthesize(text, wav_file)
        
    print(f"Done. Check {output_file}")
    
    import os
    size = os.path.getsize(output_file)
    print(f"File size: {size} bytes")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
