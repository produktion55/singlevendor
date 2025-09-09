# Build-Stage
FROM node:20-bookworm AS builder
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Runtime-Stage
FROM node:20-bookworm AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built output and production deps
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Trim dev deps just in case
RUN npm prune --omit=dev

# Default env (can be overridden by Compose)
ENV PORT=5000
ENV DATABASE_URL=/data/database.db

EXPOSE 5000

CMD ["node", "dist/index.js"]

