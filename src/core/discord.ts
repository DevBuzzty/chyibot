import { Client, GatewayIntentBits, Message, TextChannel } from 'discord.js';
import { InboundMessage } from '../shared/types.js';

export class DiscordAdapter {
  private client: Client;

  constructor(private token: string) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
      ]
    });
  }

  async start(onMessage: (msg: InboundMessage) => Promise<void>) {
    this.client.on('messageCreate', async (message: Message) => {
      if (message.author.bot) return;

      const msg: InboundMessage = {
        platform: 'discord',
        peerId: message.channelId,
        senderId: message.author.id,
        text: message.content,
        timestamp: message.createdTimestamp,
        raw: message
      };
      await onMessage(msg);
    });

    await this.client.login(this.token);
    console.log('Discord bot logged in.');
  }

  async sendMessage(channelId: string, text: string) {
    const channel = await this.client.channels.fetch(channelId);
    if (channel?.isTextBased()) {
      await (channel as TextChannel).send(text);
    }
  }
}
