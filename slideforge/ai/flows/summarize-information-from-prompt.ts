'use server';
/**
 * @fileOverview This file defines a Genkit flow for summarizing information from a user prompt.
 *
 * - summarizeInformationFromPrompt - A function that takes a user prompt and returns a summary of relevant information.
 * - SummarizeInformationFromPromptInput - The input type for the summarizeInformationFromPrompt function.
 * - SummarizeInformationFromPromptOutput - The return type for the summarizeInformationFromPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeInformationFromPromptInputSchema = z.string().describe('The user prompt to summarize information from.');
export type SummarizeInformationFromPromptInput = z.infer<typeof SummarizeInformationFromPromptInputSchema>;

const SummarizeInformationFromPromptOutputSchema = z.object({
  summary: z.string().describe('A summary of the information gathered from the user prompt.'),
  progress: z.string().describe('Progress of the summarization process'),
});
export type SummarizeInformationFromPromptOutput = z.infer<typeof SummarizeInformationFromPromptOutputSchema>;

export async function summarizeInformationFromPrompt(input: SummarizeInformationFromPromptInput): Promise<SummarizeInformationFromPromptOutput> {
  return summarizeInformationFromPromptFlow(input);
}

const summarizeInformationPrompt = ai.definePrompt({
  name: 'summarizeInformationPrompt',
  input: {schema: SummarizeInformationFromPromptInputSchema},
  output: {schema: SummarizeInformationFromPromptOutputSchema},
  prompt: `You are an AI assistant tasked with researching and summarizing information based on a user's prompt for a presentation.

  User Prompt: {{{$input}}}

  Research the topic thoroughly and provide a concise and accurate summary of relevant information, statistics, and facts that can be used in the presentation.
  The summary should be well-structured and easy to understand.

  Make sure the summary contains the most up-to-date information.`,
});

const summarizeInformationFromPromptFlow = ai.defineFlow(
  {
    name: 'summarizeInformationFromPromptFlow',
    inputSchema: SummarizeInformationFromPromptInputSchema,
    outputSchema: SummarizeInformationFromPromptOutputSchema,
  },
  async input => {
    const {output} = await summarizeInformationPrompt(input);
    return {
      ...output,
      progress: 'Gathered and summarized current information based on user prompt.',
    };
  }
);
