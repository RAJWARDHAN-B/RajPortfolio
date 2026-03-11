import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Plus, ThumbsUp, ChevronDown, X } from "lucide-react";

import project1 from "@/assets/project-1.jpg";
import project2 from "@/assets/project-2.jpg";
import project3 from "@/assets/project-3.jpg";
import project4 from "@/assets/project-4.jpg";
import project5 from "@/assets/project-5.jpg";
import project6 from "@/assets/project-6.jpg";

import aerolensImage from "@/assets/images/aerolens.png";
import emptycupsImage from "@/assets/images/emptycups.png";
import felecityImage from "@/assets/images/felecity.png";
import gignutImage from "@/assets/images/gignut.png";
import gleanImage from "@/assets/images/glean.png";
import learncraftImage from "@/assets/images/learncraft.png";
import lifesyncImage from "@/assets/images/lifesync.png";
import ovoImage from "@/assets/images/ovo.png";
import packmateImage from "@/assets/images/packmate.png";
import sanguinesagesImage from "@/assets/images/sanguinesages.png";
import sportsorcaImage from "@/assets/images/sportsorca.png";
import staticportfolioImage from "@/assets/images/staticportfolio.png";
import sudoqImage from "@/assets/images/sudoq.png";
import tindogImage from "@/assets/images/tindog.png";
import waste2worthImage from "@/assets/images/waste2worth.png";
import watchdogImage from "@/assets/images/watchdog.png";
import comingSoonImage from "@/assets/comingsoon.jpg";

export interface ContentItem {
  id: number;
  title: string;
  image: string;
  match: string;
  tags: string[];
  description: string;
  longDescription: string;
  year: string;
  category: string;
  url?: string;
}

const LikeButton = ({ size = "md" }: { size?: "sm" | "md" }) => {
  const [liked, setLiked] = useState(false);
  const [showBurst, setShowBurst] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
    if (!liked) {
      setShowBurst(true);
      setTimeout(() => setShowBurst(false), 800);
    }
  };

  const buttonClass = size === "sm" 
    ? "w-7 h-7 border" 
    : "w-9 h-9 border-2";
  
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";

  return (
    <div className="relative inline-block">
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`${buttonClass} rounded-full border-muted-foreground flex items-center justify-center transition-colors ${
          liked ? "bg-primary border-primary text-white" : "hover:border-foreground text-foreground"
        }`}
      >
        <motion.div
           animate={liked ? { scale: [1, 1.4, 1], rotate: [0, -15, 0] } : {}}
           transition={{ duration: 0.3 }}
        >
          <ThumbsUp className={`${iconSize} ${liked ? "fill-current" : ""}`} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {showBurst && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0], y: -40, scale: 1.5 }}
            exit={{ opacity: 0 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          >
            <div className="text-primary">
              <ThumbsUp className="w-8 h-8 fill-current blur-[1px]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const DetailModal = ({ item, onClose }: { item: ContentItem; onClose: () => void }) => (
  <AnimatePresence>
    <motion.div
      className="fixed inset-0 z-[150] flex items-start justify-center pt-8 md:pt-16 px-4 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <motion.div
        className="relative w-full max-w-3xl bg-card rounded-lg overflow-hidden shadow-2xl mb-16 z-10"
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25 }}
      >
        {/* Hero image */}
        <div className="relative aspect-video">
          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-card/80 flex items-center justify-center hover:bg-card transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>

          {/* Title overlay */}
          <div className="absolute bottom-6 left-6 right-6">
            <h3 className="font-display text-3xl md:text-5xl text-foreground text-shadow-hero mb-3">
              {item.title}
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => { if (item.url) window.open(item.url, '_blank'); }}
                className="flex items-center gap-2 bg-foreground text-background px-6 py-2 rounded-sm font-semibold text-sm hover:bg-foreground/80 transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
                View
              </button>
              <button className="w-9 h-9 rounded-full border-2 border-muted-foreground flex items-center justify-center hover:border-foreground transition-colors">
                <Plus className="w-5 h-5 text-foreground" />
              </button>
              <LikeButton />
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-primary font-bold">{item.match}</span>
            <span className="text-muted-foreground text-sm">{item.year}</span>
            <span className="border border-muted-foreground text-muted-foreground text-xs px-2 py-0.5 rounded">
              {item.category}
            </span>
          </div>

          <p className="text-foreground/90 leading-relaxed mb-6">{item.longDescription}</p>

          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground mb-1">
              <span className="text-foreground/70">Technologies: </span>
              {item.tags.join(", ")}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

