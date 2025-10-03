
'use client';

import PptxGenJS from 'pptxgenjs';
import type { PresentationData, SlideLayout, SlideTheme } from '@/lib/types';

function parseMarkdown(content: string): PptxGenJS.TextProps[] {
    if (!content) return [];

    const textProps: PptxGenJS.TextProps[] = [];
    const lines = content.split('\n').filter(line => line.trim() !== '');

    lines.forEach((line) => {
        let currentText = line;
        const textOptions: PptxGenJS.TextPropsOptions = {};

        // Handle bullet points
        if (currentText.startsWith('- ') || currentText.startsWith('* ')) {
            currentText = currentText.substring(2);
            textOptions.bullet = true;
        }

        // Add the processed line
        textProps.push({ text: currentText, options: textOptions });
    });

    return textProps;
}


export async function exportToPptx(presentation: PresentationData) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';

  const themeDefinitions: Record<SlideTheme, { titleColor: string; contentColor: string; backgroundColor: string; overlay: string; titleFont: string; contentFont: string; defaultLayout: SlideLayout }> = {
    professional: {
      titleColor: "0A2540", // Dark Navy Blue
      contentColor: "333333", // Charcoal
      backgroundColor: "FFFFFF", // White
      overlay: 'FFFFFF',
      titleFont: "Helvetica",
      contentFont: "Helvetica",
      defaultLayout: 'image-left',
    },
    creative: {
      titleColor: "006A4E",
      contentColor: "333333",
      backgroundColor: "E6F4EA",
      overlay: 'E6F4EA',
      titleFont: "Playfair Display",
      contentFont: "Lato",
      defaultLayout: 'image-left',
    },
    minimalist: {
      titleColor: "000000",
      contentColor: "333333",
      backgroundColor: "FFFFFF",
      overlay: 'FFFFFF',
      titleFont: "Inter",
      contentFont: "Inter",
      defaultLayout: 'text-only'
    },
    vibrant: {
      titleColor: "4C0099",
      contentColor: "333333",
      backgroundColor: "F3E8FF",
      overlay: 'F3E8FF',
      titleFont: "Montserrat",
      contentFont: "Lato",
      defaultLayout: 'image-right'
    },
    corporate: {
      titleColor: "0d6efd", // Bootstrap Blue, for a professional look
      contentColor: "343a40", // Dark gray for readability
      backgroundColor: "FFFFFF", // Clean white background
      overlay: 'FFFFFF',
      titleFont: "Inter",
      contentFont: "Lato",
      defaultLayout: 'image-left',
    }
  };
  
  const activeTheme = themeDefinitions[presentation.theme] || themeDefinitions.corporate;

  // Title Slide
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: activeTheme.backgroundColor };
  titleSlide.addText(presentation.title, {
    x: 0.5,
    y: 2.5,
    w: '90%',
    h: 1,
    align: 'center',
    fontSize: 44,
    bold: true,
    color: activeTheme.titleColor === 'FFFFFF' ? '000000' : activeTheme.titleColor, // Use black on light background for title
    fontFace: activeTheme.titleFont,
  });
  
  // Create a copy of slides and add a "Thank You" slide
  const slidesWithThankYou = [
    ...presentation.slides,
    {
      title: 'Thank You!',
      content: 'Any Questions?',
      layout: 'text-only' as SlideLayout,
      speakerNotes: 'End of presentation.'
    }
  ];

  // Content Slides
  for (const slideData of slidesWithThankYou) {
    const slide = pptx.addSlide();
    
    // Determine layout: use slide-specific layout, then theme default, then fallback
    const layout: SlideLayout = slideData.layout || activeTheme.defaultLayout || 'text-only';
    
    slide.background = { color: activeTheme.backgroundColor };
    slide.transition = { type: 'fade' };
    
    if (slideData.speakerNotes) {
      slide.addNotes(slideData.speakerNotes);
    }
    
    // For PPTX, the URL must be base64 encoded.
    const hasImage = slideData.image?.url?.startsWith('data:image');

    let textX: PptxGenJS.Coord = '5%';
    let textW: PptxGenJS.Coord = '90%';
    let textY: PptxGenJS.Coord = 0.5;
    let contentY: PptxGenJS.Coord = 1.5;
    let titleColor = activeTheme.titleColor;
    let contentColor = activeTheme.contentColor;

    if (layout === 'background-image' && hasImage) {
        slide.background = { data: slideData.image!.url };
        
        // Add a semi-transparent overlay for text readability
        slide.addShape(pptx.shapes.RECTANGLE, {
            x: '5%', y: '15%', w: '90%', h: '70%',
            fill: { type: 'solid', color: activeTheme.overlay, transparency: 20 }
        });
        textX = '10%';
        textY = '20%';
        contentY = '35%';
        textW = '80%';
        titleColor = 'FFFFFF';
        contentColor = 'F1F1F1';

    } else if (layout === 'image-left' && hasImage) {
        textX = '55%';
        textW = '40%';
        slide.addImage({ data: slideData.image!.url, x: '5%', y: '15%', w: '45%', h: '70%', sizing: { type: 'contain', w: '45%', h: '70%' } });
    } else if (layout === 'image-right' && hasImage) {
        textX = '5%';
        textW = '40%';
        slide.addImage({ data: slideData.image!.url, x: '50%', y: '15%', w: '45%', h: '70%', sizing: { type: 'contain', w: '45%', h: '70%' } });
    }
    
    slide.addText(slideData.title, {
      x: textX,
      y: textY,
      w: textW,
      h: 1,
      fontSize: 28,
      bold: true,
      color: titleColor,
      fontFace: activeTheme.titleFont,
    });
    
    const contentItems = parseMarkdown(slideData.content);
    slide.addText(contentItems.map(item => ({...item, options: {...item.options, fontFace: activeTheme.contentFont}})), {
      x: textX,
      y: contentY,
      w: textW,
      h: '75%',
      fontSize: slideData.fontSize || 14,
      color: contentColor,
      fontFace: activeTheme.contentFont,
    });
  }

  await pptx.writeFile({ fileName: `${presentation.title}.pptx` });
}
