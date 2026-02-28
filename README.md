# Chyi: Your Personalized AI Gateway 🦞

Chyi is a self-hosted, secure AI gateway designed to bridge your favorite chat applications (Telegram, Discord) directly to powerful AI agents. Inspired by the OpenClaw architecture, Chyi is optimized for personal use on a headless Ubuntu server, maintaining absolute control over your data and execution environment.

## Key Features

- **Multi-Channel Integration**: Communicate with your AI via Telegram and Discord.
- **Secure Execution**: Tools run in a Docker-based sandbox, protecting your host system.
- **Data Sovereignty**: All session logs (JSONL) and system states (SQLite) are stored locally.
- **Cryptographic Security**: Secure WebSocket wire protocol with Ed25519 handshakes.
- **Canvas (A2UI)**: A dynamic, declarative UI system for agent-generated interfaces.
- **Simple Lifecycle**: One-liner installation and built-in update mechanism.

---

## 🚀 Step-by-Step Installation

### 1. The One-Liner Setup

Run the following command on your fresh Ubuntu server to install all dependencies (Node.js, Docker, etc.) and set up Chyi:

```bash
curl -fsSL https://raw.githubusercontent.com/DevBuzzty/chyibot/main/scripts/install.sh | bash
```

*Note: You may need to log out and back in after the script finishes for Docker group changes to take effect.*

### 2. Run the Onboarding Wizard

Once the installation is complete, you can run the interactive configuration from any directory:

```bash
chyi onboard
```

The wizard will guide you through:
- Entering your **Anthropic** or **OpenAI** API keys.
- Configuring your **Telegram** and **Discord** bot tokens.
- Setting the **Gateway Port** (default: 18789).
- Generating a **Cryptographic Keypair** for secure remote access.
- Optional **Tailscale** installation for zero-trust networking.

### 3. Start the Gateway

Once configured, start the Chyi daemon in the background:

```bash
chyi start -d
```

---

## 🛠 Exhaustive Command Reference

### Command Line Interface (CLI)

The `chyi` command is available globally on your server.

- **`chyi onboard`**: Interactive setup wizard to configure API keys, messaging tokens, and security settings.
- **`chyi start`**: Starts the Gateway daemon.
    - `-d, --daemon`: Runs the process in the background.
- **`chyi status`**: Checks if Chyi is properly configured and if the `.env` file is present.
- **`chyi security`**: Runs a security audit to verify filesystem permissions and configuration integrity.
- **`chyi update`**: Pulls the latest code from GitHub, installs new dependencies, and rebuilds the project.
- **`chyi --version`**: Displays the current version of Chyi.
- **`chyi --help`**: Lists all available subcommands.

### Chat-Based Commands

You can send these commands directly to your bot on Telegram or Discord:

- **`/update`**: Triggers Chyi to pull the latest version from GitHub, rebuild, and restart itself remotely.

---

## 🧰 AI Agent Capabilities (Skills & Tools)

Your Chyi agent is equipped with the following tools, which it uses autonomously to fulfill your requests:

- **`bash`**: Executes shell commands within a secure, isolated Docker sandbox.
- **`read_file`**: Reads the content of a file within the safe `workspace/` directory.
- **`write_file`**: Writes or overwrites content to a file in the `workspace/` directory (protected against directory traversal).
- **`render_canvas`**: Pushes dynamic, declarative UI components (Cards, Columns, Text) to your web dashboard.

---

## 🎨 Canvas Dashboard

Chyi serves a local web dashboard for dynamic agent interfaces (A2UI). By default, it is accessible at `http://localhost:18789`. For secure remote access, we recommend using the built-in **Tailscale** integration.

---

## ⚖️ License

Chyi is released under the MIT License.
