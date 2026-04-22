# ScholarForge Server Setup

This repository contains the complete setup for running ScholarForge on a Debian server with automated CI/CDP deployment.

## 🚀 Quick Start

### Option 1: Start API Server
```bash
cd artifacts/api-server
npm install
npm start
```

### Option 2: Start Frontend Development Server
```bash
cd artifacts/scholar-forge
npm install
npm run dev
```

### Option 3: Docker Deployment (Recommended)
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📁 Project Structure

```
scholarforge-server/
├── artifacts/
│   ├── api-server/          # Node.js backend API
│   └── scholar-forge/      # React frontend
├── components/
│   └── WebsiteLinkButton.tsx  # Website link component
├── scripts/
│   └── start-servers.sh      # Automated startup script
├── docker-compose.prod.yml    # Production Docker setup
├── Dockerfile.production      # Production Docker image
├── .env                    # Environment variables
├── website-link-button.html  # Standalone website link button
└── README.md               # This file
```

## 🔧 Environment Configuration

### Required Environment Variables

Create a `.env` file with the following variables:

```bash
# Backend Configuration
PORT=8081
DATABASE_URL=postgresql://postgres:password@localhost:5433/scholarforge
SESSION_SECRET=your-jwt-secret-key-change-this-in-production

# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
YAHOO_CLIENT_ID=your-yahoo-client-id
YAHOO_CLIENT_SECRET=your-yahoo-client-secret

# Node Environment
NODE_ENV=production

# Website URL (for redirects and links)
WEBSITE_URL=http://your-domain.com
```

## 🌐 Access Points

Once servers are running:

- **API Server**: `http://localhost:8081`
- **Frontend**: `http://localhost:5173`
- **Health Check**: `http://localhost:8081/api/health`
- **Website Link Button**: Open `website-link-button.html`

## 🐳 Docker Deployment

### Build and Deploy
```bash
# Build Docker image
docker build -f Dockerfile.production -t scholarforge:latest .

# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Docker Compose Services

- **scholarforge-prod**: Main application container
- **PostgreSQL**: Database container (if configured)
- **Nginx**: Reverse proxy (if configured)

## 🔄 Automated Deployment

### GitHub Actions CI/CDP

The repository includes a complete GitHub Actions workflow for automated deployment:

- **Trigger**: Push to `main` branch
- **Build**: Multi-stage Docker build
- **Deploy**: Automatic deployment to production
- **Health Checks**: Post-deployment verification

### Required GitHub Secrets

Configure these secrets in your GitHub repository:

- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: JWT secret key
- `GOOGLE_CLIENT_ID`: Google OAuth Client ID
- `YAHOO_CLIENT_ID`: Yahoo OAuth Client ID
- `YAHOO_CLIENT_SECRET`: Yahoo OAuth Client Secret

## 📊 Monitoring and Logs

### Server Logs
```bash
# API Server logs
tail -f artifacts/api-server/logs/app.log

# Frontend logs (if running in production)
tail -f artifacts/scholar-forge/logs/frontend.log

# Docker logs
docker logs scholarforge-prod
```

### Health Monitoring
```bash
# Check API health
curl http://localhost:8081/api/health

# Check container status
docker ps | grep scholarforge

# Monitor resource usage
docker stats scholarforge-prod
```

## 🔒 Security Considerations

1. **Environment Variables**: Never commit secrets to version control
2. **Database Security**: Use strong passwords and limit access
3. **Container Security**: Run as non-root user
4. **Network Security**: Use firewall rules to restrict access
5. **SSL/TLS**: Always use HTTPS in production

## 🛠️ Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check what's using ports
sudo netstat -tlnp | grep :8081
sudo netstat -tlnp | grep :5173

# Kill processes using ports
sudo lsof -ti:8081
sudo lsof -ti:5173
```

#### Database Connection Issues
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check database logs
sudo journalctl -u postgresql -f
```

#### Container Issues
```bash
# Check container logs
docker logs scholarforge-prod

# Restart containers
docker-compose -f docker-compose.prod.yml restart
```

## 📱 Development Workflow

### Local Development
1. Clone repository
2. Copy `.env.example` to `.env`
3. Update environment variables
4. Run `npm install` in both `artifacts/api-server` and `artifacts/scholar-forge`
5. Start servers using the methods above

### Production Deployment
1. Configure GitHub secrets
2. Push to `main` branch
3. Monitor GitHub Actions deployment
4. Verify deployment using health checks

## 🔗 Website Integration

The system includes a website link button component that:

- Links to the main website instead of separate domain
- Shows website availability status
- Works on both localhost and production
- Professional styling with hover effects
- Responsive design

### Using the Website Link Button

1. Open `website-link-button.html` in a browser
2. Click the "Visit Website" button
3. The button opens the main website in a new tab
4. Status indicator shows website availability

## 📈 Scaling

### Horizontal Scaling
```bash
# Deploy multiple instances
docker-compose -f docker-compose.prod.yml up -d --scale scholarforge=3

# Use load balancer
# Configure Nginx or similar reverse proxy
```

### Vertical Scaling
```bash
# Update container resources
docker-compose -f docker-compose.prod.yml up -d --memory=2g --cpus=1.0
```

## 🔄 Updates and Maintenance

### Application Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild and redeploy
docker-compose -f docker-compose.prod.yml up -d --build
```

### Database Maintenance
```bash
# Create backups
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup_20240422.sql
```

## 📞 Support

For deployment issues:
1. Check GitHub Actions logs
2. Review container logs
3. Verify environment variables
4. Test database connectivity
5. Check network and firewall settings

## 🏗 Architecture

```
┌─────────────────┐
│   GitHub      │
│   Repository   │
└──────┬────────┘
       │
       ▼
┌─────────────────┐     ┌─────────────────┐
│   GitHub      │     │  Production    │
│   Actions     │────▶│  Server        │
└──────┬────────┘     └─────────────────┘
       │                    │
       ▼                    ▼
┌─────────────────┐     ┌─────────────────┐
│   Docker      │     │   Application   │
│   Container    │────▶│  (API + UI)    │
└──────┬────────┘     └─────────────────┘
       │                    │
       ▼                    ▼
┌─────────────────┐     ┌─────────────────┐
│   PostgreSQL   │     │   Website      │
│   Database    │────▶│  Access        │
└──────┬────────┘     └─────────────────┘
```

## 📝 License

This project is licensed under the MIT License. See LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request
6. Follow coding standards and best practices

---

**Last Updated**: April 22, 2026
**Version**: 1.0.0
