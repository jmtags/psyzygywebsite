import { MapPin, Phone, Mail } from 'lucide-react';

const contacts = [
  {
    branch: 'Pampanga',
    subtitle: 'Mabalacat City',
    details: [
      { icon: MapPin, text: 'Bldg 1, Unit 16, Xevera Plaza, Mabalacat City' },
      { icon: Phone, text: '0931 203 7963', link: 'tel:09312037963' },
      { icon: Mail, text: 'psyzygymabalacat@psyzygyclinic.com', link: 'mailto:psyzygymabalacat@psyzygyclinic.com' },
      { icon: Mail, text: 'psyzygymabalacat@gmail.com', link: 'mailto:psyzygymabalacat@gmail.com' },
    ],
  },
  {
    branch: 'Tarlac',
    subtitle: 'Tarlac City',
    details: [
      { icon: MapPin, text: '2nd Floor MAQS Business Center, San Rafael, Tarlac City' },
      { icon: Phone, text: '0931 203 7962', link: 'tel:09312037962' },
      { icon: Mail, text: 'psyzygytarlac@psyzygyclinic.com', link: 'mailto:psyzygytarlac@psyzygyclinic.com' },
      { icon: Mail, text: 'psyzygypsychcenter@gmail.com', link: 'mailto:psyzygypsychcenter@gmail.com' },
    ],
  },
  {
    branch: 'Calapan',
    subtitle: 'Calapan City, Mindoro',
    details: [
      { icon: MapPin, text: 'Mahogany St., Brgy. Sto. Niño, Calapan City, Philippines' },
      { icon: Phone, text: '0949 869 2264', link: 'tel:09498692264' },
      { icon: Mail, text: 'psyzygycalapan@psyzygyclinic.com', link: 'mailto:psyzygycalapan@psyzygyclinic.com' },
      { icon: Mail, text: 'psyzygycalapan@gmail.com', link: 'mailto:psyzygycalapan@gmail.com' },
    ],
  },
];

export function Contact() {
  return (
    <section id="contact" className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Header row */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16 items-end">
          <div>
            <p
              className="text-xs tracking-[0.2em] uppercase text-accent font-semibold mb-4"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Reach Us
            </p>
            <h2
              className="text-4xl sm:text-5xl font-normal text-foreground leading-[1.15]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              We are here
              <br />
              <em className="italic text-primary">to support you.</em>
            </h2>
          </div>
          <div className="lg:max-w-sm lg:ml-auto">
            <p
              className="text-sm text-foreground/60 leading-relaxed font-light mb-6"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Contact any of our branches directly for inquiries about our services. Our team looks
              forward to welcoming you with care and professionalism.
            </p>
            <div className="p-5 rounded-2xl bg-[#f7f4f0] border border-border">
              <p
                className="text-xs text-foreground/50 leading-relaxed font-light"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                For general inquiries or to schedule an appointment, please reach out via phone or email
                to your preferred branch. We do not accept online bookings through this website.
              </p>
            </div>
          </div>
        </div>

        {/* Contact cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {contacts.map((contact, i) => (
            <div
              key={i}
              className="relative p-8 rounded-2xl bg-[#f7f4f0] border border-border hover:border-primary/25 hover:shadow-md transition-all duration-300 group"
            >
              {/* Branch header */}
              <div className="mb-8">
                <h3
                  className="text-xl font-normal text-foreground mb-1"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {contact.branch}
                </h3>
                <p
                  className="text-xs text-foreground/45 font-medium tracking-wide"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {contact.subtitle}
                </p>
                <div className="mt-4 w-6 h-px bg-border group-hover:w-12 group-hover:bg-primary/30 transition-all duration-300" />
              </div>

              {/* Details */}
              <div className="space-y-4">
                {contact.details.map((detail, di) => {
                  const Icon = detail.icon;
                  return (
                    <div key={di} className="flex items-start gap-3.5">
                      <Icon className="w-4 h-4 text-primary/45 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                      {detail.link ? (
                        <a
                          href={detail.link}
                          className="text-sm text-foreground/65 hover:text-primary transition-colors font-light break-all leading-snug"
                          style={{ fontFamily: 'var(--font-body)' }}
                        >
                          {detail.text}
                        </a>
                      ) : (
                        <span
                          className="text-sm text-foreground/65 font-light leading-snug"
                          style={{ fontFamily: 'var(--font-body)' }}
                        >
                          {detail.text}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
