
'use server';

/**
 * @fileOverview Extracts keywords from a descriptive prompt.
 *
 * - extractKeywordsFromPrompt - A function that takes a descriptive sentence and returns keywords.
 * - ExtractKeywordsInput - The input type for the function.
 * - ExtractKeywordsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractKeywordsInputSchema = z.object({
  prompt: z.string().describe('A descriptive sentence for image generation.'),
});
export type ExtractKeywordsInput = z.infer<typeof ExtractKeywordsInputSchema>;

const ExtractKeywordsOutputSchema = z.object({
  keywords: z
    .string()
    .describe(
      'A comma-separated list of the 2-3 most important keywords from the prompt, suitable for an image search.'
    ),
});
export type ExtractKeywordsOutput = z.infer<typeof ExtractKeywordsOutputSchema>;

export async function extractKeywordsFromPrompt(
  input: ExtractKeywordsInput
): Promise<ExtractKeywordsOutput> {
  return extractKeywordsFlow(input);
}

const extractKeywordsFlow = ai.defineFlow(
  {
    name: 'extractKeywordsFlow',
    inputSchema: ExtractKeywordsInputSchema,
    outputSchema: ExtractKeywordsOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `From the following image generation prompt, extract the 2-3 most important keywords and return them as a comma-separated list.
      
      Example Prompt: "A high-quality, photorealistic image of a majestic lion roaring at sunset on the Serengeti plains."
      Example Output: "lion,roaring,sunset"
      
      Example Prompt: "people scrolling on their smartphones"
      Example Output: "people,smartphones"
      
      Prompt: "${input.prompt}"
      `,
      output: {
        schema: ExtractKeywordsOutputSchema,
      },
    });

    return output!;
  }
);
