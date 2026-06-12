import { ArrowRight, CalendarCheck, ShieldCheck } from 'lucide-react';

export function About() {
  const scrollToServices = () => {
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
  };

  const highlights = [
    {
      icon: CalendarCheck,
      label: 'Established 2015',
      detail: 'Over a decade serving individuals, families, schools, and institutions across Central Luzon.',
    },
    {
      icon: ShieldCheck,
      label: 'Professional Care',
      detail: 'Services are guided by professional psychological standards, confidentiality, and ethical practice.',
    },
  ];

  return (
    <section id="about" className="py-24 lg:py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Two-column asymmetric layout */}
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-16 lg:gap-24 items-center">

          {/* Left — Pull quote + tag */}
          <div className="relative">
            <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full bg-primary/6 blur-2xl" />
            <div
              className="text-xs tracking-[0.2em] uppercase text-accent font-semibold mb-6"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Who We Are
            </div>
            <blockquote
              className="text-3xl sm:text-4xl lg:text-[2.6rem] font-normal leading-[1.2] text-foreground mb-8"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              A clinic built on{' '}
              <em className="text-primary italic">compassion,</em>
              <br />
              not just credentials.
            </blockquote>
            <p
              className="text-base text-foreground/60 leading-relaxed mb-6 font-light"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              PSYZYGY Psychological Center, Inc. is a premier psychological consultancy dedicated to
              providing holistic, high-quality mental health services. We serve toddlers to older adults,
              as well as schools, companies, NGOs, and government institutions.
            </p>
            <p
              className="text-base text-foreground/60 leading-relaxed mb-10 font-light"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Guided by our tagline{' '}
              <em className="text-primary font-normal">"Your Mental Health Care with a Heart,"</em>{' '}
              every service we deliver is anchored in excellence, empathy, and genuine care.
            </p>
            <button
              onClick={scrollToServices}
              className="group inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              View our services
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Right — Credential cards + service list */}
          <div className="space-y-5">
            {highlights.map((h) => {
              const Icon = h.icon;
              return (
                <div
                  key={h.label}
                  className="flex items-start gap-5 p-6 rounded-2xl bg-[#f7f4f0] border border-border hover:shadow-sm transition-shadow"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3
                      className="text-sm font-semibold text-foreground mb-1 tracking-wide"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      {h.label}
                    </h3>
                    <p
                      className="text-sm text-foreground/60 leading-relaxed font-light"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      {h.detail}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Service list grid */}
            <div className="mt-6 p-6 rounded-2xl bg-primary/5 border border-primary/10">
              <p
                className="text-xs tracking-[0.15em] uppercase text-primary/60 font-semibold mb-4"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                What We Offer
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6">
                {[
                  'Psychological Consultation & Counseling',
                  'Telepsychology',
                  'Psychological Testing & Assessment',
                  'Employee Screening & Selection',
                  'Executive Profiling',
                  'CPD Programs',
                  'Workplace Mental Health Initiatives',
                  'Program Design & Policy Consultation',
                ].map((svc) => (
                  <div key={svc} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                    <span
                      className="text-xs text-foreground/70 font-light"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      {svc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
