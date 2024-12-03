import { ChatSession, BackendSession } from '@/types/chat';

interface BackendSyncProps {
  onError?: (error: Error) => void;
}

interface BackendResponse {
  data: Array<{
    id: string;
    attributes: {
      name: string;
      messages: any[];
      sessionCreatedAt: string;
    }
  }>;
}

const api = {
  async fetchSessions(token: string): Promise<BackendResponse> {
    console.log('Fetching sessions from backend...');
    const response = await fetch('http://192.168.0.2:1337/api/sessions', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch sessions');
    const data = await response.json();
    console.log('Fetched sessions:', data);
    return data;
  },

  async saveSession(token: string, session: ChatSession) {
    const isExistingSession = !isNaN(Number(session.id));
    const method = isExistingSession ? 'PUT' : 'POST';
    const url = isExistingSession 
      ? `http://192.168.0.2:1337/api/sessions/${session.id}`
      : 'http://192.168.0.2:1337/api/sessions';
  
    console.log(`${method} session:`, session);
    console.log('Messages to save:', session.messages);

    const payload = {
      data: {
        name: session.name || `Chat ${session.id}`,
        messages: session.messages,
        sessionCreatedAt: session.createdAt
      }
    };

    console.log('Request payload:', JSON.stringify(payload, null, 2));
  
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Save failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error('Failed to save session');
    }

    const responseData = await response.json();
    console.log('Save response:', responseData);
    if (responseData.data && responseData.data.attributes && responseData.data.attributes.messages) {
      responseData.data.attributes.messages = JSON.parse(responseData.data.attributes.messages);
    }
    return responseData;
  },

  async saveAllSessions(token: string, sessions: ChatSession[]) {
    for (const session of sessions) {
      await this.saveSession(token, session);
    }
  }
};

export const useBackendSync = ({ onError }: BackendSyncProps = {}) => {
  const loadFromBackend = async (token: string) => {
    try {
      const response = await api.fetchSessions(token);
      if (!response.data) return [];
  
      const sessions = response.data.map((session) => {
        console.log('Session messages from backend:', session.attributes.messages);
        return {
          id: session.id,
          name: session.attributes.name,
          messages: session.attributes.messages || [], // Check if messages is null/undefined
          createdAt: new Date(session.attributes.sessionCreatedAt)
        };
      });
  
      console.log('Final sessions with messages:', sessions);
      return sessions;
    } catch (error) {
      onError?.(error as Error);
      return [];
    }
  };
  
  const saveToBackend = async (token: string, sessions: ChatSession[]) => {
    try {
      console.log('Attempting to save sessions:', sessions);
      await api.saveAllSessions(token, sessions);
      return true;
    } catch (error) {
      onError?.(error as Error);
      return false;
    }
  };

  return {
    loadFromBackend,
    saveToBackend
  };
};