import React, { useEffect, useMemo, useRef, useState } from "react";
import "./chatbot.css";

const Chatbot = () => {
  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState([
    { id: "welcome", author: "bot", text: "Hey there! where are you stuck!" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const containerRef = useRef(null);

  useEffect(() =>{
    const existing = document.getElementById("model-viewer-script");
    if (!existing) {
      const script = document.createElement("script");
      script.id = "model-viewer-script";
      script.type = "module";
      script.src = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
      document.body.appendChild(script);
    }
    const onOpen = () => setVisible(true);
    window.addEventListener("open-chat", onOpen);
    return () => window.removeEventListener("open-chat", onOpen);
  }, []);

  const scrollThreshold = 120;

  const isNearBottom = () => {
    const node = containerRef.current;
    if (!node) {
      return true;
    }
    const distance = node.scrollHeight - (node.scrollTop + node.clientHeight);
    return distance <= scrollThreshold;
  };

  const scrollToBottom = (behavior = "auto") => {
    const node = containerRef.current;
    if (!node) {
      return;
    }
    node.scrollTo({ top: node.scrollHeight, behavior });
  };

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const node = containerRef.current;
    const handleScroll = () => {
      const distance = node.scrollHeight - (node.scrollTop + node.clientHeight);
      setShowScrollButton(distance > scrollThreshold);
    };

    handleScroll();
    node.addEventListener("scroll", handleScroll);
    return () => node.removeEventListener("scroll", handleScroll);
  }, [visible]);

  useEffect(() => {
    if (isNearBottom()) {
      scrollToBottom();
      setShowScrollButton(false);
    } else {
      setShowScrollButton(true);
    }
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!input.trim()) {
      return;
    }

  const userMessage = { id: `user-${Date.now()}`, author: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage.text }),
      });

      if (!response.ok) {
        throw new Error(`request failed with status ${response.status}`);
      }

      const payload = await response.json();
      const answer = payload.answer || "looks like I am out of info, add this in feedback";

      setMessages((prev) => [
        ...prev,
        { id: `bot-${Date.now()}`, author: "bot", text: answer.trim() },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-error-${Date.now()}`,
          author: "bot",
          text: "connect to api failed",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) {
      return "Good morning";
    }
    if (hours < 18) {
      return "Good afternoon";
    }
    return "Good evening";
  }, []);

  return (
    <div className="chat-assistant">
      {visible && (
        <div className="chat-panel" id="learning-chatbot" role="dialog" aria-modal="false">
          <header className="chat-panel__header">
            <div>
              <p className="chat-panel__eyebrow">{greeting}</p>
              <h4>Nova AI</h4>
            </div>
            <button type="button" className="chat-panel__close" onClick={() => setVisible(false)}>
              ×
            </button>
          </header>

          <div className="chat-panel__body" ref={containerRef}>
            {messages.map((message) => (
              <div key={message.id} className={`chat-bubble chat-bubble--${message.author}`}>
                <p>{message.text}</p>
              </div>
            ))}
            {isLoading && (
              <div className="chat-bubble chat-bubble--bot is-loading">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            )}
          </div>
          {showScrollButton && (
            <button
              type="button"
              className="chat-scroll-button"
              onClick={() => {
                scrollToBottom("smooth");
                setShowScrollButton(false);
              }}
              aria-label="Scroll to latest message"
            >
              ↓
            </button>
          )}

          <div className="chat-panel__composer">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Example: Recommend a course to become a ML Engineer"
            />
            <button type="button" onClick={sendMessage} disabled={isLoading}>
              {isLoading ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