const ContentRow = ({
  title,
  items,
}: {
  title: string;
  items: ContentItem[];
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  const scroll = (dir: "left" | "right") => {
    if (!rowRef.current) return;
    const amount = rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <>
      <div className="mb-8 group/row">
        <h2 className="netflix-section-title text-foreground">{title}</h2>

        <div className="relative">
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-8 z-40 w-12 bg-background/50 opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center"
          >
            <ChevronLeft className="w-8 h-8 text-foreground" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-8 z-40 w-12 bg-background/50 opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center"
          >
            <ChevronRight className="w-8 h-8 text-foreground" />
          </button>

          <div ref={rowRef} className="netflix-row">
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                className="flex-shrink-0 w-[85%] sm:w-[45%] md:w-[30%] lg:w-[22%] relative group/card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.4 }}
                viewport={{ once: true }}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className="netflix-card aspect-video bg-card/50 shadow-lg group-hover/card:ring-2 ring-primary/50 transition-all duration-300" onClick={() => setSelectedItem(item)}>
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Default info shown without hover */}
                  <div className={`absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 ${hoveredId === item.id ? 'opacity-0' : 'opacity-100'}`}>
                    <p className="text-sm font-bold text-white mb-0.5 line-clamp-1">{item.title}</p>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-primary font-bold">{item.match}</span>
                      <span className="text-gray-300 font-medium">• {item.category}</span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {hoveredId === item.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/20 flex flex-col justify-end p-4 backdrop-blur-[1px]"
                      >
                        <div className="flex gap-2 mb-3">
                          <button
                            className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.url) window.open(item.url, '_blank');
                            }}
                          >
                            <Play className="w-4 h-4 text-background fill-current ml-0.5" />
                          </button>
                          <button className="w-8 h-8 rounded-full bg-secondary/80 border border-muted-foreground/30 flex items-center justify-center hover:bg-secondary hover:border-foreground transition-all">
                            <Plus className="w-4 h-4 text-foreground" />
                          </button>
                          <LikeButton size="sm" />
                          <button
                            className="w-8 h-8 rounded-full bg-secondary/80 border border-muted-foreground/30 flex items-center justify-center hover:bg-secondary hover:border-foreground transition-all ml-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item);
                            }}
                          >
                            <ChevronDown className="w-4 h-4 text-foreground" />
                          </button>
                        </div>
                        <p className="text-sm font-bold text-white mb-0.5">{item.title}</p>
                        <p className="text-[11px] text-primary font-bold mb-1">{item.match}</p>
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          {item.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-[10px] text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">+{item.tags.length - 3}</span>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {selectedItem && (
        <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </>
  );
};

