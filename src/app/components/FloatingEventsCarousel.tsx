import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Images, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

type EventPhoto = {
  id: string;
  public_url: string | null;
  caption: string | null;
  sort_order: number;
};

type EventAlbum = {
  id: string;
  title: string;
  event_date: string | null;
  description: string | null;
  event_photos: EventPhoto[];
};

export function FloatingEventsCarousel() {
  const [albums, setAlbums] = useState<EventAlbum[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase
      .from('event_albums')
      .select('id, title, event_date, description, event_photos(id, public_url, caption, sort_order)')
      .eq('is_public', true)
      .order('event_date', { ascending: false })
      .limit(10)
      .then(({ data }) => setAlbums((data ?? []) as EventAlbum[]));
  }, []);

  useEffect(() => {
    if (!isOpen || albums.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % albums.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [albums.length, isOpen]);

  if (albums.length === 0) {
    return null;
  }

  const activeAlbum = albums[activeIndex] ?? albums[0];
  const cover = getSortedPhotos(activeAlbum)[0];

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-xl md:bottom-6"
        aria-label="Show latest events"
      >
        <Images className="h-5 w-5" strokeWidth={1.8} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 z-40 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border bg-white shadow-2xl md:bottom-6">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/70">Latest Events</p>
        <button type="button" onClick={() => setIsOpen(false)} className="text-foreground/45 hover:text-primary" aria-label="Hide latest events">
          <X className="h-4 w-4" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' })}
        className="block w-full text-left"
      >
        <div className="aspect-[16/9] bg-secondary">
          {cover?.public_url ? (
            <img src={cover.public_url} alt={cover.caption || activeAlbum.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-primary/50">
              <Images className="h-8 w-8" strokeWidth={1.5} />
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] text-foreground/45">
            <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>{activeAlbum.event_date ? new Date(activeAlbum.event_date).toLocaleDateString() : 'PSYZYGY Event'}</span>
          </div>
          <h3 className="text-base font-semibold text-foreground" style={clampStyle(2)}>
            {activeAlbum.title}
          </h3>
          {activeAlbum.description && (
            <p className="mt-2 text-xs leading-relaxed text-foreground/55" style={clampStyle(2)}>
              {activeAlbum.description}
            </p>
          )}
          <span className="mt-3 inline-block text-xs font-semibold text-primary">View events</span>
        </div>
      </button>
      {albums.length > 1 && (
        <div className="flex items-center justify-between border-t border-border px-3 py-2">
          <button type="button" onClick={() => setActiveIndex((current) => (current - 1 + albums.length) % albums.length)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-secondary" aria-label="Previous latest event">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-foreground/45">{activeIndex + 1} / {albums.length}</span>
          <button type="button" onClick={() => setActiveIndex((current) => (current + 1) % albums.length)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-secondary" aria-label="Next latest event">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function getSortedPhotos(album: EventAlbum) {
  return [...(album.event_photos ?? [])]
    .filter((photo) => photo.public_url)
    .sort((a, b) => a.sort_order - b.sort_order);
}

function clampStyle(lines: number) {
  return {
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  } as const;
}
