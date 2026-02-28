import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import express from 'express';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import nacl from 'tweetnacl';
import { decodeBase64 } from 'tweetnacl-util';
import { TelegramAdapter } from './telegram.js';
import { DiscordAdapter } from './discord.js';
import { InboundMessage } from '../shared/types.js';
import { AgentOrchestrator } from '../agents/orchestrator.js';

dotenv.config();

const PORT = parseInt(process.env.GATEWAY_PORT || '18789');
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CLIENT_PUBLIC_KEY = process.env.CLIENT_PUBLIC_KEY;

let agentOrchestrator: AgentOrchestrator | null = null;
let telegramAdapter: TelegramAdapter | null = null;
let discordAdapter: DiscordAdapter | null = null;
let activeWss: WebSocketServer | null = null;

async function initDB() {
  const db = await open({
    filename: path.join(process.cwd(), 'chyi.db'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      agentId TEXT,
      platform TEXT,
      peerId TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
}

async function handleInboundMessage(msg: InboundMessage) {
  console.log(chalk.magenta(`[${msg.platform}] Message from ${msg.senderId}: ${msg.text}`));

  if (agentOrchestrator) {
    const responseText = await agentOrchestrator.processMessage(msg);

    if (msg.platform === 'telegram' && telegramAdapter) {
      await telegramAdapter.sendMessage(msg.peerId, responseText);
    } else if (msg.platform === 'discord' && discordAdapter) {
      await discordAdapter.sendMessage(msg.peerId, responseText);
    }
  }
}

async function broadcastCanvasUpdate(components: any[]) {
  if (activeWss) {
    const message = JSON.stringify({ type: 'surfaceUpdate', components });
    activeWss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

async function startDaemon() {
  const db = await initDB();
  console.log(chalk.blue('Database initialized.'));

  if (ANTHROPIC_API_KEY || OPENAI_API_KEY) {
    agentOrchestrator = new AgentOrchestrator({
        anthropicKey: ANTHROPIC_API_KEY,
        openaiKey: OPENAI_API_KEY
    }, broadcastCanvasUpdate);
    console.log(chalk.blue('Agent orchestrator initialized with multiple providers.'));
  }

  const app = express();
  app.use(express.static(path.join(process.cwd(), 'src/ui')));

  const server = createServer(app);
  const wss = new WebSocketServer({ noServer: true });
  activeWss = wss;

  if (TELEGRAM_TOKEN) {
    telegramAdapter = new TelegramAdapter(TELEGRAM_TOKEN);
    telegramAdapter.start(handleInboundMessage).catch(err => console.error('Telegram start failed:', err));
  }

  if (DISCORD_TOKEN) {
    discordAdapter = new DiscordAdapter(DISCORD_TOKEN);
    discordAdapter.start(handleInboundMessage).catch(err => console.error('Discord start failed:', err));
  }

  server.on('upgrade', (request, socket, head) => {
    if (request.url === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws: WebSocket) => {
    console.log(chalk.yellow('New client connected. Awaiting cryptographic handshake...'));

    let authenticated = false;
    const nonce = nacl.randomBytes(32);
    const nonceStr = Buffer.from(nonce).toString('base64');

    ws.send(JSON.stringify({ type: 'challenge', nonce: nonceStr, ts: Date.now() }));

    ws.on('message', (data: string) => {
      try {
        const message = JSON.parse(data);

        if (!authenticated) {
          if (message.type === 'connect') {
            if (message.signature && CLIENT_PUBLIC_KEY) {
              const signature = decodeBase64(message.signature);
              const publicKey = decodeBase64(CLIENT_PUBLIC_KEY);
              const verified = nacl.sign.detached.verify(nonce, signature, publicKey);

              if (verified) {
                authenticated = true;
                console.log(chalk.green('Client authenticated cryptographically.'));
                ws.send(JSON.stringify({ type: 'connected', status: 'ok' }));
              } else {
                console.log(chalk.red('Cryptographic verification failed.'));
                ws.close();
              }
            } else if (message.signature === 'ui-client') {
              authenticated = true;
              console.log(chalk.green('Local UI client connected.'));
              ws.send(JSON.stringify({ type: 'connected', status: 'ok' }));
            } else {
              console.log(chalk.red('Authentication failed: Missing or invalid signature.'));
              ws.close();
            }
          }
          return;
        }

        console.log(chalk.cyan('Received message:'), message);
      } catch (e) {
        console.error(chalk.red('Failed to parse message:'), e);
      }
    });

    ws.on('close', () => {
      console.log(chalk.gray('Client disconnected.'));
    });
  });

  server.listen(PORT, () => {
    console.log(chalk.green(`Chyi Gateway Daemon listening on port ${PORT}`));
  });
}

startDaemon().catch(err => {
  console.error(chalk.red('Failed to start daemon:'), err);
});
