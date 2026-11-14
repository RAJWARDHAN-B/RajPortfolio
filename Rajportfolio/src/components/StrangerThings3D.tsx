import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, X } from "lucide-react";
import type { ContentItem } from "@/data/portfolio";

type SceneComponent = typeof import("./StrangerThingsScene")["default"];

const StrangerThings3D = () => {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [SceneComponent, setSceneComponent] = useState<SceneComponent | null>(null);
  const [selectedProject, setSelectedProject] = useState<ContentItem | null>(null);

  const enterScene = async () => {
    if (SceneComponent) {
      setActive(true);
      return;
    }

    setLoadError(false);
    setLoading(true);
    try {
      const { default: Scene } = await import("./StrangerThingsScene");
      setSceneComponent(() => Scene);
      setActive(true);
    } catch (error) {
      console.error("Unable to load the portfolio's 3D scene.", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="3d-mode" className="py-16 px-4 md:px-12">
      <h2 className="netflix-section-title text-foreground mb-4">Enter The Upside Down</h2>
      <p className="text-muted-foreground text-sm px-[4%] mb-6 max-w-xl">
        Experience my projects in an immersive 3D environment inspired by Stranger Things.
        Click the cards to explore each project.
      </p>

      {!active ? (
        <motion.div
          className="px-[4%]"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <button
            onClick={enterScene}
            disabled={loading}
            className="group relative overflow-hidden bg-card border border-primary/30 rounded-sm px-10 py-5 font-display text-2xl tracking-wider text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-500 disabled:cursor-wait disabled:opacity-70"
          >
            <span className="relative z-10 flex items-center gap-3">
              {loading ? "LOADING 3D MODE..." : "ENTER 3D MODE"}
              {!loading && <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 group-hover:via-primary/20 transition-all duration-500" />
          </button>
          {loadError && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              The 3D scene could not be loaded. Please try again; the rest of the portfolio is still available.
            </p>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "80vh" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative rounded-sm overflow-hidden border border-primary/20"
        >
          <button
            type="button"
            aria-label="Exit 3D mode"
            onClick={() => {
              setActive(false);
              setSelectedProject(null);
            }}
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-primary transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>

          {SceneComponent && <SceneComponent onSelectProject={setSelectedProject} />}

          <AnimatePresence>
            {selectedProject && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-card via-card/95 to-transparent p-6 md:p-8"
              >
                <button
                  type="button"
                  aria-label="Close project details"
                  onClick={() => setSelectedProject(null)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
                <p className="text-primary text-sm font-semibold mb-1">
                  {selectedProject.match} • {selectedProject.category}
                </p>
                <h3 className="font-display text-2xl md:text-4xl text-foreground mb-2">
                  {selectedProject.title.toUpperCase()}
                </h3>
                <p className="text-foreground/80 text-sm max-w-2xl leading-relaxed mb-3">
                  {selectedProject.longDescription}
                </p>
                {selectedProject.url && (
                  <a
                    href={selectedProject.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-3 inline-block text-sm font-semibold text-primary hover:underline"
                  >
                    Visit project
                  </a>
                )}
                <div className="flex flex-wrap gap-2">
                  {selectedProject.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  );
};

export default StrangerThings3D;
