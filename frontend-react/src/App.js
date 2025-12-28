import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = 'http://localhost:8000';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `user_${Date.now()}`);
  const [apiHealth, setApiHealth] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    checkHealth();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkHealth = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/health`);
      setApiHealth(response.data);
    } catch (error) {
      console.error('Health check failed:', error);
      setApiHealth({ status: 'offline' });
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Convert messages to API format
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await axios.post(`${API_BASE_URL}/api/chat`, {
        message: inputMessage,
        session_id: sessionId,
        conversation_history: conversationHistory
      }, {
        timeout: 60000 
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.reply,
        context_used: response.data.context_used
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: error.response 
          ? `Server error: ${error.response.data.detail || 'Unknown error'}` 
          : 'Sorry, I encountered an error. Please make sure the backend server is running on http://localhost:8000',
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo">
              <span className="logo-icon">🩺</span>
              <h1 className="logo-text">AI Doctor</h1>
            </div>
            <p className="tagline">Your Personal Health Assistant</p>
          </div>
          
          <div className="header-actions">
            {apiHealth && (
              <div className={`status-badge ${apiHealth.status === 'healthy' ? 'status-online' : 'status-offline'}`}>
                <span className="status-dot"></span>
                {apiHealth.status === 'healthy' ? 'Online' : 'Offline'}
              </div>
            )}
            {messages.length > 0 && (
              <button className="new-chat-btn" onClick={startNewConversation}>
                <span className="btn-icon">+</span>
                New Chat
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="chat-container">
          {messages.length === 0 ? (
            <div className="welcome-screen">
              <div className="welcome-icon">🏥</div>
              <h2 className="welcome-title">Welcome to AI Doctor</h2>
              <p className="welcome-subtitle">
                Describe your symptoms and I'll help provide medical guidance
              </p>
              
              <div className="example-prompts">
                <h3 className="prompts-title">Try asking:</h3>
                <div className="prompts-grid">
                  <button 
                    className="prompt-card" 
                    onClick={() => setInputMessage("I have a headache and fever")}
                  >
                    <span className="prompt-icon">🤒</span>
                    <span className="prompt-text">I have a headache and fever</span>
                  </button>
                  <button 
                    className="prompt-card" 
                    onClick={() => setInputMessage("I'm experiencing chest pain")}
                  >
                    <span className="prompt-icon">💔</span>
                    <span className="prompt-text">I'm experiencing chest pain</span>
                  </button>
                  <button 
                    className="prompt-card" 
                    onClick={() => setInputMessage("I have a persistent cough")}
                  >
                    <span className="prompt-icon">😷</span>
                    <span className="prompt-text">I have a persistent cough</span>
                  </button>
                  <button 
                    className="prompt-card" 
                    onClick={() => setInputMessage("I feel dizzy and nauseous")}
                  >
                    <span className="prompt-icon">😵</span>
                    <span className="prompt-text">I feel dizzy and nauseous</span>
                  </button>
                </div>
              </div>

              <div className="disclaimer">
                <span className="disclaimer-icon">⚠️</span>
                <p>This is an AI assistant for informational purposes only. Always consult a healthcare professional for medical advice.</p>
              </div>
            </div>
          ) : (
            <div className="messages-container">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`message ${message.role === 'user' ? 'message-user' : 'message-assistant'} ${message.isError ? 'message-error' : ''}`}
                >
                  <div className="message-avatar">
                    {message.role === 'user' ? '👤' : '👨‍⚕️'}
                  </div>
                  <div className="message-content">
                    <div className="message-text">
                      {message.content}
                    </div>
                    {message.context_used && message.context_used.length > 0 && (
                      <div className="message-context">
                        <details>
                          <summary>📚 Medical Context Used</summary>
                          <ul className="context-list">
                            {message.context_used.map((context, idx) => (
                              <li key={idx}>{context}</li>
                            ))}
                          </ul>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="message message-assistant">
                  <div className="message-avatar">👨‍⚕️</div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <footer className="footer">
        <div className="input-container">
          <form onSubmit={sendMessage} className="input-form">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Describe your symptoms..."
              className="message-input"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="send-button"
              disabled={!inputMessage.trim() || isLoading}
            >
              {isLoading ? (
                <span className="button-loading">...</span>
              ) : (
                <span className="button-icon">➤</span>
              )}
            </button>
          </form>
          <p className="footer-note">
            AI-powered diagnosis assistant • Always consult a healthcare professional
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
