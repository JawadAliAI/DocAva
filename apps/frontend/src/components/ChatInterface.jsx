import { useRef, useEffect, useState } from "react";
import { useSpeech } from "../hooks/useSpeech";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export const ChatInterface = ({ hidden, ...props }) => {
  const input = useRef();
  const { tts, loading, message, startRecording, stopRecording, recording, setUserId } = useSpeech();
  const { currentUser, logout } = useAuth();
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  // Fetch Username from Firestore and Sync Identity
  useEffect(() => {
    const fetchUsername = async () => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const fetchedUsername = userData.username || currentUser.displayName || "User";
            setUsername(fetchedUsername);
            setUserId(fetchedUsername);
            console.log("✅ Identity set to username:", fetchedUsername);
          } else {
            // Fallback if doc missing
            const fallback = currentUser.displayName || "User";
            setUsername(fallback);
            setUserId(fallback);
          }
        } catch (error) {
          console.error("Error fetching username:", error);
          // Fallback
          setUserId(currentUser.displayName || "User");
        }
      } else {
        setUserId("demo_user_123");
        setUsername("");
      }
    };

    fetchUsername();
  }, [currentUser, setUserId]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const sendMessage = () => {
    const text = input.current.value;
    // Use the fetched username, or fallback to demo if not ready/logged in
    const userId = username || (currentUser ? currentUser.uid : "demo_user_123");

    if (!loading && !message) {
      tts(text, userId);
      input.current.value = "";
    }
  };

  if (hidden) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 z-10 flex justify-between p-4 flex-col pointer-events-none">
      <div className="self-start backdrop-blur-md bg-white bg-opacity-50 p-4 rounded-lg flex justify-between items-center w-full max-w-md pointer-events-auto">
        <div>
          <h1 className="font-black text-xl text-gray-700">
            {currentUser?.displayName ? `Hello, ${currentUser.displayName} 👋` : "Dr. HealBot 🩺"}
          </h1>
          <p className="text-gray-600 text-sm">
            {loading ? "Thinking..." : "Your AI Medical Assistant"}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
        >
          Logout
        </button>
      </div>

      <div className="flex-grow w-full mb-4 p-2 pointer-events-none">
        {/* Chat text removed as requested */}
        {loading && <div className="text-center text-xs text-gray-500 animate-pulse mt-4 bg-white/80 p-1 rounded inline-block">Thinking...</div>}
      </div>

      <div className="flex flex-col items-center gap-2 pointer-events-auto max-w-screen-sm w-full mx-auto">
        {/* Debug / Error Area */}
        {(useSpeech().error) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative w-full mb-2" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{useSpeech().error}</span>
          </div>
        )}

        <div className="flex items-center gap-2 w-full">
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`bg-gray-500 hover:bg-gray-600 text-white p-4 px-4 font-semibold uppercase rounded-md relative ${recording ? "bg-red-500 hover:bg-red-600" : ""
              } ${loading || message ? "cursor-not-allowed opacity-30" : ""}`}
          >
            {/* Visual Indicator of Recording */}
            {recording && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
              />
            </svg>
          </button>

          <input
            className="w-full placeholder:text-gray-800 placeholder:italic p-4 rounded-md bg-opacity-50 bg-white backdrop-blur-md"
            placeholder="Type a message..."
            ref={input}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
          />
          <button
            disabled={loading || message}
            onClick={sendMessage}
            className={`bg-gray-500 hover:bg-gray-600 text-white p-4 px-10 font-semibold uppercase rounded-md ${loading || message ? "cursor-not-allowed opacity-30" : ""
              }`}
          >
            Send
          </button>
        </div>
      </div>
    </div >
  );
};
