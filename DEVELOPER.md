# Developer Documentation

## Overview

ScholarForge is a full-stack web application built with modern JavaScript/TypeScript technologies. It consists of a React frontend, Node.js/Express backend API, and PostgreSQL database, all containerized with Docker for easy deployment.

## Architecture

### Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Radix UI
- **Backend**: Node.js, Express 5, TypeScript, Socket.IO
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js v5 with Google OAuth and email/password
- **Deployment**: Docker, Docker Compose, GitHub Actions CI/CD
- **Package Manager**: pnpm (workspace monorepo)
- **Code Quality**: ESLint, Prettier, TypeScript strict mode

### Project Structure

```
workspaces/scholarforge/
├── artifacts/                 # Main applications
│   ├── api-server/           # Backend API server
│   │   ├── src/              # Source code
│   │   ├── dist/             # Built output
│   │   ├── logs/             # Application logs
│   │   └── package.json
│   └── scholar-forge/        # Frontend React app
│       ├── src/              # Source code
│       ├── dist/             # Built output
│       ├── public/           # Static assets
│       └── package.json
├── lib/                      # Shared libraries
│   ├── api-client-react/     # React API client
│   ├── api-spec/            # OpenAPI specifications
│   ├── api-zod/             # Zod schemas for API types
│   └── db/                  # Database schemas and utilities
├── components/               # Shared React components
├── scripts/                  # Build and utility scripts
└── docker-compose.*.yml      # Docker configurations
```

## Development Environment Setup

### Prerequisites

- Node.js 18+ (LTS recommended)
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL (for local development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd scholarforge
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development database**
   ```bash
   docker-compose -f docker-compose.db.yml up -d
   ```

5. **Run database migrations**
   ```bash
   cd artifacts/api-server
   pnpm run db:migrate
   ```

### Development Workflow

#### Starting Development Servers

**Option 1: Start all services**
```bash
pnpm run dev:all
```

**Option 2: Start individual services**
```bash
# Terminal 1: API Server
cd artifacts/api-server
pnpm run dev

# Terminal 2: Frontend
cd artifacts/scholar-forge
pnpm run dev

# Terminal 3: Database (if not using Docker)
# Start PostgreSQL locally
```

#### Available Scripts

**Root workspace:**
- `pnpm build` - Build all packages
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier

**API Server (`artifacts/api-server/`):**
- `pnpm run dev` - Start development server with hot reload
- `pnpm run build` - Build for production
- `pnpm run start` - Start production server
- `pnpm run typecheck` - TypeScript type checking

**Frontend (`artifacts/scholar-forge/`):**
- `pnpm run dev` - Start Vite dev server
- `pnpm run build` - Build for production
- `pnpm run serve` - Serve built files
- `pnpm run typecheck` - TypeScript type checking
- `pnpm run lint` - Run ESLint
- `pnpm run format` - Format code
- `pnpm run test` - Run tests with Vitest
- `pnpm run test:ui` - Run tests with UI
- `pnpm run test:coverage` - Run tests with coverage

## Code Organization

### Frontend (React/TypeScript)

**File Structure:**
```
artifacts/scholar-forge/src/
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── pages/              # Page components
├── styles/             # Global styles
├── types/              # TypeScript type definitions
└── utils/              # Helper functions
```

**Key Patterns:**
- Use functional components with hooks
- TypeScript strict mode enabled
- Component composition over inheritance
- Custom hooks for shared logic
- Radix UI primitives for accessibility

### Backend (Node.js/TypeScript)

**File Structure:**
```
artifacts/api-server/src/
├── controllers/        # Route handlers
├── middleware/         # Express middleware
├── models/            # Data models
├── routes/            # API route definitions
├── services/          # Business logic
├── types/             # TypeScript definitions
├── utils/             # Utility functions
└── index.ts           # Server entry point
```

**Key Patterns:**
- Express.js with TypeScript
- Middleware for authentication, validation, logging
- Service layer for business logic
- Repository pattern for data access
- Zod schemas for runtime type validation

### Shared Libraries

**API Client (`lib/api-client-react/`):**
- Generated from OpenAPI spec using Orval
- React Query for caching and state management
- Type-safe API calls

**Database (`lib/db/`):**
- Drizzle ORM for type-safe database operations
- Schema definitions with migrations
- Connection pooling and transactions

**API Types (`lib/api-zod/`):**
- Zod schemas for API request/response validation
- Shared between frontend and backend
- Runtime type checking

## Testing

### Frontend Testing

**Framework:** Vitest with React Testing Library

```bash
cd artifacts/scholar-forge
pnpm run test              # Run all tests
pnpm run test:ui          # Run tests with UI
pnpm run test:coverage    # Generate coverage report
```

**Test Structure:**
```
src/
├── __tests__/            # Test files
├── components/
│   └── __tests__/       # Component tests
└── hooks/
    └── __tests__/       # Hook tests
```

### Backend Testing

**Framework:** Node.js built-in test runner (future implementation)

## Code Quality

### Linting

**ESLint Configuration:**
- TypeScript strict rules
- React best practices
- Accessibility rules
- Import sorting

```bash
pnpm run lint     # Check for issues
pnpm run lint:fix # Auto-fix issues
```

### Formatting

**Prettier Configuration:**
- Single quotes
- Semicolons
- 2-space indentation
- 100 character line width

```bash
pnpm run format       # Format all files
pnpm run format:check # Check formatting
```

### TypeScript

**Strict Configuration:**
- `noImplicitAny: true`
- `strictNullChecks: true`
- `strictFunctionTypes: false` (for flexibility)
- `noUnusedLocals: false` (for development)
- `isolatedModules: true`

## Database

### Schema Management

**Drizzle ORM:**
- Type-safe database operations
- Migration system
- Schema introspection

**Migration Commands:**
```bash
cd artifacts/api-server
pnpm run db:generate  # Generate migration from schema changes
pnpm run db:migrate   # Apply migrations
pnpm run db:push      # Push schema changes (development only)
```

### Development Database

**Docker Compose:**
```bash
docker-compose -f docker-compose.db.yml up -d
```

**Local PostgreSQL:**
- Host: localhost
- Port: 5433
- Database: scholarforge
- User: postgres
- Password: password

## Authentication

### NextAuth.js v5

**Providers:**
- Google OAuth
- Email/Password (with bcrypt)

**Configuration:**
- JWT tokens for session management
- Secure cookie settings
- CSRF protection

**Environment Variables:**
```env
NEXTAUTH_URL=http://localhost:5173
NEXTAUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Deployment

### Docker

**Build Process:**
```bash
# Build all images
docker-compose build

# Build specific service
docker build -f Dockerfile.production -t scholarforge:latest .
```

**Production Deployment:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### CI/CD

**GitHub Actions:**
- Automated testing on push/PR
- Docker image building
- Security scanning
- Deployment to production

**Required Secrets:**
- Database credentials
- OAuth secrets
- Docker registry credentials

## API Documentation

### OpenAPI Specification

**Location:** `lib/api-spec/openapi.yaml`

**Generation:**
```bash
cd lib/api-spec
pnpm run generate  # Generate API client from OpenAPI spec
```

### API Endpoints

**Base URL:** `http://localhost:8081/api`

**Key Endpoints:**
- `GET /health` - Health check
- `POST /auth/*` - Authentication routes
- `GET /users` - User management
- `POST /upload` - File uploads

## Contributing

### Development Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes**
   - Follow code style guidelines
   - Add tests for new functionality
   - Update documentation

3. **Run quality checks**
   ```bash
   pnpm run typecheck
   pnpm run lint
   pnpm run test
   ```

4. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Create pull request**
   - Provide clear description
   - Reference related issues
   - Request review from maintainers

### Commit Convention

**Format:** `type(scope): description`

**Types:**
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions/updates
- `chore:` - Maintenance tasks

### Code Review Process

**Checklist:**
- [ ] TypeScript types are correct
- [ ] Tests pass and coverage maintained
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] Security considerations addressed
- [ ] Performance impact assessed

## Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Check what's using ports
sudo lsof -i :8081
sudo lsof -i :5173

# Kill process
sudo kill -9 <PID>
```

**Database connection issues:**
```bash
# Test connection
psql postgresql://postgres:password@localhost:5433/scholarforge -c "SELECT 1;"

# Check Docker logs
docker-compose -f docker-compose.db.yml logs
```

**Build failures:**
```bash
# Clear caches
pnpm run clean
pnpm install

# Check TypeScript errors
pnpm run typecheck
```

**Permission issues:**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) node_modules
```

## Security

### Best Practices

- **Environment Variables:** Never commit secrets
- **Input Validation:** Use Zod schemas for all inputs
- **Authentication:** Implement proper session management
- **HTTPS:** Always use HTTPS in production
- **Dependencies:** Regular security audits with `pnpm audit`

### Security Scanning

```bash
# Check for vulnerabilities
pnpm audit

# Update dependencies
pnpm update --latest
```

## Performance

### Frontend Optimization

- **Code Splitting:** Automatic with Vite
- **Image Optimization:** Use WebP format
- **Bundle Analysis:** `pnpm run build:analyze`
- **Lazy Loading:** Implement for routes and components

### Backend Optimization

- **Caching:** Implement Redis for session/data caching
- **Database Indexing:** Optimize queries with proper indexes
- **Connection Pooling:** Configured in Drizzle ORM
- **Logging:** Structured logging with Pino

## Monitoring

### Application Logs

**API Server:**
```
artifacts/api-server/logs/app.log
```

**Frontend:** Browser developer tools

**Docker Logs:**
```bash
docker-compose logs -f
```

### Health Checks

**Endpoints:**
- `GET /api/health` - Application health
- `GET /api/ready` - Readiness probe

### Metrics

**Future Implementation:**
- Application Performance Monitoring (APM)
- Error tracking
- User analytics

## Support

### Getting Help

1. **Check documentation** - README.md, this file
2. **Search issues** - GitHub Issues
3. **Create issue** - For bugs or feature requests
4. **Community** - Discord/Slack channels

### Escalation

For urgent production issues:
1. Check monitoring dashboards
2. Review recent deployments
3. Rollback if necessary
4. Contact on-call engineer

---

**Last Updated:** April 23, 2026
**Version:** 1.0.0</content>
<parameter name="filePath">/workspaces/Schoolars-work-bench/DEVELOPER.md