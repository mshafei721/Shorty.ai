# Pipeline Fixtures

Test data for M2 Processing Pipeline POC.

## Files

### `sample-transcript.json`
Normalized transcript with typical filler words ("um", "so") for NLP testing.

**Usage:**
```typescript
import sampleTranscript from './sample-transcript.json';
const fillers = fillerDetectionService.detectFillers(sampleTranscript);
```

### `filler-ground-truth.json`
Ground truth labels for filler detection metrics validation.

**Expected Metrics:**
- Precision: ≥0.90
- Recall: ≥0.85

**Usage:**
```typescript
import groundTruth from './filler-ground-truth.json';
const metrics = service.evaluateMetrics(detected, groundTruth);
```

## Adding Fixtures

1. Keep fixtures minimal (≤100 tokens)
2. Include edge cases (long silence, low confidence, multi-word fillers)
3. Provide ground truth labels for automated validation
4. Document expected behavior in comments

## Validation

Run fixture tests:
```bash
npm test -- pipeline/nlp
```
