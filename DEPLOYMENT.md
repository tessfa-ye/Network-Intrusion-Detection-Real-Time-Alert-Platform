# NIDAS Full-Stack Deployment Guide (AWS Free Tier)

## Overview
Deploy the complete NIDAS stack (Backend + Web + Mobile) on AWS EC2 Free Tier.

## What You're Deploying
```
EC2 Instance (t2.micro - Free Tier)
├── MongoDB (Container)
├── NestJS Backend :3001
├── Next.js Web :3000
└── Nginx (Reverse Proxy + SSL)
```

Both **Web Dashboard** and **Mobile App** will connect to the same backend.

---

## Prerequisites
- AWS Account (Free Tier eligible)
- Domain name (optional, but recommended)
- Git repository with your code

---

## Step 1: Launch EC2 Instance

1. **Go to AWS EC2 Console**:
   ```
   https://console.aws.amazon.com/ec2/
   ```

2. **Launch Instance**:
   - **Name**: `nidas-server`
   - **AMI**: Ubuntu Server 22.04 LTS (Free tier eligible)
   - **Instance type**: `t2.micro` (1 vCPU, 1GB RAM - Free)
   - **Key pair**: Create new or use existing
   - **Storage**: 30 GB gp3 (Free tier: 30GB)

3. **Security Group** (Configure inbound rules):
   ```
   SSH      | Port 22   | Your IP
   HTTP     | Port 80   | 0.0.0.0/0
   HTTPS    | Port 443  | 0.0.0.0/0
   Custom   | Port 3000 | 0.0.0.0/0 (Web Dashboard)
   Custom   | Port 3001 | 0.0.0.0/0 (API for mobile)
   ```

4. **Launch** and note your **Public IPv4 address**

---

## Step 2: Connect and Setup Server

```bash
# Connect to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt install docker-compose -y

# Install Git
sudo apt install git -y

# Logout and login again for docker group to take effect
exit
```

---

## Step 3: Clone and Deploy

```bash
# Reconnect
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Clone your repository
git clone https://github.com/your-org/nidas.git
cd nidas

# Create environment file
nano .env
```

**Paste this in `.env`**:
```env
# MongoDB
MONGO_PASSWORD=YourSecurePassword123

# JWT
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# URLs (replace with your EC2 IP or domain)
NEXT_PUBLIC_API_URL=http://YOUR_EC2_IP:3001/api
NEXT_PUBLIC_SOCKET_URL=http://YOUR_EC2_IP:3001
```

**Save and exit** (Ctrl+X, Y, Enter)

```bash
# Build and start all services
docker-compose up -d --build

# Check logs
docker-compose logs -f

# Wait for "Application is running on: http://localhost:3001"
```

---

## Step 4: Verify Deployment

### Test Backend API
```bash
curl http://YOUR_EC2_IP:3001/health
```
Expected: `{"status":"ok"}`

### Test Web Dashboard
Open in browser:
```
http://YOUR_EC2_IP:3000
```

### Test from Mobile App
Update your Flutter app's API URL:
```dart
// lib/core/constants/api_constants.dart
const String baseUrl = 'http://YOUR_EC2_IP:3001';
const String socketUrl = 'http://YOUR_EC2_IP:3001';
```

---

## Step 5: Setup Domain & SSL (Optional but Recommended)

### 5.1 Point Domain to EC2

In your domain registrar (GoDaddy, Namecheap, etc.):
```
Type: A Record
Name: @
Value: YOUR_EC2_IP
TTL: 3600
```

For subdomain (e.g., `api.yourdomain.com`):
```
Type: A Record
Name: api
Value: YOUR_EC2_IP
```

### 5.2 Install Nginx

```bash
sudo apt install nginx -y
```

### 5.3 Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/nidas
```

Paste:
```nginx
# Web Dashboard
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# API for Mobile
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/nidas /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 5.4 Install SSL Certificate

```bash
sudo apt install certbot python3-certbot-nginx -y

# Get certificate (replace with your domains)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

**Now access**:
- Web: `https://yourdomain.com`
- API (Mobile): `https://api.yourdomain.com`

---

## Step 6: Update Mobile App

In your Flutter project:

```dart
// lib/core/constants/api_constants.dart
const String baseUrl = 'https://api.yourdomain.com';
const String socketUrl = 'https://api.yourdomain.com';
```

---

## Maintenance Commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f web

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Update code and redeploy
git pull
docker-compose up -d --build

# Backup MongoDB
docker exec nidas-mongodb mongodump --out /backup
docker cp nidas-mongodb:/backup ./mongodb-backup
```

---

## Cost Estimation (AWS Free Tier)

| Service | Free Tier | After Free Tier |
|---------|-----------|-----------------|
| EC2 t2.micro | 750 hrs/month (Free for 12 months) | ~$8-10/month |
| Storage (30 GB) | 30 GB (Free for 12 months) | ~$3/month |
| Data Transfer | 15 GB outbound | $0.09/GB |
| **Total** | **$0** | **~$11-13/month** |

---

## Troubleshooting

### Services won't start
```bash
# Check Docker status
sudo systemctl status docker

# Check available disk space
df -h

# Check memory
free -h
```

### MongoDB connection failed
```bash
# Check MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

### Can't connect from mobile
- Verify security group allows port 3001
- Test with: `curl http://YOUR_EC2_IP:3001/health`
- Check firewall: `sudo ufw status`

---

## Production Checklist

- [ ] Changed default `MONGO_PASSWORD`
- [ ] Changed `JWT_SECRET` to a strong random string
- [ ] Configured domain and SSL
- [ ] Set up MongoDB backups
- [ ] Enabled monitoring (CloudWatch)
- [ ] Configured auto-restart for containers
- [ ] Tested mobile app connection
- [ ] Tested web dashboard
- [ ] Set up log rotation

---

## Next Steps

1. **Monitor**: Set up CloudWatch or UptimeRobot
2. **Backup**: Schedule MongoDB dumps
3. **Scale**: Consider ECS/Fargate when traffic grows
4. **CDN**: Add CloudFront for static assets
