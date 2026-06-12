import { Building2, Mail, Phone } from 'lucide-react';

export function StickyMobileContactBar() {
  const scrollToBranches = () => {
    document.getElementById('branches')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(30,42,53,0.12)] backdrop-blur-md md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
        <a
          href="tel:09312037962"
          className="flex h-12 flex-col items-center justify-center gap-1 rounded-lg bg-primary text-white transition-colors hover:bg-primary/90"
          style={{ fontFamily: 'var(--font-body)' }}
          aria-label="Call PSYZYGY Psychological Center"
        >
          <Phone className="h-4 w-4" strokeWidth={1.8} />
          <span className="text-[11px] font-semibold leading-none">Call</span>
        </a>
        <a
          href="mailto:psyzygytarlac@psyzygyclinic.com"
          className="flex h-12 flex-col items-center justify-center gap-1 rounded-lg border border-border bg-white text-foreground/70 transition-colors hover:border-primary hover:text-primary"
          style={{ fontFamily: 'var(--font-body)' }}
          aria-label="Email PSYZYGY Psychological Center"
        >
          <Mail className="h-4 w-4" strokeWidth={1.8} />
          <span className="text-[11px] font-semibold leading-none">Email</span>
        </a>
        <button
          type="button"
          onClick={scrollToBranches}
          className="flex h-12 flex-col items-center justify-center gap-1 rounded-lg border border-border bg-white text-foreground/70 transition-colors hover:border-primary hover:text-primary"
          style={{ fontFamily: 'var(--font-body)' }}
          aria-label="View PSYZYGY branch locations"
        >
          <Building2 className="h-4 w-4" strokeWidth={1.8} />
          <span className="text-[11px] font-semibold leading-none">Branches</span>
        </button>
      </div>
    </div>
  );
}
