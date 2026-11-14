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
import michelinLogo from "@/assets/experience/michelin.png";
import gabrilLogo from "@/assets/experience/gabril-industries.png";
import iitKharagpurLogo from "@/assets/experience/iit-kharagpur.png";
import iitMandiLogo from "@/assets/experience/iit-mandi.png";
import unitectureLogo from "@/assets/experience/unitec.png";
import utconsLogo from "@/assets/experience/utcons.png";
import learncraftLogo from "@/assets/experience/learncraft.png";
import comingSoonImage from "@/assets/comingsoon.jpg";
import dfdSysArchImage from "@/assets/dfd_sys_arch.png";
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
  imageAlt?: string;
  imageStyle?: "logo-light" | "logo-dark";
  match: string;
  tags: string[];
  description: string;
  longDescription: string;
  year: string;
  category: string;
  url?: string;
}

export const projectItems: ContentItem[] = [
  { id: 1, title: "LegalBuddy", image: project1, match: "RAG · FAISS", tags: ["Python", "RAG", "FAISS", "Embeddings", "Risk Scoring"], description: "Legal document Q&A with risk scoring", longDescription: "Built an end-to-end backend for legal document question answering. Processed 200MB+ of multi-format documents with FAISS-based retrieval, domain-specific embeddings, and text-classification-based risk scoring.", year: "2026", category: "AI Assistant" },
  { id: 2, title: "Gignut", image: gignutImage, match: "Production B2B", tags: ["FastAPI", "REST APIs", "Backend", "Database Optimization"], description: "Production-grade B2B platform", longDescription: "Built production-grade backend services and REST APIs for gignut.com using FastAPI. Optimized database queries and API performance.", year: "2026", category: "B2B Platform", url: "https://gignut.com" },
  { id: 3, title: "WatchDog.ai", image: watchdogImage, match: "Real-time monitoring", tags: ["ELK Stack", "Anomaly Detection", "Logging", "Dashboards"], description: "Anomaly detection for API behavior", longDescription: "Built real-time anomaly-detection pipelines to monitor API behavior with the ELK stack. Developed dashboards and alerting for low-latency logging and performance tracking.", year: "2026", category: "AI / Observability", url: "https://watchdog-6s7x.onrender.com/" },
  { id: 4, title: "Packmate", image: packmateImage, match: "40% less planning effort", tags: ["LangChain", "LLM", "Prompt Engineering", "Memory"], description: "LLM-powered trip-planning assistant", longDescription: "Developed a conversational trip-planning assistant using LangChain, engineering context-aware prompts and memory handling to reduce trip-planning effort by 40%.", year: "2026", category: "AI Assistant", url: "https://packmate.streamlit.app/" },
  { id: 5, title: "Static Portfolio", image: staticportfolioImage, match: "Portfolio", tags: ["HTML", "CSS", "JavaScript"], description: "Personal portfolio website", longDescription: "A static portfolio website built with HTML, CSS, and JavaScript.", year: "2024", category: "Portfolio", url: "https://rajwardhan-b.github.io/rajportfoliostatic/" },
  { id: 6, title: "LifeSync", image: lifesyncImage, match: "Health · Education · Finance", tags: ["Web App"], description: "AI-powered insights platform", longDescription: "A web application presenting AI-powered insights across health, education, and finance.", year: "2024", category: "Web App", url: "https://life-sync-eta.vercel.app/" },
  { id: 7, title: "Waste2Worth", image: waste2worthImage, match: "Donation platform", tags: ["Web App", "NGO"], description: "Waste and donation project", longDescription: "A web project for connecting donations with nonprofit organizations.", year: "2024", category: "Web App", url: "https://github.com/RAJWARDHAN-B/donateNGO" },
  { id: 8, title: "LearnCraft", image: learncraftImage, match: "Education", tags: ["Web App"], description: "Learning-focused web application", longDescription: "A web application project in the education space.", year: "2024", category: "Web App", url: "https://learn-craft.vercel.app/" },
  { id: 9, title: "TinDog", image: tindogImage, match: "Web project", tags: ["Web App"], description: "TinDog website project", longDescription: "A web project with a live deployment.", year: "2024", category: "Web App", url: "https://tindog-website-zeta.vercel.app/" },
  { id: 10, title: "Glean", image: gleanImage, match: "Web project", tags: ["Web App"], description: "Glean web application", longDescription: "A web application project with a live deployment.", year: "2024", category: "Web App", url: "https://glean-nu.vercel.app/home" },
  { id: 11, title: "SanguineSages", image: sanguinesagesImage, match: "Web project", tags: ["Web App"], description: "SanguineSages web application", longDescription: "A web application project with a live deployment.", year: "2024", category: "Web App", url: "https://sanguinesages.vercel.app/" },
  { id: 12, title: "Felecity", image: felecityImage, match: "Web project", tags: ["Web App"], description: "Felecity web application", longDescription: "A web application project with a live deployment.", year: "2024", category: "Web App", url: "https://felecity-frontend.vercel.app/" },
  { id: 13, title: "SudoQ", image: sudoqImage, match: "Web project", tags: ["Web App"], description: "SudoQ project", longDescription: "A web project with a live deployment.", year: "2024", category: "Web App", url: "https://cs-50-p-finalproject.vercel.app/" },
  { id: 14, title: "SportsOrca", image: sportsorcaImage, match: "Sports · Web App", tags: ["Web App"], description: "SportsOrca web application", longDescription: "A sports-focused web application project with a live deployment.", year: "2024", category: "Web App", url: "https://sports-orca-mu.vercel.app/" },
  { id: 15, title: "EmptyCups", image: emptycupsImage, match: "Web project", tags: ["Web App"], description: "EmptyCups web application", longDescription: "A web application project with a live deployment.", year: "2024", category: "Web App", url: "https://empty-cups-inter-task.vercel.app/" },
  { id: 16, title: "AeroLens", image: aerolensImage, match: "Streamlit app", tags: ["Streamlit"], description: "AeroLens application", longDescription: "A Streamlit project with a live deployment.", year: "2024", category: "Web App", url: "https://aerolens.streamlit.app/" },
  { id: 17, title: "OVO", image: ovoImage, match: "Streamlit app", tags: ["Streamlit"], description: "OVO application", longDescription: "A Streamlit project with a live deployment.", year: "2024", category: "Web App", url: "https://ovoeval.streamlit.app/" },
  { id: 18, title: "Verdantia", image: comingSoonImage, match: "Coming Soon", tags: ["Project", "Upcoming"], description: "Green technology platform", longDescription: "An upcoming green technology platform focused on sustainable living and environmental awareness.", year: "2026", category: "Web App" },
];

