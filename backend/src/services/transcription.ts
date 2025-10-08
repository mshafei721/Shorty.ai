import axios from 'axios';
import { config } from '../config';
import type { TranscriptionResult, TranscriptionWord, SubtitleSegment } from '../types';

const ASSEMBLYAI_API_URL = 'https://api.assemblyai.com/v2';
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 200;

export async function uploadToAssemblyAI(localFilePath: string): Promise<string> {
  const fs = await import('fs/promises');
  const fileData = await fs.readFile(localFilePath);

  const response = await axios.post(`${ASSEMBLYAI_API_URL}/upload`, fileData, {
    headers: {
      authorization: config.assemblyai.apiKey,
      'content-type': 'application/octet-stream',
    },
  });

  return response.data.upload_url;
}

export async function createTranscript(uploadUrl: string): Promise<string> {
  const response = await axios.post(
    `${ASSEMBLYAI_API_URL}/transcript`,
    {
      audio_url: uploadUrl,
      language_code: 'en',
      punctuate: true,
      format_text: true,
    },
    {
      headers: {
        authorization: config.assemblyai.apiKey,
        'content-type': 'application/json',
      },
    }
  );

  return response.data.id;
}

export async function pollTranscript(transcriptId: string): Promise<TranscriptionResult> {
  let attempts = 0;

  while (attempts < MAX_POLL_ATTEMPTS) {
    const response = await axios.get(`${ASSEMBLYAI_API_URL}/transcript/${transcriptId}`, {
      headers: {
        authorization: config.assemblyai.apiKey,
      },
    });

    const { status, text, words, confidence, audio_duration } = response.data;

    if (status === 'completed') {
      if (!text || !words || words.length === 0) {
        throw new Error('Transcription completed but no text/words returned');
      }

      const transcriptionWords: TranscriptionWord[] = words.map((w: any) => ({
        text: w.text,
        start: w.start / 1000,
        end: w.end / 1000,
        confidence: w.confidence,
      }));

      return {
        id: transcriptId,
        text,
        words: transcriptionWords,
        confidence,
        duration: audio_duration / 1000,
      };
    }

    if (status === 'error') {
      throw new Error(`Transcription failed: ${response.data.error}`);
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    attempts++;
  }

  throw new Error('Transcription polling timeout');
}

export async function transcribeVideo(localFilePath: string): Promise<TranscriptionResult> {
  const uploadUrl = await uploadToAssemblyAI(localFilePath);
  const transcriptId = await createTranscript(uploadUrl);
  const result = await pollTranscript(transcriptId);
  return result;
}

export function generateSubtitles(
  words: TranscriptionWord[],
  maxWordsPerSegment = 5,
  maxDurationPerSegment = 3.0
): SubtitleSegment[] {
  const segments: SubtitleSegment[] = [];
  let currentSegment: TranscriptionWord[] = [];
  let segmentStart = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    if (currentSegment.length === 0) {
      segmentStart = word.start;
    }

    currentSegment.push(word);

    const segmentDuration = word.end - segmentStart;
    const isLastWord = i === words.length - 1;
    const shouldBreak =
      currentSegment.length >= maxWordsPerSegment ||
      segmentDuration >= maxDurationPerSegment ||
      isLastWord;

    if (shouldBreak) {
      const text = currentSegment.map((w) => w.text).join(' ');
      segments.push({
        start: segmentStart,
        end: word.end,
        text,
      });
      currentSegment = [];
    }
  }

  return segments;
}
