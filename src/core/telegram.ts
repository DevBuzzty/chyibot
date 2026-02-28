import { Bot } from 'grammy';
import { InboundMessage } from '../shared/types.js';

export class TelegramAdapter {
  private bot: Bot;

  constructor(token: string) {
    this.bot = new Bot(token);
  }

  async start(onMessage: (msg: InboundMessage) => Promise<void>) {
    this.bot.on('message:text', async (ctx) => {
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
    console.log('Telegram bot started.');
  }

  async sendMessage(peerId: string, text: string) {
    await this.bot.api.sendMessage(peerId, text);
  }
}
