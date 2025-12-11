# Setup Instructions

Follow these steps to set up the Piper TTS models and binary:

## 1. Download Piper Binary (Windows)

Run this Python script to download the Piper binary:

```python
import os
import urllib.request
import zipfile

url = "https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_windows_amd64.zip"
dest_zip = "piper_windows.zip"
extract_dir = "piper_bin"

print(f"Downloading {url}...")
urllib.request.urlretrieve(url, dest_zip)
print("Download complete.")

print(f"Extracting to {extract_dir}...")
with zipfile.ZipFile(dest_zip, 'r') as zip_ref:
    zip_ref.extractall(extract_dir)
print("Extraction complete.")

# Clean up
os.remove(dest_zip)
print("Setup complete!")
```

## 2. Download Voice Model

Download the Danny (male, low quality, fast) voice model:

```python
import os
import urllib.request

base_dir = "models/piper"
os.makedirs(base_dir, exist_ok=True)

models = [
    ("https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/danny/low/en_US-danny-low.onnx?download=true", "en_US-danny-low.onnx"),
    ("https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/danny/low/en_US-danny-low.onnx.json?download=true", "en_US-danny-low.onnx.json")
]

for url, filename in models:
    dest = os.path.join(base_dir, filename)
    if not os.path.exists(dest):
        print(f"Downloading {filename}...")
        urllib.request.urlretrieve(url, dest)
        print("Done.")
    else:
        print(f"{filename} already exists.")
```

## 3. Alternative Voice Models

### Female Voices:
- **Amy (Medium)**: `en_US-amy-medium`
- **Kathleen (Low)**: `en_US-kathleen-low`

### Male Voices:
- **Ryan (Medium)**: `en_US-ryan-medium`
- **Danny (Low)**: `en_US-danny-low` ✅ Default

Download from: https://huggingface.co/rhasspy/piper-voices/tree/v1.0.0/en/en_US

## 4. Install Python Dependencies

```bash
pip install -r requirements.txt
```

Required packages:
- `faster-whisper` - STT
- `piper-tts` - TTS (Python API, optional)
- `edge-tts` - Fallback TTS
- `onnxruntime-gpu` - GPU acceleration for Piper

## 5. Verify Setup

Check that these files exist:
- `piper_bin/piper/piper.exe` (Windows)
- `models/piper/en_US-danny-low.onnx`
- `models/piper/en_US-danny-low.onnx.json`

## Notes

- The Piper binary includes all necessary dependencies (espeak-ng, etc.)
- Models are ~10-60MB each depending on quality
- GPU acceleration requires `onnxruntime-gpu` and CUDA