export const projectItems: ContentItem[] = [
  { id: 1, title: "Static Portfolio", image: staticportfolioImage, match: "100% Match", tags: ["HTML", "CSS", "JavaScript"], description: "Simple portfolio website in HTML, CSS, JavaScript", longDescription: "A simple portfolio website built using HTML, CSS, and JavaScript. Showcases static web development skills.", year: "2024", category: "Portfolio", url: "https://rajwardhan-b.github.io/rajportfoliostatic/" },
  { id: 2, title: "Gignut", image: gignutImage, match: "99% Match", tags: ["Web", "Fullstack"], description: "Placeholder description", longDescription: "Placeholder description for Gignut.", year: "2024", category: "Web App", url: "https://gignut.com" },
  { id: 3, title: "Watchdog", image: watchdogImage, match: "98% Match", tags: ["Web App"], description: "Placeholder description", longDescription: "Placeholder description for Watchdog.", year: "2024", category: "Web App", url: "https://watchdog-6s7x.onrender.com/" },
  { id: 4, title: "Packmate", image: packmateImage, match: "95% Match", tags: ["Streamlit"], description: "Placeholder description", longDescription: "Placeholder description for Packmate.", year: "2024", category: "Web App", url: "https://packmate-nqjjl4rmhwypmuy8tmdhid.streamlit.app/" },
  { id: 5, title: "LifeSync", image: lifesyncImage, match: "96% Match", tags: ["Web App"], description: "Placeholder description", longDescription: "Placeholder description for LifeSync.", year: "2024", category: "Web App", url: "https://life-sync-eta.vercel.app/" },
  { id: 6, title: "Waste2Worth", image: waste2worthImage, match: "97% Match", tags: ["Web App"], description: "Placeholder description", longDescription: "Placeholder description for Waste2Worth.", year: "2024", category: "Web App", url: "https://github.com/RAJWARDHAN-B/donateNGO" },
  { id: 7, title: "LearnCraft", image: learncraftImage, match: "99% Match", tags: ["Web App"], description: "Placeholder description", longDescription: "Placeholder description for LearnCraft.", year: "2024", category: "Web App", url: "https://learn-craft.vercel.app/" },
  { id: 8, title: "TinDog", image: tindogImage, match: "95% Match", tags: ["Web App"], description: "Placeholder description", longDescription: "Placeholder description for TinDog.", year: "2024", category: "Web App", url: "https://tindog-website-zeta.vercel.app/" },
  { id: 9, title: "Glean", image: gleanImage, match: "94% Match", tags: ["Web App"], description: "Placeholder description", longDescription: "Placeholder description for Glean.", year: "2024", category: "Web App", url: "https://glean-nu.vercel.app/home" },
  { id: 10, title: "SanguineSages", image: sanguinesagesImage, match: "98% Match", tags: ["Web App"], description: "Placeholder description", longDescription: "Placeholder description for SanguineSages.", year: "2024", category: "Web App", url: "https://sanguinesages.vercel.app/" },
  { id: 11, title: "Felecity", image: felecityImage, match: "96% Match", tags: ["Web App"], description: "Placeholder description", longDescription: "Placeholder description for Felecity.", year: "2024", category: "Web App", url: "https://felecity-frontend.vercel.app/" },
  { id: 12, title: "SudoQ", image: sudoqImage, match: "99% Match", tags: ["Web App"], description: "Placeholder description", longDescription: "Placeholder description for SudoQ.", year: "2024", category: "Web App", url: "https://cs-50-p-finalproject.vercel.app/" },
  { id: 13, title: "SportsOrca", image: sportsorcaImage, match: "94% Match", tags: ["Web App"], description: "Placeholder description", longDescription: "Placeholder description for SportsOrca.", year: "2024", category: "Web App", url: "https://sports-orca-mu.vercel.app/" },
  { id: 14, title: "EmptyCups", image: emptycupsImage, match: "95% Match", tags: ["Web App"], description: "Placeholder description", longDescription: "Placeholder description for EmptyCups.", year: "2024", category: "Web App", url: "https://empty-cups-inter-task.vercel.app/" },
  { id: 15, title: "AeroLens", image: aerolensImage, match: "97% Match", tags: ["Web App"], description: "Placeholder description", longDescription: "Placeholder description for AeroLens.", year: "2024", category: "Web App", url: "https://aerolens.streamlit.app/" },
  { id: 16, title: "OVO", image: ovoImage, match: "93% Match", tags: ["Web App"], description: "Placeholder description", longDescription: "Placeholder description for OVO.", year: "2024", category: "Web App", url: "https://ovoeval.streamlit.app/" },
  { id: 17, title: "Verdantia", image: comingSoonImage, match: "Coming Soon", tags: ["Project", "Upcoming"], description: "Green Tech Platform", longDescription: "Verdantia is an upcoming green technology platform focused on sustainable living and environmental awareness. Stay tuned for updates!", year: "2026", category: "Web App" },
];

