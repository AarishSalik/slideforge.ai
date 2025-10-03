
'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Link as LinkIcon, Image as ImageIcon, Upload, AlertTriangle, Users, Info } from 'lucide-react';

import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generatePresentationAction, generatePresentationFromUrlAction, generatePresentationFromImageAction } from '@/app/actions';
import { PresentationViewer } from '@/components/presentation-viewer';
import type { PresentationData } from '@/lib/types';
import { LoadingScreen } from './loading-screen';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { allExamplePrompts } from '@/lib/example-prompts';
import Image from 'next/image';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';

// Function to shuffle an array and return the first few elements
function getShuffledPrompts(count: number) {
  const shuffled = [...allExamplePrompts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}


export function PresentationGenerator() {
  const [prompt, setPrompt] = useState('');
  const [url, setUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [audience, setAudience] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [examplePrompts, setExamplePrompts] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setExamplePrompts(getShuffledPrompts(5));
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError(null);
    setPresentation(null);

    const result = await generatePresentationAction(prompt, audience);

    if (result.success && result.data) {
      setPresentation(result.data);
    } else {
      setError(result.error || 'An unexpected error occurred.');
    }

    setIsLoading(false);
  };
  
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsLoading(true);
    setError(null);
    setPresentation(null);

    const result = await generatePresentationFromUrlAction(url, audience);

    if (result.success && result.data) {
      setPresentation(result.data);
    } else {
      setError(result.error || 'An unexpected error occurred.');
    }

    setIsLoading(false);
  };

  const handleImageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile || !imagePreview) return;
  
    setIsLoading(true);
    setError(null);
    setPresentation(null);
  
    const result = await generatePresentationFromImageAction(imagePreview, audience);
  
    if (result.success && result.data) {
      setPresentation(result.data);
    } else {
      setError(result.error || 'An unexpected error occurred.');
    }
  
    setIsLoading(false);
  };
  
  const commonFormFields = (
     <div className="space-y-2">
        <Label htmlFor="audience" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Target Audience (Optional)
        </Label>
        <Input
          id="audience"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="e.g., 'High school students', 'Executive board', 'Technical experts'"
          className="text-base"
        />
        <p className="text-xs text-muted-foreground">Tell the AI who this presentation is for to tailor the tone and complexity.</p>
    </div>
  );

  const reset = () => {
    setPresentation(null);
    setError(null);
    setPrompt('');
    setUrl('');
    setImageFile(null);
    setImagePreview(null);
    setAudience('');
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (presentation) {
    return <PresentationViewer presentation={presentation} onReset={reset} />;
  }

  return (
    <div className="w-full max-w-2xl">
      <Card className="shadow-2xl shadow-primary/10">
        <Tabs defaultValue="prompt" className="w-full">
          <CardHeader>
             <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="prompt"><Sparkles className="mr-2"/>From Prompt</TabsTrigger>
                <TabsTrigger value="url"><LinkIcon className="mr-2"/>From URL</TabsTrigger>
                <TabsTrigger value="image"><ImageIcon className="mr-2"/>From Image</TabsTrigger>
              </TabsList>
          </CardHeader>
          <TabsContent value="prompt">
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <CardDescription>
                  Tell us what your presentation is about. Or try one of our examples.
                </CardDescription>
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., 'Create a presentation about the future of renewable energy...'"
                  rows={4}
                  className="text-base"
                />
                 {commonFormFields}
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Not sure where to start? Try these:</p>
                    <div className="flex flex-wrap gap-2">
                        {examplePrompts.map((p, i) => (
                            <Button key={i} variant="outline" size="sm" onClick={() => setPrompt(p)}>
                                {p}
                            </Button>
                        ))}
                    </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" size="lg" className="w-full" disabled={!prompt}>
                  Generate Presentation
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          <TabsContent value="url">
            <form onSubmit={handleUrlSubmit}>
              <CardContent className="space-y-4">
                <CardDescription>
                  Enter a URL and let AI create a presentation from its content.
                </CardDescription>
                 {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/article"
                  type="url"
                  className="text-base"
                />
                 {commonFormFields}
              </CardContent>
              <CardFooter>
                <Button type="submit" size="lg" className="w-full" disabled={!url}>
                  Generate from URL
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          <TabsContent value="image">
            <form onSubmit={handleImageSubmit}>
              <CardContent className="space-y-4">
                <CardDescription>
                  Upload an image of your notes or a document to generate a presentation.
                </CardDescription>
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div 
                  className={cn("w-full h-48 border-2 border-dashed border-muted-foreground/50 rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer hover:bg-muted/50")}
                  onClick={handleImageUploadClick}
                >
                  {imagePreview ? (
                    <Image src={imagePreview} alt="Image preview" width={200} height={192} className="max-h-full w-auto object-contain rounded-md" />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Upload className="mx-auto h-8 w-8 mb-2" />
                      <p>Click to upload an image</p>
                      <p className="text-xs">(PNG, JPG, or WebP)</p>
                    </div>
                  )}
                </div>
                 {commonFormFields}
                <Input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleImageChange}
                  accept="image/png, image/jpeg, image/webp"
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" size="lg" className="w-full" disabled={!imageFile}>
                  Generate from Image
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
