import { useState, useCallback } from "react";
import NetflixIntro from "@/components/NetflixIntro";
import NetflixNav from "@/components/NetflixNav";
import HeroSection from "@/components/HeroSection";
import ContentRow, { projectItems, experienceItems, skillItems } from "@/components/ContentRow";
import AboutSection from "@/components/AboutSection";
// import StrangerThings3D from "@/components/StrangerThings3D";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

const Index = () => {
  const [introComplete, setIntroComplete] = useState(false);

  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {!introComplete && <NetflixIntro onComplete={handleIntroComplete} />}

      {introComplete && (
        <>
          <NetflixNav />
          <HeroSection />

          <div className="-mt-16 relative z-10">
            <section id="projects">
              <ContentRow title="Featured Projects" items={projectItems} />
            </section>

            <section id="experience">
              <ContentRow title="Experience & Education" items={experienceItems} />
            </section>

            <ContentRow title="Skills & Technologies" items={skillItems} />

            <AboutSection />
            {/* <StrangerThings3D /> */}
            <ContactSection />
            <Footer />
          </div>
        </>
      )}
    </div>
  );
};

export default Index;
