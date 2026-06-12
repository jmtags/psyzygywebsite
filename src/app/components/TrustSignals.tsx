import { Award, HeartHandshake, MapPinned, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';

const trustSignals = [
  {
    icon: Award,
    value: '10+',
    label: 'Years of Service',
    detail: 'Serving communities across Central Luzon and Mindoro since 2015.',
  },
  {
    icon: MapPinned,
    value: '3',
    label: 'Branch Locations',
    detail: 'Accessible care through Mabalacat, Tarlac, and Calapan branches.',
  },
  {
    icon: ShieldCheck,
    value: 'PRC',
    label: 'Licensed Care',
    detail: 'Services are handled in line with professional standards and ethical practice.',
  },
];

const carePrinciples = [
  {
    icon: HeartHandshake,
    title: 'Care with compassion',
    text: 'Clients are welcomed with warmth, respect, and sensitivity at every step.',
  },
  {
    icon: UsersRound,
    title: 'Support for every stage',
    text: 'Services are available for individuals, families, schools, companies, and organizations.',
  },
  {
    icon: Sparkles,
    title: 'Ethical and confidential',
    text: 'Each concern is approached with privacy, professionalism, and thoughtful care.',
  },
];

export function TrustSignals() {
  return (
    <section className="py-24 lg:py-32 bg-[#f7f4f0]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-[0.95fr_1.25fr] gap-12 lg:gap-20 items-start">
          <div>
            <p
              className="text-xs tracking-[0.2em] uppercase text-accent font-semibold mb-4"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Trusted Care
            </p>
            <h2
              className="text-4xl sm:text-5xl font-normal text-foreground leading-[1.15] mb-6"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Confidence built
              <br />
              <em className="italic text-primary">through care.</em>
            </h2>
            <p
              className="text-sm text-foreground/60 leading-relaxed font-light mb-8 max-w-md"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              PSYZYGY Psychological Center, Inc. centers every service on credible practice,
              compassionate support, and ethical mental health care.
            </p>

            <div className="rounded-lg border border-primary/15 bg-white p-6">
              <p
                className="text-[10px] tracking-[0.18em] uppercase text-primary/60 font-semibold mb-3"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Professional Leadership
              </p>
              <h3
                className="text-2xl font-normal text-foreground mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Dr. Josevy A. Taguibao
              </h3>
              <p
                className="text-sm font-semibold text-primary tracking-wide mb-3"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                RPsy, RGC, LPT
              </p>
              <p
                className="text-sm text-foreground/60 leading-relaxed font-light"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                The center's care is guided by professional experience, heart-centered service,
                and a commitment to responsible psychological practice.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-4">
              {trustSignals.map((signal) => {
                const Icon = signal.icon;
                return (
                  <div key={signal.label} className="rounded-lg bg-white border border-border p-5">
                    <Icon className="w-5 h-5 text-primary mb-5" strokeWidth={1.5} />
                    <p
                      className="text-3xl font-semibold text-primary leading-none mb-2"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {signal.value}
                    </p>
                    <h3
                      className="text-sm font-semibold text-foreground mb-2"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      {signal.label}
                    </h3>
                    <p
                      className="text-xs text-foreground/55 leading-relaxed font-light"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      {signal.detail}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {carePrinciples.map((principle) => {
                const Icon = principle.icon;
                return (
                  <div key={principle.title} className="rounded-lg border border-primary/10 bg-primary/5 p-5">
                    <Icon className="w-5 h-5 text-primary mb-4" strokeWidth={1.5} />
                    <h3
                      className="text-sm font-semibold text-foreground mb-2"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      {principle.title}
                    </h3>
                    <p
                      className="text-xs text-foreground/60 leading-relaxed font-light"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      {principle.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
