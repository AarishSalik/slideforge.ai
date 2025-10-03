
import { PresentationGenerator } from '@/components/presentation-generator';
import { Bot } from 'lucide-react';
import Link from 'next/link';

export default function CreatePage() {
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
      <main className="container mx-auto flex flex-1 flex-col items-center justify-center p-4 md:p-8">
        <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-800 to-green-400">
            SlideForge AI
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
            Craft brilliant presentations from a single prompt, URL, or image.
            </p>
        </div>
        <PresentationGenerator />
      </main>
    </div>
  );
}
