import Navbar from "@/presentation/components/landing/Navbar";
import Hero from "@/presentation/components/landing/Hero";
import About from "@/presentation/components/landing/About";
import Features from "@/presentation/components/landing/Features";
import WhoWeServe from "@/presentation/components/landing/WhoWeServe";
import CTA from "@/presentation/components/landing/CTA";
import Footer from "@/presentation/components/landing/Footer";

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />

      <main>
        <Hero />
        <About />
        <Features />
        <WhoWeServe />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

export default LandingPage;
