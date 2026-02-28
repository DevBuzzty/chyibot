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

You can check the status at any time:
```bash
chyi status
```

---

## 🛠 Management Commands

Chyi comes with a robust CLI utility for daily operations:

- **Security Audit**: `chyi security` - Probes your setup for vulnerabilities.
- **Update Chyi**: `chyi update` - Pulls the latest version from GitHub and rebuilds.
- **Agent Interaction**: Send `/update` to your bot on Telegram or Discord to initiate a remote update.

## 🎨 Canvas Dashboard

Chyi serves a local web dashboard for dynamic agent interfaces (A2UI). By default, it is accessible at `http://localhost:18789`. For secure remote access, we recommend using the built-in **Tailscale** integration.

---

## ⚖️ License

Chyi is released under the MIT License.
