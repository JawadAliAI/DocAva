import sys
import json
import os
from g2p_en import G2p
import numpy as np

# Initialize G2P
g2p = G2p()

# ARPABET to Rhubarb mapping
# Rhubarb Shapes: A, B, C, D, E, F, G, H, X
# A: m, b, p
# B: k, s, t, d, n, g, r, j, z, zh, ch, sh (Teeth)
# C: eh, ey, ae, ih (Wide/Smile)
# D: aa, ay, ah (Wide Open)
# E: ao, ow, oy (Round)
# F: uw, uh, w (Pucker)
# G: f, v (Lip bite)
# H: l (Tongue up) - Optional, often mapped to B or separate
# X: Rest

arpabet_map = {
    # Consonants
    'M': 'A', 'B': 'A', 'P': 'A',
    'F': 'G', 'V': 'G',
    'UW': 'F', 'W': 'F', 'UH': 'F', # U-sounds
    'OW': 'E', 'AO': 'E', 'OY': 'E', # O-sounds
    'AW': 'D', # Ow sound - transitions D -> F? simplifying to D
    'AA': 'D', 'AY': 'D', 'AH': 'D', # Open A sounds
    'AE': 'C', 'EH': 'C', 'IH': 'C', 'EY': 'C', 'IY': 'C', # E/I sounds
    'L': 'H', # L
    'ER': 'B', 'R': 'B', # R
    'S': 'B', 'Z': 'B', 'SH': 'B', 'ZH': 'B', 'CH': 'B', 'JH': 'B',
    'T': 'B', 'D': 'B', 'N': 'B', 'DH': 'B', 'TH': 'B', # Dental/Alveolar
    'K': 'B', 'G': 'B', 'NG': 'B', 'HH': 'B', 'Y': 'B',
    ' ': 'X'
}

def get_phonemes(text):
    return g2p(text)

def generate_mouth_cues(word_timings):
    mouth_cues = []
    
    for word_data in word_timings:
        text = word_data["text"]
        start = word_data["start"]
        duration = word_data["duration"]
        end = start + duration
        
        # Get phonemes describing this word
        phonemes = g2p(text)
        # Filter out numbers/stress markers (e.g. AA1 -> AA) and keep only valid phones
        clean_phones = []
        for p in phonemes:
            p_clean = ''.join([c for c in p if c.isalpha()])
            if p_clean in arpabet_map:
                clean_phones.append(p_clean)
            elif p == ' ':
                pass # ignore spaces within phrase if any
        
        if not clean_phones:
            # Fallback if no phonemes found (e.g. symbol)
            mouth_cues.append({ "start": start, "end": end, "value": "B" })
            continue
            
        # Distribute phonemes evenly across the word duration
        # Improve: Vowels usually longer than consonants?
        # For now, linear distribution is efficient and usually "good enough" for "fast" mode.
        
        phone_duration = duration / len(clean_phones)
        
        for i, phone in enumerate(clean_phones):
            p_start = start + (i * phone_duration)
            p_end = p_start + phone_duration
            value = arpabet_map.get(phone, "B")
            
            # Optimization: Merge identical consecutive shapes
            if mouth_cues and mouth_cues[-1]["value"] == value and abs(mouth_cues[-1]["end"] - p_start) < 0.001:
                mouth_cues[-1]["end"] = p_end
            else:
                mouth_cues.append({
                    "start": round(p_start, 3),
                    "end": round(p_end, 3),
                    "value": value
                })
                
    # Add rest at the end if needed (handled by avatar usually, but good for format)
    if mouth_cues:
        mouth_cues.append({
            "start": mouth_cues[-1]["end"],
            "end": mouth_cues[-1]["end"] + 0.1,
            "value": "X"
        })
        
    return mouth_cues

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python phoneme_sync.py <timings_json> <output_rhubarb_json>")
        sys.exit(1)
        
    timings_path = sys.argv[1]
    output_path = sys.argv[2]
    
    with open(timings_path, "r", encoding="utf-8") as f:
        timings = json.load(f)
        
    cues = generate_mouth_cues(timings)
    
    # Determine total duration
    total_duration = 0
    if cues:
        total_duration = cues[-1]["end"]
        
    result = {
        "metadata": {
            "soundFile": "", # Metadata placeholder
            "duration": total_duration
        },
        "mouthCues": cues
    }
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)
        
    print(f"Rhubarb-compatible cues saved to {output_path}")