export const experienceItems: ContentItem[] = [
  { 
    id: 6, 
    title: "Research Intern @ IIT Kharagpur", 
    image: comingSoonImage, 
    match: "Coming Soon", 
    tags: ["Research", "Upcoming"], 
    description: "Acceptance Received", 
    longDescription: "Incoming Research Internship at Indian Institute of Technology Kharagpur. Focus and project details to be updated shortly.", 
    year: "2026", 
    category: "Upcoming" 
  },
  { 
    id: 7, 
    title: "CV Research Intern @ IIT Mandi", 
    image: project2, 
    match: "Nov 2025 – Mar 2026", 
    tags: ["Computer Vision", "Deep Learning", "Research", "Python"], 
    description: "Solar Cell Defect Detection", 
    longDescription: "Conducting research on Solar Cell Defect Detection and classification using advanced Computer Vision techniques. Developed deep learning models to automate the identification of micro-cracks and anomalies in photovoltaic cells. Processed large-scale datasets to improve model accuracy and robustness for real-world industrial inspection.", 
    year: "2025 - 2026", 
    category: "Internship" 
  },
  { 
    id: 8, 
    title: "Software Dev Intern @ UNITECTURE", 
    image: project1, 
    match: "Dec 2025 – Feb 2026", 
    tags: ["Full Stack", "HRMS", "Workflow Automation", "React"], 
    description: "Internal HRMS Development", 
    longDescription: "Engineered an internal HRMS to streamline organizational workflows. Developed modules for employee data management, attendance tracking, leave processing and Task Management. Focused on creating a secure, user-centric interface to improve internal administrative efficiency.", 
    year: "2025 - 2026", 
    category: "Internship" 
  },
  { 
    id: 9, 
    title: "Full Stack Intern @ Unified Transformation", 
    image: project3, 
    match: "July 2025 – Feb 2026", 
    tags: ["FastAPI", "B2B", "API Design", "Deployment"], 
    description: "Developed gignut.com", 
    longDescription: "Developed gignut.com, a production-grade B2B web platform, handling end-to-end development and deployment. Designed and implemented scalable backend services using FastAPI to support core business workflows. Built secure and efficient REST APIs and integrated them with frontend components. Optimized API performance, database queries, and overall system responsiveness.", 
    year: "2025 - 2026", 
    category: "Internship" 
  },
  { 
    id: 10, 
    title: "Web Dev Intern @ Learncraft Engineering", 
    image: project5, 
    match: "May – June 2025", 
    tags: ["React.js", "Clean Architecture", "REST API", "Frontend"], 
    description: "Modular React Applications", 
    longDescription: "Developed modular and responsive React.js applications with a focus on clean architecture and performance. Collaborated with backend services and integrated REST APIs for production-grade deployments.", 
    year: "2025", 
    category: "Internship" 
  }
];

export const skillItems: ContentItem[] = [
  { id: 13, title: "React & Next.js", image: project3, match: "Expert", tags: ["Hooks", "SSR", "RSC", "Redux", "Zustand"], description: "5+ years", longDescription: "Deep expertise in React ecosystem including Next.js, server components, state management with Redux and Zustand, performance optimization, and building design systems. Contributed to open-source React libraries and authored technical blog posts on advanced patterns.", year: "5+ years", category: "Frontend" },
  { id: 14, title: "TypeScript", image: project1, match: "Expert", tags: ["Types", "Generics", "DX", "Zod"], description: "4+ years", longDescription: "Advanced TypeScript skills including complex generic types, utility types, discriminated unions, and type-safe API layers. Experience with Zod for runtime validation, tRPC for end-to-end type safety, and building type-safe design systems.", year: "4+ years", category: "Language" },
  { id: 15, title: "Node.js & Express", image: project4, match: "Advanced", tags: ["REST", "GraphQL", "Auth", "Prisma"], description: "4+ years", longDescription: "Extensive experience building RESTful and GraphQL APIs with Node.js. Proficient with Express, Fastify, and NestJS frameworks. Experience with database ORMs (Prisma, Sequelize), authentication (JWT, OAuth), and real-time communication (WebSockets, Socket.io).", year: "4+ years", category: "Backend" },
  { id: 16, title: "Cloud & DevOps", image: project2, match: "Advanced", tags: ["AWS", "Docker", "CI/CD", "Terraform"], description: "3+ years", longDescription: "Hands-on experience with AWS (Lambda, EC2, S3, RDS, CloudFront), containerization with Docker and Kubernetes, CI/CD pipelines with GitHub Actions, and infrastructure as code with Terraform. Certified AWS Solutions Architect Associate.", year: "3+ years", category: "Infrastructure" },
  { id: 17, title: "Python & ML", image: project5, match: "Intermediate", tags: ["TensorFlow", "Pandas", "Scikit", "FastAPI"], description: "2+ years", longDescription: "Experience with Python for data science and machine learning. Built predictive models using TensorFlow and scikit-learn, data pipelines with Pandas, and ML-serving APIs with FastAPI. Familiar with NLP, computer vision, and recommendation systems.", year: "2+ years", category: "Data Science" },
  { id: 18, title: "UI/UX Design", image: project6, match: "Advanced", tags: ["Figma", "Motion", "A11y", "Design Systems"], description: "3+ years", longDescription: "Strong eye for design with proficiency in Figma, prototyping, and design systems. Experience with motion design using Framer Motion and CSS animations. Advocate for accessibility (WCAG 2.1) and inclusive design practices.", year: "3+ years", category: "Design" },
];

