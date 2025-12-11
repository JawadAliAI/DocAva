from piper import PiperVoice
import wave
import sys

model_path = r"c:\Users\JAY\Music\DocAva\apps\backend\models\piper\en_US-amy-medium.onnx"
config_path = r"c:\Users\JAY\Music\DocAva\apps\backend\models\piper\en_US-amy-medium.onnx.json"
output_file = "test_piper.wav"

try:
    voice = PiperVoice.load(model_path, config_path=config_path)
    with wave.open(output_file, "wb") as wav_file:
        voice.synthesize("Hello, this is a test of Piper TTS.", wav_file)
    print("Success")
except Exception as e:
    print(f"Error: {e}")
