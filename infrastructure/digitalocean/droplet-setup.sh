#!/bin/bash

# DigitalOcean Droplet Setup for Shipzy

# Prerequisites: doctl CLI installed and authenticated

DROPLET_NAME="shipzy-prod-$(date +%Y%m%d)"
IMAGE="ubuntu-22-04-x64"
REGION="nyc3"
SIZE="s-2vcpu-4gb"
SSH_KEY="your-ssh-key-id"

echo "Creating droplet: $DROPLET_NAME"

doctl compute droplet create $DROPLET_NAME \
  --image $IMAGE \
  --region $REGION \
  --size $SIZE \
  --ssh-keys $SSH_KEY \
  --wait

IP=$(doctl compute droplet list --format "Public IPv4" --no-header | tail -1)

echo "Droplet created with IP: $IP"

# Run initial setup
ssh root@$IP << EOF
  apt update && apt upgrade -y
  apt install -y docker.io docker-compose nginx git
  systemctl enable docker
  systemctl start docker
  useradd -m shipzy
  usermod -aG docker shipzy
  # Clone repo, setup services
EOF

echo "Initial setup complete. Configure further services."
