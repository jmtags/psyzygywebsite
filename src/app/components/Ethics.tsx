import { Lock, Scale, Shield, CircleCheck } from 'lucide-react';

const principles = [
  {
    icon: Lock,
    title: 'Confidentiality',
    description: 'Your privacy is paramount. All client information is handled with the utmost confidentiality in accordance with professional standards.',
  },
  {
    icon: Scale,
    title: 'Ethical Practice',
    description: 'We adhere to the Code of Ethics for Psychologists and all relevant guidelines established by Philippine regulatory bodies.',
  },
  {
    icon: Shield,
    title: 'Client Welfare',
    description: 'Your well-being and safety are at the heart of everything we do. We are committed to services that prioritize your best interests.',
  },
  {
    icon: CircleCheck,
    title: 'Regulatory Compliance',
    description: 'PSYZYGY operates with respect for Philippine laws, ethical guidelines, and professional psychological standards.',
  },
];

export function Ethics() {
  return (
    <section className="py-24 lg:py-32 bg-primary">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <p
            className="text-xs tracking-[0.2em] uppercase text-white/40 font-semibold mb-4"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Our Commitment
          </p>
          <h2
            className="text-4xl sm:text-5xl font-normal text-white leading-[1.15] mb-6"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Ethics &amp; Confidentiality
          </h2>
          <p
            className="max-w-xl mx-auto text-sm text-white/55 leading-relaxed font-light"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Our commitment to professional excellence is grounded in ethical practice and genuine respect for every individual we serve.
          </p>
        </div>

        {/* Principles grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden mb-14">
          {principles.map((principle) => {
            const Icon = principle.icon;
            return (
              <div
                key={principle.title}
                className="bg-primary p-7 hover:bg-white/5 transition-colors duration-300"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-6">
                  <Icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                </div>
                <h3
                  className="text-sm font-semibold text-white mb-3"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {principle.title}
                </h3>
                <p
                  className="text-xs text-white/55 leading-relaxed font-light"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {principle.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Central quote */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-8 h-px bg-white/20 mx-auto mb-8" />
          <p
            className="text-base sm:text-lg font-normal italic text-white/75 leading-relaxed"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            "All our psychologists are licensed professionals who uphold the ethical principles of
            beneficence, non-maleficence, justice, and respect for people's rights and dignity."
          </p>
          <p
            className="mt-4 text-xs tracking-wide text-white/35 font-medium"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            — PSYZYGY Psychological Center, Inc.
          </p>
        </div>
      </div>
    </section>
  );
}