export const experienceItems: ContentItem[] = [
  { id: 19, title: "Software Engineering Intern @ Michelin", image: michelinLogo, imageAlt: "Michelin logo", imageStyle: "logo-light", match: "Aug 2026 – Present", tags: ["Astro", "Apostrophe CMS", "Python", "Unit Testing"], description: "Full-stack chatbot features", longDescription: "Building full-stack chatbot features across an Astro and Apostrophe CMS frontend with a Python backend. Writing and maintaining unit tests for each module, validating behavior before merge, and resolving issues found through test failures and logs.", year: "2026 – Present", category: "Internship" },
  { id: 20, title: "Freelance Software Developer @ Gabril Industries", image: gabrilLogo, imageAlt: "Gabril Industries logo", imageStyle: "logo-dark", match: "Mar 2026 – Jul 2026", tags: ["Python", "ERP", "MES", "Analytics"], description: "ERP and manufacturing execution platform", longDescription: "Built a custom ERP and MES platform for a precision manufacturing and engineering business, integrating procurement, inventory, HRMS, and production workflows. Designed backend pipelines and analytics dashboards for machine efficiency and waste monitoring, using version-controlled, modular development practices.", year: "2026", category: "Freelance" },
  { id: 21, title: "Research Intern @ IIT Kharagpur", image: iitKharagpurLogo, imageAlt: "IIT Kharagpur logo", imageStyle: "logo-light", match: "May 2026 – Jun 2026", tags: ["PyTorch", "nnU-Net", "ML Systems", "Open Source"], description: "Training pipeline and framework contribution", longDescription: "Built and validated an end-to-end PyTorch training pipeline within nnU-Net, adding a custom trainer with under 0.2% overhead. Debugged and patched a scheduler compatibility issue in the framework and shipped the fix through an open-source GitHub commit.", year: "2026", category: "Research Internship" },
  { id: 22, title: "Computer Vision Research Intern @ IIT Mandi", image: iitMandiLogo, imageAlt: "IIT Mandi logo", imageStyle: "logo-light", match: "Nov 2025 – May 2026", tags: ["Computer Vision", "Deep Learning", "Python", "Industrial Imaging"], description: "Industrial defect detection", longDescription: "Developed and evaluated deep learning models for defect detection on large-scale industrial image datasets, improving robustness through systematic preprocessing and testing.", year: "2025 – 2026", category: "Research Internship" },
  { id: 23, title: "Software Development Intern @ UNITECTURE", image: unitectureLogo, imageAlt: "UNITECTURE logo", imageStyle: "logo-light", match: "Jan 2026 – Feb 2026", tags: ["HRMS", "Waste Management", "WhatsApp", "ESSL Biometrics"], description: "Integrated HRMS and waste-management modules", longDescription: "Built HRMS and waste-management modules with WhatsApp and ESSL biometric integrations. Handled end-to-end deployment and production validation.", year: "2026", category: "Internship" },
  { id: 24, title: "Full Stack Developer Intern @ Unified Transformation", image: utconsLogo, imageAlt: "UTCONS logo", imageStyle: "logo-dark", match: "Jul 2025 – Feb 2026", tags: ["FastAPI", "REST APIs", "Backend", "Performance"], description: "Backend services for gignut.com", longDescription: "Built production-grade backend services and REST APIs for gignut.com using FastAPI, optimizing database queries and API performance.", year: "2025 – 2026", category: "Internship" },
  { id: 44, title: "React Intern @ Learncraft LLP", image: learncraftLogo, imageAlt: "Learncraft logo", imageStyle: "logo-light", match: "May 2025 – Jun 2025", tags: ["React", "Online Learning"], description: "Online learning platform", longDescription: "Created an online learning platform with various courses using React.", year: "2025", category: "Internship" },
];

