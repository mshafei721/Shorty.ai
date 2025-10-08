# Shorty.ai Backend

Video processing backend for Shorty.ai mobile app.

## Features

- **Video Upload**: Multipart file upload with validation (MP4, MOV, AVI)
- **Transcription**: AssemblyAI integration for audio-to-text
- **Subtitle Generation**: Automatic subtitle segmentation (5 words, 3s max)
- **Video Composition**: Shotstack rendering with subtitle overlay
- **Job Orchestration**: FSM-based job status tracking

## Architecture

```
Upload (D1) → Transcription (D2) → Composition (D4) → Output
```

Current implementation: **Subtitles-only slice** (proof of architecture)

## API Endpoints

### POST /uploads
Upload video file
- Body: `multipart/form-data` with `video` field
- Response: `{ video: { id, originalName, sizeBytes, uploadedAt } }`

### POST /jobs
Create processing job
- Body: `{ videoId: string, features: JobFeatures }`
- Response: `{ job: { id, videoId, status, progress, ... } }`

### GET /jobs/:jobId
Get job status
- Response: `{ job: { id, status, progress, outputUrl, error, ... } }`

### POST /jobs/:jobId/cancel
Cancel job
- Response: `{ message, jobId }`

### GET /health
Health check
- Response: `{ status, timestamp, env }`

## Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys
npm run dev
```

## Environment Variables

```
ASSEMBLYAI_API_KEY=your_assemblyai_key
SHOTSTACK_API_KEY=your_shotstack_key
SHOTSTACK_ENV=stage
PORT=3000
```

## Development

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Compile TypeScript
npm start            # Run production build
npm test             # Run tests
npm run typecheck    # Check types
npm run lint         # Lint code
```

## Production Deployment

1. Set environment variables
2. Build: `npm run build`
3. Start: `npm start`
4. Configure reverse proxy (nginx/Apache)
5. Set up process manager (PM2/systemd)

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm test -- --coverage
```

## Future Enhancements

- D3: Filler-word removal
- D5: Mux encoding
- Epic D: Background music, intro/outro
- Database persistence (PostgreSQL)
- Queue system (Bull/BullMQ)
- Webhooks for async notifications

## License

MIT
