export interface InboundMessage {
  platform: 'telegram' | 'discord';
  peerId: string;
  senderId: string;
  text: string;
  timestamp: number;
  raw: any;
}

export interface OutboundMessage {
  platform: 'telegram' | 'discord';
  peerId: string;
  text: string;
}
