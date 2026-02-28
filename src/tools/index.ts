import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export interface ToolContext {
  workspace: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodObject<any>;
  execute: (args: any, context: ToolContext) => Promise<any>;
}

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  register(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string) {
    return this.tools.get(name);
  }

  getDefinitions() {
    return Array.from(this.tools.values()).map(t => {
        const schema = zodToJsonSchema(t.parameters, {
            target: 'openApi3',
            $refStrategy: 'none'
        }) as any;

        // Remove top-level noise if any
        const { $schema, ...cleanSchema } = schema;

        return {
            name: t.name,
            description: t.description,
            input_schema: cleanSchema
        };
    });
  }
}
