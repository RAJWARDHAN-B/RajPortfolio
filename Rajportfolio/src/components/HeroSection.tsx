import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { ContentItem, projectItems, experienceItems } from "./ContentRow";

const heroItems: ContentItem[] = [...projectItems.slice(0, 3), ...experienceItems.slice(0, 3)];

const HeroSection = () => {
  const [current, setCurrent] = useState(0);
  const item = heroItems[current];

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % heroItems.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + heroItems.length) % heroItems.length);
  }, []);

  // Auto-advance every 8 seconds
  useEffect(() => {
    const interval = setInterval(next, 8000);
    return () => clearInterval(interval);
  }, [next]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="home" className="relative h-screen w-full overflow-hidden">
      {/* Background images with crossfade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          <div className="netflix-gradient absolute inset-0" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end h-full px-4 md:px-12 pb-[15%]">
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm md:text-lg text-muted-foreground mb-2 tracking-widest uppercase">
              {item.category} • {item.year}
            </p>
            <h1 className="font-display text-4xl md:text-7xl lg:text-8xl text-foreground text-shadow-hero leading-none mb-3">
              {item.title.toUpperCase()}
            </h1>
            <p className="text-foreground/80 text-sm md:text-lg max-w-xl mb-6 leading-relaxed line-clamp-3">
              {item.longDescription}
            </p>

            <div className="flex flex-wrap gap-2 mb-5">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-foreground/10 text-foreground/80 px-3 py-1 rounded-sm"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => scrollTo("projects")}
                className="flex items-center gap-2 bg-foreground text-background px-5 md:px-8 py-2 md:py-3 rounded-sm font-semibold text-sm md:text-base hover:bg-foreground/80 transition-colors"
              >
                <Play className="w-5 h-5 fill-current" />
                View Details
              </button>
              <button
                onClick={() => scrollTo("about")}
                className="flex items-center gap-2 bg-muted/80 text-foreground px-5 md:px-8 py-2 md:py-3 rounded-sm font-semibold text-sm md:text-base hover:bg-muted/50 transition-colors"
              >
                <Info className="w-5 h-5" />
                More Info
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel controls */}
        <div className="absolute bottom-8 right-4 md:right-12 flex items-center gap-3 z-20">
          <button
            onClick={prev}
            className="w-10 h-10 rounded-full border border-muted-foreground/50 flex items-center justify-center hover:border-foreground transition-colors bg-background/30 backdrop-blur-sm"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>

          {/* Dots */}
          <div className="flex gap-1.5">
            {heroItems.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`h-0.5 rounded-full transition-all duration-300 ${
                  idx === current
                    ? "w-6 bg-foreground"
                    : "w-3 bg-muted-foreground/50 hover:bg-muted-foreground"
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-10 h-10 rounded-full border border-muted-foreground/50 flex items-center justify-center hover:border-foreground transition-colors bg-background/30 backdrop-blur-sm"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
