import sys
import asyncio
import json
import edge_tts
import os

async def generate_tts_with_timings(text, output_file, voice="en-GB-ThomasNeural"):
    """
    Generates audio and a corresponding JSON file with word timings.
    """
    communicate = edge_tts.Communicate(text, voice)
    
    timings = []

    # Ensure output directory exists
    dir_name = os.path.dirname(output_file)
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)

    with open(output_file, "wb") as audio_file:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_file.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                # chunk contains: offset, duration, text
                timings.append({
                    "text": chunk["text"],
                    "start": chunk["offset"] / 10000000, # convert 100ns units to seconds
                    "duration": chunk["duration"] / 10000000
                })

    # Save timings to a JSON file
    json_output = output_file + ".json"
    with open(json_output, "w", encoding="utf-8") as f:
        json.dump(timings, f, indent=2)
    
    print(f"Audio saved to {output_file}")
    print(f"Timings saved to {json_output}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python tts_edge.py <text> <output_file> [voice]")
        sys.exit(1)

    text = sys.argv[1]
    output_file = sys.argv[2]
    voice = sys.argv[3] if len(sys.argv) > 3 else "en-GB-ThomasNeural"

    # Handle stdin input for text if needed (though we pass as arg usually)
    if text == "-":
        text = sys.stdin.read()
    loop = asyncio.get_event_loop_policy().get_event_loop()
    try:
        loop.run_until_complete(generate_tts_with_timings(text, output_file, voice))
    finally:
        loop.close()