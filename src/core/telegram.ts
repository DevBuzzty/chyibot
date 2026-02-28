import { Bot, HttpError, GrammyError } from 'grammy';
import { InboundMessage } from '../shared/types.js';
import chalk from 'chalk';

export class TelegramAdapter {
  private bot: Bot;

  constructor(token: string) {
    this.bot = new Bot(token);

    this.bot.catch((err) => {
      const ctx = err.ctx;
      console.error(chalk.red(`Error while handling update ${ctx.update.update_id}:`));
      const e = err.error;
      if (e instanceof GrammyError) {
        console.error("Error in request:", e.description);
      } else if (e instanceof HttpError) {
        console.error("Could not contact Telegram:", e);
      } else {
        console.error("Unknown error:", e);
      }
    });
  }

  async start(onMessage: (msg: InboundMessage) => Promise<void>) {
    try {
        const me = await this.bot.api.getMe();
        console.log(chalk.green(`Telegram bot connected as @${me.username}`));

        this.bot.on('message:text', async (ctx) => {
          console.log(chalk.gray(`Telegram: Received text from ${ctx.from.id}: ${ctx.message.text}`));
          const msg: InboundMessage = {
            platform: 'telegram',
            peerId: ctx.chat.id.toString(),
            senderId: ctx.from.id.toString(),
            text: ctx.message.text,
            timestamp: ctx.message.date,
            raw: ctx.message
          };
          await onMessage(msg);
        });

        this.bot.start();
    } catch (e) {
        console.error(chalk.red('Failed to start Telegram bot. Check your token.'));
        throw e;
    }
  }

  async sendMessage(peerId: string, text: string) {
    try {
        console.log(chalk.gray(`Telegram: Sending message to ${peerId}`));
        await this.bot.api.sendMessage(peerId, text);
        console.log(chalk.green(`Telegram: Message sent to ${peerId}`));
    } catch (e) {
        console.error(chalk.red(`Telegram: Failed to send message to ${peerId}:`), e);
    }
  }
}
