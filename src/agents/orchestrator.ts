import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { InboundMessage } from '../shared/types.js';
import { ToolRegistry } from '../tools/index.js';
import { SessionManager } from './session.js';
import { readFileTool, writeFileTool } from '../tools/fs.js';
import { sandboxBashTool } from '../tools/runtime.js';
import { renderCanvasTool } from '../tools/ui.js';
import { Sandbox } from '../core/sandbox.js';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import chalk from 'chalk';

export interface AgentConfig {
    id: string;
    provider: 'anthropic' | 'openai';
    model: string;
    systemPrompt: string;
}

export class AgentOrchestrator {
  private anthropic: Anthropic | null = null;
  private openai: OpenAI | null = null;
  private toolRegistry: ToolRegistry;
  private sessionManager: SessionManager;
  private workspaceDir: string;
  private agents: Map<string, AgentConfig> = new Map();

  constructor(
    config: { anthropicKey?: string; openaiKey?: string },
    private onRender?: (components: any[]) => Promise<void>
  ) {
    if (config.anthropicKey) this.anthropic = new Anthropic({ apiKey: config.anthropicKey });
    if (config.openaiKey) this.openai = new OpenAI({ apiKey: config.openaiKey });

    this.toolRegistry = new ToolRegistry();
    this.sessionManager = new SessionManager();
    this.workspaceDir = path.join(process.cwd(), 'workspace');
    if (!fs.existsSync(this.workspaceDir)) {
      fs.mkdirSync(this.workspaceDir, { recursive: true });
    }

    this.toolRegistry.register(readFileTool);
    this.toolRegistry.register(writeFileTool);
    this.toolRegistry.register(sandboxBashTool);
    this.toolRegistry.register(renderCanvasTool);

    if (this.anthropic || this.openai) {
        this.agents.set('main', {
            id: 'main',
            provider: this.anthropic ? 'anthropic' : 'openai',
            model: this.anthropic ? 'claude-3-5-sonnet-20240620' : 'gpt-4o',
            systemPrompt: "You are Chyi, a highly capable personal AI agent. Use tools to satisfy the user request."
        });
    }
  }

  async processMessage(msg: InboundMessage): Promise<string> {
    if (!this.anthropic && !this.openai) {
        return "System error: No AI providers configured. Please run `chyi onboard` and provide an Anthropic or OpenAI API key.";
    }

    const sessionId = `${msg.platform}_${msg.peerId}`;
    const agentConfig = this.agents.get('main')!;

    if (msg.text.trim() === '/update') {
      console.log(chalk.cyan('Update command received via chat. Triggering self-update...'));
      const projectRoot = process.cwd();

      exec(`git pull && npm install && npm run build`, { cwd: projectRoot }, (err) => {
          if (err) {
              console.error(chalk.red('Self-update failed:'), err);
          } else {
              console.log(chalk.green('Self-update successful. Restarting daemon...'));
              process.exit(0);
          }
      });

      return "Self-update initiated. I will pull the latest version, rebuild, and restart. Please wait a moment.";
    }

    await this.sessionManager.appendMessage(sessionId, {
      role: 'user',
      content: msg.text,
      timestamp: Date.now()
    });

    const sandbox = new Sandbox(sessionId, this.workspaceDir);
    let historyTurns = await this.sessionManager.getContextForModel(sessionId);
    let messages: any[] = historyTurns.map(h => ({
      role: h.role,
      content: h.content
    }));

    try {
      let turn = 0;
      const MAX_TURNS = 10;

      while (turn < MAX_TURNS) {
        turn++;
        console.log(chalk.gray(`Agent Loop: Turn ${turn} for session ${sessionId}`));

        let responseContent: any;
        if (agentConfig.provider === 'anthropic' && this.anthropic) {
          const resp = await this.anthropic.messages.create({
            model: agentConfig.model,
            max_tokens: 1024,
            system: agentConfig.systemPrompt,
            messages: messages,
            tools: this.toolRegistry.getDefinitions() as any,
          });
          responseContent = resp.content;
        } else if (agentConfig.provider === 'openai' && this.openai) {
          const resp = await this.openai.chat.completions.create({
            model: agentConfig.model,
            messages: [
                { role: 'system', content: agentConfig.systemPrompt },
                ...messages
            ],
            tools: this.toolRegistry.getDefinitions().map(d => ({
                type: 'function',
                function: {
                    name: d.name,
                    description: d.description,
                    parameters: d.input_schema
                }
            })) as any
          });

          const choice = resp.choices[0].message;
          responseContent = [];
          if (choice.content) responseContent.push({ type: 'text', text: choice.content });
          if (choice.tool_calls) {
              choice.tool_calls.forEach(tc => {
                  responseContent.push({ type: 'tool_use', id: tc.id, name: tc.function.name, input: JSON.parse(tc.function.arguments) });
              });
          }
        }

        await this.sessionManager.appendMessage(sessionId, {
            role: 'assistant',
            content: responseContent,
            timestamp: Date.now()
        });
        messages.push({ role: 'assistant', content: responseContent });

        const toolCalls = responseContent.filter((c: any) => c.type === 'tool_use');
        if (toolCalls.length === 0) {
            const finalReply = responseContent.filter((c: any) => c.type === 'text').map((t: any) => t.text).join('\n');
            console.log(chalk.gray(`Agent Loop: Finished with reply: ${finalReply}`));
            return finalReply || "Done.";
        }

        console.log(chalk.cyan(`Agent Loop: Executing ${toolCalls.length} tool calls...`));
        const toolResults = await Promise.all(toolCalls.map(async (tc: any) => {
            const tool = this.toolRegistry.getTool(tc.name);
            if (!tool) return { type: 'tool_result', tool_use_id: tc.id, content: `Error: Tool ${tc.name} not found.` };
            try {
                const result = await tool.execute(tc.input, { workspace: this.workspaceDir, sandbox, render: this.onRender } as any);
                return { type: 'tool_result', tool_use_id: tc.id, content: JSON.stringify(result) };
            } catch (e: any) {
                return { type: 'tool_result', tool_use_id: tc.id, content: `Error: ${e.message}` };
            }
        }));

        await this.sessionManager.appendMessage(sessionId, {
            role: 'user',
            content: toolResults as any,
            timestamp: Date.now()
        });
        messages.push({ role: 'user', content: toolResults as any });
      }
      return "Reached maximum tool execution turns. Please refine your request.";
    } catch (err: any) {
      console.error(chalk.red('Agent Execution Error:'), err);
      return `Error processing request: ${err.message}`;
    }
  }
}
