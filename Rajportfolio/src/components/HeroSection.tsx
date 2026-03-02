import { motion } from "framer-motion";
import { Play, Info } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="home" className="relative h-screen w-full overflow-hidden">
      {/* Static Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt="Portfolio Background"
          className="w-full h-full object-cover"
        />
        <div className="netflix-gradient absolute inset-0" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end h-full px-4 md:px-12 pb-[15%]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-sm md:text-lg text-muted-foreground mb-2 tracking-widest uppercase">
            Portfolio • 2026 • Creative Developer
          </p>
          <h1 className="font-display text-5xl md:text-8xl lg:text-9xl text-foreground text-shadow-hero leading-none mb-4">
            RAJWARDHAN
          </h1>
          <p className="text-foreground/90 text-sm md:text-xl max-w-2xl mb-8 leading-relaxed">
            Crafting immersive digital experiences through full-stack development.
            Focused on building scalable applications with modern technologies and
            premium user interfaces.
          </p>

          <div className="flex gap-4">
            <button
              onClick={() => scrollTo("projects")}
              className="flex items-center gap-2 bg-foreground text-background px-6 md:px-10 py-2.5 md:py-4 rounded-sm font-semibold text-sm md:text-lg hover:bg-foreground/90 transition-all hover:scale-105"
            >
              <Play className="w-5 h-5 md:w-6 md:h-6 fill-current" />
              View Projects
            </button>
            <button
              onClick={() => scrollTo("about")}
              className="flex items-center gap-2 bg-muted/80 text-foreground px-6 md:px-10 py-2.5 md:py-4 rounded-sm font-semibold text-sm md:text-lg hover:bg-muted/60 backdrop-blur-md transition-all hover:scale-105"
            >
              <Info className="w-5 h-5 md:w-6 md:h-6" />
              More Info
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

