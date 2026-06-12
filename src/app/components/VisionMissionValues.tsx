import { useState } from 'react';

type Tab = 'vision' | 'mission' | 'values';

const tabs: { key: Tab; label: string }[] = [
  { key: 'vision', label: 'Vision' },
  { key: 'mission', label: 'Mission' },
  { key: 'values', label: 'Values' },
];

const content: Record<Tab, { headline: string; items: string[] }> = {
  vision: {
    headline: 'To be the leading center for psychological excellence in Central Luzon.',
    items: [
      'Recognized leader in professional psychological services',
      'Premier center for continuing professional development',
      'Trusted partner for executive search and selection',
      'Primary distributor of standardized psychological test materials',
      'Champion of workplace and organizational mental health programs',
    ],
  },
  mission: {
    headline: 'Making quality mental health care accessible to every Filipino.',
    items: [
      'Make mental health services accessible to far-flung municipalities and provinces in Central Luzon',
      'Assist companies and institutions in selecting competent leaders who drive growth and development',
      'Provide flexible and inclusive workplace mental health programs that promote productivity and well-being',
      'Offer affordable and high-quality CPD programs to professionals',
      'Supply schools, companies, and organizations with original, standardized test materials',
      'Conduct outreach programs for indigent Filipinos and inspire others to do the same',
    ],
  },
  values: {
    headline: 'Three pillars that guide every decision we make.',
    items: [
      'Faith — We are guided by God\'s wisdom and grace in all our actions and service',
      'Integrity — We uphold ethical, moral, and professional standards, earning the trust of every client',
      'Service — We are committed to holistic, humane, and high-quality care that every client deserves',
    ],
  },
};

export function VisionMissionValues() {
  const [activeTab, setActiveTab] = useState<Tab>('vision');
  const active = content[activeTab];

  return (
    <section className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Section label */}
        <p
          className="text-xs tracking-[0.2em] uppercase text-accent font-semibold mb-10 text-center"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Our Purpose
        </p>

        {/* Tab switcher */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center bg-[#f7f4f0] rounded-full p-1 gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-foreground/60 hover:text-foreground'
                }`}
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content — two column */}
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-16 items-start">

          {/* Left — headline + decoration */}
          <div className="relative">
            <div className="absolute -top-6 -left-6 w-32 h-32 rounded-full bg-primary/5" />
            <h2
              className="relative text-3xl sm:text-4xl lg:text-[2.4rem] font-normal text-foreground leading-[1.2] mb-8"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <em className="italic text-primary">{active.headline.split(' ').slice(0, 4).join(' ')}</em>{' '}
              {active.headline.split(' ').slice(4).join(' ')}
            </h2>

            {/* Decorative tab indicator line */}
            <div className="flex gap-2 mt-6">
              {tabs.map((tab) => (
                <div
                  key={tab.key}
                  className={`h-0.5 rounded-full transition-all duration-400 ${
                    activeTab === tab.key ? 'w-10 bg-primary' : 'w-4 bg-border'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Right — list items */}
          <div className="space-y-4">
            {active.items.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-5 rounded-xl border border-border hover:border-primary/20 hover:bg-primary/3 transition-all duration-200"
              >
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary mt-0.5"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {i + 1}
                </span>
                <p
                  className="text-sm text-foreground/70 leading-relaxed font-light"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
