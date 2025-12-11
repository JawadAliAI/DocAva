import sys
import os
import json
import asyncio
import edge_tts
import subprocess

# --- Configuration ---
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
PIPER_MODEL_PATH = os.path.join(MODELS_DIR, "piper", "en_US-danny-low.onnx")

# --- Edge TTS Setup ---
print("Initializing TTS Service...", file=sys.stderr)

# Default voice
DEFAULT_VOICE = "en-US-ChristopherNeural"




# --- Piper Setup ---
PIPER_BIN_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "piper_bin", "piper", "piper.exe")
Configured_Piper_Model = PIPER_MODEL_PATH # Default

PIPER_PROCESS = None

def get_piper_process(model_path):
    global PIPER_PROCESS, Configured_Piper_Model
    
    # Restart if model changed or process dead
    if PIPER_PROCESS:
        if PIPER_PROCESS.poll() is not None:
             print("Piper process died, restarting...", file=sys.stderr)
             PIPER_PROCESS = None
        elif model_path != Configured_Piper_Model:
             print(f"Switching Piper model to {model_path}...", file=sys.stderr)
             PIPER_PROCESS.terminate()
             PIPER_PROCESS = None
             
    if PIPER_PROCESS is None:
        if not os.path.exists(PIPER_BIN_PATH):
             raise FileNotFoundError(f"Piper binary not found at: {PIPER_BIN_PATH}")
        if not os.path.exists(model_path):
             raise FileNotFoundError(f"Piper model not found at: {model_path}")

        Configured_Piper_Model = model_path
        
        # Start persistent process
        # Using --output_dir . means we provide filenames relative to CWD
        cmd = [
            PIPER_BIN_PATH, 
            "-m", model_path, 
            "--json-input", 
            "--output_dir", os.getcwd() 
        ]
        
        startupinfo = None
        if sys.platform == 'win32':
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            startupinfo.wShowWindow = subprocess.SW_HIDE

        print(f"Starting Persistent Piper: {cmd}", file=sys.stderr)
        
        PIPER_PROCESS = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=sys.stderr, # Redirect stderr to main stderr to see logs
            startupinfo=startupinfo,
            text=True, # Text mode for JSON lines
            bufsize=1  # Line buffered
        )
        
    return PIPER_PROCESS

async def generate_piper_audio(text, output_file, model_path=PIPER_MODEL_PATH):
    """
    Generate audio using Piper TTS (Persistent Process).
    Ultra-low Latency.
    """
    try:
        proc = get_piper_process(model_path)
        
        # Calculate relative path for Piper
        # output_file is absolute, we need relative to CWD (apps/backend)
        try:
            rel_output_file = os.path.relpath(output_file, os.getcwd())
        except ValueError:
            # Fallback if on different drive (unlikely)
            rel_output_file = "temp_audio.wav"
        
        payload = json.dumps({"text": text, "output_file": rel_output_file})
        
        start_time = asyncio.get_event_loop().time()
        
        # Write to stdin
        proc.stdin.write(payload + "\n")
        proc.stdin.flush()
        
        # Wait for response line from stdout
        # run_in_executor to avoid blocking the event loop
        response = await asyncio.get_event_loop().run_in_executor(None, proc.stdout.readline)
        
        duration = asyncio.get_event_loop().time() - start_time
        print(f"Generated ({duration:.2f}s): {rel_output_file}", file=sys.stderr)
        
        # Fallback renaming if drive issues prevented direct write (logic above)
        if rel_output_file == "temp_audio.wav" and rel_output_file != output_file:
             pass # In practice we expect relpath to work in this setup
             
        # Add a small delay to ensure file handle is flushed/closed by Piper OS level?
        # Usually checking the file existence is enough.
        
        if not os.path.exists(output_file):
            print(f"Warning: Expected output file {output_file} not found immediately.", file=sys.stderr)

        return [] 

    except Exception as e:
        print(f"Piper generation error: {e}", file=sys.stderr)
        # Kill process to be safe on error
        if PIPER_PROCESS:
            try:
                PIPER_PROCESS.terminate()
            except: 
                pass
        raise



async def generate_edge_audio(text, output_file, voice=DEFAULT_VOICE):
    """
    Generate audio using Edge TTS (Microsoft).
    No API key required. Free and fast.
    """
    try:
        if not voice:
            voice = DEFAULT_VOICE
            
        # Handle some common voice name mappings to Edge TTS voices
        voice_map = {
            "adam": "en-US-ChristopherNeural",       # Deep male
            "antoni": "en-US-EricNeural",           # Male
            "rachel": "en-US-AriaNeural",           # Female
            "domi": "en-US-AvaNeural",              # Female
            "bella": "en-GB-SoniaNeural",           # Female (Soft)
        }
        
        if voice.lower() in voice_map:
            voice = voice_map[voice.lower()]
            
        print(f"Generating Edge TTS audio for: '{text[:50]}...' with voice: {voice}", file=sys.stderr)
        
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_file)
        
        print(f"Audio saved to: {output_file}", file=sys.stderr)
        
        # We return empty timings for now. 
        # The Node.js backend will detect empty timings and fallback to local Rhubarb sync.
        return [] 
            
    except Exception as e:
        import traceback
        traceback.print_exc(file=sys.stderr)
        raise Exception(f"Edge TTS generation failed: {e}")

async def process_request(request_line):
    try:
        data = json.loads(request_line)
        text = data.get("text")
        output_file = data.get("output_file")
        voice = data.get("voice", DEFAULT_VOICE)
        
        if not text or not output_file:
            raise ValueError("Missing 'text' or 'output_file'")

        timings = []
        try:
            # Check if voice is piper-related
            if "piper" in voice.lower() or voice.lower() == "amy":
                 timings = await generate_piper_audio(text, output_file)
            else:
                 timings = await generate_edge_audio(text, output_file, voice)
                 
            return {"success": True, "timings": timings}
        except Exception as e:
            return {"error": f"TTS Generation Failed: {e}"}

    except Exception as e:
        return {"error": str(e)}

async def main():
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

    print("READY", flush=True) 
    
    loop = asyncio.get_event_loop()
    
    while True:
        try:
            line = await loop.run_in_executor(None, sys.stdin.readline)
            if not line:
                break
                
            line = line.strip()
            if not line:
                continue
            
            result = await process_request(line)
            print(json.dumps(result), flush=True)
            
        except Exception as big_e:
            print(json.dumps({"error": f"Service Error: {big_e}"}), flush=True)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
