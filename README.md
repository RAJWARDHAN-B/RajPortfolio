# RAJWARDHAN | Portfolio

<div align="center">

### A developer portfolio, reimagined as a streaming experience.

Explore projects, experience, research, and more through a Netflix-inspired interface built with React and TypeScript.

<p>
	<img src="https://img.shields.io/badge/React-18-149eca?style=flat-square&logo=react&logoColor=white" alt="React 18" />
	<img src="https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 5" />
	<img src="https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite&logoColor=white" alt="Vite 5" />
	<img src="https://img.shields.io/badge/Three.js-3D%20scene-black?style=flat-square&logo=threedotjs&logoColor=white" alt="Three.js" />
</p>

[GitHub](https://github.com/RAJWARDHAN-B) · [LinkedIn](https://linkedin.com/in/rajwardhan-bhandigare) · [Email](mailto:rajwardhanpict@gmail.com)

</div>

---

## The Experience

The portfolio turns a conventional résumé into a browsable catalogue. An animated intro opens into a cinematic hero, then each part of Rajwardhan's work is presented as its own row of interactive titles.

| Browse | Discover |
| --- | --- |
| Featured projects and internships | Search titles, technologies, and categories |
| Research and publications | Open project detail panels with links and technology tags |
| Technology and language showcases | Explore an interactive Three.js scene inspired by *Stranger Things* |
| About and contact sections | View or download the résumé and send a message through Formspree |

## Built With

- **React 18** and **TypeScript** for the interface
- **Vite** for development and production builds
- **Tailwind CSS** and **shadcn/ui** components for styling and accessible UI primitives
- **Framer Motion** for transitions and interaction
- **Three.js**, **React Three Fiber**, and **Drei** for the 3D scene
- **Formspree** for the contact form

## Run Locally

The application lives in the `Rajportfolio/` directory.

```bash
cd Rajportfolio
npm install
npm run dev
```

Vite prints the local URL after the development server starts.

## Available Scripts

Run these from `Rajportfolio/`:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create the production bundle in `dist/` |
| `npm run build:dev` | Create a development-mode build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run the Vitest test suite once |
| `npm run test:watch` | Run tests in watch mode |

## Project Layout

```text
Rajportfolio/
├── public/          # Static files, résumé, and 3D assets
├── src/
│   ├── components/  # Portfolio sections and shared UI
│   ├── pages/       # Route-level pages
│   └── assets/      # Images and other imported media
├── index.html
└── package.json
```

## Deployment

Build the site with `npm run build` from `Rajportfolio/`, then deploy the generated `Rajportfolio/dist/` directory to a static hosting provider. The contact form uses Formspree; the 3D section uses WebGL in the visitor's browser.

## Connect

- [GitHub](https://github.com/RAJWARDHAN-B)
- [LinkedIn](https://linkedin.com/in/rajwardhan-bhandigare)
- [Email](mailto:rajwardhanpict@gmail.com)
