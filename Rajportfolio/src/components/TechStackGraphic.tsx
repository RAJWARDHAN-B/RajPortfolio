import { motion } from "framer-motion";
import { 
  Database,
  Server,
  Terminal,
  Cpu,
  Code2
} from "lucide-react";

const techCategories = [
  {
    title: "Backend & APIs",
    icon: <Server className="w-5 h-5 text-primary" />,
    items: [
      { name: "FastAPI", color: "hover:text-teal-400" },
      { name: "Django", color: "hover:text-green-500" },
      { name: "Node.js", color: "hover:text-green-400" },
      { name: "REST APIs", color: "hover:text-blue-400" },
      { name: "MySQL", color: "hover:text-blue-500" },
      { name: "MongoDB", color: "hover:text-green-500" }
    ],
    className: "md:col-span-2"
  },
  {
    title: "Programming Languages",
    icon: <Terminal className="w-5 h-5 text-primary" />,
    items: [
      { name: "Python", color: "hover:text-yellow-400" },
      { name: "C++", color: "hover:text-blue-500" },
      { name: "Java", color: "hover:text-orange-500" },
      { name: "JavaScript", color: "hover:text-yellow-300" },
      { name: "SQL", color: "hover:text-blue-300" }
    ],
    className: "md:col-span-1"
  },
  {
    title: "Applied ML & AI",
    icon: <Cpu className="w-5 h-5 text-primary" />,
    items: [
      { name: "PyTorch", color: "hover:text-orange-400" },
      { name: "TensorFlow", color: "hover:text-orange-500" },
      { name: "scikit-learn", color: "hover:text-orange-300" },
      { name: "OpenCV", color: "hover:text-blue-400" },
      { name: "Hugging Face Transformers", color: "hover:text-yellow-400" },
      { name: "LangChain", color: "hover:text-green-400" }
    ],
    className: "md:col-span-2"
  },
  {
    title: "Engineering Toolkit",
    icon: <Code2 className="w-5 h-5 text-primary" />,
    items: [
      { name: "Unit Testing", color: "hover:text-green-400" },
      { name: "Git", color: "hover:text-orange-400" },
      { name: "Docker", color: "hover:text-blue-400" },
      { name: "Weights & Biases", color: "hover:text-yellow-400" },
      { name: "Debugging & Logs", color: "hover:text-red-400" }
    ],
    className: "md:col-span-1"
  },
  {
    title: "Computer Science Foundations",
    icon: <Database className="w-5 h-5 text-primary" />,
    items: [
      { name: "Data Structures & Algorithms", color: "hover:text-blue-400" },
      { name: "Object-Oriented Programming", color: "hover:text-purple-400" },
      { name: "DBMS", color: "hover:text-cyan-400" },
      { name: "Operating Systems", color: "hover:text-orange-400" },
      { name: "Networking", color: "hover:text-green-400" }
    ],
    className: "md:col-span-3"
  }
];

const TechStackGraphic = () => {
  return (
    <div className="px-[4%] py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {techCategories.map((category, catIdx) => (
          <motion.div
            key={category.title}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: catIdx * 0.1 }}
            viewport={{ once: true }}
            className={`${category.className} bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:border-primary/30 transition-all duration-500 group`}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform duration-500">
                {category.icon}
              </div>
              <h3 className="text-2xl font-display text-foreground tracking-wide">{category.title}</h3>
            </div>

            <div className="flex flex-wrap gap-3">
              {category.items.map((item, itemIdx) => (
                <motion.div
                  key={item.name}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className={`px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-sm font-medium text-muted-foreground ${item.color} transition-all duration-300 flex items-center gap-2 cursor-default hover:bg-white/10 hover:border-white/10`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                  {item.name}
                </motion.div>
              ))}
            </div>

            {/* Background decoration */}
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              {category.icon && <div className="scale-[4] origin-top-right">{category.icon}</div>}
            </div>
          </motion.div>
        ))}

        {/* Floating elements section for "all" */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="md:col-span-3 mt-8 p-12 rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-transparent border border-white/5 relative overflow-hidden text-center"
        >
          <div className="relative z-10">
            <h4 className="text-4xl font-display text-foreground mb-4">BUILT END TO END</h4>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From shipping backend features and training pipelines to validating changes with unit tests, I take ideas through implementation, debugging, and delivery.
            </p>
          </div>
          
          {/* Animated background shapes */}
          <motion.div 
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-24 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px]"
          />
          <motion.div 
            animate={{ 
              rotate: -360,
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-24 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px]"
          />
        </motion.div>
      </div>
    </div>
  );
};

export default TechStackGraphic;
