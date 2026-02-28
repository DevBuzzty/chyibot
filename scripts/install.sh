#!/bin/bash
set -e

echo "--- Installing Chyi: Your Personalized AI Gateway ---"

# Update and install basic dependencies
sudo apt-get update
sudo apt-get install -y curl git build-essential

# Install Node.js
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo apt-get install -y ca-certificates gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

# Fix Docker permissions
if ! groups $USER | grep &>/dev/null "\bdocker\b"; then
    echo "Adding $USER to the docker group..."
    sudo usermod -aG docker $USER
    echo "You may need to log out and back in for docker group changes to take effect."
fi

# Project setup
if [ ! -f "package.json" ]; then
    if [ ! -d "chyi" ]; then
        git clone https://github.com/DevBuzzty/chyibot.git chyi
    fi
    cd chyi
fi

npm install
npm run build

# Link binary globally
echo "Linking chyi binary globally..."
sudo ln -sf $(pwd)/bin/chyi.js /usr/local/bin/chyi
sudo chmod +x /usr/local/bin/chyi

echo "--- Installation complete! ---"
echo "To configure Chyi, run: chyi onboard"
echo "To start the gateway, run: chyi start -d"
