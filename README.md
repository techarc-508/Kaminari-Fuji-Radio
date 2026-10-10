# Kaminari Radio — Self-Hosted Ambient & Retro Web Radio

A self-hosted personal internet radio and ambient music player inspired by vintage desktop receivers. Features warm cream/beige paper textures, thin dark borders, monospaced metadata, serif typography, tactile playback controls, and a signature crimson red accent.

Built for continuous, uninterrupted playback of instrumental music, lo-fi beats, ambient soundscapes, calm piano, and synthwave.

---

## Features

- **Vintage Radio Receiver Interface**: Styled after classic desktop radio hardware with tactile controls, animated crimson equalizer bars, volume slider with black square thumb, preset buttons, and live stream indicators.
- **Continuous Ambient Playback**: Starts immediately upon pressing play, advancing tracks automatically with zero intervention.
- **Rich Preset Stations**: Out of the box presets for *Lofi Chillhop* (iLoveRadio), *Nightwave Plaza* (Vaporwave/Synthwave), *SomaFM Space Station* (Ambient Space), *RPLab Radio* (Groove Salad Downtempo), *Ambient Piano*, and *Deep Focus*.
- **YouTube URL Importing**: Import ambient YouTube tracks and playlists into your rotation using the permitted YouTube embedded player.
- **Self-Hosted Audio Storage**: Direct file upload (MP3, WAV, FLAC, OGG, M4A) with storage directly on the host's persistent volume (`/data/music/`).
- **HTTP 206 Partial Content Range Requests**: True audio seeking capability for stored and uploaded files.
- **Custom Station Playlists**: Create themed channels (*Rainy Day*, *Sleep Drone*, *Deep Focus*, *Cyberpunk Night Drive*).
- **Queue Management**: Up next rotation, drag-and-drop / manual reordering, shuffle, repeat (all / one / off).
- **Audio Crossfade**: Configurable 0 to 10 seconds crossfade blending between sequential tracks.
- **Sleep Timer**: Built-in 15, 30, 45, 60, or 90 minute auto-shutoff timer.
- **Media Session API**: Lock screen controls, headphone play/pause, and notification metadata support.
- **Local Folder Rescan**: Drop audio files directly into `/data/music/` and click *Rescan* to automatically index them.

---

## Quick Start (Docker Compose)

The easiest way to run the radio receiver on your home server, NAS, or mini PC:

```bash
# Clone the repository
git clone https://github.com/techarc-508/Kaminari-Fuji-Radio.git
cd Kaminari-Fuji-Radio

# Create .env with your admin credentials (see .env.example)
cp .env.example .env

# Start the service
docker compose up -d
```

Open your browser and navigate to `http://<your-server-ip>:3000`.

### Persistent Volumes

The Docker Compose configuration persists:
- `radio-music`: Stored audio tracks in `/app/data/music/`
- `radio-artwork`: Album covers and artwork in `/app/data/artwork/`
- `radio-data`: JSON / database store, playlists, and settings in `/app/data/`

To bind to host folders instead of Docker named volumes:

```yaml
volumes:
  - ./my-music:/app/data/music
  - ./my-data:/app/data
```

---

## Local Development (Node.js)

Requirements: Node.js 20+ and npm.

```bash
# Install dependencies
npm install

# Start development fullstack server
npm run dev

# App runs at http://localhost:3000
```

To build for production:

```bash
npm run build
npm start
```

---

## Storage & Backup

### Backup
To back up your library metadata, playlists, and configuration:

```bash
# Backup the data directory
docker compose exec kaminari-radio tar -czf /app/data/backups/backup-$(date +%F).tar.gz /app/data/db.json
```

### Restore
To restore:
```bash
docker compose cp ./backup.tar.gz kaminari-radio:/app/data/
docker compose restart
```

---

## Reverse Proxy Configuration

### Nginx

```nginx
server {
    listen 80;
    server_name radio.yourhome.net;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name radio.yourhome.net;

    ssl_certificate /etc/letsencrypt/live/radio.yourhome.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/radio.yourhome.net/privkey.pem;

    client_max_body_size 100M; # For audio file uploads

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Caddy

```caddyfile
radio.yourhome.net {
    reverse_proxy localhost:3000
}
```

---

## Keyboard Shortcuts

- <kbd>Space</kbd>: Play / Pause toggle
- <kbd>M</kbd>: Mute / Unmute
- <kbd>Alt</kbd> + <kbd>→</kbd>: Next track or radio preset
- <kbd>Alt</kbd> + <kbd>←</kbd>: Previous track or radio preset
