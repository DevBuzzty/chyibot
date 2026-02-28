import { z } from 'zod';
import { ToolDefinition } from './index.js';
import fs from 'fs';
import path from 'path';

function getSafePath(base: string, requested: string) {
  const resolved = path.resolve(base, requested);
  if (!resolved.startsWith(path.resolve(base))) {
    throw new Error(`Security Error: Attempted access outside workspace: ${requested}`);
  }
  return resolved;
}

export const readFileTool: ToolDefinition = {
  name: 'read_file',
  description: 'Read the contents of a file from the workspace securely.',
  parameters: z.object({
    path: z.string().describe('The path to the file to read.')
  }),
  execute: async (args, context) => {
    const safePath = getSafePath(context.workspace, args.path);
    if (!fs.existsSync(safePath)) {
      throw new Error(`File not found: ${args.path}`);
    }
    return fs.readFileSync(safePath, 'utf8');
  }
};

export const writeFileTool: ToolDefinition = {
  name: 'write_file',
  description: 'Write content to a file in the workspace securely.',
  parameters: z.object({
    path: z.string().describe('The path to the file to write.'),
    content: z.string().describe('The content to write to the file.')
  }),
  execute: async (args, context) => {
    const safePath = getSafePath(context.workspace, args.path);
    fs.mkdirSync(path.dirname(safePath), { recursive: true });
    fs.writeFileSync(safePath, args.content);
    return `File written successfully to ${args.path}`;
  }
};
