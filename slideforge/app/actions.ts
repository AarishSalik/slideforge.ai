
'use server';

import { generatePresentationFromPrompt } from '@/ai/flows/generate-presentation-from-prompt';
import { generatePresentationFromImage } from '@/ai/flows/generate-presentation-from-image';
import { summarizeWebpage } from '@/ai/flows/summarize-webpage';
import { generateAudioFromText } from '@/ai/flows/generate-audio-from-text';
import { answerPresentationQuestion } from '@/ai/flows/answer-presentation-question';
import { extractKeywordsFromPrompt } from '@/ai/flows/extract-keywords-from-prompt';


import type { PresentationData, Slide } from '@/lib/types';

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// A helper prompt to guide the AI to produce JSON in the desired format.
const jsonOutputInstructions = `
Return the presentation as a valid JSON object with the following structure:
{
  "title": "Your Presentation Title",
  "theme": "corporate",
  "slides": [
    {
      "title": "Slide 1: High-Level Introduction",
      "content": "Start with a concise introductory paragraph. Then, use a markdown list with 3-5 key takeaways. For example: - Point 1\\n- Point 2",
      "speakerNotes": "AI-generated speaker notes for this slide, explaining the key points in more detail.",
      "layout": "text-only",
      "image": { "generationPrompt": "A simple, professional, abstract background image related to the slide's core topic." }
    },
    {
      "title": "Slide 2: Deeper Dive",
      "content": "Provide more detailed content for this slide, perhaps focusing on one of the key takeaways from the introduction. Use markdown for lists where appropriate.",
      "speakerNotes": "Speaker notes for slide 2.",
      "layout": "image-left",
      "image": { "generationPrompt": "A specific, photorealistic image illustrating the main point of this slide." }
    }
  ]
}
Each slide must have a title, content, speakerNotes, a layout, and an image property.
The content should be structured and concise. Use markdown for lists. Do not use markdown for bolding or italics.
The image property should always be included. The image.generationPrompt must be a non-empty string.
For 'text-only' slides, the prompt can be generic. For slides with images, the prompt must be specific and professional.
For the image.generationPrompt, be very specific and professional. The prompt should be very descriptive to get a relevant image. For a slide about social media, a good prompt would be 'people scrolling on their smartphones'. For a slide on climate change, 'a timelapse of a glacier melting'.
The theme must be "corporate".
Ensure the entire output is ONLY the JSON object, without any surrounding text or markdown formatting.
`;

function handleActionError(e: unknown): string {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    if (errorMessage.includes('503') || errorMessage.includes('overloaded') || errorMessage.includes('temporarily unavailable')) {
        return 'The presentation generation service is currently busy. Please wait a moment and try again.';
    }
    return errorMessage;
}


async function getPresentationData(prompt: string): Promise<PresentationData> {
  const result = await generatePresentationFromPrompt({ prompt });

  if (!result.presentationContent) {
    throw new Error('AI did not return any content.');
  }

  // The AI might return the JSON string inside a markdown code block, or with other text.
  const jsonStart = result.presentationContent.indexOf('{');
  const jsonEnd = result.presentationContent.lastIndexOf('}');

  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) {
    console.error('Could not find a valid JSON object in the AI response.');
    console.error('Raw AI response:', result.presentationContent);
    throw new Error('AI returned an invalid response format.');
  }

  const jsonString = result.presentationContent.substring(jsonStart, jsonEnd + 1);

  let parsedData: PresentationData;

  try {
    parsedData = JSON.parse(jsonString) as PresentationData;
    // Basic validation
    if (!parsedData.title || !Array.isArray(parsedData.slides) || !parsedData.theme) {
      throw new Error("Invalid JSON structure received from AI.");
    }
    
    // Add a welcome slide
    const welcomeSlide: Slide = {
      title: parsedData.title,
      content: 'Welcome to the presentation!',
      layout: 'background-image',
      speakerNotes: 'A welcome slide to start the presentation.',
      image: {
        generationPrompt: 'beautiful abstract welcome background',
        url: `https://picsum.photos/seed/welcome/1280/720`,
      }
    };
    parsedData.slides.unshift(welcomeSlide);


    // Ensure slides have speaker notes and valid image prompts.
    parsedData.slides.forEach((slide, index) => {
      if (typeof slide.speakerNotes === 'undefined') {
        slide.speakerNotes = "No speaker notes were generated for this slide.";
      }
      if (!slide.image) {
        slide.image = { generationPrompt: 'abstract background' }; 
      }
      if (slide.image && (typeof slide.image.generationPrompt !== 'string' || slide.image.generationPrompt.trim() === '')) {
        slide.image.generationPrompt = 'abstract background'; 
      }
      if (!slide.layout) {
        slide.layout = 'text-only';
      }
      // Assign a reliable placeholder URL, skipping the welcome slide
      if (index > 0 && slide.image) {
        const keywords = slide.image.generationPrompt.split(' ').slice(0, 3).join(',');
        const randomCacheBuster = Math.random().toString(36).substring(7);
        slide.image.url = `https://picsum.photos/seed/${encodeURIComponent(keywords + randomCacheBuster)}/1280/720`;
      }
    });
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError);
    console.error('Sanitized AI response string:', jsonString);
    console.error('Raw AI response:', result.presentationContent);
    throw new Error('Failed to process AI response. The format was invalid.');
  }

  return parsedData;
}

export async function generatePresentationAction(
  prompt: string,
  audience?: string,
): Promise<ActionResult<PresentationData>> {
  try {
    const audiencePrompt = audience ? `Tailor the presentation for the following audience: ${audience}.` : '';
    const fullPrompt = `${prompt}\n\n${audiencePrompt}\n\n${jsonOutputInstructions}`;
    const data = await getPresentationData(fullPrompt);
    return { success: true, data };
  } catch (e) {
    return { success: false, error: handleActionError(e) };
  }
}

