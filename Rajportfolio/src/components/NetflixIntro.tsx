import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import tudumSound from "@/assets/sound/netflix-tudum-sfx-n-c.mp3";

const NetflixIntro = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState<"sound" | "letter" | "done">("sound");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(tudumSound);
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
          <div className="netflix-intro-letter w-full max-w-[900px] px-4 py-8 flex justify-center items-center">
            <svg
              viewBox="0 0 900 200"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-auto drop-shadow-[0_0_25px_rgba(229,9,20,0.8)]"
            >
              <defs>
                <linearGradient id="netflixGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#E50914" />
                  <stop offset="100%" stopColor="#B20710" />
                </linearGradient>
              </defs>

              <text
                x="50%"
                y="100"
                fontFamily="'Bebas Neue', sans-serif"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="url(#netflixGradient)"
                className="select-none"
              >
                <tspan fontSize="120">R</tspan>
                <tspan fontSize="110">A</tspan>
                <tspan fontSize="100">J</tspan>
                <tspan fontSize="90">W</tspan>
                <tspan fontSize="80">A</tspan>
                <tspan fontSize="80">R</tspan>
                <tspan fontSize="90">D</tspan>
                <tspan fontSize="100">H</tspan>
                <tspan fontSize="110">A</tspan>
                <tspan fontSize="120">N</tspan>
              </text>
            </svg>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NetflixIntro;