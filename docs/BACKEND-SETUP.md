# Backend Service Setup

## Overview

The Shorty.ai mobile app requires a backend service implementing the M2Gateway REST API contract for video processing. This document describes how to set up and run the backend service.

## Prerequisites

- Node.js ≥18.0.0
- npm ≥9.0.0
- API keys for external providers (AssemblyAI, Shotstack, Mux)

## Quick Start (Development)

### 1. Environment Configuration

Copy `.env.example` to `.env` in the mobile app root:

```bash
cp .env.example .env
```

Set the backend URL:

```bash
EXPO_PUBLIC_M2_BASE_URL=http://localhost:3000
```

### 2. Backend Service

**Status:** ✅ **Implemented** - Subtitles-only slice (Phase 2.1)

**Location:** `backend/` directory

**Setup:**

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys:
# - ASSEMBLYAI_API_KEY
# - SHOTSTACK_API_KEY
npm run dev
```

The backend implements these endpoints:

#### POST /uploads

Upload video file for processing.

**Request:** `multipart/form-data` with `video` field
**Response:**
```json
{
  "video": {
    "id": "uuid",
    "originalName": "my-video.mp4",
    "sizeBytes": 12345678,
    "uploadedAt": "2025-01-08T..."
  }
}
```

#### POST /jobs

Create processing job.

**Request Body:**
```json
{
  "videoId": "uuid-from-upload",
  "features": {
    "subtitles": true,
    "fillerWordRemoval": false
  }
}
```

**Response:**
```json
{
  "job": {
    "id": "job-uuid",
    "videoId": "uuid",
    "status": "queued",
    "progress": 0,
    "requestedFeatures": { ... },
    "startedAt": "2025-01-08T..."
  }
}
```

#### GET /jobs/:jobId

Poll job status (2-second intervals recommended).

**Response:**
```json
{
  "job": {
    "id": "job-uuid",
    "videoId": "uuid",
    "status": "complete",
    "progress": 100,
    "startedAt": "2025-01-08T...",
    "completedAt": "2025-01-08T...",
    "outputUrl": "https://shotstack.io/.../output.mp4",
    "error": null
  }
}
```

**Status Values:** `queued` | `processing` | `complete` | `failed` | `cancelled`

#### POST /jobs/:jobId/cancel

Cancel processing job.

**Response:**
```json
{
  "message": "Job cancelled successfully",
  "jobId": "job-uuid"
}
```

#### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-08T...",
  "env": "development"
}
```

## Provider Integration

The backend integrates with:

1. **✅ AssemblyAI** (transcription) - **IMPLEMENTED**
   - Endpoint: `https://api.assemblyai.com/v2/transcript`
   - Features: Punctuation, text formatting, word-level timestamps
   - Polling: 3-second intervals, max 200 attempts

2. **✅ Shotstack** (composition) - **IMPLEMENTED**
   - Endpoint: `https://api.shotstack.io/{env}/render`
   - Features: HTML subtitle overlay, 9:16 aspect ratio, 1080x1920
   - Subtitle styling: White text, black background, drop shadow
   - Polling: 2-second intervals, max 300 attempts

3. **⏳ Mux** (encoding) - **NOT YET NEEDED**
   - Shotstack provides final MP4 output
   - Mux integration deferred to future phases

See `backend/` directory for implementation details.

## Testing

### Use Mock Gateway (Development Only)

For frontend development without a backend:

```typescript
// In test/development code only
import { MockM2Gateway } from '@/features/m3/gateway/__mocks__/MockM2Gateway';
import { setM2Gateway } from '@/features/m3/gateway';

// Before tests/dev sessions
setM2Gateway(new MockM2Gateway());
```

**IMPORTANT:** MockM2Gateway is ONLY for tests. Production builds will fail if `EXPO_PUBLIC_M2_BASE_URL` is not set.

## Troubleshooting

### Error: "EXPO_PUBLIC_M2_BASE_URL must be set"

**Cause:** The mobile app cannot find a backend URL.

**Solution:**
1. Create `.env` file in project root
2. Set `EXPO_PUBLIC_M2_BASE_URL=http://localhost:3000` (or your backend URL)
3. Restart Expo dev server: `npm start`

### Network Error When Testing

**Cause:** Backend service not running or wrong URL.

**Solution:**
1. Verify backend is running: `curl http://localhost:3000/health`
2. Check firewall/network settings
3. For device testing, use machine's IP instead of `localhost`

## Production Deployment

### Environment Variables

Set via hosting platform (Heroku, AWS, etc.):

```bash
EXPO_PUBLIC_M2_BASE_URL=https://api.shorty-ai.example.com
```

### CI/CD

CI will fail if:
- Backend URL not configured
- Tests detect mock imports in production code
- Bundle analysis finds MockM2Gateway in build output

See `.github/workflows/ci.yml` for enforcement rules.

## Implementation Status

**Phase 2.1 (Subtitles-only slice):** ✅ **COMPLETE**
- D1: Upload adapter ✅
- D2: AssemblyAI transcription ✅
- D4: Shotstack composition ✅
- D6: Job orchestration FSM ✅

**Future Enhancements:**
- D3: Filler-word removal
- D5: Mux encoding (if needed)
- Background music, intro/outro
- Database persistence (PostgreSQL)
- Queue system (Bull/BullMQ)
- Webhooks for notifications

## Next Steps

1. ✅ ~~Implement backend service subtitles slice~~ **DONE**
2. Deploy to staging environment
3. Configure provider API keys (AssemblyAI, Shotstack)
4. Run end-to-end tests with mobile app
5. Add remaining features (D3, D5, Epic D extensions)
