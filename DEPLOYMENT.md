# ScholarForge Deployment Guide

This guide covers setting up ScholarForge for production deployment on Debian systems using CI/CDP pipelines.

## Prerequisites

- Debian-based server (Ubuntu 20.04+ recommended)
- Docker and Docker Compose
- PostgreSQL database
- Node.js 18+
- pnpm package manager
- GitHub account with repository access

## Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/Cyberverse-cent0/Schoolars-work-bench.git
cd Schoolars-work-bench
```

### 2. Environment Variables
Copy the example environment file and update with your production values:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: JWT secret key
- `GOOGLE_CLIENT_ID`: Google OAuth Client ID
- `YAHOO_CLIENT_ID`: Yahoo OAuth Client ID
- `YAHOO_CLIENT_SECRET`: Yahoo OAuth Client Secret

### 3. Database Setup
Ensure PostgreSQL is running and accessible:

```bash
# Start PostgreSQL (if not already running)
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE scholarforge;
CREATE USER scholarforge WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE scholarforge TO scholarforge;
```

## Deployment Methods

### Method 1: Automated GitHub Actions Deployment

#### Setup GitHub Secrets
1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Add the following secrets:
   - `DATABASE_URL`: Full PostgreSQL connection string
   - `SESSION_SECRET`: Your JWT secret
   - `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
   - `YAHOO_CLIENT_ID`: Your Yahoo OAuth Client ID
   - `YAHOO_CLIENT_SECRET`: Your Yahoo OAuth Client Secret

#### Deploy
```bash
# Push to trigger deployment
git add .
git commit -m "Deploy to production"
git push origin main
```

The GitHub Actions workflow will:
1. Build the Docker image
2. Deploy to production server
3. Run health checks
4. Monitor the deployment

### Method 2: Manual Docker Deployment

#### Build and Deploy
```bash
# Build Docker image
docker build -f Dockerfile.production -t scholarforge:latest .

# Stop existing container
docker stop scholarforge || true
docker rm scholarforge || true

# Deploy with environment variables
docker run -d \
  --name scholarforge \
  --restart unless-stopped \
  -p 8081:8081 \
  -e NODE_ENV=production \
  -e DATABASE_URL="$DATABASE_URL" \
  -e SESSION_SECRET="$SESSION_SECRET" \
  -e GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
  -e YAHOO_CLIENT_ID="$YAHOO_CLIENT_ID" \
  -e YAHOO_CLIENT_SECRET="$YAHOO_CLIENT_SECRET" \
  scholarforge:latest
```

#### Using Docker Compose
```bash
# Deploy with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

## Monitoring and Logs

### Check Container Status
```bash
# Check if container is running
docker ps | grep scholarforge

# View logs
docker logs scholarforge

# Follow logs in real-time
docker logs -f scholarforge
```

### Health Checks
```bash
# Test health endpoint
curl http://localhost:8081/api/health

# Check application logs
docker exec scholarforge cat /app/logs/app.log
```

## SSL Setup (Optional)

For production SSL, use Nginx or Caddy as a reverse proxy:

### Example Nginx Configuration
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;
}
```

## Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check Docker logs
docker logs scholarforge

# Check port conflicts
sudo netstat -tlnp | grep :8081

# Check if database is accessible
docker exec scholarforge ping postgres -c 3
```

#### Database Connection Issues
```bash
# Test database connection from container
docker exec scholarforge node -e "
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
pool.query('SELECT NOW()').then(console.log).catch(console.error);
"
```

#### Performance Issues
```bash
# Monitor resource usage
docker stats scholarforge

# Check memory usage
docker exec scholarforge node -e "console.log(process.memoryUsage())"
```

## Backup Strategy

### Database Backups
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d)
docker exec postgres pg_dump -U scholarforge scholarforge > backup_$DATE.sql
EOF

chmod +x backup.sh
./backup.sh
```

### Application Data Backup
```bash
# Backup application data
docker run --rm -v /path/to/backups:/backup \
  -v scholarforge_data:/app/data \
  alpine tar czf /backup/scholarforge_$(date +%Y%m%d).tar.gz /app/data
```

## Scaling

### Horizontal Scaling
```bash
# Deploy multiple instances
docker run -d \
  --name scholarforge-2 \
  --restart unless-stopped \
  -p 8082:8081 \
  scholarforge:latest

# Use load balancer to distribute traffic
```

### Vertical Scaling
```bash
# Update container resources
docker stop scholarforge
docker run -d \
  --name scholarforge \
  --restart unless-stopped \
  --memory=1g \
  --cpus=0.5 \
  -p 8081:8081 \
  scholarforge:latest
```

## Security Considerations

1. **Environment Variables**: Never commit secrets to version control
2. **Network Security**: Use firewall to restrict access to port 5432
3. **Database Security**: Use strong passwords and limit database user permissions
4. **Container Security**: Run containers as non-root users
5. **SSL/TLS**: Always use HTTPS in production
6. **Regular Updates**: Keep Docker images and dependencies updated

## CI/CDP Pipeline

The GitHub Actions workflow (`.github/workflows/deploy.yml`) handles:
- Code checkout and dependency installation
- Multi-stage Docker build optimization
- Automated deployment with health checks
- Environment variable management through GitHub secrets
- Rollback capabilities on failure

## Support

For deployment issues:
1. Check GitHub Actions logs
2. Review container logs
3. Verify environment variables
4. Test database connectivity
5. Check network and firewall settings

## Next Steps

1. Set up monitoring (Prometheus, Grafana)
2. Configure automated backups
3. Set up SSL certificates
4. Configure domain and DNS
5. Test failover procedures
