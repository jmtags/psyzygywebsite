import { useEffect, useState } from 'react';
import { CalendarDays, Image as ImageIcon } from 'lucide-react';
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

  if (albums.length === 0) {
    return null;
  }

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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => {
            const photos = [...(album.event_photos ?? [])]
              .filter((photo) => photo.public_url)
              .sort((a, b) => a.sort_order - b.sort_order);
            const cover = photos[0];

            return (
              <article key={album.id} className="overflow-hidden rounded-lg border border-border bg-[#f7f4f0]">
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
                    <p className="mt-2 text-sm text-foreground/60 leading-relaxed font-light" style={{ fontFamily: 'var(--font-body)' }}>
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
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
