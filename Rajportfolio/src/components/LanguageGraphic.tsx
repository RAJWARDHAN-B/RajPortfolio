import { motion } from "framer-motion";
import { Languages as LanguageIcon } from "lucide-react";

const languages = [
  { name: "English", level: "Native", percentage: 100, color: "from-red-600 to-red-400" },
  { name: "Hindi", level: "Native", percentage: 100, color: "from-red-600 to-red-400" },
  { name: "German", level: "A2 - Elementary", percentage: 40, color: "from-red-700 to-red-500" },
];

const LanguageGraphic = () => {
  return (
    <div className="px-[4%] py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {languages.map((lang, index) => (
          <motion.div
            key={lang.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.8, 
              delay: index * 0.2,
              type: "spring",
              stiffness: 100 
            }}
            viewport={{ once: true }}
            className="relative group perspective-1000"
          >
            <div className="relative bg-card/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:bg-card/60 transition-all duration-500 overflow-hidden">
              {/* Animated Background Pulse */}
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors duration-700" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <LanguageIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-display text-foreground tracking-wide leading-none">{lang.name}</h3>
                    <p className="text-primary font-medium text-sm mt-1 uppercase tracking-tighter italic">Proficiency: {lang.level}</p>
                  </div>
                </div>

                {/* Modern Indicator */}
                <div className="relative pt-4">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium">Competency</span>
                    <span className="text-2xl font-display text-foreground/80">{lang.percentage}%</span>
                  </div>
                  
                  <div className="h-2 w-full bg-white/5 rounded-full relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${lang.percentage}%` }}
                      transition={{ 
                        duration: 2, 
                        delay: 0.8 + index * 0.2, 
                        ease: [0.16, 1, 0.3, 1] 
                      }}
                      viewport={{ once: true }}
                      className={`h-full bg-gradient-to-r ${lang.color} relative`}
                    >
                      {/* Glossy effect */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                      
                      {/* Glow tip */}
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary blur-sm rounded-full" />
                    </motion.div>
                  </div>

                  {/* Marker points */}
                  <div className="flex justify-between mt-3 text-[9px] text-muted-foreground/50 font-bold uppercase tracking-widest">
                    <span>A1</span>
                    <span>B1</span>
                    <span>C1</span>
                    <span>Native</span>
                  </div>
                </div>
              </div>

              {/* Decorative side number like Netflix top 10 */}
              <div className="absolute -bottom-6 -right-2 text-9xl font-display text-white/5 select-none pointer-events-none group-hover:text-primary/10 transition-colors duration-500">
                {index + 1}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default LanguageGraphic;