export const skillItems: ContentItem[] = [
  { id: 39, title: "Backend & APIs", image: project1, match: "Core stack", tags: ["FastAPI", "Django", "Node.js", "REST APIs", "MySQL", "MongoDB"], description: "Product backends and integrations", longDescription: "Builds backend services and REST APIs with FastAPI, Django, and Node.js, with database experience in MySQL and MongoDB. Recent work includes production APIs, chatbot features, and business workflow integrations.", year: "Current focus", category: "Backend" },
  { id: 40, title: "Applied ML & AI", image: project2, match: "Applied", tags: ["PyTorch", "TensorFlow", "scikit-learn", "OpenCV", "Transformers", "LangChain"], description: "Research and AI product work", longDescription: "Applied machine learning experience across PyTorch training pipelines, computer vision, and conversational AI. Tools include TensorFlow, scikit-learn, OpenCV, Hugging Face Transformers, and LangChain.", year: "Current focus", category: "AI / ML" },
  { id: 41, title: "Programming Languages", image: project3, match: "Technical skills", tags: ["Python", "C++", "Java", "JavaScript", "SQL"], description: "Five languages from the résumé", longDescription: "Programming languages listed on the current résumé: Python, C++, Java, JavaScript, and SQL.", year: "Current skills", category: "Languages" },
  { id: 42, title: "Engineering Practice", image: project4, match: "Production-minded", tags: ["Unit Testing", "Git", "Docker", "Debugging", "Weights & Biases"], description: "Testing, diagnosis, and delivery", longDescription: "Writes unit tests, uses Git and Docker, diagnoses problems through logs, and tracks machine-learning experiments with Weights & Biases.", year: "Current focus", category: "Engineering" },
  { id: 43, title: "Computer Science Foundations", image: project5, match: "Foundations", tags: ["Data Structures & Algorithms", "OOP", "DBMS", "Operating Systems", "Networking"], description: "Core CS fundamentals", longDescription: "Foundational knowledge in data structures and algorithms, object-oriented programming, database management systems, operating systems, and networking.", year: "Education", category: "Computer Science" },
];

export const techStackItems: ContentItem[] = [
  { id: 29, title: "Backend & APIs", image: project1, match: "Core stack", tags: ["FastAPI", "Django", "Node.js", "REST APIs", "MySQL", "MongoDB"], description: "Services, APIs, and data", longDescription: "Backend technologies and databases used across recent product work.", year: "2026", category: "Backend" },
  { id: 30, title: "Applied ML & AI", image: project2, match: "Applied", tags: ["PyTorch", "TensorFlow", "OpenCV", "Transformers", "LangChain"], description: "ML systems, vision, and AI assistants", longDescription: "Applied ML and AI tools used in research, training pipelines, and assistant projects.", year: "2026", category: "AI / ML" },
  { id: 31, title: "Engineering Toolkit", image: project3, match: "Production", tags: ["Unit Testing", "Git", "Docker", "Weights & Biases", "Log Debugging"], description: "Quality, collaboration, and diagnosis", longDescription: "Tools and practices for testing, version control, containerization, experiment tracking, and debugging.", year: "2026", category: "Engineering" },
];

