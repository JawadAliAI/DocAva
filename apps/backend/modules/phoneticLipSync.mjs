import fs from "fs";

/**
 * Generate phonetic lip sync data from text
 * This is a fallback when Rhubarb is not available
 * It creates realistic mouth movements based on letter patterns
 */
export const generatePhoneticLipSync = ({ text, duration }) => {
    console.log(`Generating phonetic lip sync for: "${text}" (${duration}s)`);

    const words = text.toLowerCase().split(/\s+/);
    const mouthCues = [];

    // Phoneme mapping based on common letter patterns
    const letterToPhoneme = {
        // Closed mouth sounds
        'p': 'A', 'b': 'A', 'm': 'A',
        // K/G sounds
        'k': 'B', 'g': 'B', 'c': 'B', 'q': 'B',
        // EE/I sounds  
        'e': 'C', 'i': 'C',
        // AA/AH sounds
        'a': 'D',
        // O sounds
        'o': 'E',
        // U/OO sounds
        'u': 'F',
        // F/V sounds
        'f': 'G', 'v': 'G',
        // TH sounds
        't': 'H', 'd': 'H', 's': 'H', 'z': 'H',
        // Default
        'default': 'X'
    };

    let currentTime = 0;
    const avgLetterDuration = duration / text.replace(/\s/g, '').length;

    // Process each word
    words.forEach(word => {
        // Add a small pause between words
        if (mouthCues.length > 0) {
            mouthCues.push({
                start: currentTime,
                end: currentTime + avgLetterDuration * 0.5,
                value: 'X' // Rest position
            });
            currentTime += avgLetterDuration * 0.5;
        }

        // Process each letter in the word
        for (let i = 0; i < word.length; i++) {
            const letter = word[i];
            const phoneme = letterToPhoneme[letter] || letterToPhoneme['default'];

            // Vary duration slightly for more natural feel
            const variance = 0.8 + Math.random() * 0.4; // 0.8x to 1.2x
            const letterDur = avgLetterDuration * variance;

            mouthCues.push({
                start: currentTime,
                end: currentTime + letterDur,
                value: phoneme
            });

            currentTime += letterDur;
        }
    });

    // Ensure we end at the right time
    if (mouthCues.length > 0) {
        const lastCue = mouthCues[mouthCues.length - 1];
        if (lastCue.end > duration) {
            // Scale all times proportionally to fit
            const scale = duration / lastCue.end;
            mouthCues.forEach(cue => {
                cue.start *= scale;
                cue.end *= scale;
            });
        } else if (lastCue.end < duration) {
            // Add final rest position
            mouthCues.push({
                start: lastCue.end,
                end: duration,
                value: 'X'
            });
        }
    }

    console.log(`✅ Generated ${mouthCues.length} mouth cues`);

    return {
        metadata: {
            soundFile: "generated",
            duration: duration
        },
        mouthCues: mouthCues
    };
};

/**
 * Generate phoneme data and save to file
 */
export const generatePhoneticLipSyncFile = ({ text, duration, outputPath }) => {
    const lipSyncData = generatePhoneticLipSync({ text, duration });
    fs.writeFileSync(outputPath, JSON.stringify(lipSyncData, null, 2));
    console.log(`💾 Saved lip sync data to: ${outputPath}`);
    return lipSyncData;
};
