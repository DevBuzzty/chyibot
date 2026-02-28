import fs from 'fs';
import path from 'path';

export interface SessionMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: number;
}

export class SessionManager {
  private sessionsDir: string;

  constructor() {
    this.sessionsDir = path.join(process.cwd(), 'sessions');
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir);
    }
  }

  async getSessionHistory(sessionId: string): Promise<SessionMessage[]> {
    const sessionPath = path.join(this.sessionsDir, `${sessionId}.jsonl`);
    if (!fs.existsSync(sessionPath)) return [];

    const content = fs.readFileSync(sessionPath, 'utf8');
    return content.trim().split('\n').map(line => JSON.parse(line));
  }

  async appendMessage(sessionId: string, message: SessionMessage) {
    const sessionPath = path.join(this.sessionsDir, `${sessionId}.jsonl`);
    fs.appendFileSync(sessionPath, JSON.stringify(message) + '\n');
  }

  async getContextForModel(sessionId: string) {
    const history = await this.getSessionHistory(sessionId);
    return history.slice(-10);
  }
}
