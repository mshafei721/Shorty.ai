# EAS Build Implementation Plan - On-Device AI Video Processing
**Branch:** `eas-build`
**Timeline:** 6-8 weeks
**App Size Increase:** ~200-350MB
**Status:** Research & Planning Phase

---

## Executive Summary

This document outlines the migration from Expo Go to EAS Development Build to enable on-device AI-powered video processing. Based on 2025 technology research, we've identified optimal packages and architecture for implementing subtitles, background removal, filler word removal, and audio mixing entirely on-device.

---

## Technology Stack (2025 Latest)

### **1. Transcription & Subtitles**

#### Primary Option: React Native ExecuTorch + Whisper
- **Package:** `react-native-executorch` v0.4.0+
- **Model:** Whisper Tiny/Base (exported to ExecuTorch format)
- **Size:** 40-150MB depending on model
- **Speed:** 30-60s for 2min video
- **Accuracy:** 90-95% English, multilingual support
- **Pros:**
  - ✅ Official Meta framework (PyTorch Edge)
  - ✅ Active development (v0.4.0 released 2025)
  - ✅ Supports New React Native Architecture
  - ✅ Tool calling & embeddings support
  - ✅ Fully offline with timestamps
- **Cons:**
  - ❌ Requires EAS Build (no Expo Go)
  - ❌ Larger app size

#### Alternative: whisper.rn
- **Package:** `whisper.rn`
- **Model:** whisper.cpp binding
- **Size:** 40-100MB
- **Speed:** Real-time transcription available
- **Pros:**
  - ✅ Realtime transcriber with VAD
  - ✅ Lightweight C++ implementation
- **Cons:**
  - ❌ Android has delays compared to iOS
  - ❌ Context loss on re-render (needs useRef)

**Recommendation:** Use React Native ExecuTorch for better future-proofing and Meta's backing.

---

### **2. Video Processing & Editing**

#### FFmpegKit (Still Viable Despite Retirement)
- **Package:** `ffmpeg-kit-react-native` + `@config-plugins/ffmpeg-kit-react-native`
- **Status:** Officially retired, but fully functional when built locally
- **Capabilities:**
  - ✅ Intro/outro concatenation
  - ✅ Background music mixing
  - ✅ Subtitle burn-in (from Whisper output)
  - ✅ Filler word segment removal
  - ✅ Video filters, watermarks, trimming
- **Variants:**
  - `min` - 20MB (basic codecs)
  - `audio` - 30MB (+ audio codecs)
  - `video` - 50MB (+ video codecs) **← Recommended**
  - `full-gpl` - 120MB (all features)
- **Platform Requirements:**
  - Android: Minimum SDK 24 (up from 21)
  - iOS: iOS 12.1+
- **Pros:**
  - ✅ Industry-standard video processing
  - ✅ Extensive format support
  - ✅ Works with Expo config plugins
  - ✅ Battle-tested, stable
- **Cons:**
  - ❌ No new releases (retired)
  - ❌ Requires EAS Build
  - ❌ Increases app size significantly

**Implementation Notes:**
- Use config plugin for auto-configuration
- Build locally for custom features
- Community may fork and maintain

---

### **3. Background Removal (Video Segmentation)**

#### Option A: MediaPipe Selfie Segmentation (Recommended)
- **Package:** React Native bindings for MediaPipe (via TensorFlow Lite)
- **Model:** MediaPipe Selfie Segmentation v2
- **Size:** ~5MB model
- **Speed:** Real-time (30 FPS on modern devices)
- **Accuracy:** Excellent for human segmentation
- **Pros:**
  - ✅ Real-time performance
  - ✅ Small model size
  - ✅ Google-maintained
  - ✅ Optimized for mobile
- **Cons:**
  - ❌ Limited React Native examples (mostly React Web)
  - ❌ Requires custom TFLite integration
  - ❌ Human-only segmentation

