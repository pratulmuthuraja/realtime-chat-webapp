'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { useBackendSync } from '@/lib/hooks/useBackendSync';
import { ChatSession, Message } from '@/types/chat';
import { PlusIcon, TrashIcon } from 'lucide-react';

const STORAGE_KEY = 'chat_sessions';

const generateId = () => {
  const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
  return id;
};

export default function ChatInterface() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const { isConnected, sendMessage, lastMessage } = useWebSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastHandledMessageRef = useRef<string | null>(null);
  const { loadFromBackend, saveToBackend } = useBackendSync({
    onError: (error) => console.error('Backend sync error:', error)
  });
  const currentSessionData = sessions.find(s => s.id === currentSession);

  // Initial load - try backend first, fallback to localStorage
  useEffect(() => {
    const initializeSessions = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return; 
      }
   
      const backendSessions = await loadFromBackend(token);
      if (backendSessions && backendSessions.length > 0) {
        setSessions(backendSessions);
        setCurrentSession(backendSessions[0].id);
        return;
      }
   
      // Create single new session only if no sessions exist anywhere
      createNewSession();
    };
   
    initializeSessions();
   }, []);
   
  // Save to localStorage whenever sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  // Handle bot responses
  useEffect(() => {
    if (lastMessage && currentSession && lastMessage.content !== lastHandledMessageRef.current) {
      lastHandledMessageRef.current = lastMessage.content;

      const botMessage: Message = {
        id: generateId(),
        content: lastMessage.content,
        isFromUser: false,
        timestamp: new Date()
      };

      setSessions(prev => prev.map(session => {
        if (session.id === currentSession) {
          return {
            ...session,
            messages: [...session.messages, botMessage]
          };
        }
        return session;
      }));
    }
  }, [lastMessage, currentSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: generateId(),
      name: `Chat ${sessions.length + 1}`,
      messages: [],
      createdAt: new Date()
    };
    setSessions(prev => [...prev, newSession]);
    setCurrentSession(newSession.id);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !isConnected || !currentSession) return;

    const message: Message = {
      id: generateId(),
      content: inputMessage,
      isFromUser: true,
      timestamp: new Date()
    };

    console.log('New message created:', message);

    setSessions(prev => prev.map(session => {
      if (session.id === currentSession) {
        return {
          ...session,
          messages: [...session.messages, message]
        };
      }
      return session;
    }));

    sendMessage(inputMessage);
    setInputMessage('');
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    if (token && sessions.length > 0) {
      // Try to save sessions to backend before logging out
      await saveToBackend(token, sessions);
    }
    localStorage.removeItem('token');
    localStorage.removeItem(STORAGE_KEY);
    router.push('/auth/login');
  };

  const handleDeleteSession = async (sessionId: string) => {
    const token = localStorage.getItem('token');
    if (!token || !sessionId) return;

    try {
      const response = await fetch(`http://192.168.0.2:1337/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (currentSession === sessionId) {
          setCurrentSession(sessions[0]?.id || null);
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  return (
    <div className="flex h-screen max-w-5xl mx-auto bg-white shadow-lg">
      {/* Sessions Sidebar */}
      <div className="w-64 border-r flex flex-col">
        <div className="p-4 border-b">
          <button
            onClick={createNewSession}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600"
          >
            <PlusIcon size={16} />
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sessions.map(session => (
            <div key={session.id} className="flex justify-between p-4 hover:bg-gray-100">
              <button
                onClick={() => setCurrentSession(session.id)}
                className={`flex-1 text-left ${currentSession === session.id ? 'bg-gray-100' : ''}`}
              >
                <div className="font-medium">{session.name}</div>
                <div className="text-sm text-gray-500">{session.messages.length} messages</div>
              </button>
              <button
                onClick={() => handleDeleteSession(session.id)}
                className="px-2 text-red-500 hover:text-red-600"
              >
                <TrashIcon size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="font-medium">
              {currentSessionData?.name || 'Select a chat'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm text-white bg-red-500 rounded hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentSessionData?.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${message.isFromUser
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

        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              disabled={!isConnected || !currentSession}
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              onClick={handleSendMessage}
              disabled={!isConnected || !currentSession || !inputMessage.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
