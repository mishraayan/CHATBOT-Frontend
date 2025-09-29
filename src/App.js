import React, { useState, useRef } from "react";

function App() {
  const [response, setResponse] = useState("");
  const [listening, setListening] = useState(false);
  const recognition = useRef(null);
  const speaking = useRef(false); // track if AI is speaking

  if (!recognition.current) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition.current = new SpeechRecognition();
    recognition.current.continuous = true;
    recognition.current.interimResults = false;
    recognition.current.lang = "en-US";

    recognition.current.onresult = (event) => {
      const text = event.results[event.results.length - 1][0].transcript;
      console.log("User said:", text);
      sendToAI(text);
    };

    recognition.current.onerror = (event) => {
      console.error("SpeechRecognition error:", event.error);
    };

    recognition.current.onend = () => {
      if (listening && !speaking.current) {
        console.log("Recognition ended, restarting...");
        setTimeout(() => recognition.current.start(), 200);
      }
    };
  }

  const startListening = () => {
    if (!listening) {
      setListening(true);
      recognition.current.start();
    }
  };

  const stopListening = () => {
    setListening(false);
    recognition.current.stop();
  };

  const speak = (text) => {
    speaking.current = true;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";

    utterance.onend = () => {
      speaking.current = false;
      if (listening) {
        // restart recognition after speech finishes
        recognition.current.start();
      }
    };

    speechSynthesis.speak(utterance);
  };

  const sendToAI = async (text) => {
    try {
      const res = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Answer concisely in three line, no special characters: ${text}`
        })
      });

      const data = await res.json();
      const cleanText = data.reply.replace(/[^a-zA-Z0-9\s]/g, "");
      console.log("AI reply (cleaned):", cleanText);

      setResponse(cleanText);
      speak(cleanText);

    } catch (err) {
      console.error("Error connecting to AI:", err);
      setResponse("Error connecting to AI.");
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>🎙 Continuous Short Voice AI</h1>
      <button onClick={startListening} disabled={listening}>
        {listening ? "🎤 Listening..." : "🎤 Start Listening"}
      </button>
      <button onClick={stopListening} disabled={!listening}>
        🛑 Stop Listening
      </button>
      <p><strong>AI Response:</strong> {response}</p>
    </div>
  );
}

export default App;
