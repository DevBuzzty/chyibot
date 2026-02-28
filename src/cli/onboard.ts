import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import nacl from 'tweetnacl';

export async function onboard() {
  const questions = [
    {
      type: 'input',
      name: 'ANTHROPIC_API_KEY',
      message: 'Enter your Anthropic API Key (optional):',
    },
    {
      type: 'input',
      name: 'OPENAI_API_KEY',
      message: 'Enter your OpenAI API Key (optional):',
    },
    {
      type: 'input',
      name: 'TELEGRAM_BOT_TOKEN',
      message: 'Enter your Telegram Bot Token:',
      validate: (input: string) => input.length > 0 || 'Telegram Bot Token is required for now.',
    },
    {
      type: 'input',
      name: 'DISCORD_BOT_TOKEN',
      message: 'Enter your Discord Bot Token:',
      validate: (input: string) => input.length > 0 || 'Discord Bot Token is required for now.',
    },
    {
      type: 'number',
      name: 'GATEWAY_PORT',
      message: 'Enter the gateway port:',
      default: 18789,
    },
    {
      type: 'confirm',
      name: 'GENERATE_KEYS',
      message: 'Would you like to generate a new cryptographic keypair for the secure gateway handshake?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'INSTALL_TAILSCALE',
      message: 'Would you like to install Tailscale for secure remote access?',
      default: false,
    }
  ];

  const answers = await inquirer.prompt(questions);

  let clientPublicKey = '';
  if (answers.GENERATE_KEYS) {
      const keypair = nacl.sign.keyPair();
      const pubKeyBase64 = Buffer.from(keypair.publicKey).toString('base64');
      const privKeyBase64 = Buffer.from(keypair.secretKey).toString('base64');
      clientPublicKey = pubKeyBase64;

      console.log(chalk.yellow('\n--- KEYPAIR GENERATED ---'));
      console.log(chalk.cyan('Public Key: '), pubKeyBase64);
      console.log(chalk.red('Secret Key (KEEP SAFE): '), privKeyBase64);
      console.log(chalk.yellow('-------------------------\n'));
  }

  const envContent = Object.entries(answers)
    .filter(([key]) => !['INSTALL_TAILSCALE', 'GENERATE_KEYS'].includes(key))
    .map(([key, value]) => `${key}=${value}`)
    .concat(clientPublicKey ? [`CLIENT_PUBLIC_KEY=${clientPublicKey}`] : [])
    .join('\n');

  const envPath = path.join(process.cwd(), '.env');
  fs.writeFileSync(envPath, envContent);

  console.log(chalk.green(`\nConfiguration saved to ${envPath}\n`));

  if (answers.INSTALL_TAILSCALE) {
    const { execSync } = await import('child_process');
    console.log(chalk.cyan('Installing Tailscale...'));
    try {
      execSync('curl -fsSL https://tailscale.com/install.sh | sh', { stdio: 'inherit' });
      console.log(chalk.green('Tailscale installed. Run `sudo tailscale up` to connect.'));
    } catch (e) {
      console.error(chalk.red('Tailscale installation failed:'), e);
    }
  }
}
