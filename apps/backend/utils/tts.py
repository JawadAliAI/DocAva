from gtts import gTTS
import sys
import os

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python tts.py <text_or_minus_for_stdin> <output_file> [lang]")
        sys.exit(1)

    text_arg = sys.argv[1]
    output_file = sys.argv[2]
    lang = sys.argv[3] if len(sys.argv) > 3 else "en"

    if text_arg == "-":
        text = sys.stdin.read()
    else:
        text = text_arg

    # Ensure directory exists
    dir_name = os.path.dirname(output_file)
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)

    try:
        # Generate TTS using gTTS
        tts = gTTS(text=text, lang=lang, slow=False)
        tts.save(output_file)
        
        # Verify file was created and has size
        if os.path.exists(output_file) and os.path.getsize(output_file) > 0:
            print(f"Audio saved to {output_file}")
        else:
            print(f"Error: File not created or empty: {output_file}", file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
