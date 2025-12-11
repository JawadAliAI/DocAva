
from piper_phonemize import phonemize_espeak
import sys

try:
    text = "Hello world"
    # Piper usually uses 'en-us' for English
    phonemes = phonemize_espeak(text, "en-us")
    print(f"Phonemes: {phonemes}")
except Exception as e:
    print(f"Error: {e}")
