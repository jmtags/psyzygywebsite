import { GraduationCap, MessageCircle, MonitorCheck, School } from 'lucide-react';

const highlights = [
  {
    icon: School,
    title: 'Schools are welcome',
    text: 'Partner schools may inquire about OJT placement opportunities for psychology and related programs.',
  },
  {
    icon: GraduationCap,
    title: 'Students may apply',
    text: 'OJT students can message any branch to ask about requirements, availability, and next steps.',
  },
  {
    icon: MonitorCheck,
    title: 'OJT tracking system',
    text: 'Students can record time logs, while coordinators can monitor student status and rendered hours online.',
  },
];

export function OjtAnnouncement() {
  return (
    <section id="ojt-announcement" className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-border bg-[#f7f4f0]">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-8 sm:p-10 lg:p-12">
              <p
                className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                OJT Announcement
              </p>
              <h2
                className="text-4xl font-normal leading-[1.15] text-foreground sm:text-5xl"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                We are welcoming
                <br />
                <em className="italic text-primary">OJT students.</em>
              </h2>
              <p
                className="mt-5 max-w-2xl text-base font-light leading-relaxed text-foreground/65"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                PSYZYGY Psychological Center Inc. welcomes school inquiries and student inquiries for OJT opportunities.
                Schools and students may message us directly so our team can guide you with the process.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#contact"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  <MessageCircle className="h-4 w-4" /> Message Us
                </a>
              </div>
            </div>

            <div className="border-t border-border bg-white p-6 sm:p-8 lg:border-l lg:border-t-0">
              <div className="grid h-full gap-3">
                {highlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-xl border border-border bg-[#f7f4f0] p-5">
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary">
                        <Icon className="h-5 w-5" strokeWidth={1.5} />
                      </div>
                      <h3
                        className="text-sm font-semibold text-foreground"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        {item.title}
                      </h3>
                      <p
                        className="mt-2 text-sm font-light leading-relaxed text-foreground/60"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        {item.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
