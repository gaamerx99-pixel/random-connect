#!/bin/bash
set -ex

# Update and install Docker and Git
apt-get update -y
apt-get install -y ca-certificates curl gnupg git nginx

# Install Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl start docker
systemctl enable docker

# Clone repository
mkdir -p /opt/app
cd /opt/app
git clone https://github.com/gaamerx99-pixel/random-connect.git
cd /opt/app/random-connect/backend

# Write production .env
cat << 'EOF' > .env
MONGO_URI=mongodb+srv://randomconnect:RandomConnect2026DB@shiv001.ymzmqew.mongodb.net/?appName=SHIV001
CLERK_SECRET_KEY=sk_test_G45i5cMSISCYDhxhRwUKIEvNBGNW10YwbhLjaeLtmo
CLERK_PUBLISHABLE_KEY=pk_test_bGVhcm5pbmctbWFtbW90aC0yNy5jbGVyay5hY2NvdW50cy5kZXYk
ENVIRONMENT=production
REWARDED_AD_PROVIDER=
REWARDED_ADS_TEST_MODE=true
EOF

# Build & Run Docker container
docker build -t random-connect-backend .
docker run -d --name random-connect-backend --restart always -p 8000:8000 --env-file .env random-connect-backend

# Configure Nginx as reverse proxy on port 80 with WebSocket upgrade
cat << 'EOF' > /etc/nginx/sites-available/default
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
EOF

systemctl restart nginx
