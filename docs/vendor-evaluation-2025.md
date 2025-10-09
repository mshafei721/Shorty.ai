# External API Vendor Evaluation for Short-Form Video Platform
## Executive Summary

This evaluation assesses third-party API vendors for a mobile-first short-form video creation platform (Expo Go/React Native) that offloads heavy processing to external APIs. **Last updated: October 2025** with current pricing, features, and vendor capabilities.

**Primary Recommendations:**

- **AI Script Generation:** OpenAI GPT-4o (Primary) | Anthropic Claude Sonnet 4.5 (Fallback)
- **Transcription & Subtitles:** AssemblyAI (Primary) | Deepgram Nova-3 (Fallback)
- **Video Editing/Composition:** Shotstack (Primary) | Cloudinary Video API (Fallback)
- **Background Removal:** Cutout.Pro API (Primary) | Unscreen API (Fallback)
- **Music Generation:** Mubert API (Primary) | Soundraw API (Fallback)
- **Video Encoding:** Mux Video (Infrastructure) | Coconut (Cost-optimized fallback)
- **Content Moderation:** Moderation API (Primary) | Azure Content Moderator (Fallback)

---

## 1. Evaluation Criteria & Weights

| Criterion | Weight (%) | Definition | Measurement Method |
|-----------|-----------|------------|-------------------|
| **Capability Fit** | 25 | Feature completeness for required processing (transcription, filler-word removal, segmentation, music, intro/outro, composition) | Gap analysis vs. requirements; feature matrix scoring |
| **Latency/Performance** | 20 | Processing speed for 30-120s clips; p50/p95 latency; max file size/duration | Benchmark data from docs; user reports; trial tests |
| **Reliability/SLA** | 15 | Uptime guarantees (%), incident response, failover options | Published SLA terms; status page history |
| **Legal/Compliance** | 12 | GDPR/CCPA/SOC2/ISO27001; DPA availability; data residency; no-training clauses | Terms of Service; compliance pages; DPA templates |
| **Cost & Pricing** | 10 | Per-minute/per-clip pricing; overage policy; free tier; predictable scaling | Pricing pages; calculator tools; contract examples |
| **Developer Experience** | 8 | API maturity (REST/GraphQL); SDKs; webhooks; docs quality; error handling | Documentation review; API reference completeness |
| **Data Policy** | 5 | Retention periods; deletion SLAs; training opt-out; encryption standards | Privacy policy; data processing addendum |
| **Roadmap/Support** | 3 | Support SLA (response times); changelog transparency; feature roadmap | Support tiers; changelog frequency; roadmap visibility |
| **Business Risk** | 2 | Vendor stability; lock-in risk; migration path; pricing change notice | Company funding; API versioning; export options |
| **TOTAL** | **100** | | |

---

## 2. Comprehensive Vendor Matrix

### 2.0 AI Script Generation

