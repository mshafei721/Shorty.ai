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

### 2. Backend Service (TODO: Implement)

**Status:** Backend service implementation is pending (Phase 2.1 of balance hardening plan).

The backend must implement these endpoints:

#### GET /projects/:projectId/assets/:assetId/status

Returns job status:

```typescript
{
  stage: 'complete' | 'processing' | 'failed',
  status: 'done' | 'queued' | 'error',
  progressPct: number,  // 0-100
  artifactUrl?: string  // Present when stage='complete'
}
```

#### GET /projects/:projectId/assets/:assetId/transcript

Returns normalized transcript:

```typescript
{
  tokens: Array<{
    text: string,
    startMs: number,
    endMs: number,
    confidence?: number
  }>,
  fullText: string,
  durationMs: number,
  language: string
}
```

#### GET /projects/:projectId/assets/:assetId/fillers

Returns filler word spans:

```typescript
{
  fillers: Array<{
    startMs: number,
    endMs: number,
    text: string,
    confidence: number
  }>
}
```

#### POST /projects/:projectId/draft

Request draft rendering:

**Request Body:**
```typescript
{
  assetId: string,
  config: {
    fillerRemoval: boolean,
    jumpCuts: boolean,
    captions: {
      enabled: boolean,
      size: number,
      style: 'boxed' | 'plain'
    },
    introOutro: boolean,
    frameMarginPx: number,
    version: number,
    updatedAt: string
  }
}
```

**Response:**
```typescript
{
  renderId: string
}
```

#### GET /drafts/:renderId/status

Poll draft status:

```typescript
{
  renderId: string,
  status: 'queued' | 'rendering' | 'done' | 'failed',
  progressPct: number,
  artifactUrl?: string,  // Present when status='done'
  error?: {
    code: string,
    message: string
  }
}
```

## Provider Integration

The backend service must integrate with:

1. **AssemblyAI** (transcription)
   - Endpoint: `https://api.assemblyai.com/v2/transcript`
   - Fallback: Deepgram Nova-3

2. **Shotstack** (composition)
   - Endpoint: `https://api.shotstack.io/v1/render`
   - Fallback: Cloudinary Video API

3. **Mux** (encoding)
   - Endpoint: Mux Video API
   - Fallback: Coconut

See `plan.md` Epic D (D1-D6) for detailed implementation requirements.

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

## Next Steps

1. Implement backend service (Epic D, tickets D1-D6)
2. Deploy to staging environment
3. Configure provider API keys
4. Run end-to-end tests
5. Update this document with actual deployment instructions