export const languageItems: ContentItem[] = [
  { id: 32, title: "Python", image: project3, match: "Programming language", tags: ["FastAPI", "Django", "PyTorch", "TensorFlow"], description: "Backend and applied ML", longDescription: "Used across backend development, training pipelines, computer vision, and AI projects.", year: "Current skill", category: "Language" },
  { id: 33, title: "C++ & Java", image: project5, match: "Programming languages", tags: ["C++", "Java", "OOP", "Data Structures & Algorithms"], description: "Core programming", longDescription: "C++ and Java are listed among current programming skills, alongside computer science fundamentals.", year: "Current skills", category: "Languages" },
  { id: 34, title: "JavaScript & SQL", image: project6, match: "Programming languages", tags: ["JavaScript", "SQL", "REST APIs", "Databases"], description: "Web and data", longDescription: "JavaScript and SQL are listed among current programming skills, with additional experience building REST APIs and database-backed systems.", year: "Current skills", category: "Languages" },
];

export const certificationItems: ContentItem[] = [
  { id: 35, title: "Oracle Cloud Infrastructure AI Foundations", image: project2, match: "Certified · 2025", tags: ["Oracle Cloud", "AI Foundations"], description: "Oracle AI Foundations Associate", longDescription: "Oracle Cloud Infrastructure 2025 Certified AI Foundations Associate.", year: "2025", category: "Oracle" },
  { id: 36, title: "CS50: Python, SQL & Cybersecurity", image: project1, match: "HarvardX", tags: ["Python", "SQL", "Cybersecurity"], description: "HarvardX CS50 certificates", longDescription: "Completed HarvardX CS50 coursework in Python, SQL, and cybersecurity.", year: "Year not listed", category: "HarvardX" },
  { id: 37, title: "Industry Learning Programs", image: project3, match: "Forage · LinkedIn Learning", tags: ["Tata Data Visualisation", "AWS Solutions Architecture", "Generative AI"], description: "Applied industry learning", longDescription: "Completed Tata Data Visualisation through The Forage, AWS APAC Solutions Architecture, and the Microsoft × LinkedIn Generative AI Career Path.", year: "Years not listed", category: "Professional Development" },
];

export const publicationItems: ContentItem[] = [
  {
    id: 38,
    title: "A Robust and Interpretable Multimodal Deepfake Detection Framework",
    image: dfdSysArchImage,
    match: "Published",
    tags: ["Deepfake Detection", "Multimodal", "XAI"],
    description: "Multimodal deepfake detection framework that fuses visual and auditory modalities.",
    longDescription: "The rapid proliferation of artificial intelligence–driven media manipulation, commonly referred to as deepfakes, poses a critical challenge to information authenticity, personal security, and societal trust. As generative models such as diffusion networks and transformer-based architectures continue to evolve, their synthetic outputs exhibit near-authentic realism, achieving structural similarity indices (SSIM) exceeding 0.98 in several benchmarks, thereby rendering traditional detection methods increasingly ineffective. Existing unimodal detectors—often limited to visual or audio cues—show poor generalization, with cross-dataset accuracies typically below 70%, and operate as opaque “black box” systems with minimal interpretability. Motivated by these restrictions, this paper proposes a multimodal deepfake detection framework that fuses visual and auditory modalities through a bidirectional crossmodal fusion mechanism to capture subtle spatial-temporal and acoustic inconsistencies that generative models struggle to replicate coherently. The proposed framework is expected to offer meaningful and substantial improvements over the existing solutions, roughly 10-12%, this could be made possible with the use of multimodal fusion to capture inconsistencies that the current baseline models may often miss, by having a multimodal approach the framework’s robustness is expected to be enhanced by around 7%. Current techniques are mostly black boxes. i.e. they do not provide any insights into how they make the decisions, this issue is also addressed in the research by integrating explainable AI components such as Grad-CAM based special visualizations. This would improve the system transparency by a lot. Overall, this approach aims to provide a more reliable and accountable solution for deepfake detection, contributing to the ongoing efforts in the development of trustworthy AI-driven media authentication tools.",
    year: "2026",
    category: "Publication",
    url: "https://pijet.org/papers/volume-3%20issue-2/Final%20Revised%20Paper_Pijet-02_June26.pdf",
  },
];
