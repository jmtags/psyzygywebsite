import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Services } from './components/Services';
import { VisionMissionValues } from './components/VisionMissionValues';
import { Branches } from './components/Branches';
import { Ethics } from './components/Ethics';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { ScrollToTop } from './components/ScrollToTop';
import { StickyMobileContactBar } from './components/StickyMobileContactBar';

export default function App() {
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navigation />
      <Hero />
      <About />
      <Services />
      <VisionMissionValues />
      <Branches />
      <Ethics />
      <Contact />
      <Footer />
      <ScrollToTop />
      <StickyMobileContactBar />
    </div>
  );
}
