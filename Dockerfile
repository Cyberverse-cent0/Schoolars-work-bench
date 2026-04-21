FROM node:24-alpine

WORKDIR /app

# Install pnpm using corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build all packages
RUN pnpm run build

# Expose ports
EXPOSE 3000 5173

# Start both services with a script
CMD ["sh", "-c", "cd artifacts/api-server && pnpm run start & cd /app/artifacts/scholar-forge && pnpm run serve"]