#### Option B: TensorFlow Lite + DeepLab v3+
- **Package:** `@tensorflow/tfjs-react-native`
- **Model:** DeepLab v3+ Mobile
- **Size:** ~20MB
- **Speed:** 2-3 FPS
- **Accuracy:** Good for various objects
- **Pros:**
  - ✅ More mature React Native support
  - ✅ Broader object detection
- **Cons:**
  - ❌ Slower performance
  - ❌ Larger model size

#### Option C: RobustVideoMatting (Research Path)
- **Status:** Not production-ready for React Native
- **Formats:** PyTorch, ONNX, CoreML
- **Pros:**
  - ✅ State-of-the-art accuracy
  - ✅ Temporal coherence (smooth masks)
- **Cons:**
  - ❌ No React Native integration yet
  - ❌ Would require ONNX Runtime bindings
  - ❌ Larger model size (~80MB)

**Recommendation:** Start with MediaPipe Selfie Segmentation v2 for MVP, research RobustVideoMatting for v2.

---

### **4. Filler Word Detection & Removal**

**Approach:** Whisper Transcription + Silence Detection + FFmpeg Cutting

**Workflow:**
1. Transcribe with Whisper (get word-level timestamps)
2. Identify filler words: "um", "uh", "like", "you know"
3. Detect silence segments with Silero VAD
4. Generate FFmpeg filter for segment removal
5. Re-encode video without filler segments

**Packages:**
- `react-native-executorch` (Whisper)
- `ffmpeg-kit-react-native` (cutting)
- Custom JS logic for filler detection

**Complexity:** Medium - requires timestamp synchronization

---

### **5. Background Music Mixing**

**Approach:** FFmpeg audio mixing

**Features:**
- Volume normalization
- Fade in/out
- Ducking (lower music during speech)
- Loop short tracks

**FFmpeg Command Example:**
```bash
ffmpeg -i video.mp4 -i music.mp3 -filter_complex \
  "[1:a]volume=0.3,afade=t=in:st=0:d=2,afade=t=out:st=118:d=2[music]; \
   [0:a][music]amix=inputs=2:duration=first:dropout_transition=2" \
  output.mp4
```

**Music Library:**
- Bundle 10-15 royalty-free tracks (5-10MB)
- Epidemic Sound API integration (future)

---

## Architecture Overview

### **Processing Pipeline**

```
┌─────────────┐
│   Record    │
│   Video     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Save Raw Video to FileSystem       │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  User Selects Features:             │
│  ☑ Subtitles                        │
│  ☐ Background Removal               │
│  ☑ Filler Removal                   │
│  ☑ Background Music                 │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  On-Device Processing Queue         │
│  (Show Progress UI)                 │
└──────┬──────────────────────────────┘
       │
       ├─────► Step 1: Transcription
       │       ├─ Load Whisper model
       │       ├─ Extract audio
       │       ├─ Run inference
       │       └─ Get word timestamps
       │       ⏱ 30-60s
       │
       ├─────► Step 2: Background Removal (Optional)
       │       ├─ Load MediaPipe model
       │       ├─ Process frames
       │       ├─ Generate alpha matte
       │       └─ Composite with bg
       │       ⏱ 60-120s
       │
       ├─────► Step 3: Filler Detection
       │       ├─ Analyze transcript
       │       ├─ Find filler words
       │       ├─ Detect silence
       │       └─ Generate cut list
       │       ⏱ 5-10s
       │
       └─────► Step 4: Final Composition
               ├─ Burn subtitles
               ├─ Cut filler segments
               ├─ Mix background music
               ├─ Add intro/outro
               └─ Export final video
               ⏱ 30-60s

       Total: 2-4 minutes
```

### **File System Structure**

```
FileSystem.documentDirectory/
├── models/
│   ├── whisper-tiny-en.bin (40MB)
│   ├── mediapipe-selfie-seg.tflite (5MB)
│   └── silero-vad.onnx (2MB)
├── assets/
│   ├── music/
│   │   ├── upbeat-1.mp3
│   │   ├── chill-2.mp3
│   │   └── energetic-3.mp3
│   └── intros/
│       ├── default.mp4
│       └── branded.mp4
├── videos/
│   ├── raw/
│   │   └── {projectId}_{timestamp}.mp4
│   ├── processed/
│   │   └── {videoId}_final.mp4
│   └── temp/
│       ├── audio_extracted.wav
│       ├── transcript.json
│       └── segmented_*.mp4
└── cache/
    └── model_cache/
```

