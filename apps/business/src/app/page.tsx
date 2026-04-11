import { CtaSection } from "@/components/landing/cta-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { Footer } from "@/components/landing/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { MetricsBar } from "@/components/landing/metrics-bar";
import { Navbar } from "@/components/landing/navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <MetricsBar />
        <FeaturesSection />
        <HowItWorks />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
