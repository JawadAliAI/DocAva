import sys
import asyncio
import json
import os

async def generate_tts_with_timings(text, output_file, voice="en-US-AndrewNeural"):
    """
    Generates audio and a corresponding JSON file with word timings.
    Priority: Edge TTS -> gTTS -> System TTS (SAPI/pyttsx3)
    """
    timings = []
    
    # 1. Try Edge TTS
    try:
        import edge_tts
        print(f"Attempting Edge TTS with voice: {voice}")
        communicate = edge_tts.Communicate(text, voice)
        
        # We capture the stream to a file
        with open(output_file, "wb") as audio_file:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_file.write(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    timings.append({
                        "text": chunk["text"],
                        "start": chunk["offset"] / 10000000,
                        "duration": chunk["duration"] / 10000000
                    })
        
        # Check if file was actually written
        if os.path.exists(output_file) and os.path.getsize(output_file) > 0:
            # Save timings
            json_output = output_file + ".json"
            with open(json_output, "w", encoding="utf-8") as f:
                json.dump(timings, f, indent=2)
            print(f"Edge TTS success. Timings saved to {json_output}")
            return
        else:
            raise Exception("Edge TTS generated empty file")

    except Exception as e:
        print(f"EdgeTTS failed: {e}. Falling back to gTTS...", file=sys.stderr)

    # 2. Key Fallback: gTTS (Google Text-to-Speech)
    try:
        from gtts import gTTS
        print("Attempting gTTS...")
        tts = gTTS(text=text, lang='en')
        tts.save(output_file)
        if os.path.exists(output_file) and os.path.getsize(output_file) > 0:
            print(f"gTTS success. Audio saved to {output_file}")
            return
    except Exception as e2:
        print(f"gTTS failed: {e2}. Falling back to System TTS (pyttsx3)...", file=sys.stderr)

    # 3. Last Resort: System TTS (pyttsx3/SAPI5)
    try:
        import pyttsx3
        print("Attempting System TTS (pyttsx3)...")
        engine = pyttsx3.init()
        # Try to find a decent voice
        voices = engine.getProperty('voices')
        # Prefer a male voice if Andrews is requested, else female
        for v in voices:
            if "david" in v.name.lower():
                engine.setProperty('voice', v.id)
                break
        
        # SAPI saves as WAV usually, but we named it .mp3. 
        # Most players handle wav data in mp3 extension, but let's be safe and rely on ffmpeg later or just write it.
        # pyttsx3 save_to_file is synchronous
        engine.save_to_file(text, output_file)
        engine.runAndWait()
        
        if os.path.exists(output_file) and os.path.getsize(output_file) > 0:
            print(f"System TTS success. Audio saved to {output_file}")
            return
            
    except Exception as e3:
        print(f"System TTS also failed: {e3}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python tts_edge.py <text> <output_file> [voice]")
        sys.exit(1)

    text = sys.argv[1]
    output_file = sys.argv[2]
    voice = sys.argv[3] if len(sys.argv) > 3 else "en-US-AndrewNeural"

    if text == "-":
        text = sys.stdin.read()

    # Use asyncio.run for robust event loop handling in Python 3.7+
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
    try:
        asyncio.run(generate_tts_with_timings(text, output_file, voice))
    except KeyboardInterrupt:
        pass
