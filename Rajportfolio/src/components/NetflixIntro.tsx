import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const NetflixIntro = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState<"sound" | "letter" | "done">("sound");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Use Netflix "ta-dum" sound from a public source
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
    audioRef.current = audio;
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Autoplay blocked, skip sound
    });

    const timer1 = setTimeout(() => setPhase("letter"), 500);
    const timer2 = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      audio.pause();
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-netflix-dark"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="netflix-intro-letter">
            <svg
              viewBox="0 0 111 30"
              className="w-48 md:w-72 lg:w-96"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M105.062 14.28L111 30c-1.75-.25-3.499-.563-5.28-.845l-3.345-8.686-3.437 7.969c-1.687-.282-3.344-.376-5.031-.595l5.97-13.124L94.25 0h5.19l3.094 7.781L105.875 0h5.187l-6 14.28zM90.469 0c-.062 4.436-.062 8.873-.062 13.31.062 1.563.25 3.56-.781 4.78C88.5 19.5 86.5 19.875 84.78 19.875c-1.5-.063-3.22-.5-4.22-1.656l2.844-2.969c.375.563.75 1.25 1.5 1.375.81.063 1.562-.375 1.812-1.156.375-1.282.22-2.75.282-4.094V0h3.469zM76.875 0h3.656v19.375H76.5l-6.437-12.437v12.437H66.5V0h3.937L76.875 12V0zM60.812 3.469c-1.687-.5-3.625-.75-5.343-.094-1.063.437-1.25 1.75-.594 2.5.782.844 2 .907 3.032 1.188 2.5.624 5.468 1.218 6.812 3.624.906 1.78.656 4.156-.625 5.657-1.781 1.937-4.688 2.312-7.188 1.937-1.969-.281-3.874-.969-5.562-1.906L52.78 13c1.782.844 3.813 1.625 5.813 1.25 1.031-.25 1.656-1.25 1.343-2.25-.343-1.094-1.562-1.375-2.5-1.719-2.53-.687-5.562-1.124-7-3.5-.843-1.5-.624-3.53.25-4.905C52.375.437 54.875 0 57.187 0c2.063.063 4.094.563 5.938 1.375l-2.313 2.094zM45.938 0v3.47h-5.97V19.374H36.5V3.47h-5.937V0h15.375zM27.5 0v3.47h-8.97v4.53h7.72v3.375h-7.72v4.625h9.22v3.375H15.063V0H27.5zM10.813 0v15.875L4.937 0H0v19.375h3.469V3.344l5.906 16.031h4.938V0h-3.5z"
                fill="hsl(var(--primary))"
              />
            </svg>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NetflixIntro;
