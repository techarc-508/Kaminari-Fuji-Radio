# Multi-stage Dockerfile for Kaminari Radio with yt-dlp & FFmpeg.
# Uses bun as the package manager and runtime, matching the committed bun.lock
# (there is no package-lock.json, so `npm ci` won't work here).
FROM oven/bun:1.4-alpine AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . ./
RUN bun run build

# Production runtime stage
FROM oven/bun:1.4-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data

# Install Python3, FFmpeg, curl, nodejs (yt-dlp JS runtime for YouTube), and yt-dlp release
RUN apk add --no-cache python3 ffmpeg curl bash nodejs \
  && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
  && chmod a+rx /usr/local/bin/yt-dlp

# Create persistent storage directories
RUN mkdir -p /app/data/music /app/data/artwork /app/data/temp /app/data/backups

# Copy package files and install production dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

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

CMD ["bun", "server.ts"]