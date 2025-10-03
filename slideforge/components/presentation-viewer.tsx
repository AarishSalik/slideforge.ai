
'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Sparkles, Paintbrush, Monitor, FileText, X, Maximize, Minimize, Edit, Save, Clapperboard, Volume2, Loader2, MessageCircle, SendHorizonal, Image as ImageIcon, Trash2, Pilcrow, Link, LayoutTemplate, Text, Type, Minus, Plus, ChevronDown, RefreshCcw, Grid, Briefcase, Upload } from 'lucide-react';
import type { PresentationData, Slide, SlideLayout, SlideTheme } from '@/lib/types';
import { exportToPptx } from '@/lib/pptx-generator';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import React from 'react';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { generateAudioAction, getBase64FromImageUrl, askQuestionAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from './ui/sheet';
import { ScrollArea } from './ui/scroll-area';
import rehypeRaw from 'rehype-raw';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


interface PresentationViewerProps {
  presentation: PresentationData;
  onReset: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const themeOptions: { value: SlideTheme; label: string; icon: React.ReactNode }[] = [
    { value: 'corporate', label: 'Corporate', icon: <Briefcase className="h-4 w-4" /> },
    { value: 'professional', label: 'Professional', icon: <FileText className="h-4 w-4" /> },
    { value: 'creative', label: 'Creative', icon: <Paintbrush className="h-4 w-4" /> },
    { value: 'minimalist', label: 'Minimalist', icon: <FileText className="h-4 w-4" /> },
    { value: 'vibrant', label: 'Vibrant', icon: <Clapperboard className="h-4 w-4" /> },
];

const layoutOptions: { value: SlideLayout, label: string, icon: React.ReactNode }[] = [
    { value: 'text-only', label: 'Text Only', icon: <Type /> },
    { value: 'image-left', label: 'Image Left', icon: <LayoutTemplate style={{ transform: 'scaleX(-1)' }} /> },
    { value: 'image-right', label: 'Image Right', icon: <LayoutTemplate /> },
    { value: 'background-image', label: 'Background Image', icon: <ImageIcon /> },
]

export function PresentationViewer({ presentation: initialPresentation, onReset }: PresentationViewerProps) {
  const [presentation, setPresentation] = useState(initialPresentation);
  const [activeTheme, setActiveTheme] = useState<SlideTheme>(presentation.theme);
  const [viewMode, setViewMode] = useState<'preview' | 'content' | 'grid'>('preview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [api, setApi] = React.useState<CarouselApi>()
  const [currentSlideIndex, setCurrentSlideIndex] = React.useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({});
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!api) return;
    setCurrentSlideIndex(api.selectedScrollSnap())
    api.on("select", () => {
      setCurrentSlideIndex(api.selectedScrollSnap());
      setAudioUrl(null); // Reset audio when slide changes
    })
  }, [api])

  useEffect(() => {
    // Scroll to bottom of chat history
    if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleDownloadPptx = async () => {
    // We need to fetch images as base64 for PPTX export
    toast({ title: 'Preparing PPTX download...', description: 'Fetching images, please wait.' });
    const presentationForExport = { ...presentation, slides: [...presentation.slides]};
    await Promise.all(presentationForExport.slides.map(async (slide) => {
        if (slide.image?.url && slide.image.url.startsWith('http')) {
            slide.image.url = await getBase64FromImageUrl(slide.image.url);
        }
    }));
    await exportToPptx({ ...presentationForExport, theme: activeTheme });
  };
  
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    toast({
      title: "Generating PDF...",
      description: "This may take a moment. Please wait.",
    });

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [1280, 720], // Standard 16:9 aspect ratio
    });

    const selector = viewMode === 'grid' ? '.grid-slide-render-container' : '.slide-render-container';
    const slideElements = document.querySelectorAll(selector);

    for (let i = 0; i < slideElements.length; i++) {
      const slideElement = slideElements[i] as HTMLElement;
      try {
        const canvas = await html2canvas(slideElement, {
            scale: 2, // Increase resolution for better quality
            useCORS: true, // Important for external images
        });
        const imgData = canvas.toDataURL('image/png');
        if (i > 0) {
            pdf.addPage();
        }
        pdf.addImage(imgData, 'PNG', 0, 0, 1280, 720);
      } catch (error) {
        console.error(`Failed to capture slide ${i}:`, error);
         toast({
            variant: "destructive",
            title: `Error processing slide ${i + 1}`,
            description: "Could not capture slide content for PDF.",
        });
      }
    }

    pdf.save(`${presentation.title}.pdf`);
    setIsGeneratingPdf(false);
  };
  
  const handleThemeChange = (theme: SlideTheme) => {
    setActiveTheme(theme);
  };

  const handleSlideChange = (index: number, newSlide: Partial<Slide>) => {
    const newSlides = [...presentation.slides];
    const oldSlide = newSlides[index];
    newSlides[index] = { ...oldSlide, ...newSlide };
    setPresentation({ ...presentation, slides: newSlides });
  };
  
 const handleNextImage = async (index: number) => {
    const slide = presentation.slides[index];
    if (!slide.image?.generationPrompt) {
        toast({
            variant: "destructive",
            title: "No Image Prompt",
            description: "There's no prompt to generate a new image. Please add one in the content view.",
        });
        return;
    }

    setImageLoading(prev => ({ ...prev, [index]: true }));

    try {
        const keywords = slide.image.generationPrompt.split(' ').slice(0, 3).join(',');
        const randomCacheBuster = Math.random().toString(36).substring(7);
        const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(keywords + randomCacheBuster)}/1280/720`;
        
        const newSlide: Partial<Slide> = {
            image: {
                ...presentation.slides[index].image,
                url: imageUrl,
            }
        };
        handleSlideChange(index, newSlide);

    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        toast({
            variant: "destructive",
            title: "Could Not Fetch New Image",
            description: errorMessage,
        });
    } finally {
        setImageLoading(prev => ({ ...prev, [index]: false }));
    }
};

  const handleLayoutChange = (index: number, layout: SlideLayout) => {
     const currentSlide = presentation.slides[index];
    const newSlide: Partial<Slide> = { layout };
    // If switching to a layout with an image and there isn't one, generate the URL.
    if (layout !== 'text-only' && !currentSlide.image?.url && currentSlide.image?.generationPrompt) {
        handleNextImage(index);
    } else if (layout !== 'text-only' && !currentSlide.image) {
        newSlide.image = { generationPrompt: 'A relevant background image', url: '' };
        // We set an empty url and prompt and let the user generate it.
    }
    handleSlideChange(index, newSlide);
  }

  const changeFontSize = (index: number, delta: number) => {
    const currentSize = presentation.slides[index].fontSize || 14;
    const newSize = Math.max(8, Math.min(48, currentSize + delta)); // Clamp between 8 and 48
    handleSlideChange(index, { fontSize: newSize });
  }
  
  const toggleFullscreen = () => {
    const element = document.getElementById('presentation-container');
    if (!element) return;

    if (!document.fullscreenElement) {
        element.requestFullscreen();
        setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  }

  const handleGenerateAudio = async () => {
    const notes = presentation.slides[currentSlideIndex].speakerNotes;
    if (!notes) return;

    setIsGeneratingAudio(true);
    setAudioUrl(null);
    const result = await generateAudioAction(notes);
    if (result.success && result.data) {
      setAudioUrl(result.data);
    } else {
      console.error('Failed to generate audio:', result.error);
      toast({
        variant: "destructive",
        title: "Audio Generation Failed",
        description: result.error || "An unexpected error occurred.",
      });
    }
    setIsGeneratingAudio(false);
  };
  
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: chatInput }];
    setChatHistory(newHistory);
    setChatInput('');
    setIsReplying(true);
    
    const { data, error } = await askQuestionAction(presentation, chatInput);

    if (data) {
        setChatHistory([...newHistory, { role: 'assistant', content: data }]);
    } else {
        setChatHistory([...newHistory, { role: 'assistant', content: `Sorry, I encountered an error: ${error}` }]);
    }
    setIsReplying(false);
  }

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const dataUrl = reader.result as string;
              handleSlideChange(index, {
                  image: {
                      ...presentation.slides[index].image!,
                      url: dataUrl,
                      generationPrompt: "User uploaded image"
                  }
              });
          };
          reader.readAsDataURL(file);
      }
      // Reset file input to allow re-uploading the same file
      e.target.value = '';
  };


  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const slideBaseClasses = "aspect-video flex items-center justify-center relative p-0 transition-colors duration-300";
  
  const themeStyles: Record<SlideTheme, { bg: string; title: string; content: string; overlay: string; titleFont: string; contentFont: string; defaultLayout: SlideLayout }> = {
      professional: { bg: 'bg-white', title: 'text-slate-800', content: 'text-slate-600', overlay: 'bg-white/80', titleFont: 'font-headline', contentFont: 'font-body', defaultLayout: 'image-left' },
      creative: { bg: 'bg-teal-50', title: 'text-teal-800', content: 'text-teal-600', overlay: 'bg-white/80', titleFont: 'font-creative', contentFont: 'font-body', defaultLayout: 'image-left' },
      minimalist: { bg: 'bg-white', title: 'text-gray-800', content: 'text-gray-600', overlay: 'bg-white/80', titleFont: 'font-sans', contentFont: 'font-sans', defaultLayout: 'text-only' },
      vibrant: { bg: 'bg-indigo-50', title: 'text-indigo-800', content: 'text-indigo-600', overlay: 'bg-white/80', titleFont: 'font-display', contentFont: 'font-sans', defaultLayout: 'image-right' },
      corporate: { bg: 'bg-[hsl(var(--corporate-background))]', title: 'text-[hsl(var(--corporate-primary))]', content: 'text-[hsl(var(--corporate-foreground))]', overlay: 'bg-[hsl(var(--corporate-background))]/80', titleFont: 'font-headline', contentFont: 'font-body', defaultLayout: 'image-left' },
  };
  
  const currentThemeStyle = themeStyles[activeTheme] || themeStyles.corporate;

  const renderEditingToolbar = (index: number) => {
    const slide = presentation.slides[index];

    return (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 bg-background/80 backdrop-blur-sm p-1 rounded-lg border shadow-lg flex items-center gap-1">
             <Select value={slide.layout} onValueChange={(value) => handleLayoutChange(index, value as SlideLayout)}>
                <SelectTrigger className="w-auto h-8 gap-1">
                  <SelectValue placeholder="Layout" />
                </SelectTrigger>
                <SelectContent>
                  {layoutOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                       <div className="flex items-center gap-2">
                        {option.icon}
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            
             {slide.layout !== 'text-only' && (
                <div className='flex items-center gap-1'>
                    <Button variant="outline" size="sm" className="h-8" onClick={() => handleNextImage(index)} disabled={imageLoading[index]}>
                        {imageLoading[index] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                        Next Image
                    </Button>
                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleSlideChange(index, { image: { ...slide.image!, url: '' } })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )}
            
            <div className="flex items-center gap-1 bg-muted rounded-md p-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => changeFontSize(index, -2)}><Minus className="h-4 w-4" /></Button>
                <span className="text-xs font-mono w-6 text-center">{slide.fontSize || 14}</span>
                 <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => changeFontSize(index, 2)}><Plus className="h-4 w-4" /></Button>
            </div>
        </div>
    );
};
  const renderSlide = (slide: Slide, index: number, isGrid: boolean = false) => {
    const containerId = isGrid ? `grid-slide-${index}` : `slide-${index}`;
    const containerClass = isGrid ? 'grid-slide-render-container' : 'slide-render-container';
    const layout = slide.layout || currentThemeStyle.defaultLayout;
    const imageKey = `${index}-${slide.image?.url}`;

    const hasImage = slide.image?.url && (layout === 'image-left' || layout === 'image-right' || layout === 'background-image');

    const renderTextContent = (isEditingView: boolean) => (
      <div className={cn("flex-1 flex flex-col justify-center", {
        'p-2 sm:p-4 md:p-8': !isGrid && layout !== 'background-image',
        'p-1 sm:p-2': isGrid,
        'p-4 md:p-8': layout === 'background-image' && !isGrid,
        'w-full': !hasImage || layout === 'text-only' || layout === 'background-image',
        'w-1/2': hasImage && (layout === 'image-left' || layout === 'image-right'),
        [cn('max-w-full sm:max-w-3xl rounded-lg shadow-xl', currentThemeStyle.overlay)]: layout === 'background-image',
        'bg-transparent': layout !== 'background-image',
      })}>
        {isEditingView ? (
          <Input
            value={slide.title}
            onChange={(e) => handleSlideChange(index, { title: e.target.value })}
            className={cn("font-bold bg-transparent border-primary/50",
                currentThemeStyle.title, currentThemeStyle.titleFont,
                 isGrid ? "text-sm md:text-base mb-1" : "text-2xl md:text-4xl mb-4"
            )}
          />
        ) : (
          <h3 className={cn("font-bold animate-in fade-in-0 slide-in-from-bottom-4 duration-700",
              currentThemeStyle.title, currentThemeStyle.titleFont,
              isGrid ? "text-sm md:text-base mb-1" : "text-3xl md:text-4xl"
          )}>{slide.title}</h3>
        )}
        {isEditingView ? (
          <Textarea
            value={slide.content}
            onChange={(e) => handleSlideChange(index, { content: e.target.value })}
            className={cn("prose max-w-none bg-transparent border-primary/50 flex-grow",
                currentThemeStyle.content, currentThemeStyle.contentFont,
                isGrid ? "prose-xs mt-1 h-auto text-[8px] md:text-[10px] leading-tight" : "prose-base md:prose-lg mt-4 h-48"
            )}
             style={{ fontSize: isGrid ? '10px' : `${slide.fontSize || 14}px` }}
          />
        ) : (
           <ReactMarkdown
            rehypePlugins={[rehypeRaw]}
            className={cn("prose max-w-none animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-300 overflow-y-auto",
                currentThemeStyle.content, currentThemeStyle.contentFont,
                isGrid ? "prose-xs mt-1 text-[8px] md:text-[10px] leading-tight" : "prose-base md:prose-lg mt-4"
            )}
            style={{ fontSize: isGrid ? '10px' : `${slide.fontSize || 14}px` }}
          >
            {slide.content}
          </ReactMarkdown>
        )}
      </div>
    );

    return (
      <div id={containerId} className={`p-1 relative ${containerClass}`}>
        {isEditing && renderEditingToolbar(index)}
        <Card className="overflow-hidden">
          <CardContent className={cn(slideBaseClasses, currentThemeStyle.bg)}>
            {layout === 'background-image' && hasImage && (
              <Image
                key={imageKey}
                src={slide.image!.url!}
                alt={slide.image!.generationPrompt || 'AI generated image'}
                fill
                className="object-cover"
                data-ai-hint={slide.image!.generationPrompt}
              />
            )}
             <div className={cn("w-full h-full flex items-center", {
                'flex-row': layout === 'image-left',
                'flex-row-reverse': layout === 'image-right',
                'justify-center': !hasImage || layout === 'text-only' || layout === 'background-image'
            })}>
              {(layout === 'image-left' || layout === 'image-right') && hasImage && (
                  <div className={cn("relative h-full", isGrid ? "w-1/2" : "w-1/2")}>
                      <Image
                        key={imageKey}
                        src={slide.image!.url!}
                        alt={slide.image!.generationPrompt || 'AI generated image'}
                        fill
                        className={cn("object-contain", isGrid ? "p-1" : "p-4")}
                        data-ai-hint={slide.image!.generationPrompt}
                      />
                  </div>
              )}
              {renderTextContent(isEditing)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const presentationContent = (
      <div className={cn("w-full mx-auto flex flex-col gap-4 flex-1", isFullscreen ? "max-w-full h-full" : "max-w-5xl")}>
        {!isFullscreen && (
          <div className="text-center">
             {isEditing ? (
                  <Input 
                    value={presentation.title}
                    onChange={(e) => setPresentation({ ...presentation, title: e.target.value })}
                    className={cn("text-3xl font-bold tracking-tight bg-transparent border-primary/50 text-center", currentThemeStyle.titleFont, currentThemeStyle.title)}
                  />
               ) : (
                  <h1 className={cn("text-4xl font-bold tracking-tight", currentThemeStyle.titleFont, currentThemeStyle.title)}>{presentation.title}</h1>
               )}
            <p className="text-muted-foreground mt-2">Your AI-generated presentation is ready to be reviewed and downloaded.</p>
          </div>
        )}

        {viewMode === 'preview' && (
          <Carousel setApi={setApi} className="w-full flex-1 flex flex-col justify-center">
            <CarouselContent>
              {presentation.slides.map((slide, index) => (
                <CarouselItem key={index}>
                    {renderSlide(slide, index)}
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className={cn("-left-4 md:-left-12", isEditing && "hidden")} />
            <CarouselNext className={cn("-right-4 md:-right-12", isEditing && "hidden")} />
          </Carousel>
        )}
        {viewMode === 'grid' && (
             <ScrollArea className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {presentation.slides.map((slide, index) => (
                        <div key={index}>
                            {renderSlide(slide, index, true)}
                        </div>
                    ))}
                </div>
            </ScrollArea>
        )}
        {viewMode === 'content' && (
           <Card className="flex-1 overflow-y-auto bg-card">
             <CardContent className="p-8">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <h1>{presentation.title}</h1>
                   <Input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileSelected(e, currentSlideIndex)}
                      accept="image/png, image/jpeg, image/webp"
                    />
                  {presentation.slides.map((slide, index) => (
                    <div key={index} className="mt-8 not-prose">
                       {isEditing ? (
                          <Input 
                            value={slide.title}
                            onChange={(e) => handleSlideChange(index, { title: e.target.value })}
                            className="text-3xl font-bold mb-4 w-full"
                          />
                       ) : (
                          <h2 className="text-3xl font-bold mb-4">{index + 1}. {slide.title}</h2>
                       )}

                       {isEditing ? (
                         <Textarea 
                            value={slide.content}
                            onChange={(e) => handleSlideChange(index, { content: e.target.value })}
                            className="text-base w-full h-32 mb-4"
                             style={{ fontSize: `${slide.fontSize || 14}px` }}
                          />
                       ) : (
                         <ReactMarkdown rehypePlugins={[rehypeRaw]} className="prose prose-lg dark:prose-invert max-w-none" style={{ fontSize: `${slide.fontSize || 14}px` }}>{slide.content}</ReactMarkdown>
                       )}
                      
                      {isEditing && slide.layout !== 'text-only' && (
                        <div className="mt-2 space-y-2">
                            <label className="font-medium">Image Prompt</label>
                            <div className="flex gap-2">
                                <Textarea
                                    value={slide.image?.generationPrompt || ''}
                                    onChange={(e) => handleSlideChange(index, { image: { ...slide.image!, generationPrompt: e.target.value } })}
                                    className="text-sm flex-1"
                                />
                                 <Button variant="outline" onClick={() => handleImageUploadClick()}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload
                                </Button>
                            </div>
                        </div>
                      )}
                      {!isEditing && slide.image && <p className="text-sm italic text-muted-foreground">Image Prompt: {slide.image.generationPrompt}</p>}

                      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-semibold text-primary">Speaker Notes</h4>
                        {isEditing ? (
                           <Textarea 
                              value={slide.speakerNotes || ''}
                              onChange={(e) => handleSlideChange(index, { speakerNotes: e.target.value })}
                              className="text-sm mt-2 w-full h-24"
                            />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-2">{slide.speakerNotes || "No speaker notes provided."}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
             </CardContent>
           </Card>
        )}
      </div>
  );

  return (
    <div id="presentation-container" className="w-full max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-500 bg-background p-4">
      <div className={cn("flex justify-between items-start", isFullscreen && "hidden")}>
         <div>
            <Button size="sm" onClick={onReset} variant="outline" className="mb-4">
              <Sparkles className="mr-2 h-4 w-4" /> Create New
            </Button>
          </div>
         <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? <Save className="mr-2 h-4 w-4"/> : <Edit className="mr-2 h-4 w-4"/>}
            {isEditing ? 'Save Edits' : 'Edit Slides'}
          </Button>
          <Button size="sm" variant="outline" onClick={toggleFullscreen}>
             {isFullscreen ? <Minimize className="mr-2 h-4 w-4" /> : <Maximize className="mr-2 h-4 w-4" />}
             {isFullscreen ? 'Exit' : 'Fullscreen'}
            </Button>
         </div>
      </div>
      
      {presentationContent}

        <div className={cn("flex justify-center gap-2 md:gap-4 flex-wrap mt-6", isEditing && "hidden", isFullscreen && "!hidden")}>
           <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Theme:</span>
              <Select value={activeTheme} onValueChange={(value) => handleThemeChange(value as SlideTheme)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent>
                  {themeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                       <div className="flex items-center gap-2">
                        {option.icon}
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'preview' | 'content' | 'grid')}>
              <TabsList>
                <TabsTrigger value="preview"><Monitor className="mr-2 h-4 w-4"/>Preview</TabsTrigger>
                <TabsTrigger value="grid"><Grid className="mr-2 h-4 w-4"/>Grid</TabsTrigger>
                <TabsTrigger value="content"><FileText className="mr-2 h-4 w-4"/>Content</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button size="lg" onClick={handleGenerateAudio} disabled={isGeneratingAudio || !presentation.slides[currentSlideIndex]?.speakerNotes}>
                {isGeneratingAudio ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Volume2 className="mr-2 h-4 w-4" />}
                {isGeneratingAudio ? 'Generating...' : 'Play Audio'}
            </Button>
            
            <Sheet>
                <SheetTrigger asChild>
                    <Button size="lg" variant="outline"><MessageCircle className="mr-2 h-4 w-4"/>Ask a Question</Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
                    <SheetHeader>
                        <SheetTitle>Ask Your AI Assistant</SheetTitle>
                        <SheetDescription>
                            Get more details, practice your delivery, or ask for suggestions about your presentation.
                        </SheetDescription>
                    </SheetHeader>
                    <ScrollArea className="flex-1 pr-4 -mr-6" ref={chatScrollRef}>
                        <div className="space-y-4">
                            {chatHistory.map((msg, i) => (
                                <div key={i} className={cn("flex items-start gap-3", msg.role === 'user' ? 'justify-end' : '')}>
                                    {msg.role === 'assistant' && <div className="bg-primary rounded-full p-2 text-primary-foreground"><Sparkles className="h-5 w-5"/></div>}
                                    <div className={cn("rounded-lg p-3 max-w-[80%]", msg.role === 'user' ? 'bg-muted' : 'bg-card border')}>
                                      <ReactMarkdown className="prose prose-sm">{msg.content}</ReactMarkdown>
                                    </div>
                                </div>
                            ))}
                             {isReplying && (
                                <div className="flex items-start gap-3">
                                    <div className="bg-primary rounded-full p-2 text-primary-foreground"><Sparkles className="h-5 w-5"/></div>
                                    <div className="bg-card border rounded-lg p-3"><Loader2 className="h-5 w-5 animate-spin text-primary"/></div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                    <SheetFooter>
                       <form onSubmit={handleChatSubmit} className="flex w-full items-center gap-2">
                            <Input
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                placeholder="e.g., 'Expand on slide 3'"
                                disabled={isReplying}
                            />
                            <Button type="submit" disabled={isReplying || !chatInput.trim()}>
                                <SendHorizonal className="h-5 w-5" />
                            </Button>
                       </form>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="lg" disabled={isGeneratingPdf}>
                    {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                    {isGeneratingPdf ? 'Generating...' : 'Download'}
                    <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleDownloadPptx}>Download .pptx</DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadPdf}>Download .pdf</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isFullscreen && (
               <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="absolute top-4 right-4 z-50 bg-background/50 hover:bg-background/80">
                <X />
              </Button>
            )}
        </div>
        
        {audioUrl && !isEditing && (
          <div className="mt-4 flex justify-center">
            <audio controls autoPlay src={audioUrl}>
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {viewMode === 'preview' && !isEditing && !isFullscreen && (
           <div className="text-center text-sm text-muted-foreground">
             Slide {currentSlideIndex + 1} of {presentation.slides.length}
           </div>
        )}
    </div>
  );
}

    
