import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { onboard } from './onboard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

program
  .name('chyi')
  .description('Chyi: Personalized AI Gateway')
  .version('0.1.0');

program
  .command('onboard')
  .description('Run the onboarding wizard to configure Chyi')
  .action(async () => {
    console.log(chalk.cyan('\n--- Welcome to Chyi Onboarding ---\n'));
    await onboard();
  });

program
  .command('status')
  .description('Check the status of Chyi')
  .action(() => {
    console.log(chalk.cyan('Checking Chyi status...'));
    const envExists = fs.existsSync('.env');
    if (envExists) {
      console.log(chalk.green('[OK] .env file found.'));
    } else {
      console.log(chalk.red('[ERROR] .env file missing. Run "chyi onboard".'));
    }
  });

program
  .command('security')
  .description('Run security audit')
  .action(() => {
    console.log(chalk.cyan('Running security audit...'));
    const envExists = fs.existsSync('.env');
    if (envExists) {
      console.log(chalk.green('[OK] .env file found.'));
    } else {
      console.log(chalk.red('[ERROR] .env file missing. Run "chyi onboard".'));
    }
    const dbExists = fs.existsSync('chyi.db');
    if (dbExists) {
      console.log(chalk.green('[OK] Database found.'));
    }
    console.log(chalk.yellow('\nAudit complete.'));
  });

program
  .command('update')
  .description('Update Chyi from the GitHub repository')
  .action(async () => {
    const { execSync } = await import('child_process');
    console.log(chalk.cyan('Updating Chyi...'));
    try {
      execSync('git pull origin main', { stdio: 'inherit' });
      execSync('npm install', { stdio: 'inherit' });
      execSync('npm run build', { stdio: 'inherit' });
      console.log(chalk.green('Update complete! Restart the daemon for changes to take effect.'));
    } catch (e) {
      console.error(chalk.red('Update failed:'), e);
    }
  });

program
  .command('start')
  .description('Start the Chyi gateway daemon')
  .option('-d, --daemon', 'Run in background as a daemon')
  .action(async (options) => {
    const { spawn } = await import('child_process');

    const distPath = path.resolve(__dirname, '../core/daemon.js');
    const srcPath = path.resolve(__dirname, '../core/daemon.ts');

    console.log(chalk.green('Starting Chyi gateway daemon...'));

    let child;
    if (fs.existsSync(distPath)) {
      child = spawn('node', [distPath], {
        detached: options.daemon,
        stdio: options.daemon ? 'ignore' : 'inherit'
      });
    } else {
      child = spawn('node', [
        '--loader', 'ts-node/esm',
        '--no-warnings',
        srcPath
      ], {
        detached: options.daemon,
        stdio: options.daemon ? 'ignore' : 'inherit'
      });
    }

    if (options.daemon) {
      child.unref();
      console.log(chalk.blue(`Daemon started in background (PID: ${child.pid})`));
      process.exit(0);
    }
  });

program.parse();
