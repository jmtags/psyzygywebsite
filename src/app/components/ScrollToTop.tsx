import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsVisible(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-8 right-8 z-40 w-10 h-10 bg-foreground text-white rounded-full shadow-lg hover:bg-foreground/80 transition-all duration-300 hover:scale-105 flex items-center justify-center"
      aria-label="Scroll to top"
    >
      <ArrowUp className="w-4 h-4" strokeWidth={2} />
    </button>
  );
}
