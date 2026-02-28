import { z } from 'zod';
import { ToolDefinition, ToolContext } from './index.js';
import { Sandbox } from '../core/sandbox.js';

export interface SandboxContext extends ToolContext {
  sandbox: Sandbox;
}

export const sandboxBashTool: ToolDefinition = {
  name: 'bash',
  description: 'Execute a bash command in a secure Docker sandbox.',
  parameters: z.object({
    command: z.string().describe('The bash command to execute.')
  }),
  execute: async (args, context) => {
    const sandboxContext = context as SandboxContext;
    return await sandboxContext.sandbox.exec(args.command);
  }
};
