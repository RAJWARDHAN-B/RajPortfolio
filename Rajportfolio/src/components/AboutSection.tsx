import { motion } from "framer-motion";
import { User, MapPin, Calendar, Award, FileText, Download, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

const AboutSection = () => {
  return (
    <section id="about" className="py-16 px-4 md:px-12">
      <h2 className="netflix-section-title text-foreground mb-8">About Me</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-card rounded-sm p-6 md:p-8 border border-border"
        >
          <h3 className="font-display text-3xl md:text-4xl text-foreground mb-4">
            THE STORY SO FAR
          </h3>
          <p className="text-muted-foreground leading-relaxed mb-4">
            I am a B.E. Information Technology student at PICT Pune (CGPA 9.3/10, graduating 2027) and a Software Engineering Intern at Michelin. I build full-stack products and AI-enabled workflows across Python, backend systems, and modern web stacks.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Recent work spans chatbot features, an ERP/MES platform for precision manufacturing, and applied ML systems. My research experience includes computer vision at IIT Mandi and ML systems work at IIT Kharagpur.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button
              className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2 px-6"
              onClick={() => window.open("/Rajwardhan_Ashok_Bhandigare.pdf", "_blank")}
            >
              <FileText className="w-4 h-4" />
              View Full Resume
            </Button>
            <Button
              variant="outline"
              className="border-neutral-700 hover:bg-white/10 flex items-center gap-2 px-6"
              onClick={() => {
                const link = document.createElement('a');
                link.href = '/Rajwardhan_Ashok_Bhandigare.pdf';
                link.download = 'Rajwardhan_Resume.pdf';
                link.click();
              }}
            >
              <Download className="w-4 h-4" />
              Download CV
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 gap-4"
        >
          {[
            { icon: User, label: "Current Role", value: "Software Engineering Intern" },
            { icon: MapPin, label: "Location", value: "Michelin · Pune, India" },
            { icon: Calendar, label: "Education", value: "B.E. Information Technology" },
            { icon: Award, label: "Graduation · CGPA", value: "2027 · 9.3 / 10" },
          ].map(({ icon: Icon, label, value }, idx) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx, duration: 0.4 }}
              viewport={{ once: true }}
              className="bg-card rounded-sm p-5 border border-border hover:border-primary/30 transition-colors"
            >
              <Icon className="w-6 h-6 text-primary mb-3" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
              <p className="text-foreground font-semibold text-sm mt-1">{value}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="mt-8 max-w-6xl border-t border-border pt-6">
        <h3 className="flex items-center gap-2 font-display text-xl text-foreground mb-3">
          <Trophy className="w-5 h-5 text-primary" />
          COMPETITION HIGHLIGHTS
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          CodeChef 3-Star · LeetCode max rating 1544 · Ranked 6th among 2,000+ at an IIIT Hyderabad competition · Smart India Hackathon 2024 college semi-finalist (top 25 teams)
        </p>
      </div>
    </section>
  );
};

export default AboutSection;
