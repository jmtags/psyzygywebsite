import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import logoImage from 'figma:asset/3f22aafd57fb7e51342ec2f8e809e8c46ef58cba.png';

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { label: 'About', id: 'about' },
    { label: 'Services', id: 'services' },
    { label: 'Branches', id: 'branches' },
    { label: 'Contact', id: 'contact' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-[0_1px_20px_rgba(30,42,53,0.08)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 group"
          >
            <img
              src={logoImage}
              alt="PSYZYGY Logo"
              className="h-9 w-9 object-contain"
            />
            <div className="text-left">
              <span
                className="block text-base font-semibold tracking-widest text-primary leading-none"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                PSYZYGY
              </span>
              <span
                className="block text-[10px] tracking-wider text-foreground/50 leading-none mt-0.5"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Psychological Center Inc.
              </span>
            </div>
          </button>

          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-sm font-medium tracking-wide text-foreground/70 hover:text-primary transition-colors duration-200"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => scrollToSection('contact')}
              className="ml-2 px-5 py-2 bg-primary text-primary-foreground text-sm font-medium tracking-wide rounded-full hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Get in Touch
            </button>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-full hover:bg-primary/10 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-primary" />
            ) : (
              <Menu className="w-5 h-5 text-primary" />
            )}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-border bg-white/95 backdrop-blur-md">
            <div className="flex flex-col pt-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="text-left px-4 py-3 text-sm font-medium text-foreground/70 hover:text-primary hover:bg-secondary/50 transition-colors"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {item.label}
                </button>
              ))}
              <div className="px-4 pt-3">
                <button
                  onClick={() => scrollToSection('contact')}
                  className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-full hover:bg-primary/90 transition-colors"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Get in Touch
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