---

## Implementation Phases

### **Phase 1: EAS Setup & FFmpeg Integration (Week 1-2)**

**Goals:**
- Migrate from Expo Go to EAS Development Build
- Integrate FFmpegKit
- Implement basic video editing (intro/outro, music)

**Tasks:**
1. Install EAS CLI and configure
   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   ```

2. Add FFmpegKit config plugin
   ```bash
   npx expo install ffmpeg-kit-react-native
   npx expo install @config-plugins/ffmpeg-kit-react-native
   ```

3. Update `app.json`:
   ```json
   {
     "expo": {
       "plugins": [
         [
           "@config-plugins/ffmpeg-kit-react-native",
           {
             "package": "video"
           }
         ]
       ]
     }
   }
   ```

4. Create native project:
   ```bash
   npx expo prebuild
   ```

5. Build development version:
   ```bash
   eas build --profile development --platform ios
   eas build --profile development --platform android
   ```

6. Implement FFmpeg service:
   - `src/services/ffmpeg/VideoEditor.ts`
   - `src/services/ffmpeg/AudioMixer.ts`
   - `src/services/ffmpeg/IntroOutroComposer.ts`

**Deliverables:**
- ✅ EAS Build working on device
- ✅ Basic FFmpeg operations functional
- ✅ Intro/outro concatenation
- ✅ Background music mixing

---

### **Phase 2: On-Device Transcription (Week 3-4)**

**Goals:**
- Integrate React Native ExecuTorch
- Implement Whisper model loading
- Generate subtitles with timestamps
- Burn subtitles into video

**Tasks:**
1. Install ExecuTorch:
   ```bash
   npm install react-native-executorch
   npx pod-install
   ```

2. Download/convert Whisper model:
   - Use official ExecuTorch export tools
   - Compress with quantization
   - Bundle in app or download on first run

3. Implement transcription service:
   - `src/services/ai/WhisperTranscriber.ts`
   - `src/services/ai/SubtitleGenerator.ts`
   - `src/services/ai/SubtitleBurner.ts` (FFmpeg)

4. Create subtitle styles:
   - Font selection (bundle fonts)
   - Position, size, color customization
   - Shadow, outline effects

5. Progress UI:
   - "Transcribing audio... 45%"
   - "Generating subtitles..."
   - "Burning subtitles to video..."

**Deliverables:**
- ✅ Whisper model loads and runs
- ✅ Accurate transcription with timestamps
- ✅ Subtitle burn-in with styling
- ✅ Real-time progress feedback

---

### **Phase 3: Filler Word Removal (Week 5)**

**Goals:**
- Detect filler words from transcript
- Identify optimal cut points
- Remove segments from video

**Tasks:**
1. Filler detection algorithm:
   - Pattern matching ("um", "uh", "like", "so")
   - Configurable filler word list
   - Minimum segment length (avoid micro-cuts)

2. Silence detection:
   - FFmpeg silencedetect filter
   - Combine with filler word timing

3. Video cutting:
   - Generate FFmpeg filter_complex
   - Maintain A/V sync
   - Smooth transitions

4. User controls:
   - Enable/disable filler removal
   - Sensitivity slider
   - Preview cut points

**Deliverables:**
- ✅ Automatic filler detection
- ✅ Smart segment removal
- ✅ Configurable settings

---

### **Phase 4: Background Removal (Week 6-7)**

**Goals:**
- Integrate MediaPipe or TFLite
- Segment video frames
- Composite with background

**Tasks:**
1. Model integration:
   - Choose MediaPipe vs TFLite
   - Implement native bridge if needed
   - Optimize for batch processing

2. Frame processing:
   - Extract frames from video
   - Run segmentation model
   - Generate alpha matte

3. Background compositing:
   - Blur background
   - Replace with solid color
   - Replace with custom image/video

4. Performance optimization:
   - Frame skipping for speed
   - Resolution scaling
   - GPU acceleration

**Deliverables:**
- ✅ Background removal working
- ✅ Multiple background options
- ✅ Acceptable performance (1-2min processing)

**Note:** This is the most complex feature and may be deferred to Phase 5 if timeline is tight.

---

### **Phase 5: UI/UX & Optimization (Week 8)**

**Goals:**
- Polished processing UI
- Background processing
- Battery optimization
- Error handling

**Tasks:**
1. Processing screen redesign:
   - Animated progress indicators
   - Step-by-step breakdown
   - Estimated time remaining
   - Cancellation support

2. Background processing:
   - Continue processing when app minimized
   - Background notifications
   - Handle interruptions (calls, etc.)

3. Performance tuning:
   - Model caching
   - Memory management
   - Thermal throttling awareness
   - Battery state checking

4. Error recovery:
   - Graceful degradation
   - Retry logic
   - Partial processing save
   - Debug logs

**Deliverables:**
- ✅ Production-ready UI
- ✅ Robust error handling
- ✅ Optimized battery usage
- ✅ Background processing

---

## Technical Challenges & Solutions

### **Challenge 1: App Size**
**Problem:** Models add 150-300MB
**Solutions:**
- Use on-demand model download
- Implement model compression (quantization)
- Offer "Lite" version without AI features
- Use App Thinning for unused assets

### **Challenge 2: Processing Speed**
**Problem:** On-device processing is slower than cloud
**Solutions:**
- Show accurate time estimates
- Allow background processing
- Implement progressive rendering
- Use lower resolution for preview

### **Challenge 3: Memory Management**
**Problem:** Large models + video = OOM crashes
**Solutions:**
- Unload models when not in use
- Process videos in chunks
- Monitor memory pressure
- Use memory-mapped files

### **Challenge 4: Battery Drain**
**Problem:** Heavy AI workload drains battery
**Solutions:**
- Warn user about battery impact
- Suggest plugging in for long videos
- Throttle processing on low battery
- Use efficient model variants

### **Challenge 5: Device Compatibility**
**Problem:** Older devices may struggle
**Solutions:**
- Set minimum SDK/iOS version
- Detect device capabilities
- Offer "Cloud Processing" fallback
- Graceful degradation

---

## Resource Requirements

### **Development Hardware**
- ✅ MacBook (for iOS builds)
- ✅ iPhone (iOS 14+) for testing
- ✅ Android device (API 24+) for testing
- Optional: Apple Developer Account ($99/year)
- Optional: Google Play Developer ($25 one-time)

### **Development Tools**
- Xcode 14+
- Android Studio
- EAS CLI
- Model conversion tools (Python, PyTorch)

### **App Size Budget**
| Component | Size |
|-----------|------|
| Base App | 50MB |
| FFmpegKit (video) | 50MB |
| Whisper Tiny | 40MB |
| MediaPipe | 5MB |
| Music Library | 10MB |
| Intro/Outro Templates | 5MB |
| **Total** | **160MB** |

**After App Thinning:** ~120MB per platform

---

## Migration Path from Current Setup

### **Code Changes Required**

1. **app.json** → **app.config.js** (for dynamic config)
2. Add native modules (FFmpegKit, ExecuTorch)
3. Update video processing service
4. Add model management service
5. Enhanced progress UI
6. Update AsyncStorage schema for processing jobs

### **Backward Compatibility**

```javascript
// Feature detection
const canProcessLocally = await checkNativeFeatures();

