
'use server';
/**
 * @fileOverview A Genkit flow for answering questions about a presentation.
 *
 * - answerPresentationQuestion - A function that takes a presentation and a question and returns an answer.
 * - AnswerPresentationQuestionInput - The input type for the function.
 * - AnswerPresentationQuestionOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SlideSchema = z.object({
  title: z.string(),
  content: z.string(),
  layout: z.string(),
  speakerNotes: z.string().optional(),
  fontSize: z.number().optional(),
  image: z.object({
    generationPrompt: z.string(),
    url: z.string().optional(),
  }).optional(),
});

const PresentationDataSchema = z.object({
  title: z.string(),
  slides: z.array(SlideSchema),
  theme: z.string(),
});

const AnswerPresentationQuestionInputSchema = z.object({
  presentation: PresentationDataSchema.describe("The full JSON object of the presentation data."),
  question: z.string().describe("The user's question about the presentation."),
});
export type AnswerPresentationQuestionInput = z.infer<typeof AnswerPresentationQuestionInputSchema>;

// This internal schema is for the prompt itself, which expects a stringified JSON.
const InternalPromptInputSchema = z.object({
  presentationJson: z.string(),
  question: z.string(),
});

const AnswerPresentationQuestionOutputSchema = z.object({
  answer: z.string().describe('A helpful and concise answer to the user question, based on the presentation content.'),
});
export type AnswerPresentationQuestionOutput = z.infer<typeof AnswerPresentationQuestionOutputSchema>;

export async function answerPresentationQuestion(input: AnswerPresentationQuestionInput): Promise<AnswerPresentationQuestionOutput> {
  return answerPresentationQuestionFlow(input);
}

const answerQuestionPrompt = ai.definePrompt({
  name: 'answerQuestionPrompt',
  input: { schema: InternalPromptInputSchema },
  output: { schema: AnswerPresentationQuestionOutputSchema },
  prompt: `You are an expert presentation assistant. Your job is to help the user by answering questions about the presentation they've created.

Use the provided presentation content to answer the user's question. Be helpful, and base your answer strictly on the information given in the presentation JSON. Do not make up information. If the answer is not in the presentation, say that you can't find that information in the slides.

User's Question:
"{{{question}}}"

Presentation Content (JSON):
\`\`\`json
{{{presentationJson}}}
\`\`\`
`,
});

const answerPresentationQuestionFlow = ai.defineFlow(
  {
    name: 'answerPresentationQuestionFlow',
    inputSchema: AnswerPresentationQuestionInputSchema,
    outputSchema: AnswerPresentationQuestionOutputSchema,
  },
  async input => {
    // Correctly stringify the presentation object into a JSON string BEFORE passing it to the prompt.
    const presentationJson = JSON.stringify(input.presentation, null, 2);
    
    const { output } = await answerQuestionPrompt({
      presentationJson,
      question: input.question,
    });
    
    return output!;
  }
);
