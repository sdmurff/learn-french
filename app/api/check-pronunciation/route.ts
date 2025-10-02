import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { calculateDiff } from '@/utils/diff';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createReadStream } from 'fs';

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;

  try {
    const { audioBase64, referenceText } = await request.json();

    if (!audioBase64 || !referenceText) {
      return NextResponse.json(
        { error: 'Audio and reference text are required' },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioBase64, 'base64');

    // Write to temporary file
    tempFilePath = join(tmpdir(), `recording-${Date.now()}.webm`);
    writeFileSync(tempFilePath, audioBuffer);

    // Create read stream for Whisper API
    const audioFile = createReadStream(tempFilePath);

    // Transcribe audio using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile as any,
      model: 'whisper-1',
      language: 'fr', // French
    });

    const transcribedText = transcription.text.trim();

    // Calculate diff and score
    const { diff, score } = calculateDiff(referenceText, transcribedText);

    return NextResponse.json({
      transcription: transcribedText,
      diff,
      score,
      referenceText,
    });
  } catch (error) {
    console.error('Error checking pronunciation:', error);
    return NextResponse.json(
      { error: 'Failed to check pronunciation' },
      { status: 500 }
    );
  } finally {
    // Clean up temporary file
    if (tempFilePath) {
      try {
        unlinkSync(tempFilePath);
      } catch (err) {
        console.error('Error deleting temp file:', err);
      }
    }
  }
}
