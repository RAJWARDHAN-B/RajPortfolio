import { useState, useCallback } from "react";
import NetflixIntro from "@/components/NetflixIntro";
import NetflixNav from "@/components/NetflixNav";
import HeroSection from "@/components/HeroSection";
import ContentRow, {
  projectItems,
  experienceItems,
  skillItems,
  techStackItems,
  languageItems,
  certificationItems
} from "@/components/ContentRow";
import AboutSection from "@/components/AboutSection";
import StrangerThings3D from "@/components/StrangerThings3D";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import SearchResults from "@/components/SearchResults";

const Index = () => {
  const [introComplete, setIntroComplete] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const allItems = [
    ...projectItems,
    ...experienceItems,
    ...techStackItems,
    ...languageItems,
    ...skillItems,
    ...certificationItems,
  ];

  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {!introComplete && <NetflixIntro onComplete={handleIntroComplete} />}

      {introComplete && (
        <>
          <NetflixNav onSearch={(query) => setSearchQuery(query)} />

          {searchQuery ? (
            <div className="relative z-10">
              <SearchResults query={searchQuery} items={allItems} />
            </div>
          ) : (
            <>
              <HeroSection />

              <div className="-mt-16 relative z-10">
                <section id="projects">
                  <ContentRow title="Featured Projects" items={projectItems} />
                </section>

                <section id="experience">
                  <ContentRow title="Experience & Education" items={experienceItems} />
                </section>

                <section id="techstack">
                  <ContentRow title="Tech Stack" items={techStackItems} />
                </section>

                <section id="languages">
                  <ContentRow title="Languages" items={languageItems} />
                </section>

                <section id="skills">
                  <ContentRow title="Skills & Technologies" items={skillItems} />
                </section>

                <section id="certifications">
                  <ContentRow title="Certifications" items={certificationItems} />
                </section>

                <AboutSection />
                <StrangerThings3D />
                <ContactSection />
                <Footer />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};


export default Index;
