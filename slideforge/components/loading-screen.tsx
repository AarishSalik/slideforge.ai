'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const messages = [
  "Analyzing your prompt...",
  "Consulting with digital muses...",
  "Structuring your narrative...",
  "Gathering visuals and data...",
  "Designing your slides...",
  "Adding a touch of AI magic...",
  "Almost there...",
];

export function LoadingScreen() {
  const [currentMessage, setCurrentMessage] = useState(messages[0]);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setCurrentMessage(messages[index]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Forging your presentation</h2>
        <p className="text-muted-foreground transition-all duration-300">{currentMessage}</p>
      </div>
    </div>
  );
}
