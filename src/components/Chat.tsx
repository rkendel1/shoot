import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAppContext } from '../App';
import { ComponentSelector } from './ComponentSelector';
import './Chat.css';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectorActive, setSelectorActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { selectedSpecId } = useAppContext();
  const sendMessageMutation = useMutation(api.chat.sendMessage);

  useEffect(() => {
    // Add welcome message
    const welcomeMessage = selectedSpecId 
      ? `# Welcome back! 🎯\n\nYou have a spec selected. I can help you:\n\n- 🧪 Test endpoints in the playground\n- 🚀 Generate apps and components\n- 💡 Get AI suggestions for creative uses\n- 🔄 Create workflows and remixes\n- ✨ Request changes to existing apps\n\nWhat would you like to do?`
      : `# Welcome to Shoot! 🚀\n\nI'm your AI assistant for building apps from API specifications. I can help you:\n\n- 📤 Upload and parse API specs (OpenAPI, Swagger)\n- 🔍 Analyze APIs and detect patterns\n- 🛠️ Generate production-ready applications\n- 💬 Guide you through the entire process\n\nJust tell me what you'd like to do, or try one of the suggestions below!`;

    setMessages([{
      role: 'assistant',
      content: welcomeMessage,
      timestamp: Date.now(),
    }]);

    if (selectedSpecId) {
      setSuggestions([
        '💡 Show me AI suggestions for this API',
        '🚀 Generate a smart app',
        '🔄 Create a workflow',
        '✨ Suggest creative remixes',
        '🧪 Test in playground',
      ]);
    } else {
      setSuggestions([
        'Upload an API spec',
        'Show me an example',
        'What can you do?',
      ]);
    }
  }, [selectedSpecId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setSuggestions([]);

    try {
      const response = await sendMessageMutation({
        message: textToSend,
        conversationId,
        specId: selectedSpecId,
      });

      if (!conversationId) {
        setConversationId(response.conversationId);
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (response.suggestions) {
        setSuggestions(response.suggestions);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again or make sure Convex is properly configured.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleElementSelect = (elementInfo: string) => {
    setInput(prev => {
      const newContent = prev ? `${prev}\n\n${elementInfo}` : elementInfo;
      return newContent;
    });
  };

  return (
    <div className="chat-container">
      <ComponentSelector 
        isActive={selectorActive}
        onSelect={handleElementSelect}
        onClose={() => setSelectorActive(false)}
      />

      <div className="chat-header">
        <h1>🎯 Shoot - API Spec to App Generator</h1>
        <p>
          Conversational AI-powered app builder with Convex
          {selectedSpecId && <span className="context-badge">📌 Context Active</span>}
        </p>
      </div>

      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && (
          <div className="message assistant">
            <div className="message-avatar">🤖</div>
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

      {suggestions.length > 0 && (
        <div className="suggestions">
          <p>Suggestions:</p>
          <div className="suggestion-buttons">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className="suggestion-button"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="chat-input-container">
        <button
          className="selector-toggle-button"
          onClick={() => setSelectorActive(!selectorActive)}
          title="Select component or CSS from the page"
        >
          🎯 Selector
        </button>
        <textarea
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={selectedSpecId 
            ? "Ask me anything about this API, request changes, or generate components..."
            : "Type your message... (Shift+Enter for new line)"
          }
          rows={3}
          disabled={loading}
        />
        <button
          className="send-button"
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
        >
          {loading ? '⏳' : '📤'} Send
        </button>
      </div>
    </div>
  );
};