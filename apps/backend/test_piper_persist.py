import subprocess
import json
import os
import time

piper_path = r"c:\Users\JAY\Music\DocAva\apps\backend\piper_bin\piper\piper.exe"
model_path = r"c:\Users\JAY\Music\DocAva\apps\backend\models\piper\en_US-kathleen-low.onnx"
output_dir = r"c:\Users\JAY\Music\DocAva\apps\backend\tmp"

print("Starting Piper process...")
# Piper expects JSON lines. We use --output_dir.
# Per line: {"text": "...", "output_file": "filename.wav"}
proc = subprocess.Popen(
    [piper_path, "-m", model_path, "--json-input", "--output_dir", output_dir],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,  # Text mode for easier JSON handling
    bufsize=1   # Line buffered
)

print("Piper started.")

def generate(text, filename):
    print(f"Requesting: {text} -> {filename}")
    payload = json.dumps({"text": text, "output_file": filename})
    
    start = time.time()
    proc.stdin.write(payload + "\n")
    proc.stdin.flush()
    
    # Piper usually prints the output file path or result to stdout?
    # Actually, default behavior: "Output JSON objects are written to stdout"
    # Let's read a line.
    response_line = proc.stdout.readline()
    print(f"Piper Output: {response_line.strip()}")
    print(f"Time: {time.time() - start:.3f}s")

try:
    generate("Hello world, this is a test.", "test_persist_1.wav")
    generate("This should be much faster now.", "test_persist_2.wav")
except Exception as e:
    print(f"Error: {e}")
finally:
    proc.terminate()