| Vendor | API Maturity | Key Features | Limits | Latency | Pricing (Input/Output per 1M tokens) | Rate Limits | Data Policy | Compliance | Regions | Sources |
|--------|-------------|--------------|--------|---------|--------------------------------------|-------------|-------------|-----------|---------|---------|
| **OpenAI GPT-4o** | REST; SDKs (Python/Node/etc); Streaming | 128k context, multimodal (text/image/audio/video), function calling, JSON mode, seed for deterministic outputs | Token limits per model; Enterprise min 150 users | Sub-second for short prompts | **$3 / $10** per 1M tokens; Enterprise ~$60/user/mo (150+ users) | Tier-based: 500-30k RPM, 30k-180M TPM; Auto-scales with payment history | 30-day deletion; No training on API/Enterprise data | SOC2 Type II; GDPR DPA available; Enterprise features | US, EU (via Azure) | [Pricing](https://openai.com/api/pricing/), [Enterprise](https://openai.com/enterprise-privacy/), [Limits](https://platform.openai.com/docs/guides/rate-limits) (Jan 2025) |
| **Anthropic Claude 3.7 Sonnet** | REST; SDKs (Python/TS); Streaming | 200k context window, vision, tool use, thinking tokens, citation quality | Context window 200k tokens | Sub-second for short prompts | **$3 / $15** per 1M tokens (+ $10/M thinking tokens) | 5 RPM, 20k ITPM, API; Pro $20/mo: 40-80h/wk Sonnet 4 | Encryption at rest/transit; DPA available; No training on customer data | **SOC2 Type II, ISO 27001**; GDPR/NZ Privacy Act DPA | US, EU options | [Pricing](https://www.anthropic.com/pricing), [Compliance](https://www.finout.io/blog/anthropic-api-pricing), [Limits](https://docs.cohere.com/docs/rate-limits) (Jan 2025) |
| **Cohere Command R7B** | REST; SDKs; Streaming | RAG-optimized, multilingual (10+ languages), tool use, citation mode | Trial: 5k gen units/mo, 100 calls/min; Prod: 10k calls/min | Not specified | **$0.0375 / $0.15** per 1M tokens (R7B); Command R: $0.15 / $0.60 | Trial: 5k/mo, 100 calls/min; Prod: 10k calls/min | Logical segmentation; Private deployment: data not shared | Not detailed; Supports enterprise compliance needs | Multiple deployment options | [Pricing](https://cohere.com/pricing), [Limits](https://docs.cohere.com/docs/rate-limits), [FAQ](https://docs.cohere.com/v2/docs/cohere-faqs) (Jan 2025) |
| **AI21 Jamba 1.5 Mini** | REST; SDK; Via Vertex AI | 256k context, multi-language, zero-shot instruction following, task-specific APIs | Context 256k tokens | Reduced latency (vs. Jurassic-2) | Usage-based; Via platform or Vertex AI (see pricing page) | Not specified | US or EU data residency (request region) | Built-in regulatory compliance; Responsible use guidelines | US, EU (regional APIs) | [Pricing](https://www.ai21.com/pricing/), [Vertex](https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/ai21), [Docs](https://docs.ai21.com/docs/jurassic-2-models) (Jan 2025) |
| **Hugging Face Inference API** | REST; Python SDK | Access 350k+ models, serverless or dedicated endpoints, custom models | Free tier: few hundred req/hr; PRO: 20× credits | Varies by model; Dedicated endpoints faster | **Compute time × hardware cost** (e.g., $0.00012/sec GPU); PRO $9/mo: 20× credits | Free: ~few hundred/hr; PRO: higher limits | Provider costs passed through; No HF markup | Varies by model/provider | Global | [Pricing](https://huggingface.co/pricing), [Inference](https://huggingface.co/docs/api-inference/pricing), [Limits](https://huggingface.co/docs/api-inference/en/rate-limits) (Jan 2025) |

**Notes:**

- **GPT-4o** leads in multimodal capabilities (text/image/audio/video); suitable for generating scripts + visual storyboards.
- **Claude 3.7 Sonnet** offers best compliance (SOC2 Type II, ISO 27001), 200k context ideal for long research inputs, natural writing style.
- **Cohere Command R** optimized for RAG (retrieval-augmented generation); useful if script generation uses external knowledge base.
- **Pricing Comparison (250-word script ≈ 330 tokens in, 330 tokens out):**
  - GPT-4o: $0.0043 per script
  - Claude 3.7: $0.0059 per script
  - Cohere R7B: $0.00007 per script (cheapest)
- **Content Moderation Required:** All LLM outputs should be passed through content moderation API (profanity, toxicity, harmful content).

### 2.0.1 Content Moderation APIs (for AI-Generated Scripts)

| Vendor | API Maturity | Key Features | Limits | Latency | Pricing | Compliance | Sources |
|--------|-------------|--------------|--------|---------|---------|-----------|---------|
| **Moderation API** | REST; Webhooks | Profanity, toxicity, PII detection, spam, hate speech; 200+ languages; AI-powered (understands intent) | Not specified | Real-time | Usage-based (see pricing page) | GDPR-compliant; Data encryption | [Content Moderation](https://moderationapi.com/content-moderation), [Text Moderation](https://www.edenai.co/post/best-text-moderation-apis) (Jan 2025) |
| **Azure Content Moderator** | REST; SDKs | Profanity filter 110+ languages, built-in term lists, toxicity detection, PII redaction | Standard tier quotas | Near real-time | Pay-as-you-go per text transaction | 50+ compliance certs; GDPR; DPA via Azure | [Text Moderation](https://learn.microsoft.com/en-us/azure/ai-services/content-moderator/text-moderation-api), [Azure AI](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/content-moderator/) (Jan 2025) |
| **Amazon Comprehend Toxicity** | REST; SDKs | Profanity, toxicity, hate, harassment detection; Optimized for LLM-generated content | AWS quotas | Real-time | Pay-per-use (see AWS pricing) | AWS compliance suite; SOC2, ISO 27001, GDPR | [Toxicity Detection](https://aws.amazon.com/blogs/machine-learning/flag-harmful-content-using-amazon-comprehend-toxicity-detection/) (Jan 2025) |
| **Sightengine Text Moderation** | REST; Webhooks | Profanity, hate speech, toxicity, bullying, PII; Smart filters (bypasses obfuscation); 200+ languages | Not specified | Real-time | Usage-based | GDPR-compliant | [Text Moderation](https://sightengine.com/text-moderation-api), [Profanity Detection](https://sightengine.com/docs/profanity-detection-hate-offensive-text-moderation) (Jan 2025) |

**Implementation Flow:**

1. User provides topic + optional description
2. Call LLM API (GPT-4o/Claude) to generate 20-500 word script
3. Pass output through Content Moderation API
4. If flagged: reject + show error to user; if clean: save to AsyncStorage + proceed to recording

### 2.1 Transcription & Subtitle Generation

| Vendor | API Maturity | Key Features | Limits | Latency | Pricing | SLA | Support | Data Policy | Compliance | Regions | Sources |
|--------|-------------|--------------|--------|---------|---------|-----|---------|------------|-----------|---------|---------|
| **AssemblyAI** | REST; SDKs (Node/Python); Webhooks | Word-level timestamps, diarization, profanity filter, custom vocab, SRT/VTT export, 99+ languages | No explicit duration/size limits | Real-time: ~300ms streaming | $0.00025/sec (~$0.015/min) pre-recorded; Volume discounts available | **99.9% uptime** | P1/P2/P3 response tiers | Encryption at rest/transit; Data retention configurable; No training by default | SOC2 Type II, GDPR, DPA available | US, EU (Dublin) | [Pricing](https://www.assemblyai.com/pricing), [SLA](https://www.assemblyai.com/docs/faq/what-is-your-api-uptime-sla), [DPA](https://www.assemblyai.com/legal/data-processing-addendum) (Jan 2025) |
| **Deepgram Nova-3** | REST; SDKs; Webhooks | 50+ languages, streaming, custom vocab, keyword boosting, sentiment | 100 concurrent (PAYG); 5 for Whisper Cloud | Sub-300ms latency; Nova-3: 54.3% WER reduction | $0.0043/min pre-recorded; $0.0077/min streaming | Not explicitly stated; Status page available | Growth: $4k/yr (20% discount); Enterprise: $15k/yr | Webhook callbacks; No explicit retention stated | Not detailed in search | US, EU options available | [Pricing](https://deepgram.com/learn/speech-to-text-api-pricing-breakdown-2025), [Latency](https://deepgram.com/learn/best-speech-to-text-apis), [Limits](https://developers.deepgram.com/reference/api-rate-limits) (Jan 2025) |
| **Rev.ai** | REST; SDKs; Webhooks | Language detection, sentiment (EN only), affordable pricing, branch of Rev | No explicit limits documented | Not specified | Lower than AssemblyAI (exact pricing not in search) | Not specified | Standard support included | Encryption at rest/transit; Deletion on request (legal@rev.com) | SOC2 Type II, HIPAA, GDPR, PCI; DPA available | Not specified | [Security](https://www.rev.ai/security), [DPA](https://www.rev.com/legal/data-processing-addendum), [Webhooks](https://docs.rev.ai/resources/tutorials/get-started-api-webhooks/) (Jan 2025) |
| **Azure Speech-to-Text** | REST; SDKs (multi-lang); Realtime | 120+ languages, custom models, real-time + batch | Standard tier quotas apply | 1-3sec streaming; 100ms frames recommended | Pay-as-you-go per audio hour; Billed per second | **99.9% uptime** (Standard tier) | Azure support tiers | V2: Audit logging, CMEK; Real-time: no data at rest | 50+ compliance certs; GDPR; DPA via Azure | Global + 50 region-specific | [Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/), [SLA](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-services-quotas-and-limits), [Privacy](https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/speech-service/speech-to-text/data-privacy-security) (Jan 2025) |
| **Google Speech-to-Text** | REST v1/v2; gRPC; Streaming | 120+ languages, Chirp model, video model, telephony model | V2: Single/multi-region residency, audit logs, CMEK | 1-3sec streaming; 100ms frames optimal | V1: Multi-region only; V2: Higher, region options; $300 free + 60min/mo free | Not explicitly stated | Google Cloud support | V1: No audit logs; V2: Audit + CMEK | Google Cloud compliance suite | Multi-region, single-region (V2) | [Pricing](https://cloud.google.com/speech-to-text/pricing), [Latency](https://cloud.google.com/speech-to-text/docs/best-practices-provide-speech-data) (Jan 2025) |
| **OpenAI Whisper API** | REST; File-based only | 99+ languages, high accuracy, simple API | **25MB file max**; No streaming | No streaming; batch only | **$0.006/min** | Not specified | OpenAI support | No explicit retention policy stated | Not detailed | Not specified | [Pricing](https://openai.com/api/pricing/), [Limits](https://www.transcribetube.com/blog/openai-whisper-api-limits) (Jan 2025) |

**Notes:**
- WER comparisons (2025): Whisper leads, Deepgram/AssemblyAI within 2% WER; AssemblyAI Universal-2 most consistent across scenarios
- Big Tech (Azure/Google): 10-18% WER; Specialists (Deepgram/AssemblyAI): 1-10% WER
- AssemblyAI offers fastest transcription among specialists per independent reviews

### 2.2 Automated Video Editing & Composition

| Vendor | API Maturity | Key Features | Limits | Latency | Pricing | SLA | Support | Data Policy | Compliance | Sources |
|--------|-------------|--------------|--------|---------|---------|-----|---------|------------|-----------|---------|
| **Shotstack** | REST; JSON timeline; Webhooks | Merge/stitch, intro/outro, overlays, subtitles burn-in, re-encode, trim/cut | Per-plan quotas | Ingest API reduces latency for large files/cross-region | $49/mo base; $0-$309 tiers; Per-minute billing | **SLA included**; Tiered by plan | Plan-based support levels | 30-day storage default | Terms include SLA provisions | [Pricing](https://shotstack.io/pricing/), [API](https://shotstack.io/docs/api/), [Ingest](https://shotstack.io/product/ingest-api/) (Jan 2025) |
| **Cloudinary Video API** | REST; URL transformations; Webhooks | Adaptive streaming (HLS/DASH), H.264/HEVC/VP9 auto-encode, trim, overlay, effects | Free: 25 credits, 100MB; Plus: 225 credits, 2GB; Advanced: 600 credits, 4GB | Low-latency global CDN | 1 credit = 1000 transformations OR 500 SD-sec OR 250 HD-sec; $89/mo (Plus), $224/mo (Advanced) | Enterprise: SOC2, TLS 1.2 | Plan-based; Webhook support | Encryption at rest/transit; Audit logs (enterprise) | SOC2 (enterprise); Industry compliance add-ons | [Pricing](https://cloudinary.com/pricing), [Transformations](https://cloudinary.com/documentation/video_manipulation_and_delivery), [Webhooks](https://cloudinary.com/guides/video/top-video-api) (Jan 2025) |
| **Creatomate** | REST; JSON templates; Webhooks | Template-based generation, trim, merge, effects, automated | Rate limit: 30 req/10sec; 100sec render max (Direct API) | 20% monthly quota/24h (e.g., 40k credits/day for 200k/mo plan) | $41 (144min@720p, $0.28/min); $99 (723min, $0.14/min); down to $0.06/min | Not specified | Webhook + queue recommended | Not specified | Not specified | [Pricing](https://creatomate.com/pricing), [Limits](https://creatomate.com/docs/api/reference/limits-and-concurrency), [API](https://creatomate.com/docs/api/introduction) (Jan 2025) |
| **Mux Video** | REST; Webhooks; Player SDK | Advanced encoding, adaptive streaming, fast publishing, data-driven optimization | Not specified | "Fastest video publishing in multiverse" claim | Not specified in search | Not specified | Founders of Zencoder | Not specified | Not specified | [Encoding](https://www.mux.com/encoding), [Blog](https://www.mux.com/blog/cloud-encoding-apis-are-dying) (Jan 2025) |
| **Descript (NO PUBLIC API)** | **Partner-only API** | Filler-word removal (Underlord AI), text-based editing, transcription | 3-hour import link expiry | Not specified | Consumer: $12-$24/mo/user; Enterprise available | Not specified | Enterprise support | Not specified | Not specified | [API Docs](https://docs.descriptapi.com/), [Feature Request](https://feedback.descript.com/feature-requests/p/descript-api-access-request-for-academic-project) (Jan 2025) |

**Critical Gap:** No public API for filler-word removal found. **Workaround required:**
1. Use transcription API (AssemblyAI/Deepgram) to get word-level timestamps with confidence scores
2. Implement filler-word detection logic (um, uh, like, you know) in backend
3. Generate cut list (time ranges to remove)
4. Use video editing API (Shotstack/Cloudinary) to apply cuts and re-encode

### 2.3 Background Removal/Segmentation

| Vendor | API Maturity | Key Features | Limits | Latency | Pricing | SLA | Support | Data Policy | Compliance | Sources |
|--------|-------------|--------------|--------|---------|---------|-----|---------|------------|-----------|---------|
| **Cutout.Pro** | REST (async mode) | Person + pet segmentation, hair-level detail, 4K support (MP4/WMV/MOV/GIF) | 1000 images batch | Not specified | Image/API: $2.99 PAYG, $5/mo subs; Video: $19/min; 5 free credits (no watermark) | ~25k businesses; High uptime claimed | Credits rollover 5× monthly budget | **Auto-delete 24h**; End-to-end encryption | **GDPR, SOC2 Type II** | [API](https://www.cutout.pro/api), [Video Pricing](https://www.cutout.pro/video-pricing), [Compliance](https://www.cutout.pro/home) (Jan 2025) |
| **Unscreen API** | REST (async) | Pro: No length limit, Full HD (1080p), 30-day storage | Rate: 90 req/min, 10 videos/min, 10 fails/hour; 2GB file max | Not specified | API requires active subscription; Billing per-second; >30fps charged at multiples | Not specified | Pro subscription required | **30-day storage**; Certain formats limited to 20sec | Owned by Canva | [API](https://www.unscreen.com/api), [Pricing](https://www.unscreen.com/pricing), [FAQ](https://www.unscreen.com/faq) (Jan 2025) |
| **Runway (DEPRECATED)** | Legacy tool no longer updated | Background removal | Not recommended | Not recommended | Not recommended | N/A | N/A | N/A | N/A | [Help](https://help.runwayml.com/hc/en-us/articles/19112532638995-Remove-Background) (Jan 2025) |

**Note:** Vertical 9:16 segmentation quality requires POC testing for hair/edge handling and motion stability.

### 2.4 Background Music

| Vendor | API Maturity | Key Features | Limits | Latency | Pricing | Licensing | Sources |
|--------|-------------|--------------|--------|---------|---------|-----------|---------|
| **Mubert API** | REST; Real-time generation | AI music engine, adaptive/personalized, game music, real-time | API access required | Real-time generation | Free: 25 tracks/mo (attribution); Paid tiers for capacity; **API: $500/mo** | Royalty-free; Usage rights per tier | [API](https://mubert.com/), [Pricing](https://mubert.com/), [Top APIs](https://vozart.ai/blog/top-apis-for-music-generation) (Jan 2025) |
| **Soundraw API** | REST (limited info) | Ethical AI (in-house producers, no external training), simple licensing | API access required | Not specified | Individual: ~$11/mo; **API: $500/mo** | Royalty-free, monetization allowed, straightforward terms | [Licensing](https://soundraw.io/blog/post/best-ai-music-apps-for-musicians-in-2025), [Top APIs](https://www.beatoven.ai/blog/best-apis-for-music-generation/) (Jan 2025) |
| **AIVA (NO API)** | **No public API** | 250+ styles, three-tier licensing (Free w/ attribution, Standard, Pro w/ copyright) | Not applicable | N/A | Free (attribution); Standard; Pro (full copyright) | Varies by tier | [AIVA](https://www.aiva.ai/), [Review](https://www.digitalocean.com/resources/articles/ai-music-generators) (Jan 2025) |
| **Epidemic Sound (NO API)** | **No public API** | 40k tracks, 90k SFX, subscription model | Not applicable | N/A | $9.99/mo (annual); $17.99 (monthly) | Royalty-free via subscription | [Epidemic](https://www.epidemicsound.com/), [Comparison](https://www.soundstripe.com/blogs/soundstripe-vs-epidemic-sound) (Jan 2025) |
| **Artlist (NO API)** | **No public API** | Music, SFX, stock footage, plugins, software | Not applicable | N/A | $9.99/mo (annual); $14.99 (monthly) | Royalty-free via subscription | [Artlist Comparison](https://photutorial.com/artlist-vs-epidemic-sound/) (Jan 2025) |

**Critical Gap:** Most music libraries (Epidemic Sound, Artlist, Soundstripe) lack developer APIs.
**Available API Options:** Mubert API ($500/mo) and Soundraw API ($500/mo) for AI-generated music with commercial licensing.

### 2.5 Video Encoding & Infrastructure

| Vendor | API Maturity | Key Features | Limits | Latency | Pricing | Compliance | Sources |
|--------|-------------|--------------|--------|---------|---------|-----------|---------|
| **Mux Video** | REST; Webhooks; SDKs | Advanced encoding, ABR (HLS/DASH), data-driven optimization, fast publishing | Not specified | Industry-leading (claim) | Not specified | Not specified | [Mux](https://www.mux.com/encoding) (Jan 2025) |
| **Coconut** | REST (FFmpeg-based) | Developer-friendly, cost-effective, wide codec support, Docker/K8s ready | Not specified | Optimized for workflow speed | Cost-effective (exact pricing not in search) | Not specified | [Coconut](https://www.coconut.co/) (Jan 2025) |
| **Zencoder (Brightcove)** | REST | File-based transcoding, ABR (HLS/DASH), multi-device playback | Not specified | Not specified | Not specified | Not specified | [Zencoder](https://skywork.ai/blog/zencoder-video-encoding-explained/) (Jan 2025) |

---

## 3. Vendor Scoring & Shortlist

### 3.0 AI Script Generation

| Vendor | Capability Fit (25%) | Latency (20%) | Reliability (15%) | Legal (12%) | Cost (10%) | DX (8%) | Data (5%) | Roadmap (3%) | Risk (2%) | **Total** |
|--------|---------------------|---------------|-------------------|-------------|------------|---------|-----------|--------------|-----------|-----------|
| **OpenAI GPT-4o** | **25** (multimodal, JSON mode, tools) | **20** (sub-second) | 13 | **12** (SOC2, GDPR DPA, Enterprise) | 8 ($3/$10 per 1M tokens) | **8** (mature SDKs, streaming) | **5** (30-day deletion, no training) | 3 | 2 | **96/100** |
| **Anthropic Claude 3.7** | 24 (200k context, natural writing) | **20** (sub-second) | 13 | **12** (SOC2 Type II, ISO 27001, DPA) | 7 ($3/$15 per 1M tokens) | 7 | **5** (no training, DPA) | 3 | 2 | **93/100** |
| **Cohere Command R7B** | 22 (RAG-optimized, multilingual) | 18 | 12 | 9 | **10** ($0.0375/$0.15 cheapest) | 7 | 4 | 2 | 2 | **86/100** |
| **AI21 Jamba 1.5** | 23 (256k context, task APIs) | 17 | 12 | 10 (regulatory compliance, US/EU) | 7 | 6 | 4 | 2 | 2 | **83/100** |
| **Hugging Face Inference** | 20 (350k+ models, varies) | 15 (varies by model) | 11 | 8 | 9 (PRO $9/mo) | 6 | 3 | 3 | 2 | **77/100** |

**Rationale:**

- **Primary: OpenAI GPT-4o** — Best multimodal capabilities (future storyboard generation), mature SDKs, JSON mode for structured outputs, strong compliance (SOC2, GDPR DPA), 30-day deletion, no training on API data, streaming support.
- **Fallback: Anthropic Claude 3.7 Sonnet** — Highest compliance (SOC2 Type II + ISO 27001), 200k context ideal for long research inputs, natural human-like writing style preferred by content creators, no training guarantee.
- **Cost per Script (250 words ≈ 330 tokens in/out):**
  - GPT-4o: $0.0043
  - Claude 3.7: $0.0059
  - Cohere R7B: $0.00007 (96% cheaper, but less capable)
- **Risk:** Content moderation required for all AI outputs (profanity, toxicity, harmful content). Budget $0.001-$0.01 per moderation check.

### 3.0.1 Content Moderation

| Vendor | Capability Fit (25%) | Latency (20%) | Reliability (15%) | Legal (12%) | Cost (10%) | DX (8%) | Data (5%) | Roadmap (3%) | Risk (2%) | **Total** |
|--------|---------------------|---------------|-------------------|-------------|------------|---------|-----------|--------------|-----------|-----------|
| **Moderation API** | **25** (profanity, toxicity, PII, 200+ langs, intent-aware) | **20** (real-time) | 13 | **12** (GDPR, encryption) | 8 | 7 | 4 | 2 | 2 | **93/100** |
| **Azure Content Moderator** | 24 (110+ langs, PII redaction, built-in lists) | **20** (near real-time) | **15** (Azure SLA) | **12** (50+ certs, GDPR, DPA) | 7 | **8** (mature SDKs) | 5 | 3 | 2 | **96/100** |
| **Amazon Comprehend** | 23 (LLM-optimized, profanity, toxicity) | 19 | **15** (AWS SLA) | **12** (SOC2, ISO 27001, GDPR) | 7 | 7 | 4 | 3 | 2 | **92/100** |
| **Sightengine** | 24 (smart filters, obfuscation detection, 200+ langs) | **20** (real-time) | 12 | **12** (GDPR) | 7 | 6 | 4 | 2 | 2 | **89/100** |

**Rationale:**

- **Primary: Moderation API** — Highest capability fit (intent-aware, bypasses obfuscation), 200+ languages, real-time, GDPR-compliant.
- **Fallback: Azure Content Moderator** — Enterprise-grade (50+ compliance certs, Azure SLA), mature SDKs, 110+ languages, PII redaction.
- **Integration:** Call after LLM generation, before saving to AsyncStorage. Reject flagged scripts with user-friendly error.

### 3.1 Transcription & Subtitles

| Vendor | Capability Fit (25%) | Latency (20%) | Reliability (15%) | Legal (12%) | Cost (10%) | DX (8%) | Data (5%) | Roadmap (3%) | Risk (2%) | **Total** |
|--------|---------------------|---------------|-------------------|-------------|------------|---------|-----------|--------------|-----------|-----------|
| **AssemblyAI** | 24 | 18 | **15** (99.9% SLA) | **12** (SOC2, GDPR, DPA, EU residency) | 9 | 8 | 5 | 3 | 2 | **96/100** |
| **Deepgram Nova-3** | 24 | **20** (sub-300ms) | 12 | 9 | 10 | 8 | 4 | 3 | 2 | **92/100** |
| **Azure Speech** | 23 | 16 | **15** (99.9% SLA) | **12** (50+ certs, GDPR, DPA) | 8 | 7 | 5 | 3 | 2 | **91/100** |
| **Rev.ai** | 22 | 14 | 13 | **12** (SOC2, HIPAA, GDPR, DPA) | **10** (affordable) | 7 | 5 | 2 | 2 | **87/100** |
| **Google STT** | 23 | 16 | 13 | 11 | 8 | 7 | 4 | 3 | 2 | **87/100** |
| **Whisper API** | 22 | 10 (batch only) | 11 | 7 | **10** ($0.006/min) | 8 | 3 | 2 | 2 | **75/100** |

**Rationale:**
- **Primary: AssemblyAI** — Highest reliability (99.9% SLA), comprehensive compliance (SOC2, GDPR, DPA with EU residency), word-level timestamps, SRT/VTT export, competitive pricing, no data training by default.
- **Fallback: Deepgram Nova-3** — Best latency (sub-300ms), 54.3% WER reduction claim, strong feature set, but lacks explicit SLA and retention policy.
- **Risk:** Whisper API's 25MB file limit eliminates it for 120s 1080p clips (~60-150MB).

### 3.2 Video Editing & Composition

| Vendor | Capability Fit (25%) | Latency (20%) | Reliability (15%) | Legal (12%) | Cost (10%) | DX (8%) | Data (5%) | Roadmap (3%) | Risk (2%) | **Total** |
|--------|---------------------|---------------|-------------------|-------------|------------|---------|-----------|--------------|-----------|-----------|
| **Shotstack** | **25** (full feature set) | 18 | **15** (SLA included) | 10 | 8 | **8** (JSON timeline, webhooks) | 4 | 3 | 2 | **93/100** |
| **Cloudinary Video** | 23 | **20** (global CDN) | 13 | **12** (SOC2, enterprise compliance) | 7 | 7 | **5** (encryption, audit logs) | 3 | 2 | **92/100** |
| **Creatomate** | 22 | 16 | 12 | 8 | **10** ($0.06/min at scale) | 7 | 3 | 2 | 2 | **82/100** |
| **Mux Video** | 21 | **20** (fastest claim) | 13 | 7 | 6 | 7 | 3 | 3 | 2 | **82/100** |

**Rationale:**
- **Primary: Shotstack** — Complete feature set (merge, trim, intro/outro, subtitle burn-in), JSON timeline API, webhooks, tiered SLA, $49/mo entry point.
- **Fallback: Cloudinary Video** — Enterprise-grade (SOC2, encryption, audit logs), global CDN for low latency, adaptive streaming, but higher cost (credits system).
- **Risk:** Filler-word removal requires custom implementation (transcription → cut list → apply via editing API).

### 3.3 Background Removal

| Vendor | Capability Fit (25%) | Latency (20%) | Reliability (15%) | Legal (12%) | Cost (10%) | DX (8%) | Data (5%) | Roadmap (3%) | Risk (2%) | **Total** |
|--------|---------------------|---------------|-------------------|-------------|------------|---------|-----------|--------------|-----------|-----------|
| **Cutout.Pro** | **25** (4K, hair-level, async) | 16 | 14 (25k businesses) | **12** (GDPR, SOC2 Type II) | 8 | 7 | **5** (24h auto-delete, encryption) | 2 | 2 | **91/100** |
| **Unscreen API** | 23 (Full HD, no length limit) | 16 | 13 | 9 (Canva-owned) | 7 | 7 | 4 (30-day storage) | 2 | 2 | **83/100** |

**Rationale:**
- **Primary: Cutout.Pro** — Strongest compliance (GDPR, SOC2 Type II), 24h auto-delete, 4K support, hair-level segmentation, async API.
- **Fallback: Unscreen API** — Canva-backed, Full HD, no length limit, but requires active subscription and 30-day storage.
- **Risk:** Vertical 9:16 segmentation quality for hair/edges requires POC validation; motion handling at 30fps critical.

### 3.4 Background Music

| Vendor | Capability Fit (25%) | Latency (20%) | Reliability (15%) | Legal (12%) | Cost (10%) | DX (8%) | Data (5%) | Roadmap (3%) | Risk (2%) | **Total** |
|--------|---------------------|---------------|-------------------|-------------|------------|---------|-----------|--------------|-----------|-----------|
| **Mubert API** | **25** (real-time, adaptive) | **20** (real-time gen) | 13 | 10 (royalty-free tiers) | 6 ($500/mo API) | 7 | 3 | 3 | 2 | **89/100** |
| **Soundraw API** | 24 (ethical AI, simple licensing) | 16 | 13 | **12** (no external training, monetization OK) | 6 ($500/mo API) | 7 | 3 | 2 | 2 | **85/100** |

**Rationale:**
- **Primary: Mubert API** — Real-time generation, adaptive music, proven for game/app integration, royalty-free licensing.
- **Fallback: Soundraw API** — Ethical AI (in-house producers), straightforward licensing, monetization-friendly.
- **Risk:** Both at $500/mo API cost; consider starting with no music feature and adding later based on user demand.

---

## 4. Recommended Architecture

### 4.1 Primary + Fallback per Capability

| Capability | Primary | Fallback | Switch-Over Conditions |
|------------|---------|----------|------------------------|
| **AI Script Generation** | OpenAI GPT-4o | Anthropic Claude 3.7 Sonnet | - p95 latency > 5sec<br>- Error rate > 3%<br>- Rate limit exhaustion<br>- Content quality degradation (user complaints > 5%) |
| **Content Moderation** | Moderation API | Azure Content Moderator | - False positive rate > 10%<br>- Latency > 2sec<br>- Service unavailable |
| **Transcription & Subtitles** | AssemblyAI | Deepgram Nova-3 | - p95 latency > 5sec<br>- Error rate > 2%<br>- Incident severity ≥ P1<br>- SLA breach (uptime < 99.9%) |
| **Video Editing/Composition** | Shotstack | Cloudinary Video API | - p95 latency > 60sec (for 60sec clip)<br>- Error rate > 3%<br>- SLA breach<br>- Rate limit exhaustion |
| **Background Removal** | Cutout.Pro API | Unscreen API | - Segmentation quality IoU < 0.85 (manual rating proxy)<br>- p95 latency > 90sec<br>- Error rate > 5%<br>- Compliance incident |
| **Music Generation** | Mubert API | Soundraw API | - Generation failure rate > 5%<br>- Latency > 10sec<br>- Licensing issue |
| **Video Encoding** | Mux Video | Coconut | - Cost exceeds $0.10/min<br>- Latency > 2× source duration<br>- Quality degradation |

### 4.2 Processing Pipeline Flow

**Script Generation Flow (Section 11 of PRD):**

```
1a. User selects "Generate with AI" (vs. "Paste script")
    ↓
2a. User enters topic (required) + short description (optional)
    ↓
3a. Backend calls LLM API (GPT-4o primary, Claude 3.7 fallback):
    - Prompt: "Research and generate a 20-250 word short-form video script about [topic]. [description].
               Target platform: TikTok/Instagram Reels/YouTube Shorts.
               Tone: [user's niche preference].
               Format: Engaging hook + concise message + clear CTA."
    - Response: Generated script (JSON mode for structure)
    ↓
4a. Backend calls Content Moderation API (Moderation API primary, Azure fallback):
    - Check for profanity, toxicity, harmful content, PII
    - If flagged: reject + return error to user
    - If clean: proceed
    ↓
5a. Validate word count (20-500 words)
    - If >500 words: truncate + warn user
    - If <20 words: reject + ask user to provide more details
    ↓
6a. Save script to AsyncStorage (scripts array)
    ↓
7a. Display script in teleprompter preview + allow user to edit before recording
```

**Video Processing Flow (Sections 10, 12-14 of PRD):**

```
1b. User records video with teleprompter (or uploads raw video)
    ↓
2b. Backend creates job with feature flags:
    {
      "videoId": "uuid",
      "scriptId": "uuid | null",
      "features": {
        "subtitles": true,
        "fillerWordRemoval": true,
        "backgroundChange": { "enabled": true, "presetId": "preset123" },
        "backgroundMusic": { "enabled": false },
        "introOutro": { "enabled": true, "templateId": "template456" }
      }
    }
    ↓
3b. Parallel API calls:
    - Transcription: AssemblyAI → words[] with timestamps + confidence
    - Background Removal: Cutout.Pro → matted video (if enabled)
    - Music (if enabled): Mubert → generated track
    ↓
4b. Backend processing:
    - Filler-word detection: Filter words[] by dictionary (um, uh, like) + low confidence
    - Generate cut list: Convert word timestamps → time ranges to remove
    ↓
5b. Video composition: Shotstack
    - Input: Matted video, cut list, intro/outro templates, music track
    - Output: Rendered MP4 (H.264, 1080x1920, 8-12 Mbps)
    ↓
6b. Encode/optimize: Mux Video → final deliverable
    ↓
7b. Download to mobile (checksum verification)
    ↓
8b. Save to FileSystem.documentDirectory/videos/processed/
    ↓
9b. Export via Sharing.shareAsync() (native share sheet)
```

### 4.3 Cost Estimation (MVP Scale: 1,000 clips/month, avg 90s)

**Assumption:** 70% of users use AI script generation (700 scripts/month); 30% paste own scripts.

| Service | Unit Cost | Monthly Usage | Monthly Cost |
|---------|-----------|---------------|--------------|
| **OpenAI GPT-4o (Script Gen)** | $0.0043/script (250 words ≈ 330 tokens in/out) | 700 AI-generated scripts | **$3.01** |
| **Moderation API (Content Filter)** | ~$0.005/check (est.) | 700 scripts moderated | **$3.50** |
| **AssemblyAI (Transcription)** | $0.015/min | 1,000 clips × 1.5 min = 1,500 min | **$22.50** |
| **Shotstack (Composition)** | ~$0.20/min (est. from $49 base) | 1,000 clips × 1.5 min = 1,500 min | **$300** (within $49-$309 tier) |
| **Cutout.Pro (BG Removal)** | $19/min (video) | 1,000 clips × 1.5 min = 1,500 min | **$28,500** ❌ **TOO HIGH** |
| **Mubert API (Music)** | $500/mo flat (if used) | N/A | **$500** (skip for MVP) |
| **Mux Video (Encoding)** | ~$0.02/min (est. encoding) | 1,500 min | **$30** |
| **TOTAL (with AI + moderation, without BG removal & music)** | | | **~$359/mo** |

**Cost Breakdown by Feature:**

- **AI Script Generation + Moderation:** $6.51/mo (700 scripts)
  - GPT-4o: $3.01
  - Content moderation: $3.50
  - **Per-script cost: $0.0093** (less than 1 cent)

- **Video Processing (no BG removal, no music):** $352.50/mo (1,000 clips)
  - Transcription: $22.50
  - Composition: $300
  - Encoding: $30

**Critical Cost Issue:** Cutout.Pro video background removal at $19/min is **prohibitively expensive** ($28,500/mo for 1,000 clips).

**Revised Recommendation:**

1. **MVP Phase 1 (Launch):**
   - ✅ AI Script Generation (GPT-4o + Moderation API)
   - ✅ Transcription & Subtitles (AssemblyAI)
   - ✅ Filler-word Removal (custom logic)
   - ✅ Intro/Outro (Shotstack templates)
   - ✅ Video Composition & Encoding (Shotstack + Mux)
   - ❌ Skip: Background removal, music
   - **Total: ~$359/mo** for 1,000 clips (70% with AI scripts)

2. **MVP Phase 2 (After User Validation):**
   - Negotiate volume pricing with Cutout.Pro (target: $5-10/min)
   - Evaluate alternatives:
     - **Self-hosted:** MODNet/BackgroundMattingV2 on GPU instances (AWS G4dn ~$0.50/hr)
     - **Hybrid:** API for first 100 clips/month, self-hosted for remainder
     - **Unscreen alternative:** Test per-second billing model
   - Add music feature if >20% user demand (Mubert API $500/mo)

**Adjusted MVP Cost (1,000 clips/month, 90s avg, 70% AI scripts):**

- AI Script Gen: $3.01
- Content Moderation: $3.50
- AssemblyAI: $22.50
- Shotstack: $300
- Mux Video: $30
- **Total: ~$359/month** ($0.36 per clip)

---

## 5. Contract & SLA Checklist

### 5.1 Availability & Reliability
- [ ] **Uptime SLA:** Minimum 99.9% monthly uptime (AssemblyAI, Azure, Shotstack confirmed)
- [ ] **Incident Response:** P1 < 1 hour, P2 < 4 hours, P3 < 24 hours
- [ ] **SLA Credits:** Downtime > 0.1% = 10% credit; > 1% = 25% credit; > 5% = 50% credit
- [ ] **Maintenance Windows:** Advance notice ≥ 48 hours; max 4 hours/month
- [ ] **Status Page:** Public status page with 90-day incident history
- [ ] **Incident Communication:** Email + webhook notifications for P1/P2 incidents

### 5.2 Support & Response Times
- [ ] **Support Tiers:** Email (48h), Chat (4h), Phone (1h for P1)
- [ ] **Response SLA:** P1 ≤ 1h, P2 ≤ 4h, P3 ≤ 24h, P4 ≤ 48h
- [ ] **Escalation Path:** Documented escalation to engineering for P1/P2
- [ ] **Account Management:** Dedicated CSM for contracts > $10k/year

### 5.3 Security & Privacy
- [ ] **Encryption:** TLS 1.2+ in transit; AES-256 at rest
- [ ] **Data Retention:** Configurable 0-30 days; default ≤ 7 days preferred
- [ ] **Data Deletion:** API for on-demand deletion; guaranteed within 7 days
- [ ] **Training Opt-Out:** No ML training on customer data by default; explicit opt-in required
- [ ] **Access Controls:** Role-based access; API key rotation; IP whitelisting
- [ ] **Audit Logs:** 90-day retention; exportable (JSON/CSV)
- [ ] **Penetration Testing:** Annual third-party pentests; reports shared on request

### 5.4 Compliance & Legal
- [ ] **Certifications:** SOC2 Type II, ISO 27001, GDPR-compliant
- [ ] **Data Processing Addendum (DPA):** Signed DPA required; template reviewed by legal
- [ ] **Data Residency:** Option to pin data to US or EU regions
- [ ] **Subprocessors:** List of subprocessors disclosed; 30-day notice for changes
- [ ] **GDPR Rights:** Support for subject access, deletion, portability requests
- [ ] **CCPA Compliance:** Do Not Sell directive supported
- [ ] **HIPAA (if applicable):** BAA available for healthcare use cases

### 5.5 Pricing & Commercial Terms
- [ ] **Pricing Lock:** Price increases require 90-day notice; annual cap at 10%
- [ ] **Overage Policy:** Soft limits with warnings; hard limits with 24h notice
- [ ] **Rate Limit Buckets:** Burst allowance (e.g., 150% for 5 min); burst pool quota
- [ ] **Volume Discounts:** Tiered pricing at 10k, 50k, 100k clips/month
- [ ] **Commitment Discounts:** 15-20% discount for 12-month prepay
- [ ] **Free Tier/Trial:** $50-$200 credits for POC; no credit card for trial
- [ ] **Payment Terms:** Net 30; auto-recharge for PAYG; annual invoicing option

### 5.6 IP & Licensing
- [ ] **Content Ownership:** Customer retains all rights to uploaded/processed content
- [ ] **Output Licensing:** Royalty-free, perpetual license for all outputs
- [ ] **Music Licensing:** Explicit commercial use rights; social media distribution included
- [ ] **Model Training:** No training on customer data without written consent
- [ ] **Attribution:** No watermarks or attribution required (or removable)

### 5.7 Termination & Migration
- [ ] **Termination Notice:** 30-day notice for monthly; 90-day for annual
- [ ] **Data Export:** Full data export (JSON/CSV) within 7 days of termination
- [ ] **Migration Assistance:** 30 days post-termination support for migration
- [ ] **No Lock-In:** No proprietary formats; standard outputs (MP4, SRT, VTT)
- [ ] **Refund Policy:** Pro-rated refunds for annual plans if terminated early

### 5.8 Change Management & Roadmap
- [ ] **API Versioning:** Minimum 12-month deprecation notice for breaking changes
- [ ] **Changelog:** Public changelog with 30-day advance notice for major changes
- [ ] **Roadmap Visibility:** Quarterly roadmap updates; feature request portal
- [ ] **Beta Access:** Early access to new features for testing
- [ ] **Webhook for Updates:** Notification webhook for API/feature changes

### 5.9 Performance & Quotas
- [ ] **Latency SLA:** p95 latency < 2× expected (e.g., 60sec clip → < 120sec processing)
- [ ] **Concurrency Limits:** Minimum 20 concurrent jobs; auto-scaling available
- [ ] **Rate Limits:** Negotiable based on usage patterns; burst capacity included
- [ ] **File Size Limits:** Minimum 500MB (supports 120sec @ 1080p @ 12 Mbps)
- [ ] **Resolution Support:** Minimum 1080x1920 (portrait 9:16); 4K optional
- [ ] **Error Budget:** < 2% error rate; credits for exceeding budget

---

## 6. POC Test Plan

### 6.1 Test Clips Preparation
- **Clip 1:** 30sec, 1080x1920, clean audio, single speaker (baseline)
- **Clip 2:** 60sec, 1080x1920, moderate noise, multiple speakers (diarization test)
- **Clip 3:** 120sec, 1080x1920, heavy filler words (um, uh, like), background music (editing test)
- **Clip 4:** 90sec, 1080x1920, rapid motion, complex background (segmentation test)
- **Clip 5:** 60sec, 1080x1920, mixed language (EN + ES), profanity (filter test)

### 6.2 Metrics & Acceptance Thresholds

| Metric | Measurement | Acceptance Threshold | Test Method |
|--------|-------------|----------------------|-------------|
| **Upload Time** | Time to upload 90sec clip (avg ~80MB) | < 15sec on 4G (10 Mbps up) | Network throttling (Chrome DevTools) |
| **Transcription Accuracy** | Word Error Rate (WER) | < 5% for clean audio; < 10% for noisy | Manual review vs. ground truth |
| **Filler-Word Detection** | Precision/Recall | Precision > 90%; Recall > 85% | Manual annotation of test clips |
| **Processing Latency (p50)** | Transcription + Editing + Encoding | < 90sec for 60sec clip | 10 runs per clip; calculate p50 |
| **Processing Latency (p95)** | Transcription + Editing + Encoding | < 180sec for 60sec clip | 10 runs per clip; calculate p95 |
| **Segmentation Quality** | Manual rating (1-5 scale) | Avg ≥ 4.0 (hair/edges clean, no artifacts) | 3 reviewers per clip; IoU proxy |
| **Success Rate** | Jobs completed without errors | ≥ 98% | 100 job submissions per vendor |
| **Webhook Reliability** | Webhook delivery success rate | ≥ 99% | Mock webhook endpoint; 100 jobs |
| **Retry Behavior** | Exponential backoff validation | 2s → 4s → 8s; max 3 retries | Simulate 500/503 errors |
| **Cost per Clip** | Total API costs for 60sec clip | < $0.50 per clip (MVP target) | Sum all API costs per test run |

### 6.3 Test Environment Setup
1. **Backend Proxy:** Node.js/Express server with:
   - Resumable upload endpoint (tus protocol or multipart)
   - Job orchestration logic
   - Webhook receiver with signature validation
   - Error logging (Sentry/CloudWatch)

2. **Mobile Simulator:** Expo Go on iOS Simulator + Android Emulator
   - Network throttling: Fast 4G (10 Mbps down, 5 Mbps up, 100ms RTT)
   - Storage monitoring for low-space scenarios

3. **Vendor Sandboxes:**
   - AssemblyAI: Free $50 credits
   - Deepgram: $200 free credits
   - Shotstack: Free tier (limited minutes)
   - Cutout.Pro: 5 free image credits (negotiate video trial)
   - Unscreen: Pro trial (if available)

### 6.4 Validation Checklist
- [ ] **Upload:** Resumable upload works; handles interruptions
- [ ] **Transcription:** Word-level timestamps accurate; diarization works for 2+ speakers
- [ ] **Filler Detection:** Custom logic correctly identifies um/uh/like with >90% precision
- [ ] **Cut Generation:** Timestamp ranges correctly map to video frames (no audio sync issues)
- [ ] **Background Removal:** Hair/edges clean; no green glow or fringing; motion stable at 30fps
- [ ] **Composition:** Intro/outro stitched correctly; subtitle burn-in readable; cuts applied cleanly
- [ ] **Encoding:** Output MP4 plays on iOS/Android; bitrate 8-12 Mbps; resolution 1080x1920
- [ ] **Webhook:** Receives job status updates; signature validation works; retry logic triggers
- [ ] **Error Handling:** 413 (file too large), 415 (unsupported format), 429 (rate limit), 500 (server error), 503 (unavailable) all handled
- [ ] **Cost:** Total cost per clip < $0.50 (excluding background removal for MVP)

### 6.5 POC Success Criteria
- **PASS:** ≥ 4 of 5 test clips meet all acceptance thresholds
- **CONDITIONAL PASS:** 3 of 5 clips pass; identifiable fixes for failures
- **FAIL:** < 3 clips pass OR critical showstopper (e.g., data retention violation, no EU residency)

---

## 7. API Integration Contract & Schema Mapping

### 7.1 Neutral Job Schema (Client Perspective)

```json
{
  "job": {
    "id": "uuid-v4",
    "videoId": "uuid-v4",
    "status": "idle" | "uploading" | "queued" | "processing" | "complete" | "failed" | "cancelled",
    "progress": 0-100,
    "requestedFeatures": {
      "subtitles": true,
      "fillerWordRemoval": true,
      "backgroundChange": {
        "enabled": true,
        "presetId": "preset123"
      },
      "backgroundMusic": {
        "enabled": false,
        "trackId": null,
        "volume": 80
      },
      "introOutro": {
        "enabled": true,
        "templateId": "template456"
      }
    },
    "createdAt": "ISO8601",
    "startedAt": "ISO8601 | null",
    "completedAt": "ISO8601 | null",
    "error": {
      "code": "TRANSCRIPTION_FAILED" | "ENCODING_FAILED" | "RATE_LIMIT_EXCEEDED" | "INVALID_FILE" | "TIMEOUT",
      "message": "Human-readable error message",
      "retryable": true | false
    } | null,
    "retries": 0,
    "outputs": {
      "transcriptUrl": "https://cdn.example.com/transcripts/uuid.vtt",
      "processedVideoUrl": "https://cdn.example.com/videos/uuid.mp4",
      "checksum": "sha256-hash"
    } | null
  }
}
```

### 7.2 Vendor Mapping Examples

#### AssemblyAI → Neutral Schema

**AssemblyAI Request:**
```json
POST https://api.assemblyai.com/v2/transcript
{
  "audio_url": "https://backend.example.com/uploads/raw-video-123.mp4",
  "language_code": "en",
  "punctuate": true,
  "format_text": true,
  "speaker_labels": true,
  "filter_profanity": false,
  "webhook_url": "https://backend.example.com/webhooks/assemblyai"
}
```

**AssemblyAI Response (Webhook Payload):**
```json
{
  "transcript_id": "5551722-f677-48a6-9287-39821bc247c7",
  "status": "completed",
  "text": "Um, welcome to Shorty AI. This is, like, a really cool app.",
  "words": [
    { "text": "Um", "start": 0, "end": 200, "confidence": 0.42, "speaker": "A" },
    { "text": "welcome", "start": 200, "end": 500, "confidence": 0.95, "speaker": "A" },
    { "text": "to", "start": 500, "end": 600, "confidence": 0.98, "speaker": "A" },
    ...
  ],
  "utterances": [...],
  "audio_duration": 12.5
}
```

**Transformation Logic:**
```javascript
// Filler-word detection
const fillerWords = ['um', 'uh', 'like', 'you know', 'i mean'];
const fillerSegments = response.words
  .filter(w => fillerWords.includes(w.text.toLowerCase()) || w.confidence < 0.5)
  .map(w => ({ start: w.start / 1000, end: w.end / 1000 })); // ms → sec

// Update neutral job schema
job.status = 'processing'; // Move to next stage
job.outputs.transcriptUrl = convertToVTT(response.words); // Generate VTT file
job.internalData.fillerSegments = fillerSegments; // For Shotstack cut list
```

#### Shotstack → Neutral Schema

**Shotstack Request (Edit API):**
```json
POST https://api.shotstack.io/v1/render
{
  "timeline": {
    "tracks": [
      {
        "clips": [
          {
            "asset": { "type": "video", "src": "https://cdn.example.com/matted-video-123.mp4" },
            "start": 0,
            "length": 12.5,
            "trim": 0.2  // Trim first 0.2sec (filler word)
          },
          {
            "asset": { "type": "video", "src": "https://cdn.example.com/intro-template.mp4" },
            "start": 0,
            "length": 2
          },
          ...
        ]
      },
      {
        "clips": [
          {
            "asset": { "type": "audio", "src": "https://cdn.example.com/music-track.mp3" },
            "start": 2,
            "length": 10.5,
            "volume": 0.8
          }
        ]
      }
    ]
  },
  "output": {
    "format": "mp4",
    "resolution": "1080x1920",
    "fps": 30,
    "quality": "high"
  },
  "callback": "https://backend.example.com/webhooks/shotstack"
}
```

**Shotstack Response (Webhook Payload):**
```json
{
  "type": "render",
  "action": "render",
  "id": "d2b46ed6-998a-4d6b-9d9e-b0c0a5b0c5e3",
  "owner": "api-key-123",
  "status": "done",
  "url": "https://shotstack-api.s3.amazonaws.com/v1/d2b46ed6.../final.mp4",
  "data": {
    "duration": 12.5,
    "render_time": 45.2
  }
}
```

**Transformation Logic:**
```javascript
// Update neutral job schema
if (response.status === 'done') {
  job.status = 'processing'; // Move to encoding stage
  job.outputs.processedVideoUrl = response.url;
  job.progress = 80; // 80% complete (encoding remains)
} else if (response.status === 'failed') {
  job.status = 'failed';
  job.error = {
    code: 'COMPOSITION_FAILED',
    message: response.error || 'Unknown Shotstack error',
    retryable: true
  };
}
```

#### Cutout.Pro → Neutral Schema

**Cutout.Pro Request (Async Mode):**
```json
POST https://www.cutout.pro/api/v1/matting2
{
  "video_url": "https://backend.example.com/uploads/raw-video-123.mp4",
  "bg_color": "transparent",
  "response_type": "async",
  "webhook_url": "https://backend.example.com/webhooks/cutoutpro"
}
```

**Cutout.Pro Response (Webhook Payload):**
```json
{
  "request_id": "abc123",
  "status": "success",
  "result_url": "https://cdn.cutout.pro/processed/abc123-matted.mp4",
  "processing_time": 67.3
}
```

**Transformation Logic:**
```javascript
// Update neutral job schema
job.internalData.mattedVideoUrl = response.result_url; // For Shotstack input
job.progress = 40; // 40% complete (matting done, composition next)
```

### 7.3 Error Code Mapping

| Neutral Code | AssemblyAI | Shotstack | Cutout.Pro | HTTP Status |
|--------------|-----------|-----------|------------|-------------|
| `INVALID_FILE` | `invalid_audio` | `invalid_source` | `invalid_format` | 415 |
| `FILE_TOO_LARGE` | N/A (no limit) | `file_size_exceeded` | `file_too_large` | 413 |
| `RATE_LIMIT_EXCEEDED` | `rate_limit_error` | `rate_limit` | `quota_exceeded` | 429 |
| `TRANSCRIPTION_FAILED` | `processing_failed` | N/A | N/A | 500 |
| `COMPOSITION_FAILED` | N/A | `render_failed` | N/A | 500 |
| `BACKGROUND_REMOVAL_FAILED` | N/A | N/A | `matting_failed` | 500 |
| `TIMEOUT` | `timeout` | `timeout` | `timeout` | 504 |
| `SERVICE_UNAVAILABLE` | `service_unavailable` | `service_unavailable` | `service_unavailable` | 503 |

### 7.4 Retry Logic (Exponential Backoff)

```javascript
async function retryWithBackoff(apiCall, maxRetries = 3) {
  const delays = [2000, 4000, 8000]; // 2s, 4s, 8s

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      const isRetryable = [500, 502, 503, 504].includes(error.status);
      const isLastAttempt = i === maxRetries - 1;

      if (!isRetryable || isLastAttempt) {
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, delays[i]));
      job.retries = i + 1;
    }
  }
}
```

---

## 8. Contract Negotiation Priorities

### 8.1 Must-Have (Non-Negotiable)
1. **SLA Uptime ≥ 99.9%** with monthly credits for breaches
2. **GDPR Compliance + DPA** (EU data residency option)
3. **Data Retention ≤ 30 days** (configurable to 0-7 days preferred)
4. **No ML Training** on customer data by default
5. **Encryption:** TLS 1.2+ in transit, AES-256 at rest
6. **Data Deletion API** with 7-day guarantee
7. **90-Day Price Lock** (no increases in first year)
8. **API Versioning:** 12-month deprecation notice

### 8.2 High Priority (Strongly Desired)
1. **Volume Discounts:** 15-20% at 10k clips/month
2. **Burst Concurrency:** 150% of baseline for 5-min spikes
3. **Rate Limit Flexibility:** Negotiable based on usage patterns
4. **SOC2 Type II Certification** (AssemblyAI, Cutout.Pro confirmed)
5. **Webhook Reliability ≥ 99%** with retry mechanism
6. **Support SLA:** P1 < 1h, P2 < 4h response
7. **Free POC Credits:** $200-$500 for testing

### 8.3 Medium Priority (Nice-to-Have)
1. **Dedicated CSM** for contracts > $10k/year
2. **Beta Access** to new features
3. **Custom Model Training** (e.g., domain-specific vocab for transcription)
4. **White-Label Outputs** (no watermarks/attribution)
5. **Audit Rights:** Annual third-party pentest reports
6. **Migration Assistance:** 30-day post-termination support

### 8.4 Negotiation Levers
- **Annual Prepayment:** Offer 12-month prepay for 15-20% discount
- **Case Study Participation:** Marketing rights in exchange for discount
- **Volume Commitment:** Commit to 10k clips/month for tiered pricing
- **Multi-Service Bundle:** Negotiate cross-vendor deals (e.g., AssemblyAI + Shotstack partnership pricing)
- **Early Adopter:** Request early access pricing for new features (e.g., Deepgram Nova-3)

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation | Owner | Trigger/Threshold |
|------|-----------|--------|----------|-------|-------------------|
| **Cutout.Pro video cost prohibitive** ($28.5k/mo) | **High** | **Critical** | 1. Defer BG removal to Phase 2<br>2. Negotiate volume pricing ($5-10/min target)<br>3. Evaluate self-hosted models (MODNet, BMV2) on GPU<br>4. Test Unscreen alternative pricing | Product/Engineering | Cost > $1,000/mo at MVP scale (1k clips) |
| **AssemblyAI SLA breach** (uptime < 99.9%) | Low | High | 1. Auto-failover to Deepgram<br>2. Circuit breaker pattern (5 failures → switch)<br>3. Request SLA credits<br>4. Monitor status page + set alerts | Engineering | 3 consecutive failures OR uptime < 99.9% in 30-day window |
| **Filler-word detection accuracy** < 90% precision | Medium | Medium | 1. Improve dictionary (add "so", "well", "actually")<br>2. Use confidence scores (< 0.5 = likely filler)<br>3. ML model training on labeled dataset<br>4. User preview before final render | Engineering | User complaints > 5% OR manual review < 90% |
| **Shotstack latency** > 2× source duration | Low | Medium | 1. Use Ingest API for cross-region speed-up<br>2. Pre-encode videos to consistent format<br>3. Failover to Cloudinary<br>4. Batch processing for non-urgent jobs | Engineering | p95 latency > 120sec for 60sec clip |
| **Music API cost** ($500/mo) underutilized | Medium | Low | 1. Launch MVP without music feature<br>2. Add music in Phase 2 based on user demand<br>3. Negotiate pay-per-use pricing (vs. flat $500)<br>4. Use royalty-free library (Artlist) without API | Product | < 20% of users enable music feature after 3 months |
| **GDPR violation** (data retention > 30 days) | Low | **Critical** | 1. Automate deletion jobs (cron every 24h)<br>2. Audit all vendors for retention policies<br>3. Document data flow in DPA addendum<br>4. Implement "right to deletion" API endpoint | Legal/Engineering | Any vendor stores data > 30 days OR no deletion API |
| **Vendor lock-in** (proprietary formats) | Low | Medium | 1. Enforce standard outputs (MP4, SRT, VTT)<br>2. Avoid vendor-specific SDKs (use REST)<br>3. Maintain abstraction layer (adapter pattern)<br>4. Document migration paths in contracts | Engineering | Contract renewal with > 20% price increase OR vendor EOL announcement |
| **Mobile bandwidth** (upload failures on slow networks) | Medium | Medium | 1. Implement resumable uploads (tus protocol)<br>2. Compress videos client-side (reduce bitrate to 6 Mbps)<br>3. Show progress + allow pause/resume<br>4. Queue uploads for WiFi only option | Engineering | Upload failure rate > 10% |
| **Webhook delivery failures** | Medium | Medium | 1. Implement retry logic (3 attempts, exp backoff)<br>2. Use idempotent handlers (duplicate webhook handling)<br>3. Monitor delivery rate (alert < 95%)<br>4. Fallback to polling for critical jobs | Engineering | Webhook delivery < 99% over 7 days |
| **API rate limits exhausted** at scale | Medium | High | 1. Negotiate higher limits at 10k clips/month<br>2. Implement queueing (BullMQ/Celery)<br>3. Distribute load across multiple API keys<br>4. Batch jobs where possible | Engineering | Rate limit errors > 1% |

---

## 10. Integration Implementation Checklist

### 10.1 Backend Proxy Requirements
- [ ] **Upload Endpoint:**
  - Resumable upload (tus protocol or multipart)
  - Max file size: 500MB (supports 120sec @ 12 Mbps)
  - Pre-signed URL generation for vendor uploads
  - Virus scanning (ClamAV or cloud service)

- [ ] **Job Orchestration:**
  - State machine implementation (idle → uploading → queued → processing → complete/failed/cancelled)
  - Parallel API calls (transcription + background removal)
  - Sequential dependencies (matting → composition → encoding)
  - Timeout handling (20min max per job)

- [ ] **Webhook Receiver:**
  - Signature validation (HMAC-SHA256)
  - Idempotent handling (prevent duplicate processing)
  - Retry logging
  - Error alerting (Sentry/CloudWatch)

- [ ] **Monitoring & Logging:**
  - Latency tracking (p50, p95, p99)
  - Error rate by vendor
  - Cost tracking per job
  - SLA breach detection (auto-alerts)

### 10.2 Mobile Client Requirements
- [ ] **Upload UI:**
  - Progress indicator (0-100%)
  - Pause/Resume buttons
  - Background upload support (iOS: URLSession, Android: WorkManager)
  - Offline queue (retry on WiFi)

- [ ] **Processing Status:**
  - Real-time updates via webhook → push notification
  - Fallback polling (every 2sec, max 20min)
  - Cancel button (calls backend → vendor cancel API)

- [ ] **Error Handling:**
  - Network errors: "Check your connection. We'll retry automatically."
  - File too large: "Video must be < 120 seconds. Please trim and try again."
  - Rate limit: "We're processing many videos. Please try again in 5 minutes."
  - Server error: "Something went wrong. Our team has been notified. [Retry]"

### 10.3 Vendor-Specific Setup
- [ ] **AssemblyAI:**
  - API key from dashboard
  - Webhook URL configured
  - Test with sample audio (50 free credits)
  - EU region selected (if GDPR required)

- [ ] **Shotstack:**
  - API key from dashboard
  - Webhook URL configured
  - Test render with JSON timeline
  - Verify output format (MP4, 1080x1920, H.264)

- [ ] **Cutout.Pro:**
  - API key from dashboard
  - Negotiate video trial credits
  - Test async mode with webhook
  - Verify 24h auto-delete policy

- [ ] **Mubert (if music enabled):**
  - API subscription ($500/mo)
  - Licensing terms reviewed (commercial use, social media OK)
  - Test track generation (30sec, 60sec, 120sec)

- [ ] **Mux Video:**
  - Account setup
  - Test encoding (1080p → 1080p, H.264, 8-12 Mbps)
  - Verify CDN delivery speed

---

## 11. Open Questions & Next Steps

### 11.1 Unresolved Questions
1. **Background Removal Pricing:** Can Cutout.Pro offer volume discounts to $5-10/min? (vs. $19/min list price)
2. **Filler-Word Logic:** Should we use ML model (custom training) or rule-based (dictionary + confidence)?
3. **Music Feature Priority:** Launch without music (MVP Phase 1) or include with Mubert API ($500/mo)?
4. **Self-Hosted Options:** Feasibility of deploying MODNet/BMV2 on AWS GPU instances for background removal?
5. **Intro/Outro Branding:** Custom templates or generic stock templates from Shotstack library?
6. **Offline Queue:** Should uploads queue for WiFi-only, or allow cellular with user confirmation?

### 11.2 Next Steps
1. **Week 1-2: POC Setup**
   - [ ] Set up backend proxy (Node.js/Express)
   - [ ] Create test clips (5 clips covering edge cases)
   - [ ] Register for vendor trials (AssemblyAI $50, Deepgram $200, Shotstack free tier)
   - [ ] Implement webhook receiver with signature validation

2. **Week 3-4: POC Testing**
   - [ ] Run POC test plan (Section 6)
   - [ ] Measure latency, accuracy, cost per clip
   - [ ] Document findings in POC report
   - [ ] Identify blockers (e.g., Cutout.Pro cost)

3. **Week 5: Vendor Negotiations**
   - [ ] Request volume pricing from Cutout.Pro (target: $5-10/min)
   - [ ] Negotiate SLA terms with AssemblyAI (99.9% uptime, DPA)
   - [ ] Request Shotstack partnership pricing (if available)
   - [ ] Clarify data retention policies with all vendors

4. **Week 6: Architecture Finalization**
   - [ ] Select primary + fallback vendors per capability
   - [ ] Design switch-over logic (circuit breaker pattern)
   - [ ] Implement adapter layer (vendor abstraction)
   - [ ] Document integration patterns

5. **Week 7-8: MVP Implementation**
   - [ ] Integrate AssemblyAI (transcription)
   - [ ] Implement filler-word detection (rule-based v1)
   - [ ] Integrate Shotstack (composition)
   - [ ] Integrate Mux (encoding)
   - [ ] Skip background removal & music (defer to Phase 2)

6. **Week 9-10: Testing & Launch Prep**
   - [ ] End-to-end testing (mobile → backend → vendors → delivery)
   - [ ] Load testing (100 concurrent jobs)
   - [ ] Security audit (pentest of webhook endpoints)
   - [ ] Documentation (API integration guide, runbooks)

7. **Post-Launch (Month 2-3):**
   - [ ] Monitor SLA compliance (uptime, latency, error rates)
   - [ ] Analyze usage patterns (which features used most)
   - [ ] Negotiate Phase 2 vendor contracts (background removal, music)
   - [ ] Evaluate self-hosted options for cost reduction

---

## 12. Appendix: Source Links & Access Dates

**All sources accessed: January 2025**

### Transcription & Subtitles
- [AssemblyAI Pricing](https://www.assemblyai.com/pricing)
- [AssemblyAI SLA](https://www.assemblyai.com/docs/faq/what-is-your-api-uptime-sla)
- [AssemblyAI DPA](https://www.assemblyai.com/legal/data-processing-addendum)
- [Deepgram Pricing](https://deepgram.com/learn/speech-to-text-api-pricing-breakdown-2025)
- [Deepgram Rate Limits](https://developers.deepgram.com/reference/api-rate-limits)
- [Rev.ai Security](https://www.rev.ai/security)
- [Rev.ai DPA](https://www.rev.com/legal/data-processing-addendum)
- [Azure Speech Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/)
- [Azure SLA](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-services-quotas-and-limits)
- [Google Speech-to-Text Pricing](https://cloud.google.com/speech-to-text/pricing)
- [OpenAI Whisper Pricing](https://openai.com/api/pricing/)
- [WER Comparison 2025](https://voicewriter.io/blog/best-speech-recognition-api-2025)

### Video Editing & Composition
- [Shotstack Pricing](https://shotstack.io/pricing/)
- [Shotstack API Docs](https://shotstack.io/docs/api/)
- [Cloudinary Pricing](https://cloudinary.com/pricing)
- [Cloudinary Video Transformations](https://cloudinary.com/documentation/video_manipulation_and_delivery)
- [Creatomate Pricing](https://creatomate.com/pricing)
- [Creatomate API Limits](https://creatomate.com/docs/api/reference/limits-and-concurrency)
- [Mux Encoding](https://www.mux.com/encoding)
- [Descript API Docs](https://docs.descriptapi.com/)

### Background Removal
- [Cutout.Pro API](https://www.cutout.pro/api)
- [Cutout.Pro Video Pricing](https://www.cutout.pro/video-pricing)
- [Unscreen API](https://www.unscreen.com/api)
- [Unscreen Pricing](https://www.unscreen.com/pricing)

### Music Generation
- [Mubert API](https://mubert.com/)
- [Soundraw](https://soundraw.io/)
- [Top Music APIs 2025](https://vozart.ai/blog/top-apis-for-music-generation)

### Compliance & Security
- [AssemblyAI Security](https://www.assemblyai.com/security)
- [Azure DPA](https://azure.microsoft.com/en-us/support/legal/)
- [Cutout.Pro Compliance](https://www.cutout.pro/home)

---

**End of Vendor Evaluation Report**
