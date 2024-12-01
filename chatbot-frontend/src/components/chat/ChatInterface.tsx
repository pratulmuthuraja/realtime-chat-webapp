// src/components/chat/ChatInterface.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useWebSocket } from '@/lib/hooks/useWebSocket';

interface Message {
  id: string;
  content: string;
  isFromUser: boolean;
  timestamp: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const { isConnected, sendMessage, lastMessage } = useWebSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
// Inside ChatInterface.tsx, update the useEffect for lastMessage:
useEffect(() => {
    if (lastMessage) {
      setMessages(prev => [...prev, {
        ...lastMessage,
        id: Date.now().toString()
      }]);
    }
  }, [lastMessage]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !isConnected) return;

    sendMessage(inputMessage);
    setInputMessage('');
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-white shadow-lg">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="font-medium">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.isFromUser
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p>{message.content}</p>
              <span className="text-xs opacity-70">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            disabled={!isConnected}
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={handleSendMessage}
            disabled={!isConnected || !inputMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}