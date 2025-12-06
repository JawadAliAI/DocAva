// Simplified lip sync animation for avatars with limited morph targets
// This version works with just mouthOpen and mouthSmile

useFrame(() => {
    // Simple lip sync using only available morph targets
    let mouthOpenValue = 0;
    let mouthSmileValue = 0;

    if (message && lipsync && audio && !audio.paused && !audio.ended) {
        const currentAudioTime = audio.currentTime;

        // Find current mouth cue
        for (let i = 0; i < lipsync.mouthCues.length; i++) {
            const mouthCue = lipsync.mouthCues[i];

            if (currentAudioTime >= mouthCue.start && currentAudioTime <= mouthCue.end) {
                const viseme = mouthCue.value;

                // Simple mapping: open mouth for most sounds, smile for some
                // Rhubarb visemes: A-H are different mouth shapes, X is silence
                switch (viseme) {
                    case 'X': // Silence
                        mouthOpenValue = 0.0;
                        mouthSmileValue = 0.0;
                        break;
                    case 'A': // Relaxed
                    case 'B': // Lips together (P, B, M)
                    case 'C': // Mouth open (E, I, etc)
                        mouthOpenValue = 0.5;
                        mouthSmileValue = 0.3;
                        break;
                    case 'D': // Wide open (AA)
                    case 'E': // O sound
                    case 'F': // U sound
                        mouthOpenValue = 0.8;
                        mouthSmileValue = 0.1;
                        break;
                    case 'G': // F, V
                    case 'H': // L
                        mouthOpenValue = 0.4;
                        mouthSmileValue = 0.5;
                        break;
                    default:
                        mouthOpenValue = 0.3;
                        mouthSmileValue = 0.2;
                }
                break;
            }
        }
    }

    // Apply morph targets with smooth lerp
    lerpMorphTarget("mouthOpen", mouthOpenValue, 0.9);
    lerpMorphTarget("mouthSmile", mouthSmileValue, 0.9);

    // Handle blinking
    lerpMorphTarget("eyeBlinkLeft", blink ? 1 : 0, 0.5);
    lerpMorphTarget("eyeBlinkRight", blink ? 1 : 0, 0.5);
});
