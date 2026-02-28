import { z } from 'zod';
import { ToolDefinition, ToolContext } from './index.js';

export interface CanvasContext extends ToolContext {
  render: (components: any[]) => Promise<void>;
}

export const renderCanvasTool: ToolDefinition = {
  name: 'render_canvas',
  description: 'Render a declarative UI to the user. Use components like Text, Column, and Card.',
  parameters: z.object({
    components: z.array(z.any()).describe('A list of UI component objects.')
  }),
  execute: async (args, context) => {
    const canvasContext = context as CanvasContext;
    await canvasContext.render(args.components);
    return 'Canvas updated successfully.';
  }
};
