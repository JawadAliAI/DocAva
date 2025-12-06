// Rhubarb Lip Sync outputs phonemes A-H and X
// This maps them to the morph targets available on the avatar model
const visemesMapping = {
  A: "viseme_PP",  // Silence/closed mouth (P, B, M sounds)
  B: "viseme_kk",  // K, G, ng sounds
  C: "viseme_I",   // I, EE sounds
  D: "viseme_aa",  // AA, AH, AE sounds (IMPORTANT: lowercase!)
  E: "viseme_O",   // O, OH sounds
  F: "viseme_U",   // U, OO sounds
  G: "viseme_FF",  // F, V sounds
  H: "viseme_TH",  // TH sounds
  X: "viseme_sil", // Rest position (silence) - using sil instead of PP for variety
};

export default visemesMapping;