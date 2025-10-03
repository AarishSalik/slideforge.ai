'use server';

/**
 * @fileoverview A flow that summarizes a webpage or a YouTube video from a URL.
 * - summarizeWebpage - A function that takes a URL and returns a summary.
 * - SummarizeWebpageInput - The input type for the summarizeWebpage function.
 * - SummarizeWebpageOutput - The return type for the summarizeWebpage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { YoutubeTranscript } from 'youtube-transcript';

const SummarizeWebpageInputSchema = z.object({
  url: z.string().url().describe('The URL of the webpage or YouTube video to summarize.'),
});
export type SummarizeWebpageInput = z.infer<typeof SummarizeWebpageInputSchema>;

const SummarizeWebpageOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the content.'),
});
export type SummarizeWebpageOutput = z.infer<typeof SummarizeWebpageOutputSchema>;


export async function summarizeWebpage(
  input: SummarizeWebpageInput
): Promise<SummarizeWebpageOutput> {
  return summarizeWebpageFlow(input);
}

// Function to check if a URL is a YouTube URL
function isYoutubeUrl(url: string): boolean {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
  return youtubeRegex.test(url);
}

const summarizeWebpageFlow = ai.defineFlow(
  {
    name: 'summarizeWebpageFlow',
    inputSchema: SummarizeWebpageInputSchema,
    outputSchema: SummarizeWebpageOutputSchema,
  },
  async (input) => {
    let contentToSummarize = '';

    if (isYoutubeUrl(input.url)) {
      try {
        const transcript = await YoutubeTranscript.fetchTranscript(input.url);
        if (!transcript || transcript.length === 0) {
          throw new Error('Could not fetch transcript for this YouTube video. It may have transcripts disabled.');
        }
        contentToSummarize = transcript.map(item => item.text).join(' ');
      } catch (e) {
        console.error(e);
        throw new Error('Failed to process YouTube transcript. The video may not have captions available.');
      }
    } else {
      // Fetch the raw HTML content from the provided URL.
      const response = await fetch(input.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch webpage: ${response.statusText}`);
      }
      contentToSummarize = await response.text();
    }

    // Use a powerful model to extract the main content and summarize it.
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: `From the following content, extract the main information and then create a concise summary suitable for a presentation. If the content is HTML, ignore boilerplate like headers, footers, ads, and navigation menus.\n\nContent:\n\n${contentToSummarize}`,
      output: {
        schema: SummarizeWebpageOutputSchema,
      },
    });

    return output!;
  }
);
