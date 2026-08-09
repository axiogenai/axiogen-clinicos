#!/bin/bash
echo "🚀 Setting up ClinicOS on Oracle Cloud VM..."

# 1. Install Node.js, Git, PM2
sudo dnf install -y nodejs npm git 2>/dev/null || sudo apt-get update && sudo apt-get install -y nodejs npm git
sudo npm install -g pm2

# 2. Clone Repository
cd /home/opc 2>/dev/null || cd /home/ubuntu 2>/dev/null || cd ~
rm -rf axiogen-clinicos
git clone https://github.com/axiogenai/axiogen-clinicos.git
cd axiogen-clinicos/server
npm install

# 3. Create .env file with Supabase & Groq credentials
cat << 'EOF' > .env
PORT=5000
FRONTEND_URL=https://shinagareclinicos.vercel.app
JWT_SECRET=clinicos_super_secret_jwt_key_2026_axiogen
NODE_ENV=production
DATABASE_URL=PASTE_YOUR_SUPABASE_URL_HERE
GROQ_API_KEY=PASTE_YOUR_GROQ_KEY_HERE
EOF

# 4. Configure Firewall to open port 5000, 80, 443
sudo firewall-cmd --permanent --add-port=5000/tcp 2>/dev/null || true
sudo firewall-cmd --permanent --add-port=80/tcp 2>/dev/null || true
sudo firewall-cmd --permanent --add-port=443/tcp 2>/dev/null || true
sudo firewall-cmd --reload 2>/dev/null || true
sudo iptables -F 2>/dev/null || true

# 5. Start Backend Process with PM2
pm2 stop clinicos-backend 2>/dev/null || true
pm2 delete clinicos-backend 2>/dev/null || true
pm2 start server.js --name "clinicos-backend"
pm2 save

echo "===================================================="
echo "🎉 ClinicOS Backend & WhatsApp Gateway is LIVE!"
echo "Server URL: http://92.4.92.239:5000/api/health"
echo "===================================================="
