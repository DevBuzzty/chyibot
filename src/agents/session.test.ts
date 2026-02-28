import { describe, it, expect } from 'vitest';
import { SessionManager } from './session.js';
import fs from 'fs';
import path from 'path';

describe('SessionManager', () => {
  it('should append and retrieve messages', async () => {
    const manager = new SessionManager();
    const sessionId = 'test-session';
    const message = { role: 'user' as const, content: 'hello', timestamp: Date.now() };

    await manager.appendMessage(sessionId, message);
    const history = await manager.getSessionHistory(sessionId);

    expect(history.length).toBeGreaterThan(0);
    expect(history[history.length - 1].content).toBe('hello');

    fs.unlinkSync(path.join(process.cwd(), 'sessions', `${sessionId}.jsonl`));
  });
});
