import { useState } from "react";
import Navbar from "@/presentation/components/landing/Navbar";
import Hero from "@/presentation/components/landing/Hero";
import About from "@/presentation/components/landing/About";
import Features from "@/presentation/components/landing/Features";
import WhoWeServe from "@/presentation/components/landing/WhoWeServe";
import CTA from "@/presentation/components/landing/CTA";
import Footer from "@/presentation/components/landing/Footer";
import PublicEmergencyAlert from "@/presentation/components/landing/PublicEmergencyAlert";

function LandingPage() {
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />

      <main>
        <Hero onEmergency={() => setEmergencyOpen(true)} />
        <About />
        <Features />
        <WhoWeServe />
        <CTA />
      </main>
      <Footer />
      <PublicEmergencyAlert open={emergencyOpen} onOpen={() => setEmergencyOpen(true)} onClose={() => setEmergencyOpen(false)} />
    </div>
  );
}

export default LandingPage;
