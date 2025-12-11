
import os
import urllib.request

def download_file(url, dest):
    print(f"Downloading {url} to {dest}...")
    try:
        urllib.request.urlretrieve(url, dest)
        print("Done.")
    except Exception as e:
        print(f"Failed to download {url}: {e}")

base_dir = r"c:\Users\JAY\Music\DocAva\apps\backend\models\piper"
os.makedirs(base_dir, exist_ok=True)

models = [
    ("https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/danny/low/en_US-danny-low.onnx?download=true", "en_US-danny-low.onnx"),
    ("https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/danny/low/en_US-danny-low.onnx.json?download=true", "en_US-danny-low.onnx.json")
]

for url, filename in models:
    dest = os.path.join(base_dir, filename)
    if not os.path.exists(dest):
        download_file(url, dest)
    else:
        print(f"{filename} already exists.")