export async function generatePresentationFromUrlAction(
  url: string,
  audience?: string,
): Promise<ActionResult<PresentationData>> {
  try {
    const summary = await summarizeWebpage({url});
    const audiencePrompt = audience ? `Tailor the presentation for the following audience: ${audience}.` : '';
    const prompt = `Create a presentation based on the following summary:\n\n${summary.summary}\n\n${audiencePrompt}\n\n${jsonOutputInstructions}`;
    const data = await getPresentationData(prompt);
    return { success: true, data };
  } catch (e) {
    return { success: false, error: handleActionError(e) };
  }
}

export async function generatePresentationFromImageAction(
  photoDataUri: string,
  audience?: string,
): Promise<ActionResult<PresentationData>> {
  try {
     const audiencePrompt = audience ? `Tailor the presentation for the following audience: ${audience}.` : '';
    const result = await generatePresentationFromImage({
      photoDataUri,
      prompt: `Analyze the following image and generate structured presentation content based on it. ${audiencePrompt} ${jsonOutputInstructions}`,
    });

    if (!result.presentationContent) {
      throw new Error('AI did not return any content from the image.');
    }
    
    const jsonStart = result.presentationContent.indexOf('{');
    const jsonEnd = result.presentationContent.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) {
      console.error('Could not find a valid JSON object in the AI response from image.');
      console.error('Raw AI response:', result.presentationContent);
      throw new Error('AI returned an invalid response format from image.');
    }
    
    const jsonString = result.presentationContent.substring(jsonStart, jsonEnd + 1);
    let parsedData: PresentationData = JSON.parse(jsonString);

    // Basic validation
    if (!parsedData.title || !Array.isArray(parsedData.slides) || !parsedData.theme) {
      throw new Error("Invalid JSON structure received from AI.");
    }
    
    // Add a welcome slide
    const welcomeSlide: Slide = {
      title: parsedData.title,
      content: 'Welcome to the presentation!',
      layout: 'background-image',
      speakerNotes: 'A welcome slide to start the presentation.',
      image: {
        generationPrompt: 'beautiful abstract welcome background',
        url: `https://picsum.photos/seed/welcome-image/1280/720`,
      }
    };
    parsedData.slides.unshift(welcomeSlide);

    // Ensure slides have speaker notes and valid image prompts.
    parsedData.slides.forEach((slide, index) => {
      if (typeof slide.speakerNotes === 'undefined') {
        slide.speakerNotes = "No speaker notes were generated for this slide.";
      }
      if (!slide.image) {
        slide.image = { generationPrompt: 'abstract background' };
      }
      if (slide.image && (typeof slide.image.generationPrompt !== 'string' || slide.image.generationPrompt.trim() === '')) {
        slide.image.generationPrompt = 'abstract background';
      }
      if (!slide.layout) {
        slide.layout = 'text-only';
      }
       // Assign a reliable placeholder URL
      if (index > 0 && slide.image) {
        const keywords = slide.image.generationPrompt.split(' ').slice(0, 3).join(',');
        const randomCacheBuster = Math.random().toString(36).substring(7);
        slide.image.url = `https://picsum.photos/seed/${encodeURIComponent(keywords + randomCacheBuster)}/1280/720`;
      }
    });

    return { success: true, data: parsedData };
  } catch (e) {
    return { success: false, error: handleActionError(e) };
  }
}


export async function generateAudioAction(text: string): Promise<ActionResult<string>> {
  try {
    const result = await generateAudioFromText(text);
    if (result.media) {
      return { success: true, data: result.media };
    }
    // This case should be handled by the updated flow, but as a fallback:
    return { success: false, error: 'The AI model did not return any audio data. This may be a temporary issue. Please try again.' };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    if (errorMessage.includes('503') || errorMessage.includes('overloaded') || errorMessage.includes('temporarily unavailable')) {
        return { success: false, error: 'The audio generation service is currently busy. Please try again in a moment.' };
    }
    return { success: false, error: errorMessage };
  }
}

async function fetchImageAsBase64(imageUrl: string): Promise<string> {
    try {
        const response = await fetch(imageUrl, { headers: { 'Cache-Control': 'no-cache' } });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image from ${imageUrl}. Status: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        if (!blob.type.startsWith('image/')) {
          throw new Error(`The response from ${imageUrl} was not a valid image. Content-Type: ${blob.type}`);
        }
        const buffer = Buffer.from(await blob.arrayBuffer());
        const base64 = buffer.toString('base64');
        return `data:${blob.type};base64,${base64}`;
    } catch (e) {
        console.error(`Failed to fetch and process image from ${imageUrl}:`, e);
        return ""; // Return empty string on failure to prevent crashes
    }
};

export async function getBase64FromImageUrl(url: string): Promise<string> {
    try {
        return await fetchImageAsBase64(url);
    } catch (e) {
        console.error(`Failed to fetch and process image from ${url}:`, e);
        return "";
    }
}


export async function askQuestionAction(
  presentation: PresentationData,
  question: string
): Promise<ActionResult<string>> {
  try {
    const result = await answerPresentationQuestion({ presentation, question });
    return { success: true, data: result.answer };
  } catch (e) {
    return { success: false, error: handleActionError(e) };
  }
}

export async function getKeywordsForImageAction(prompt: string): Promise<ActionResult<string>> {
  try {
    const { keywords } = await extractKeywordsFromPrompt({ prompt });
    return { success: true, data: keywords };
  } catch (e) {
    return { success: false, error: handleActionError(e) };
  }
}
