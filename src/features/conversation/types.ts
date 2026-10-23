export type MessageSender = 'signer' | 'reply' | 'assistant';

export interface Message {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: number;
  status?: 'confirmed' | 'draft' | 'error';
  editedAt?: number;
}

export interface ConversationSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}
