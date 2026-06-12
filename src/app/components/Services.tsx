import { useState } from 'react';
import { MessageCircle, Monitor, ClipboardList, Briefcase, Target, BookOpen, Building2, FileText, ArrowRight } from 'lucide-react';

const services = [
  {
    icon: MessageCircle,
    title: 'Psychological Consultation & Counseling',
    description: 'Compassionate support for individuals and families navigating life challenges and mental health concerns, delivered face-to-face.',
    tag: 'Individual & Family',
  },
  {
    icon: Monitor,
    title: 'Telepsychology',
    description: 'Accessible online mental health services for clients in remote areas or with limited availability, connecting care to wherever you are.',
    tag: 'Online Services',
  },
  {
    icon: ClipboardList,
    title: 'Psychological Testing & Assessment',
    description: 'Comprehensive evaluations for children, adolescents, and adults to understand cognitive, emotional, and behavioral functioning.',
    tag: 'Assessment',
  },
  {
    icon: Briefcase,
    title: 'Employee Selection & Screening',
    description: 'Professional psychological screening services to support organizations in identifying qualified, well-suited candidates for their teams.',
    tag: 'Organizational',
  },
  {
    icon: Target,
    title: 'Executive Profiling',
    description: 'In-depth psychological assessment services to help companies identify and select competent leaders for key strategic positions.',
    tag: 'Leadership',
  },
  {
    icon: BookOpen,
    title: 'CPD Programs',
    description: 'Affordable and high-quality Continuing Professional Development programs designed for mental health and allied health professionals.',
    tag: 'Professional Dev.',
  },
  {
    icon: Building2,
    title: 'Workplace Mental Health Initiatives',
    description: 'Flexible, inclusive programs designed to promote employee well-being, reduce burnout, and strengthen organizational health.',
    tag: 'Corporate',
  },
  {
    icon: FileText,
    title: 'Program Design & Consultation',
    description: 'Expert guidance in developing evidence-based mental health policies, programs, and organizational strategies tailored to your needs.',
    tag: 'Advisory',
  },
];

export function Services() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section id="services" className="py-24 lg:py-32 bg-[#f7f4f0]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Section header */}
        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-12 mb-16 items-end">
          <div>
            <p
              className="text-xs tracking-[0.2em] uppercase text-accent font-semibold mb-4"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              What We Offer
            </p>
            <h2
              className="text-4xl sm:text-5xl font-normal text-foreground leading-[1.15]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Services tailored
              <br />
              <em className="italic text-primary">to your needs.</em>
            </h2>
          </div>
          <div className="lg:max-w-lg lg:ml-auto">
            <p
              className="text-base text-foreground/60 leading-relaxed font-light"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              We provide comprehensive psychological services with professionalism and heart-centered care.
              All services are in accordance with the highest professional ethical standards.
            </p>
          </div>
        </div>

        {/* Service cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden shadow-sm">
          {services.map((service, index) => {
            const Icon = service.icon;
            const isHovered = hoveredIndex === index;
            return (
              <div
                key={index}
                className={`relative p-7 cursor-default transition-all duration-300 ${
                  isHovered ? 'bg-primary text-white' : 'bg-white'
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Number */}
                <span
                  className={`block text-[10px] tracking-[0.2em] uppercase font-semibold mb-5 transition-colors ${
                    isHovered ? 'text-white/50' : 'text-foreground/30'
                  }`}
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  0{index + 1}
                </span>

                {/* Icon */}
                <div className="mb-4">
                  <Icon
                    className={`w-6 h-6 transition-colors ${isHovered ? 'text-white' : 'text-primary'}`}
                    strokeWidth={1.5}
                  />
                </div>

                {/* Title */}
                <h3
                  className={`text-sm font-semibold leading-snug mb-3 transition-colors ${
                    isHovered ? 'text-white' : 'text-foreground'
                  }`}
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {service.title}
                </h3>

                {/* Description — shows on hover */}
                <p
                  className={`text-xs leading-relaxed font-light transition-all duration-300 ${
                    isHovered ? 'text-white/80 opacity-100' : 'text-foreground/50 opacity-80'
                  }`}
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {service.description}
                </p>

                {/* Tag */}
                <div className="mt-5">
                  <span
                    className={`inline-block text-[10px] tracking-wide px-2 py-0.5 rounded-full transition-colors ${
                      isHovered
                        ? 'bg-white/20 text-white/80'
                        : 'bg-primary/8 text-primary/60'
                    }`}
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {service.tag}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ethical note */}
        <div className="mt-10 flex items-start gap-3 max-w-2xl mx-auto text-center justify-center">
          <p
            className="text-xs text-foreground/40 leading-relaxed italic"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            All services are provided in accordance with professional ethical standards.
            We do not make diagnostic claims or treatment guarantees through this website.
          </p>
        </div>
      </div>
    </section>
  );
}
