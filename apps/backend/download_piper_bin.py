
import os
import urllib.request
import zipfile

url = "https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_windows_amd64.zip"
dest_zip = "piper_windows.zip"
extract_dir = "piper_bin"

try:
    print(f"Downloading {url}...")
    urllib.request.urlretrieve(url, dest_zip)
    print("Download complete.")

    print(f"Extracting to {extract_dir}...")
    with zipfile.ZipFile(dest_zip, 'r') as zip_ref:
        zip_ref.extractall(extract_dir)
    print("Extraction complete.")
    
except Exception as e:
    print(f"Failed: {e}")
