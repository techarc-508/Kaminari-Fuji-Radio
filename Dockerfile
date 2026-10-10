# Multi-stage Dockerfile for Self-Hosted Ambient Radio with yt-dlp & FFmpeg
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . ./
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data

# Install Python3, FFmpeg, curl, and pinned yt-dlp release
RUN apk add --no-cache python3 ffmpeg curl bash \
  && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
  && chmod a+rx /usr/local/bin/yt-dlp

# Create persistent storage directories
RUN mkdir -p /app/data/music /app/data/artwork /app/data/temp /app/data/backups

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm install -g tsx

# Copy built frontend assets and server modules
COPY --from=builder /app/dist ./dist
COPY server.ts ./
COPY src/types ./src/types
COPY src/server ./src/server

# Expose web radio port
EXPOSE 3000

# Health check to ensure receiver is operational
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/stations || exit 1

VOLUME ["/app/data"]

CMD ["tsx", "server.ts"]
