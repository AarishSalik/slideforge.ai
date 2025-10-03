
import { Bot, Edit3, Image as ImageIcon, Link as LinkIcon, Film, Wind, PictureInPicture, BarChart, MousePointerClick } from 'lucide-react';
import Link from 'next/link';
import NextLink from 'next/link';

export default function LearnMorePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <Bot className="h-6 w-6" />
          <span className="sr-only">SlideForge AI</span>
        </Link>
         <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/create" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Create
          </Link>
          <Link href="/learn-more" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Learn More
          </Link>
        </nav>
      </header>
       <main className="flex-1">
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                    <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Key Features</div>
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">How It Works</h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Generate presentations in multiple ways, tailored to your content and needs.
                    </p>
                </div>
                <div className="mx-auto grid max-w-3xl gap-y-16">
                    {/* Feature 1 */}
                    <div className="grid gap-1">
                        <div className="flex items-center gap-4">
                            <div className="bg-primary text-primary-foreground rounded-full p-3 flex-shrink-0">
                                <Edit3 className="h-6 w-6" />
                            </div>
                            <h3 className="text-2xl font-bold">From a Simple Prompt</h3>
                        </div>
                        <p className="text-muted-foreground ml-16">
                            Have an idea? Just describe your topic. Our AI will research, structure, and design a complete, ready-to-use presentation from scratch.
                        </p>
                    </div>
                    {/* Feature 2 */}
                    <div className="grid gap-1">
                        <div className="flex items-center gap-4">
                            <div className="bg-primary text-primary-foreground rounded-full p-3 flex-shrink-0">
                                <LinkIcon className="h-6 w-6" />
                            </div>
                            <h3 className="text-2xl font-bold">From Any URL</h3>
                        </div>
                        <p className="text-muted-foreground ml-16">
                            Found a great article or YouTube video? Provide the link, and we'll summarize the key points into a concise and informative slide deck.
                        </p>
                    </div>
                    {/* Feature 3 */}
                    <div className="grid gap-1">
                        <div className="flex items-center gap-4">
                            <div className="bg-primary text-primary-foreground rounded-full p-3 flex-shrink-0">
                                <ImageIcon className="h-6 w-6" />
                            </div>
                            <h3 className="text-2xl font-bold">From an Image</h3>
                        </div>
                        <p className="text-muted-foreground ml-16">
                            Turn your thoughts into a presentation. Snap a photo of your whiteboard scribbles, a document, or handwritten notes, and our AI will digitize and organize them into slides.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <section id="future-implementations" className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                    <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Coming Soon</div>
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Future Implementations</h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        We're constantly innovating. Here's a sneak peek at what's next for SlideForge AI.
                    </p>
                </div>
                <div className="mx-auto grid max-w-5xl items-center gap-8">
                    <div className="flex flex-col justify-center space-y-8">
                         <div className="flex items-start gap-4">
                            <div className="bg-primary text-primary-foreground rounded-full p-3 flex-shrink-0">
                                <PictureInPicture className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">AI-Generated Images</h3>
                                <p className="text-muted-foreground mt-1">
                                    Move beyond stock photos. Our next generation of AI will create custom, highly relevant images for your slides based on the content, ensuring a perfect visual match every time.
                                </p>
                            </div>
                        </div>
                         <div className="flex items-start gap-4">
                            <div className="bg-primary text-primary-foreground rounded-full p-3 flex-shrink-0">
                                <Wind className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">Dynamic Animations</h3>
                                <p className="text-muted-foreground mt-1">
                                    Bring your slides to life with intelligent, one-click animations. Our AI will suggest and apply tasteful transitions and effects to highlight key points and keep your audience engaged.
                                </p>
                            </div>
                        </div>
                         <div className="flex items-start gap-4">
                            <div className="bg-primary text-primary-foreground rounded-full p-3 flex-shrink-0">
                                <Film className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">Short Animated Video Clips</h3>
                                <p className="text-muted-foreground mt-1">
                                    Illustrate complex ideas with short, AI-generated video clips. From animated data visualizations to moving diagrams, video will make your presentations more impactful.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="bg-primary text-primary-foreground rounded-full p-3 flex-shrink-0">
                                <BarChart className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">AI-Powered Data Visualization</h3>
                                <p className="text-muted-foreground mt-1">
                                    Simply provide your raw data, and our AI will automatically generate clear, insightful charts and graphs, choosing the best format to tell your story.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="bg-primary text-primary-foreground rounded-full p-3 flex-shrink-0">
                                <MousePointerClick className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">Interactive Polls & Q&A</h3>
                                <p className="text-muted-foreground mt-1">
                                    Engage your audience directly by having the AI generate and insert live polls, quizzes, and Q&A sessions based on your presentation content.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 SlideForge AI. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
           <NextLink href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </NextLink>
          <NextLink href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </NextLink>
        </nav>
      </footer>
    </div>
  );
}
