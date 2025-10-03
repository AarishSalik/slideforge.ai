'use server';

/**
 * @fileOverview Generates a presentation based on an image of notes.
 *
 * - generatePresentationFromImage - A function that generates a presentation from an image.
 * - GeneratePresentationFromImageInput - The input type for the function.
 * - GeneratePresentationFromImageOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GeneratePresentationFromImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of handwritten notes or a document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  prompt: z.string().describe('Instructions for the output format (e.g., the JSON structure).'),
});
export type GeneratePresentationFromImageInput = z.infer<typeof GeneratePresentationFromImageInputSchema>;

const GeneratePresentationFromImageOutputSchema = z.object({
  presentationContent: z.string().describe('The generated presentation content in a structured format.'),
});
export type GeneratePresentationFromImageOutput = z.infer<typeof GeneratePresentationFromImageOutputSchema>;

export async function generatePresentationFromImage(
  input: GeneratePresentationFromImageInput
): Promise<GeneratePresentationFromImageOutput> {
  return generatePresentationFromImageFlow(input);
}

const generatePresentationFromImageFlow = ai.defineFlow(
  {
    name: 'generatePresentationFromImageFlow',
    inputSchema: GeneratePresentationFromImageInputSchema,
    outputSchema: GeneratePresentationFromImageOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: `You are an AI assistant that creates presentations from images of notes or documents.
Analyze the provided image and create a presentation based on its content.
{{{prompt}}}

Use this image as the primary source: {{media url=photoDataUri}}
`,
      output: {
        schema: GeneratePresentationFromImageOutputSchema,
      }
    });

    return output!;
  }
);