export const techStackItems: ContentItem[] = [
  { id: 19, title: "Frontend Stack", image: project1, match: "Primary", tags: ["React", "Next.js", "Tailwind", "Framer Motion"], description: "Modern UI development", longDescription: "Comprehensive frontend development using the latest React features and Tailwind CSS for rapid, responsive design.", year: "2026", category: "Frontend" },
  { id: 20, title: "Backend Stack", image: project4, match: "Primary", tags: ["Node.js", "NestJS", "PostgreSQL", "Redis"], description: "Scalable server logic", longDescription: "Building robust backend services with microservices architecture and efficient data management.", year: "2026", category: "Backend" },
  { id: 21, title: "Tools & DevOps", image: project2, match: "Primary", tags: ["Docker", "Kubernetes", "GitHub Actions", "Terraform"], description: "Infrastructure & Automation", longDescription: "Streamlining deployment pipelines and managing cloud infrastructure for high-availability applications.", year: "2026", category: "DevOps" },
];

export const languageItems: ContentItem[] = [
  { id: 22, title: "JavaScript/TypeScript", image: project3, match: "Native", tags: ["ES6+", "TS 5.0", "Node", "Browser"], description: "Core Programming", longDescription: "Deep understanding of JavaScript internals, asynchronous programming, and TypeScript's advanced type system.", year: "8+ years", category: "Core" },
  { id: 23, title: "Python", image: project5, match: "Fluent", tags: ["Data Science", "Automation", "Django", "FastAPI"], description: "Scripting & Data", longDescription: "Expertise in Python for various applications from simple automation scripts to complex machine learning models.", year: "5+ years", category: "Versatile" },
  { id: 24, title: "Go", image: project6, match: "Proficient", tags: ["Concurrency", "Microservices", "Performance"], description: "High-performance", longDescription: "Implementing efficient, concurrent backend services where performance and reliability are paramount.", year: "2+ years", category: "Systems" },
];

export const certificationItems: ContentItem[] = [
  { id: 25, title: "AWS Solutions Architect", image: project2, match: "Certified", tags: ["Cloud", "Architecture", "Security"], description: "Associate Level", longDescription: "Validates ability to design and deploy scalable, highly available, and fault-tolerant systems on AWS.", year: "2023", category: "AWS" },
  { id: 26, title: "Professional Google Developer", image: project1, match: "Certified", tags: ["Cloud", "Firebase", "Web"], description: "Mobile Web Specialist", longDescription: "Demonstrates advanced skill in web performance, accessibility, and offline-first applications.", year: "2024", category: "Google" },
  { id: 27, title: "Meta Front-End Developer", image: project3, match: "Certified", tags: ["React", "UX", "Web"], description: "Professional Cert", longDescription: "Comprehensive training in modern front-end development, responsive design, and iterative testing.", year: "2023", category: "Meta" },
];

export default ContentRow;

