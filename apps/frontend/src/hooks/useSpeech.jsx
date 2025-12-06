import { createContext, useContext, useEffect, useRef, useState } from "react";

const getBackendUrl = () => {
  return import.meta.env.VITE_API_URL || "";
};

const backendUrl = getBackendUrl();

const fetchWithTimeout = async (resource, options = {}) => {
  const { timeout = 30000 } = options; // 30 seconds timeout
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal
  });
  clearTimeout(id);
  return response;
};

const SpeechContext = createContext();

export const SpeechProvider = ({ children }) => {
  const [error, setError] = useState(null);
  const [chatHistory, setChatHistory] = useState([]); // Added
  const [recording, setRecording] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState();
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef(null);
  const userIdRef = useRef("demo_user_123");

  // ... (keeping setUserId, refs, VAD setup ... skipping to relevant parts for replacement if needed, but since this file is messed up I might need to replace larger chunks or be precise).
  // I will replace ONLY the start of the component to fix the duplicate state declarations first.


  const setUserId = (id) => {
    userIdRef.current = id;
  };

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const isContinuousRef = useRef(false);

  const startRecording = async (isAutoRestart = false) => {
    if (typeof isAutoRestart !== 'boolean' || !isAutoRestart) isContinuousRef.current = true; // Manual start enables loop
    try {
      // Debug logging
      console.log('🔍 Debugging microphone access:');
      console.log('  - Current URL:', window.location.href);
      console.log('  - Protocol:', window.location.protocol);
      console.log('  - Hostname:', window.location.hostname);
      console.log('  - navigator exists:', typeof navigator !== 'undefined');
      console.log('  - navigator.mediaDevices exists:', typeof navigator.mediaDevices !== 'undefined');
      console.log('  - getUserMedia exists:', navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia !== 'undefined');

      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Fallback to Web Speech API
        console.log('⚠️ MediaDevices not available, using Web Speech API fallback');

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
          throw new Error(
            'Neither MediaDevices nor Web Speech API is available. Please use Chrome, Edge, or Safari, and ensure you are on HTTPS or localhost.'
          );
        }

        // Use Web Speech API
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setRecording(true);
          console.log('🎤 Web Speech Recognition started...');
        };

        recognition.onresult = async (event) => {
          const transcript = event.results[0][0].transcript;
          console.log('📝 Recognized text:', transcript);

          setRecording(false);
          setLoading(true);

          try {
            // Send directly to TTS endpoint (skip STT since we already have text)
            await tts(transcript, userIdRef.current);
          } catch (error) {
            console.error('Error processing speech:', error);
            setError(`Error: ${error.message}`);
          } finally {
            setLoading(false);
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setRecording(false);
          setError(`Speech recognition error: ${event.error}`);
        };

        recognition.onend = () => {
          setRecording(false);
          console.log('🎤 Web Speech Recognition ended.');
        };

        recognition.start();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      let mimeType = "";
      if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
        mimeType = "audio/ogg";
      }

      const options = mimeType ? { mimeType } : undefined;
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      chunksRef.current = [];

      // VAD (Voice Activity Detection) Setup
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      analyserRef.current = analyser;
      audioContextRef.current = audioContext;

      let lastSpeakTime = Date.now();
      let hasSpoken = false;

      const checkSilence = () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;

        analyser.getByteFrequencyData(dataArray);

        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        // Threshold of 10 seems reasonable for silence vs speech in quiet room
        if (average > 10) {
          lastSpeakTime = Date.now();
          if (!hasSpoken) {
            console.log("🗣️ User started speaking...");
            hasSpoken = true;
          }
        }

        // If we have spoken previously, and now it's been silent for 2 seconds -> STOP
        if (hasSpoken && (Date.now() - lastSpeakTime > 1000)) {
          console.log("🤫 Silence detected, stopping recording...");
          stopRecording(true);
          return;
        }

        silenceTimerRef.current = requestAnimationFrame(checkSilence);
      };

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        // Cleanup VAD
        if (silenceTimerRef.current) cancelAnimationFrame(silenceTimerRef.current);
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }

        const audioBlob = new Blob(chunksRef.current, { type: mediaRecorderRef.current.mimeType || 'audio/webm' });

        // Convert Blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result.split(',')[1];

          setLoading(true);
          try {
            // Send to backend STS endpoint
            const response = await fetch(`${backendUrl}/sts`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                audio: base64Audio,
                userId: userIdRef.current
              }),
            });

            if (!response.ok) {
              throw new Error(`Server error: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('📦 Received response from backend:', {
              hasError: !!data.error,
              messagesCount: data.messages?.length || 0,
              userMessage: data.userMessage
            });

            if (data.error) {
              throw new Error(data.error);
            }

            if (!data.messages || data.messages.length === 0) {
              throw new Error("AI returned no response. Please try again.");
            }

            console.log('✅ Adding messages to queue:', data.messages);
            setMessages((messages) => [...messages, ...data.messages]);
            if (data.messages.length > 0) {
              const userText = data.userMessage || "Voice Message";
              setChatHistory(prev => [...prev, { type: 'user', text: userText }, { type: 'bot', text: data.messages[0].text }]);
            }
          } catch (error) {
            console.error("STS Error:", error);
            setError(`STS Error: ${error.message}`);
          } finally {
            setLoading(false);
          }
        };
      };

      mediaRecorderRef.current.start();
      setRecording(true);
      console.log('🎤 Recording started...');

      // Start VAD monitoring
      checkSilence();

    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError(`Microphone Error: ${err.message}`);
      // alert(`Could not access microphone...`); // Removing alert to reduce popup spam
    }
  };

  const stopRecording = (fromVAD = false) => {
    if (typeof fromVAD !== 'boolean' || !fromVAD) isContinuousRef.current = false; // Manual stop disables loop
    if (mediaRecorderRef.current && recording) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setRecording(false);
      console.log('🎤 Recording stopped.');

      // Stop all tracks to release microphone
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }

      // Cleanup VAD (redundant check but safe)
      if (silenceTimerRef.current) cancelAnimationFrame(silenceTimerRef.current);
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch (e) { }
        audioContextRef.current = null;
      }
    }
  };

  const tts = async (message, userId) => {
    const effectiveUserId = userId || userIdRef.current || "demo_user_123";
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithTimeout(`${backendUrl}/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, userId: effectiveUserId }),
        timeout: 45000 // 45 seconds for slow generation
      });

      if (!data.ok) {
        throw new Error(`Server error: ${data.status} ${data.statusText}`);
      }

      const response = (await data.json()).messages;
      setMessages((messages) => [...messages, ...response]);
      if (response && response.length > 0) {
        setChatHistory(prev => [...prev, { type: 'user', text: message }, { type: 'bot', text: response[0].text }]);
      }
    } catch (error) {
      console.error("TTS error:", error);
      if (error.name === 'AbortError') {
        setError("Request timed out. Server is taking too long.");
      } else {
        setError(`TTS Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const onMessagePlayed = () => {
    console.log('🎵 Message played, removing from queue');
    setMessages((messages) => messages.slice(1));

    // Auto-restart loop if enabled
    if (isContinuousRef.current && messages.length <= 1) {
      console.log("🔄 Auto-conversation: Restarting listening in 1s...");
      setTimeout(() => {
        if (isContinuousRef.current) {
          startRecording(true);
        }
      }, 1000);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      console.log('🎬 Setting current message to play:', messages[0].text?.substring(0, 50));
      setMessage(messages[0]);
    } else {
      console.log('⏹️ No messages in queue');
      setMessage(null);
    }
  }, [messages]);

  return (
    <SpeechContext.Provider
      value={{
        startRecording,
        stopRecording,
        recording,
        tts,
        message,
        onMessagePlayed,
        chatHistory,
        loading,
        setUserId,
        error,
      }}
    >
      {children}
    </SpeechContext.Provider>
  );
};

export const useSpeech = () => {
  const context = useContext(SpeechContext);
  if (!context) {
    throw new Error("useSpeech must be used within a SpeechProvider");
  }
  return context;
};
