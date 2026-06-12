import { ArrowRight, ChevronDown } from 'lucide-react';
import logoImage from 'figma:asset/3f22aafd57fb7e51342ec2f8e809e8c46ef58cba.png';

export function Hero() {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden bg-[#f7f4f0]">
      {/* Split layout */}
      <div className="flex-1 grid lg:grid-cols-2 min-h-screen">

        {/* Left — Content */}
        <div className="relative z-10 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 pt-28 pb-16 lg:pt-32">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-8">
            <img src={logoImage} alt="" className="h-10 w-10 object-contain opacity-70" />
            <span
              className="text-xs tracking-[0.2em] uppercase text-primary/70 font-medium"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Est. 2015
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-normal leading-[1.1] text-foreground mb-6"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Your Mental
            <br />
            Health Care
            <br />
            <em className="text-primary italic">with a Heart.</em>
          </h1>

          {/* Subtext */}
          <p
            className="text-base sm:text-lg text-foreground/65 leading-relaxed max-w-md mb-10 font-light"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            A premier psychological consultancy serving individuals, families, schools, and organizations
            across Central Luzon and Mindoro since 2015.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 mb-16">
            <button
              onClick={() => scrollToSection('services')}
              className="group inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-white text-sm font-semibold tracking-wide rounded-full hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:translate-y-[-1px]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Explore Our Services
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-foreground/20 text-foreground/70 text-sm font-medium tracking-wide rounded-full hover:border-primary hover:text-primary transition-all duration-300"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              About Us
            </button>
          </div>

          {/* Trust stats */}
          <div className="grid grid-cols-3 gap-6 border-t border-border pt-8 max-w-md">
            {[
              { value: '10+', label: 'Years of Service' },
              { value: '3', label: 'Branch Locations' },
              { value: 'PRC', label: 'Licensed & Registered' },
            ].map((stat) => (
              <div key={stat.label}>
                <div
                  className="text-2xl font-semibold text-primary leading-none mb-1"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {stat.value}
                </div>
                <div
                  className="text-xs text-foreground/50 leading-tight font-medium"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Photo panel */}
        <div className="relative hidden lg:block bg-primary/5">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(https://images.unsplash.com/photo-1535300759075-961ae19672e4?w=900&h=1200&fit=crop&auto=format)`,
              backgroundColor: '#c8dcea',
            }}
          />
          {/* Soft blue tint overlay */}
          <div className="absolute inset-0 bg-primary/25 mix-blend-multiply" />
          {/* Warm gradient fade to left */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#f7f4f0] via-[#f7f4f0]/20 to-transparent" />

          {/* Floating card */}
          <div className="absolute bottom-12 left-12 right-12 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-white">
            <p
              className="text-base font-normal italic text-foreground/70 leading-relaxed"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              "Dedicated to making quality psychological care accessible to every Filipino, wherever they are."
            </p>
            <div className="flex items-center gap-3 mt-4">
              <img src={logoImage} alt="" className="h-8 w-8 object-contain" />
              <div>
                <p className="text-xs font-semibold text-primary tracking-wide" style={{ fontFamily: 'var(--font-body)' }}>PSYZYGY Psychological Center Inc.</p>
                <p className="text-xs text-foreground/50" style={{ fontFamily: 'var(--font-body)' }}>Central Luzon & Mindoro</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 lg:left-auto lg:translate-x-0 lg:right-[50%] lg:mr-8">
        <span className="text-[10px] tracking-widest uppercase text-foreground/40" style={{ fontFamily: 'var(--font-body)' }}>Scroll</span>
        <ChevronDown className="w-4 h-4 text-foreground/40 animate-bounce" />
      </div>
    </section>
  );
}
