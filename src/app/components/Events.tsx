import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Image as ImageIcon, X } from 'lucide-react';
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

export function Events() {
  const [albums, setAlbums] = useState<EventAlbum[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedAlbum, setSelectedAlbum] = useState<EventAlbum | null>(null);
  const [showAllEvents, setShowAllEvents] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase
      .from('event_albums')
      .select('id, title, event_date, description, event_photos(id, public_url, caption, sort_order)')
      .eq('is_public', true)
      .order('event_date', { ascending: false })
      .then(({ data }) => {
        setAlbums((data ?? []) as EventAlbum[]);
      });
  }, []);

  useEffect(() => {
    if (albums.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % Math.min(albums.length, 10));
    }, 4500);

    return () => window.clearInterval(timer);
  }, [albums.length]);

  if (albums.length === 0) {
    return null;
  }

  const featuredAlbums = albums.slice(0, 10);
  const activeAlbum = featuredAlbums[activeIndex] ?? featuredAlbums[0];
  const activePhotos = getSortedPhotos(activeAlbum);
  const activeCover = activePhotos[0];
  const visibleAlbums = showAllEvents ? albums : albums.slice(0, 6);

  return (
    <section id="events" className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
          <div>
            <p
              className="text-xs tracking-[0.2em] uppercase text-accent font-semibold mb-4"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Events
            </p>
            <h2
              className="text-4xl sm:text-5xl font-normal text-foreground leading-[1.15]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Moments from
              <br />
              <em className="italic text-primary">our community.</em>
            </h2>
          </div>
          <p
            className="text-sm text-foreground/55 max-w-xs font-light leading-relaxed"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            A look at PSYZYGY activities, learning sessions, and community initiatives.
          </p>
        </div>

        {activeAlbum && (
          <div className="mb-10 overflow-hidden rounded-lg border border-border bg-[#f7f4f0]">
            <button
              type="button"
              onClick={() => setSelectedAlbum(activeAlbum)}
              className="grid w-full text-left lg:grid-cols-[1.15fr_0.85fr]"
            >
              <div className="relative aspect-[16/9] bg-secondary lg:aspect-auto lg:min-h-[320px]">
                {activeCover?.public_url ? (
                  <img src={activeCover.public_url} alt={activeCover.caption || activeAlbum.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-primary/50">
                    <ImageIcon className="h-12 w-12" strokeWidth={1.5} />
                  </div>
                )}
                <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Latest Events
                </div>
              </div>
              <div className="flex flex-col justify-center p-6 lg:p-8">
                <EventDate date={activeAlbum.event_date} />
                <h3 className="mt-4 text-3xl font-normal text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                  {activeAlbum.title}
                </h3>
                {activeAlbum.description && (
                  <p className="mt-3 text-sm text-foreground/60 leading-relaxed font-light" style={clampStyle(3)}>
                    {activeAlbum.description}
                  </p>
                )}
                <span className="mt-6 text-sm font-semibold text-primary">Read full event</span>
              </div>
            </button>
            {featuredAlbums.length > 1 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <button
                  type="button"
                  onClick={() => setActiveIndex((current) => (current - 1 + featuredAlbums.length) % featuredAlbums.length)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-foreground/60 hover:text-primary"
                  aria-label="Previous event"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex gap-1.5">
                  {featuredAlbums.map((album, index) => (
                    <button
                      key={album.id}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={`h-2 rounded-full transition-all ${index === activeIndex ? 'w-6 bg-primary' : 'w-2 bg-border'}`}
                      aria-label={`Show event ${index + 1}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveIndex((current) => (current + 1) % featuredAlbums.length)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-foreground/60 hover:text-primary"
                  aria-label="Next event"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleAlbums.map((album) => {
            const photos = getSortedPhotos(album);
            const cover = photos[0];

            return (
              <article key={album.id} className="overflow-hidden rounded-lg border border-border bg-[#f7f4f0]">
                <button type="button" onClick={() => setSelectedAlbum(album)} className="block w-full text-left">
                <div className="aspect-[4/3] bg-secondary">
                  {cover?.public_url ? (
                    <img src={cover.public_url} alt={cover.caption || album.title} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-primary/50">
                      <ImageIcon className="h-10 w-10" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="mb-3 flex items-center gap-2 text-xs text-foreground/45">
                    <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.6} />
                    <span>{album.event_date ? new Date(album.event_date).toLocaleDateString() : 'PSYZYGY Event'}</span>
                  </div>
                  <h3 className="text-xl font-normal text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                    {album.title}
                  </h3>
                  {album.description && (
                    <p className="mt-2 text-sm text-foreground/60 leading-relaxed font-light" style={{ ...clampStyle(2), fontFamily: 'var(--font-body)' }}>
                      {album.description}
                    </p>
                  )}
                  {photos.length > 1 && (
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {photos.slice(1, 5).map((photo) => (
                        <img key={photo.id} src={photo.public_url!} alt={photo.caption || album.title} className="aspect-square rounded-md object-cover" loading="lazy" />
                      ))}
                    </div>
                  )}
                  <span className="mt-4 inline-block text-xs font-semibold text-primary">Read more</span>
                </div>
                </button>
              </article>
            );
          })}
        </div>

        {albums.length > 6 && (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAllEvents((current) => !current)}
              className="rounded-full border border-primary/25 px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {showAllEvents ? 'Show fewer events' : `View all events (${albums.length})`}
            </button>
          </div>
        )}
      </div>

      {selectedAlbum && (
        <EventDialog album={selectedAlbum} onClose={() => setSelectedAlbum(null)} />
      )}
    </section>
  );
}

function EventDialog({ album, onClose }: { album: EventAlbum; onClose: () => void }) {
  const photos = getSortedPhotos(album);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/70 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/60">Event Details</p>
            <h3 className="text-xl font-normal text-foreground" style={{ fontFamily: 'var(--font-display)' }}>{album.title}</h3>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground/60 hover:text-primary" aria-label="Close event dialog">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 lg:p-8">
          <EventDate date={album.event_date} />
          {album.description && (
            <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-foreground/70" style={{ fontFamily: 'var(--font-body)' }}>
              {album.description}
            </p>
          )}
          {photos.length > 0 && (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {photos.map((photo) => (
                <figure key={photo.id} className="overflow-hidden rounded-lg border border-border bg-[#f7f4f0]">
                  <img src={photo.public_url!} alt={photo.caption || album.title} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                  {photo.caption && <figcaption className="p-3 text-xs text-foreground/55">{photo.caption}</figcaption>}
                </figure>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EventDate({ date }: { date: string | null }) {
  return (
    <div className="flex items-center gap-2 text-xs text-foreground/45">
      <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.6} />
      <span>{date ? new Date(date).toLocaleDateString() : 'PSYZYGY Event'}</span>
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
