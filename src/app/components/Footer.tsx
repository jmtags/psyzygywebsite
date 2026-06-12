import logoImage from 'figma:asset/3f22aafd57fb7e51342ec2f8e809e8c46ef58cba.png';

const navLinks = [
  { label: 'About Us', id: 'about' },
  { label: 'Services', id: 'services' },
  { label: 'Branches', id: 'branches' },
  { label: 'Contact', id: 'contact' },
];

const branches = [
  { name: 'Pampanga (Mabalacat)', email: 'psyzygymabalacat@gmail.com', phone: '0931 203 7963' },
  { name: 'Tarlac City', email: 'psyzygypsychcenter@gmail.com', phone: '0931 203 7962' },
  { name: 'Calapan City', email: 'psyzygycalapan@gmail.com', phone: '0949 869 2264' },
];

export function Footer() {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-foreground text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Main footer grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1.4fr] gap-12 py-16 border-b border-white/8">

          {/* Brand column */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img src={logoImage} alt="PSYZYGY Logo" className="h-9 w-9 object-contain opacity-80" />
              <div>
                <span
                  className="block text-sm font-semibold tracking-widest text-white leading-none"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  PSYZYGY
                </span>
                <span
                  className="block text-[10px] tracking-wider text-white/40 leading-none mt-0.5"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Psychological Center, Inc.
                </span>
              </div>
            </div>
            <p
              className="text-sm text-white/50 leading-relaxed font-light mb-5 max-w-xs"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Your Mental Health Care with a Heart. Serving Central Luzon and Mindoro since 2015.
            </p>
            <p
              className="text-xs text-white/30 font-light leading-relaxed max-w-xs"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Licensed by the Professional Regulation Commission (PRC). All services provided by qualified psychologists.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p
              className="text-[10px] tracking-[0.2em] uppercase text-white/30 font-semibold mb-5"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Navigation
            </p>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => scrollToSection(link.id)}
                    className="text-sm text-white/55 hover:text-white transition-colors font-light"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Branches */}
          <div>
            <p
              className="text-[10px] tracking-[0.2em] uppercase text-white/30 font-semibold mb-5"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Our Branches
            </p>
            <ul className="space-y-5">
              {branches.map((branch) => (
                <li key={branch.name}>
                  <p
                    className="text-sm font-medium text-white/70 mb-1"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {branch.name}
                  </p>
                  <a
                    href={`tel:${branch.phone.replace(/\s/g, '')}`}
                    className="block text-xs text-white/35 hover:text-white/60 transition-colors font-light"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {branch.phone}
                  </a>
                  <a
                    href={`mailto:${branch.email}`}
                    className="block text-xs text-white/35 hover:text-white/60 transition-colors font-light break-all"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {branch.email}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p
            className="text-xs text-white/25 font-light"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            © {new Date().getFullYear()} PSYZYGY Psychological Center, Inc. All rights reserved.
          </p>
          <p
            className="text-xs text-white/20 font-light italic text-center"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            This website is for informational purposes only and does not substitute professional psychological services.
          </p>
        </div>
      </div>
    </footer>
  );
}
