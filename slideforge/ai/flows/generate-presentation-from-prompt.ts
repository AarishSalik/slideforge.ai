'use server';

/**
 * @fileOverview Generates a presentation based on a single prompt.
 *
 * - generatePresentationFromPrompt - A function that generates a presentation based on a prompt.
 * - GeneratePresentationFromPromptInput - The input type for the generatePresentationFromPrompt function.
 * - GeneratePresentationFromPromptOutput - The return type for the generatePresentationFromPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePresentationFromPromptInputSchema = z.object({
  prompt: z.string().describe('A single prompt to generate a presentation from.'),
});
export type GeneratePresentationFromPromptInput = z.infer<typeof GeneratePresentationFromPromptInputSchema>;

const GeneratePresentationFromPromptOutputSchema = z.object({
  presentationContent: z.string().describe('The generated presentation content in a structured format.'),
});
export type GeneratePresentationFromPromptOutput = z.infer<typeof GeneratePresentationFromPromptOutputSchema>;

export async function generatePresentationFromPrompt(input: GeneratePresentationFromPromptInput): Promise<GeneratePresentationFromPromptOutput> {
  return generatePresentationFromPromptFlow(input);
}

const generatePresentationPrompt = ai.definePrompt({
  name: 'generatePresentationPrompt',
  input: {schema: GeneratePresentationFromPromptInputSchema},
  output: {schema: GeneratePresentationFromPromptOutputSchema},
  prompt: `You are an AI assistant that creates presentations.
   
User Prompt: {{{prompt}}}

Generate the presentation content based on the user's prompt.`,
});

const generatePresentationFromPromptFlow = ai.defineFlow(
  {
    name: 'generatePresentationFromPromptFlow',
    inputSchema: GeneratePresentationFromPromptInputSchema,
    outputSchema: GeneratePresentationFromPromptOutputSchema,
  },
  async input => {
    const {output} = await generatePresentationPrompt(input);
    return output!;
  }
);
