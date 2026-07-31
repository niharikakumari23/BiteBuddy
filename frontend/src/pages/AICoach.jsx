import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, User, MoreHorizontal } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AI_SUGGESTIONS } from '../data/constants';
import './AICoach.css';

export const AICoach = ({ API_BASE, token }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your BiteBuddy AI Coach. How can I help you with your nutrition or workout goals today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = useCallback(async (text) => {
    const msgText = text || input.trim();
    if (!msgText) return;
    
    setInput('');
    const userMsg = { role: 'user', content: msgText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsTyping(true);

    try {
      // Gemini expects conversation to start with user. Filter out the initial greeting if it's the first message.
      const chatHistory = updatedMessages.filter((m, i) => !(i === 0 && m.role === 'assistant'));
      
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ messages: chatHistory }),
      });
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please check if the servers are running! 🥗" }]);
    } finally {
      setIsTyping(false);
    }
  }, [input, messages, API_BASE, token]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="page-container coach-container animate-fade-in">
      <Card className="chat-card">
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-avatar assistant">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="chat-title">BiteBuddy Coach</h2>
              <span className="chat-status">
                <span className="status-dot online"></span> Always online
              </span>
            </div>
          </div>
        </div>

        <div className="chat-body">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message-wrapper ${msg.role}`}>
              <div className={`chat-avatar ${msg.role}`}>
                {msg.role === 'assistant' ? <Sparkles size={16} /> : <User size={16} />}
              </div>
              <div className="message-bubble">
                {msg.content}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="message-wrapper assistant">
              <div className="chat-avatar assistant">
                <Sparkles size={16} />
              </div>
              <div className="message-bubble typing-indicator">
                <MoreHorizontal size={24} className="animate-pulse" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-suggestions">
          {AI_SUGGESTIONS.map((suggestion, idx) => (
            <button 
              key={idx} 
              className="suggestion-pill"
              onClick={() => sendMessage(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <textarea
              className="chat-input"
              placeholder="Ask anything about nutrition, recipes, or your goals..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <Button 
              className="chat-send-btn" 
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
