import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {google} from 'googleapis';

export const ai = genkit({
  plugins: [googleAI({
    // You can specify your API key in a .env file.
    // When you deploy to Firebase, this will be set for you.
    apiKey: process.env.GEMINI_API_KEY
  })],
  model: 'googleai/gemini-2.5-flash',
});
