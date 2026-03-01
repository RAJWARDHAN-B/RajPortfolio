import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Plus, ThumbsUp, ChevronDown, X } from "lucide-react";

import project1 from "@/assets/project-1.jpg";
import project2 from "@/assets/project-2.jpg";
import project3 from "@/assets/project-3.jpg";
import project4 from "@/assets/project-4.jpg";
import project5 from "@/assets/project-5.jpg";
import project6 from "@/assets/project-6.jpg";

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
}

const DetailModal = ({ item, onClose }: { item: ContentItem; onClose: () => void }) => (
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
              <button className="flex items-center gap-2 bg-foreground text-background px-6 py-2 rounded-sm font-semibold text-sm hover:bg-foreground/80 transition-colors">
                <Play className="w-4 h-4 fill-current" />
                View
              </button>
              <button className="w-9 h-9 rounded-full border-2 border-muted-foreground flex items-center justify-center hover:border-foreground transition-colors">
                <Plus className="w-5 h-5 text-foreground" />
              </button>
              <button className="w-9 h-9 rounded-full border-2 border-muted-foreground flex items-center justify-center hover:border-foreground transition-colors">
                <ThumbsUp className="w-5 h-5 text-foreground" />
              </button>
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
                className="flex-shrink-0 w-[45%] sm:w-[30%] md:w-[23%] lg:w-[16%] relative group/card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.4 }}
                viewport={{ once: true }}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className="netflix-card aspect-[2/3]" onClick={() => setSelectedItem(item)}>
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />

                  {hoveredId === item.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent flex flex-col justify-end p-3"
                    >
                      <div className="flex gap-2 mb-2">
                        <button className="w-7 h-7 rounded-full bg-foreground flex items-center justify-center">
                          <Play className="w-3.5 h-3.5 text-background fill-current" />
                        </button>
                        <button className="w-7 h-7 rounded-full border border-muted-foreground flex items-center justify-center hover:border-foreground transition-colors">
                          <Plus className="w-3.5 h-3.5 text-foreground" />
                        </button>
                        <button className="w-7 h-7 rounded-full border border-muted-foreground flex items-center justify-center hover:border-foreground transition-colors">
                          <ThumbsUp className="w-3.5 h-3.5 text-foreground" />
                        </button>
                        <button
                          className="w-7 h-7 rounded-full border border-muted-foreground flex items-center justify-center hover:border-foreground transition-colors ml-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(item);
                          }}
                        >
                          <ChevronDown className="w-3.5 h-3.5 text-foreground" />
                        </button>
                      </div>
                      <p className="text-xs font-bold text-foreground">{item.title}</p>
                      <p className="text-[10px] text-primary font-semibold">{item.match}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {item.tags.map((tag) => (
                          <span key={tag} className="text-[9px] text-muted-foreground">
                            {tag}{" · "}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}
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
  { id: 1, title: "E-Commerce Platform", image: project1, match: "98% Match", tags: ["React", "Node.js", "MongoDB", "Stripe", "Redis"], description: "Full-stack e-commerce solution", longDescription: "A comprehensive e-commerce platform built from the ground up with React and Node.js. Features include real-time inventory management, payment processing with Stripe, user authentication, product recommendations powered by ML, and an admin dashboard for managing orders, customers, and analytics. The platform handles 10,000+ daily active users with sub-200ms response times.", year: "2024", category: "Web App" },
  { id: 2, title: "Social Media App", image: project2, match: "95% Match", tags: ["React Native", "Firebase", "TypeScript", "Algolia"], description: "Cross-platform social app", longDescription: "A cross-platform social media application built with React Native and Firebase. Features real-time messaging, story sharing, algorithmic feed, push notifications, and media uploads. The app supports both iOS and Android with a shared codebase, achieving 4.8 star rating on both app stores with 50,000+ downloads.", year: "2023", category: "Mobile App" },
  { id: 3, title: "AI Analytics Dashboard", image: project3, match: "97% Match", tags: ["Python", "TensorFlow", "D3.js", "FastAPI", "PostgreSQL"], description: "ML-powered analytics", longDescription: "An enterprise-grade analytics dashboard that leverages machine learning to provide predictive insights. Built with a Python/FastAPI backend and D3.js visualizations. Features automated anomaly detection, natural language querying of data, customizable dashboards, and scheduled reporting. Processing millions of data points daily for Fortune 500 clients.", year: "2024", category: "Data Science" },
  { id: 4, title: "Real-time Chat App", image: project4, match: "92% Match", tags: ["Socket.io", "Express", "Redis", "React", "Docker"], description: "Scalable messaging platform", longDescription: "A scalable real-time messaging platform supporting 1-on-1 and group conversations, file sharing, voice notes, and end-to-end encryption. Built on a microservices architecture with Socket.io for real-time communication and Redis for message queuing. Supports 100,000+ concurrent connections with horizontal scaling.", year: "2023", category: "Web App" },
  { id: 5, title: "Music Streaming Service", image: project5, match: "94% Match", tags: ["Next.js", "AWS", "GraphQL", "Elasticsearch", "CDN"], description: "Spotify-like streaming", longDescription: "A full-featured music streaming platform with intelligent playlist generation, social sharing features, and artist analytics. Built with Next.js for the frontend, AWS for scalable media delivery, and Elasticsearch for lightning-fast search. Features lossless audio streaming, offline mode, and collaborative playlists.", year: "2022", category: "Web App" },
  { id: 6, title: "Project Management Tool", image: project6, match: "96% Match", tags: ["Vue.js", "Supabase", "Tailwind", "TypeScript"], description: "Kanban-style project manager", longDescription: "A modern project management tool inspired by Notion and Linear. Features Kanban boards, Gantt charts, time tracking, team collaboration, and automated workflows. Built with Vue.js and Supabase for real-time data sync across all connected clients. Includes AI-powered task prioritization and sprint planning assistance.", year: "2024", category: "SaaS" },
];

export const experienceItems: ContentItem[] = [
  { id: 7, title: "Senior Dev @ TechCorp", image: project1, match: "2022 - Present", tags: ["Lead", "Full-Stack", "Mentor", "Architecture"], description: "Leading a team of 8", longDescription: "Leading a team of 8 engineers building the next generation of TechCorp's core platform. Responsible for architectural decisions, code reviews, sprint planning, and mentoring junior developers. Introduced CI/CD pipelines that reduced deployment time by 70% and implemented microservices migration that improved system reliability to 99.99% uptime.", year: "2022 - Present", category: "Full-Time" },
  { id: 8, title: "Dev @ StartupXYZ", image: project3, match: "2020 - 2022", tags: ["React", "AWS", "Agile", "TypeScript"], description: "Built core platform", longDescription: "Employee #5 at a fast-growing startup. Built the core SaaS platform from scratch using React and AWS serverless architecture. Grew the platform from 0 to 10,000 paying customers. Implemented real-time collaboration features, billing system integration, and SSO authentication for enterprise clients.", year: "2020 - 2022", category: "Full-Time" },
  { id: 9, title: "Junior Dev @ WebAgency", image: project5, match: "2018 - 2020", tags: ["Frontend", "UI/UX", "Design", "WordPress"], description: "Client-facing projects", longDescription: "Worked on 30+ client projects ranging from small business websites to complex web applications. Specialized in responsive design, animation, and performance optimization. Key achievements include reducing page load times by 60% across the agency's portfolio and establishing the design system used by the entire team.", year: "2018 - 2020", category: "Full-Time" },
  { id: 10, title: "Intern @ BigTech Inc", image: project2, match: "2017 - 2018", tags: ["Python", "Data", "ML", "Spark"], description: "Data pipeline automation", longDescription: "Interned at a major tech company's data engineering team. Built automated data pipelines using Python and Apache Spark that processed 50TB of data daily. Developed ML models for content recommendation that improved user engagement by 15%. Received a return offer and was recognized as top intern in the cohort.", year: "2017 - 2018", category: "Internship" },
  { id: 11, title: "Freelance Developer", image: project4, match: "2016 - 2017", tags: ["WordPress", "PHP", "CSS", "JavaScript"], description: "20+ client websites", longDescription: "Built and maintained 20+ websites for small businesses and startups. Handled everything from client communication and requirements gathering to design, development, and deployment. Specialized in WordPress custom themes, e-commerce setups, and SEO optimization. Maintained a 100% client satisfaction rate.", year: "2016 - 2017", category: "Freelance" },
  { id: 12, title: "CS Degree @ University", image: project6, match: "2014 - 2018", tags: ["Algorithms", "OS", "Networks", "Databases"], description: "BSc Computer Science", longDescription: "Bachelor of Science in Computer Science with a focus on software engineering and artificial intelligence. Graduated with honors (GPA 3.8/4.0). Capstone project on distributed systems won the department's Best Project Award. Active member of the coding club and hackathon team, winning 3 university-level competitions.", year: "2014 - 2018", category: "Education" },
];

export const skillItems: ContentItem[] = [
  { id: 13, title: "React & Next.js", image: project3, match: "Expert", tags: ["Hooks", "SSR", "RSC", "Redux", "Zustand"], description: "5+ years", longDescription: "Deep expertise in React ecosystem including Next.js, server components, state management with Redux and Zustand, performance optimization, and building design systems. Contributed to open-source React libraries and authored technical blog posts on advanced patterns.", year: "5+ years", category: "Frontend" },
  { id: 14, title: "TypeScript", image: project1, match: "Expert", tags: ["Types", "Generics", "DX", "Zod"], description: "4+ years", longDescription: "Advanced TypeScript skills including complex generic types, utility types, discriminated unions, and type-safe API layers. Experience with Zod for runtime validation, tRPC for end-to-end type safety, and building type-safe design systems.", year: "4+ years", category: "Language" },
  { id: 15, title: "Node.js & Express", image: project4, match: "Advanced", tags: ["REST", "GraphQL", "Auth", "Prisma"], description: "4+ years", longDescription: "Extensive experience building RESTful and GraphQL APIs with Node.js. Proficient with Express, Fastify, and NestJS frameworks. Experience with database ORMs (Prisma, Sequelize), authentication (JWT, OAuth), and real-time communication (WebSockets, Socket.io).", year: "4+ years", category: "Backend" },
  { id: 16, title: "Cloud & DevOps", image: project2, match: "Advanced", tags: ["AWS", "Docker", "CI/CD", "Terraform"], description: "3+ years", longDescription: "Hands-on experience with AWS (Lambda, EC2, S3, RDS, CloudFront), containerization with Docker and Kubernetes, CI/CD pipelines with GitHub Actions, and infrastructure as code with Terraform. Certified AWS Solutions Architect Associate.", year: "3+ years", category: "Infrastructure" },
  { id: 17, title: "Python & ML", image: project5, match: "Intermediate", tags: ["TensorFlow", "Pandas", "Scikit", "FastAPI"], description: "2+ years", longDescription: "Experience with Python for data science and machine learning. Built predictive models using TensorFlow and scikit-learn, data pipelines with Pandas, and ML-serving APIs with FastAPI. Familiar with NLP, computer vision, and recommendation systems.", year: "2+ years", category: "Data Science" },
  { id: 18, title: "UI/UX Design", image: project6, match: "Advanced", tags: ["Figma", "Motion", "A11y", "Design Systems"], description: "3+ years", longDescription: "Strong eye for design with proficiency in Figma, prototyping, and design systems. Experience with motion design using Framer Motion and CSS animations. Advocate for accessibility (WCAG 2.1) and inclusive design practices.", year: "3+ years", category: "Design" },
];

export default ContentRow;
