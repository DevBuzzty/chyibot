import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { ToolRegistry } from './index.js';

describe('ToolRegistry', () => {
  it('should transform Zod schemas to JSON Schema for Anthropic/OpenAI', () => {
    const registry = new ToolRegistry();
    const testTool = {
      name: 'test_tool',
      description: 'A test tool',
      parameters: z.object({
        query: z.string().describe('The search query'),
        limit: z.number().optional().describe('Result limit')
      }),
      execute: async () => 'result'
    };

    registry.register(testTool);
    const definitions = registry.getDefinitions();

    expect(definitions).toHaveLength(1);
    const def = definitions[0];
    expect(def.name).toBe('test_tool');
    expect(def.input_schema.type).toBe('object');
    expect(def.input_schema.properties.query.type).toBe('string');
    expect(def.input_schema.properties.limit.type).toBe('number');
  });
});
