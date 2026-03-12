import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import tudumSound from "@/assets/sound/netflix-tudum-sfx-n-c.mp3";

const NetflixIntro = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState<"sound" | "letter" | "done">("sound");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(tudumSound);
    audioRef.current = audio;
    audio.volume = 0.8;

    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;

    const startSequence = () => {
      setPhase("sound");
      timer1 = setTimeout(() => setPhase("letter"), 500);
      timer2 = setTimeout(() => {
        setPhase("done");
        onComplete();
      }, 4500);
    };

    const playAudio = () => {
      audio.play().then(() => {
        console.log("Audio playing successfully");
      }).catch((err) => {
        console.warn("Autoplay blocked, continuing without sound:", err);
      });
      // Always start the sequence, even if audio is blocked
      startSequence();
    };

    playAudio();

    // Fallback: Play on first click if blocked
    const handleFirstInteraction = () => {
      if (audio.paused) {
        audio.play().catch(console.error);
      }
      window.removeEventListener("click", handleFirstInteraction);
    };

    window.addEventListener("click", handleFirstInteraction);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      audio.pause();
      window.removeEventListener("click", handleFirstInteraction);
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
          <div className="relative w-full max-w-[600px] px-8 flex justify-center items-center">
            <motion.img
              src="/Rnetflixfulltext.png"
              alt="RAJWARDHAN"
              className="w-full h-auto drop-shadow-[0_0_50px_rgba(229,9,20,0.6)]"
              initial={{ scale: 0.5, opacity: 0, filter: "brightness(0)" }}
              animate={{
                scale: phase === "letter" ? [0.5, 1, 1.1, 12] : 0.5,
                opacity: phase === "letter" ? [0, 1, 1, 0] : 0,
                filter: phase === "letter" ? ["brightness(0)", "brightness(1)", "brightness(1.2)", "brightness(2)"] : "brightness(0)"
              }}
              transition={{
                duration: 4,
                times: [0, 0.1, 0.8, 1],
                ease: "easeInOut"
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NetflixIntro;