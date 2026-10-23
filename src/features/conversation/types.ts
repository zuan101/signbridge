export type MessageSender = 'signer' | 'reply';

export interface Message {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: number;
  status?: 'confirmed' | 'draft';
}

export interface ConversationSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}
