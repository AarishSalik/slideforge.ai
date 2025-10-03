
import { Button } from '@/components/ui/button';
import { ArrowRight, Bot } from 'lucide-react';
import NextLink from 'next/link';
import Image from 'next/image';


export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <NextLink href="/" className="flex items-center justify-center" prefetch={false}>
          <Bot className="h-6 w-6" />
          <span className="sr-only">SlideForge AI</span>
        </NextLink>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <NextLink href="/create" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Create
          </NextLink>
          <NextLink href="/learn-more" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Learn More
          </NextLink>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center gap-6 text-center lg:flex-row lg:items-center lg:gap-12 lg:text-left">
              <div className="flex flex-col justify-center space-y-4 lg:w-[550px]">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-800 to-green-400">
                    From Idea to Impact, Instantly
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl mx-auto lg:mx-0">
                    SlideForge AI transforms your prompts, links, and even photos of notes into stunning, professional presentations in seconds. Save time, spark creativity, and impress your audience.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center lg:justify-start">
                  <Button asChild size="lg">
                    <NextLink href="/create">
                      Get Started Free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </NextLink>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <NextLink href="/learn-more">
                      Learn More
                    </NextLink>
                  </Button>
                </div>
              </div>
              <Image
                src="https://picsum.photos/seed/hero-ai/1200/800"
                width="1200"
                height="800"
                alt="An AI generated image showing an abstract concept of presentation creation"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:w-[650px]"
                data-ai-hint="futuristic presentation abstract"
              />
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
