
export type SlideTheme = 'professional' | 'creative' | 'minimalist' | 'vibrant' | 'corporate';
export type SlideLayout = 'text-only' | 'image-left' | 'image-right' | 'background-image';

export interface Slide {
  title: string;
  content: string; // Markdown formatted content
  layout: SlideLayout;
  speakerNotes?: string;
  fontSize?: number;
  image?: {
    generationPrompt: string;
    url?: string;
  };
}

export interface PresentationData {
  title: string;
  slides: Slide[];
  theme: SlideTheme;
}
