import Navbar from "../../components/landing/Navbar";
import Hero from "../../components/landing/Hero";
import About from "../../components/landing/About";
import Features from "../../components/landing/Features";
import WhoWeServe from "../../components/landing/WhoWeServe";
import CTA from "../../components/landing/CTA";
import Footer from "../../components/landing/Footer";

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
