import { lazy, Suspense } from 'react';
import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { TrustSignals } from './components/TrustSignals';
import { Services } from './components/Services';
import { VisionMissionValues } from './components/VisionMissionValues';
import { Branches } from './components/Branches';
import { Events } from './components/Events';
import { Ethics } from './components/Ethics';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { ScrollToTop } from './components/ScrollToTop';
import { StickyMobileContactBar } from './components/StickyMobileContactBar';
import { FloatingEventsCarousel } from './components/FloatingEventsCarousel';
import { PageViewTracker } from './components/PageViewTracker';

const AdminApp = lazy(() => import('./admin/AdminApp').then((module) => ({ default: module.AdminApp })));

export default function App() {
  if (window.location.pathname.startsWith('/admin')) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#f7f4f0] p-8 text-foreground">Loading admin...</div>}>
        <AdminApp />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <PageViewTracker />
      <Navigation />
      <Hero />
      <About />
      <TrustSignals />
      <Services />
      <VisionMissionValues />
      <Branches />
      <Events />
      <Ethics />
      <Contact />
      <Footer />
      <ScrollToTop />
      <FloatingEventsCarousel />
      <StickyMobileContactBar />
    </div>
  );
}
