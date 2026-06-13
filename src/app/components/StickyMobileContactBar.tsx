import { useState } from 'react';
import { Building2, Mail, Phone, X } from 'lucide-react';

const branches = [
  {
    name: 'Mabalacat',
    phone: '0931 203 7963',
    phoneHref: 'tel:09312037963',
    email: 'psyzygymabalacat@psyzygyclinic.com',
  },
  {
    name: 'Tarlac',
    phone: '0931 203 7962',
    phoneHref: 'tel:09312037962',
    email: 'psyzygytarlac@psyzygyclinic.com',
  },
  {
    name: 'Calapan',
    phone: '0949 869 2264',
    phoneHref: 'tel:09498692264',
    email: 'psyzygycalapan@psyzygyclinic.com',
  },
];

export function StickyMobileContactBar() {
  const [activeAction, setActiveAction] = useState<'call' | 'email' | null>(null);

  const scrollToBranches = () => {
    document.getElementById('branches')?.scrollIntoView({ behavior: 'smooth' });
    setActiveAction(null);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(30,42,53,0.12)] backdrop-blur-md md:hidden">
      {activeAction && (
        <div className="mx-auto mb-3 max-w-md rounded-lg border border-border bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p
              className="text-xs font-semibold uppercase tracking-[0.15em] text-primary/70"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Select branch
            </p>
            <button
              type="button"
              onClick={() => setActiveAction(null)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/45 transition-colors hover:bg-secondary hover:text-primary"
              aria-label="Close branch selector"
            >
              <X className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
          <div className="grid gap-2">
            {branches.map((branch) => (
              <a
                key={branch.name}
                href={activeAction === 'call' ? branch.phoneHref : `mailto:${branch.email}`}
                className="flex min-h-12 items-center justify-between gap-3 rounded-lg bg-[#f7f4f0] px-4 py-3 text-left transition-colors hover:bg-primary/10"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                <span>
                  <span className="block text-sm font-semibold text-foreground">{branch.name}</span>
                  <span className="block break-all text-xs text-foreground/55">
                    {activeAction === 'call' ? branch.phone : branch.email}
                  </span>
                </span>
                {activeAction === 'call' ? (
                  <Phone className="h-4 w-4 flex-shrink-0 text-primary" strokeWidth={1.8} />
                ) : (
                  <Mail className="h-4 w-4 flex-shrink-0 text-primary" strokeWidth={1.8} />
                )}
              </a>
            ))}
          </div>
        </div>
      )}
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setActiveAction(activeAction === 'call' ? null : 'call')}
          className="flex h-12 flex-col items-center justify-center gap-1 rounded-lg bg-primary text-white transition-colors hover:bg-primary/90"
          style={{ fontFamily: 'var(--font-body)' }}
          aria-label="Select a branch to call"
        >
          <Phone className="h-4 w-4" strokeWidth={1.8} />
          <span className="text-[11px] font-semibold leading-none">Call</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveAction(activeAction === 'email' ? null : 'email')}
          className="flex h-12 flex-col items-center justify-center gap-1 rounded-lg border border-border bg-white text-foreground/70 transition-colors hover:border-primary hover:text-primary"
          style={{ fontFamily: 'var(--font-body)' }}
          aria-label="Select a branch to email"
        >
          <Mail className="h-4 w-4" strokeWidth={1.8} />
          <span className="text-[11px] font-semibold leading-none">Email</span>
        </button>
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
