import { MapPin, Phone, Mail, ArrowRight, ExternalLink } from 'lucide-react';

const branches = [
  {
    name: 'Pampanga',
    city: 'Mabalacat City',
    address: 'Bldg 1, Unit 16, Xevera Plaza, Mabalacat City',
    mapQuery: 'PSYZYGY Psychological Center Mabalacat 15.2449761,120.5636047',
    phone: '0931 203 7963',
    emails: ['psyzygymabalacat@psyzygyclinic.com', 'psyzygymabalacat@gmail.com'],
    facebookUrl: 'https://web.facebook.com/PsyzygyMabalacat',
    index: '01',
  },
  {
    name: 'Tarlac',
    city: 'Tarlac City',
    address: '2nd Floor MAQS Business Center, San Rafael, Tarlac City',
    mapQuery: 'PSYZYGY Psychological Center Tarlac 15.454903,120.5997814',
    phone: '0931 203 7962',
    emails: ['psyzygytarlac@psyzygyclinic.com', 'psyzygypsychcenter@gmail.com'],
    facebookUrl: 'https://web.facebook.com/psyzygy',
    index: '02',
  },
  {
    name: 'Calapan',
    city: 'Calapan City, Mindoro',
    mapQuery: 'Psyzygy psychological center inc Calapan 13.4089138,121.1842373',
    address: 'Mahogany St., Brgy. Sto. Niño, Calapan City, Philippines',
    phone: '0949 869 2264',
    emails: ['psyzygycalapan@psyzygyclinic.com', 'psyzygycalapan@gmail.com'],
    facebookUrl: 'https://web.facebook.com/PsyzygyCalapan',
    index: '03',
  },
];

export function Branches() {
  return (
    <section id="branches" className="py-24 lg:py-32 bg-[#f7f4f0]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16">
          <div>
            <p
              className="text-xs tracking-[0.2em] uppercase text-accent font-semibold mb-4"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Find Us
            </p>
            <h2
              className="text-4xl sm:text-5xl font-normal text-foreground leading-[1.15]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Three branches,
              <br />
              <em className="italic text-primary">one commitment.</em>
            </h2>
          </div>
          <p
            className="text-sm text-foreground/55 max-w-xs font-light leading-relaxed"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Visit us at any of our locations across Central Luzon and Mindoro to begin your journey toward wellness.
          </p>
        </div>

        {/* Branch cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {branches.map((branch) => (
            <div
              key={branch.name}
              className="group bg-white rounded-2xl p-8 border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              {/* Number + city tag */}
              <div className="flex items-center justify-between mb-8">
                <span
                  className="text-[10px] tracking-[0.2em] uppercase text-foreground/30 font-semibold"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {branch.index}
                </span>
                <span
                  className="text-[10px] tracking-wide px-2.5 py-1 rounded-full bg-secondary text-foreground/50 font-medium"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {branch.city}
                </span>
              </div>

              {/* Branch name */}
              <h3
                className="text-2xl font-normal text-foreground mb-6"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Psyzygy –{' '}
                <em className="italic text-primary">{branch.name}</em>
              </h3>

              {/* Divider */}
              <div className="w-8 h-px bg-border mb-6 group-hover:w-16 group-hover:bg-primary/30 transition-all duration-300" />

              {/* Contact details */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-primary/50 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                  <span
                    className="text-sm text-foreground/65 leading-snug font-light"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {branch.address}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-primary/50 flex-shrink-0" strokeWidth={1.5} />
                  <a
                    href={`tel:${branch.phone.replace(/\s/g, '')}`}
                    className="text-sm text-foreground/65 hover:text-primary transition-colors font-light"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {branch.phone}
                  </a>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-primary/50 flex-shrink-0" strokeWidth={1.5} />
                  <div className="space-y-1">
                    {branch.emails.map((email) => (
                      <a
                        key={email}
                        href={`mailto:${email}`}
                        className="block text-xs text-foreground/65 hover:text-primary transition-colors break-all font-light"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        {email}
                      </a>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ExternalLink className="w-4 h-4 text-primary/50 flex-shrink-0" strokeWidth={1.5} />
                  <a
                    href={branch.facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-foreground/65 hover:text-primary transition-colors font-light"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    Facebook page
                  </a>
                </div>
              </div>

              {/* Map */}
              <div className="mt-6 overflow-hidden rounded-lg border border-border bg-secondary aspect-[4/3]">
                <iframe
                  title={`Google Map for Psyzygy ${branch.name}`}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(branch.mapQuery)}&output=embed`}
                  className="h-full w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* CTA */}
              <div className="mt-8 pt-6 border-t border-border">
                <a
                  href={`mailto:${branch.emails[0]}`}
                  className="group/link inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/70 transition-colors"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Send an inquiry
                  <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
