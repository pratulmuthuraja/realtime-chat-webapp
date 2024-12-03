export interface Message {
    id: string;
    content: string;
    isFromUser: boolean;
    timestamp: Date;
  }
  
  export interface ChatSession {
    id: string;
    name: string;
    messages: Message[];
    createdAt: Date;
  }
  
  export interface BackendSession {
    id: string;
    attributes: {
      name: string;
      messages: Message[];
      sessionCreatedAt: string;
      createdAt: string;
      updatedAt: string;
    }
  }