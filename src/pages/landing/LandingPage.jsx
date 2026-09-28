import Navbar from "../../components/landing/Navbar";
import Hero from "../../components/landing/Hero";

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />

      <main>
        <Hero />
      </main>
    </div>
  );
}

export default LandingPage;
