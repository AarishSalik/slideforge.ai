'use server';
/**
 * @fileOverview A Genkit flow that converts text to audio.
 *
 * - generateAudioFromText - A function that takes a string of text and returns a playable audio file.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import wav from 'wav';

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));

    writer.write(pcmData);
    writer.end();
  });
}

const GenerateAudioOutputSchema = z.object({
  media: z.string().describe('The generated audio as a data URI.'),
});

const generateAudioFromTextFlow = ai.defineFlow(
  {
    name: 'generateAudioFromTextFlow',
    inputSchema: z.string(),
    outputSchema: GenerateAudioOutputSchema,
  },
  async (text) => {
    const {media} = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: 'Algenib'},
          },
        },
      },
      prompt: text,
    });
    
    if (!media?.url) {
      throw new Error('The AI model did not return any audio data. This may be a temporary issue. Please try again.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const wavBase64 = await toWav(audioBuffer);
    
    return {
      media: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);

export async function generateAudioFromText(text: string) {
  return generateAudioFromTextFlow(text);
}
