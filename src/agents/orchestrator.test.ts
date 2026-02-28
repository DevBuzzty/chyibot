import { describe, it, expect, vi } from 'vitest';
import { AgentOrchestrator } from './orchestrator.js';
import { InboundMessage } from '../shared/types.js';
import Anthropic from '@anthropic-ai/sdk';

vi.mock('@anthropic-ai/sdk');

describe('AgentOrchestrator', () => {
  it('should process messages and handle tool-use turns', async () => {
    const mockAnthropic = {
      messages: {
        create: vi.fn()
          .mockResolvedValueOnce({
            content: [{ type: 'tool_use', id: '123', name: 'write_file', input: { path: 'test.txt', content: 'hello' } }]
          })
          .mockResolvedValueOnce({
            content: [{ type: 'text', text: 'File written successfully.' }]
          })
      }
    };
    (Anthropic as any).mockImplementation(() => mockAnthropic);

    const orchestrator = new AgentOrchestrator({ anthropicKey: 'test' });
    const msg: InboundMessage = { platform: 'telegram', peerId: '1', senderId: '1', text: 'Write hello to test.txt', timestamp: 1, raw: {} };

    const response = await orchestrator.processMessage(msg);
    expect(response).toBe('File written successfully.');
    expect(mockAnthropic.messages.create).toHaveBeenCalledTimes(2);
  });
});
