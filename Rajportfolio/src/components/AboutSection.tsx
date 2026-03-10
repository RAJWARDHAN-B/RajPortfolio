import { motion } from "framer-motion";
import { User, MapPin, Calendar, Award } from "lucide-react";

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
            Hello! I am a third-year IT Engineering student at Pune Institute of Computer Technology (PICT), Pune. I'm a passionate developer who loves turning complex problems into simple, beautiful, and intuitive solutions.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            When I'm not studying or building projects, you'll find me exploring new technologies,
            contributing to open-source, or participating in hackathons.
            I believe in writing clean, maintainable code and building seamless digital experiences.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 gap-4"
        >
          {[
            { icon: User, label: "Role", value: "IT Engineering Student" },
            { icon: MapPin, label: "Location", value: "Pune, India" },
            { icon: Calendar, label: "Experience", value: "3rd Year Student" },
            { icon: Award, label: "College", value: "PICT Pune" },
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
    </section>
  );
};

export default AboutSection;