if (canProcessLocally) {
  // On-device processing
  await processVideoLocally(videoUri, features);
} else {
  // Fallback to cloud or raw video
  await skipProcessing(videoUri);
}
```

### **Testing Strategy**

1. **Unit Tests:** FFmpeg commands, model loading
2. **Integration Tests:** End-to-end processing pipeline
3. **Device Tests:** iPhone 12, Pixel 5, older devices
4. **Performance Tests:** Battery, memory, thermal
5. **User Tests:** Beta via TestFlight/Internal Testing

---

## Cost Analysis

### **One-Time Costs**
- EAS Build credits: Free tier available (30 builds/month)
- Apple Developer: $99/year
- Model download bandwidth: Free (hosted in app)

### **Ongoing Costs**
- Zero recurring costs (fully on-device)
- No API fees
- No server hosting

### **Development Time**
- 6-8 weeks @ $75/hour = $18,000-$24,000
- OR: 6-8 weeks of focused development time

---

## Success Metrics

### **Technical KPIs**
- ✅ Transcription accuracy: >90%
- ✅ Processing time: <3min for 2min video
- ✅ Crash rate: <1%
- ✅ Battery drain: <20% for full processing
- ✅ App size: <200MB

### **User Experience KPIs**
- ✅ Processing completion rate: >95%
- ✅ Feature usage: >60% enable subtitles
- ✅ User satisfaction: 4+ stars

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| FFmpegKit compatibility issues | Medium | High | Test early, have cloud fallback |
| Model accuracy insufficient | Low | Medium | Use proven Whisper model |
| Performance too slow | Medium | High | Optimize, offer cloud option |
| App size rejection | Low | Medium | Implement on-demand download |
| Battery drain complaints | Medium | Medium | Clear warnings, background processing |
| Device incompatibility | Medium | High | Set minimum requirements clearly |

---

## Decision: Go/No-Go Criteria

### **GO if:**
- ✅ Privacy is critical selling point
- ✅ Offline functionality is must-have
- ✅ Budget allows 6-8 weeks development
- ✅ Target audience has modern devices (2020+)
- ✅ Willing to maintain native code

### **NO-GO if:**
- ❌ Need faster time to market (<4 weeks)
- ❌ Cloud processing is acceptable to users
- ❌ Limited development resources
- ❌ App size is critical concern (<50MB)
- ❌ Supporting older devices is required

---

## Alternative: Hybrid Approach

**Best of Both Worlds:**

```
User Choice in Settings:
┌─────────────────────────────┐
│ Video Processing Mode       │
├─────────────────────────────┤
│ ○ Cloud (Fast, requires     │
│   internet) - Free for 10   │
│   videos/month              │
│                             │
│ ● Device (Private, slower,  │
│   works offline) - Unlimited│
└─────────────────────────────┘
```

**Benefits:**
- Fast processing for most users
- Privacy option for those who need it
- Monetization opportunity (cloud credits)
- Fallback if on-device fails

---

## Recommended Next Steps

1. **Week 1:** Prototype FFmpegKit integration (basic video editing)
2. **Week 2:** Test Whisper.rn OR ExecuTorch with small model
3. **Week 3:** Benchmark performance on target devices
4. **Week 4:** Decision point - continue or pivot to cloud

**After 4 weeks, you'll have:**
- Real performance data
- Accurate timeline estimate
- Proof of concept
- User feedback on processing time

---

## Conclusion

On-device AI video processing is **technically feasible** with 2025 technology stack (React Native ExecuTorch, FFmpegKit, MediaPipe). However, it requires:

- ⚠️ **6-8 weeks development time**
- ⚠️ **~200MB app size**
- ⚠️ **2-4min processing time**
- ⚠️ **EAS Build (no Expo Go)**
- ⚠️ **Modern devices (2020+)**

**Recommendation:** Start with **4-week proof of concept** to validate performance, then decide between:
- **Full on-device** (privacy-first)
- **Hybrid approach** (best UX)
- **Cloud-only** (fastest to market)

The technology is ready. The question is: **What's your priority - Privacy, Performance, or Time to Market?**

---

*Document Version: 1.0*
*Last Updated: 2025-01-09*
*Research Sources: GitHub, npm, Expo Blog, Software Mansion Docs*
