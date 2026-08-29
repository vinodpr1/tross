# Server

Node.js + Express API server with TypeScript.

## Setup

```bash
npm install
cp .env.example .env
```

## Development

```bash
npm run dev
```

## Production

```bash
npm run build
npm start
```

## HTTPS (optional)

```bash
npm run certs:generate
```

## Docker

Build and run with Docker Compose:

```bash
cp .env.example .env   # add LinkedIn credentials
docker compose up --build
```

Or with Docker directly:

```bash
docker build -t linkedin-scraper-api .
docker run --rm -p 3100:3100 --env-file .env linkedin-scraper-api
```

The image generates a self-signed TLS certificate on build. To use your own certs, mount them:

```bash
docker run --rm -p 3100:3100 \
  --env-file .env \
  -v "$(pwd)/certs:/app/certs:ro" \
  linkedin-scraper-api
```

API: `https://localhost:3100`

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/linkedin/profile?url={profileUrl}` | Scrape LinkedIn profile |
| POST | `/api/v1/linkedin/profile` | Scrape LinkedIn profile (JSON body) |

### LinkedIn profile example

```bash
# GET
curl -sk "https://localhost:3100/api/v1/linkedin/profile?url=https://www.linkedin.com/in/bill-gates/"

# POST
curl -sk -X POST https://localhost:3100/api/v1/linkedin/profile \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.linkedin.com/in/bill-gates/"}'
```
