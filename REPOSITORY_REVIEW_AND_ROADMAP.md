# Repository Review and Improvement Roadmap

**Reviewed:** 2026-11-13  
**Repository:** `RajPortfolio` (135 tracked files at review time)  
**Application root:** [`Rajportfolio/`](Rajportfolio/)

## Executive summary

The portfolio is a React 18, TypeScript, and Vite single-page app with a Netflix-inspired presentation, project-specific screenshots, search, a contact form, and an opt-in Three.js scene. The image situation is mixed: there are real, project-named screenshots, but generic artwork is reused for projects, work experience, skills, and certificates. Replacing every image indiscriminately would discard useful screenshots; first map each image to the work it represents, then replace the generic and mismatched ones.

The 3D section is already implemented, so the next step is to make it lighter, more accessible, and more project-focused—not to add a second 3D section. Its intended GLB is currently a 134-byte ASCII file rather than a usable binary model, while the scene itself renders without it.

The initial audit found a broken ESLint configuration, duplicate IDs in search, and a 1.5 MB initial JavaScript bundle. The first two are now fixed, and the 3D scene is deferred into its own chunk. Remaining priorities are replacing generic imagery with accurate assets, reducing the still-large 3D chunk, improving accessibility, and adding broader behavior tests.

## Implementation progress

The first implementation pass has addressed the baseline issues that did not require new personal assets:

- Replaced the invalid ESLint configuration reference and removed the duplicate extensionless config.
- Moved the hard-coded catalogue and its image references into [`src/data/portfolio.ts`](Rajportfolio/src/data/portfolio.ts), and gave the skill records unique IDs.
- Replaced the placeholder test with a regression test that checks IDs across the combined search catalogue.
- Added an explicit `npm run typecheck` command and fixed the type issues it surfaced.
- Split the Three.js scene into a separately loaded module. The scene is fetched only after a visitor activates 3D mode; its detail overlay now offers a verified project URL when one exists.
- Resolved lint errors in the app/configuration and shared helpers. Lint still reports Fast Refresh warnings in generated UI primitives.
- Made portfolio and search cards keyboard-operable, with focus-managed detail dialogs, Escape-to-close, and working project links where available.
- Added a skip-intro button and bypassed the animated intro for reduced-motion users; made navigation and search controls keyboard accessible.
- Removed nonfunctional card actions, the notification bell, and the inactive sign-out menu item.
- Replaced the floating-card 3D demo with The Shadow Road, an optional original world with a car, on-foot exploration, six featured project displays, and a complete accessible project list.

The seven user-supplied experience logos now appear on the corresponding experience cards, including a new Learncraft internship entry. The original project images remain unchanged and should still be reviewed for accuracy.

## Scope and confidence

This review covers the repository root, the nested Vite app, first-party source, project documentation, configuration, and the tracked image/model assets. The installed `node_modules` tree and generated `dist/` output were not treated as source. The UI primitives under `src/components/ui/` are mostly generated/shared components and were not individually audited unless implicated in app behavior.

This is a source review, not a live-site review: deployed URLs, external integrations, and the factual accuracy of personal résumé/project claims were not independently verified. Confirm those details with the owner before changing public content. Some assets were inspected visually; all images should still be matched against the current projects before replacement.

## What is already working

- The app has a clear presentation concept and a single-page route with project, experience, publication, certification, technology, language, about, 3D, and contact sections. See [`src/pages/Index.tsx`](Rajportfolio/src/pages/Index.tsx).
- Most portfolio projects have named screenshot assets under [`src/assets/images/`](Rajportfolio/src/assets/images/), including Gignut, WatchDog, Packmate, LifeSync, and others. The Gignut file is a screenshot of the product UI, not a generic placeholder.
- The 3D scene is opt-in: the Canvas is only mounted after the visitor selects “Enter 3D Mode.” The rest of the portfolio remains usable without entering it. See [`StrangerThings3D.tsx`](Rajportfolio/src/components/StrangerThings3D.tsx).
- `npm test` passes, and `npm run build` completes. The build is not clean of warnings; see the findings below.
- The root [`README.md`](README.md) already gives a stronger overview than the nested app README.

## Findings and recommended changes

### P1 — Repair ESLint configuration (implemented)

**Initial evidence:** [`eslint.config.js`](Rajportfolio/eslint.config.js) read `reactHooks.configs.flat.recommended`, which was undefined in the installed plugin, and a second extensionless `eslint.config` was tracked. This prevented `npm run lint` from loading.

**Implemented:** The config now uses the installed plugin's supported rules, the duplicate config file was removed, and the surfaced source-level lint errors were corrected. `npm run lint` now succeeds; seven Fast Refresh warnings remain in shared UI primitives.

### P1 — Make content IDs unique across search (implemented)

**Initial evidence:** [`Index.tsx`](Rajportfolio/src/pages/Index.tsx) combines all categories into one `allItems` array, while experience and skill records both used IDs `23` and `24`. [`SearchResults.tsx`](Rajportfolio/src/components/SearchResults.tsx) keys results by `item.id`.

**Impact:** React could receive duplicate keys in search results, causing warnings and incorrect state reuse.

**Implemented:** Catalogue records now live in [`src/data/portfolio.ts`](Rajportfolio/src/data/portfolio.ts), the skill IDs are unique, and [`src/test/content.test.ts`](Rajportfolio/src/test/content.test.ts) checks IDs across the combined catalogue.

### P1 — Add meaningful tests and an explicit TypeScript check (in progress)

**Initial evidence:** The only test asserted `true` is true, and [`package.json`](Rajportfolio/package.json) had no type-check script. [`tsconfig.app.json`](Rajportfolio/tsconfig.app.json) sets `strict`, `noUnusedLocals`, `noUnusedParameters`, and `noImplicitAny` to `false`. A Vite build transpiles TypeScript but does not, by itself, guarantee type checking.

**Recommendation:**

- Add focused tests for search matching, modal open/close semantics, and future image/content mapping in addition to the unique-ID regression test.
- Keep the `typecheck` script using the app's TypeScript configuration in the routine checks.
- Enable stricter compiler options incrementally, addressing diagnostics rather than suppressing them globally.

**Implemented:** The `typecheck` script and unique-ID regression test are in place. The broader interaction tests and stricter TypeScript options remain.

### P1 — Audit and replace generic or mismatched images, not every image

**Initial evidence:** Six generic `project-1.jpg` through `project-6.jpg` images were reused for LegalBuddy, experience cards, skills, technologies, languages, and certifications. They are portrait assets (640 × 896) displayed in wide 16:9 cards using `object-cover`, which crops a substantial portion of the image. The experience cards now use the supplied organization logos; generic art remains elsewhere. `comingsoon.jpg` is assigned to the upcoming Verdantia entry. The project-named PNGs under `src/assets/images/` are real-looking product screenshots; the Gignut screenshot was visually inspected and shows a product interface.

**Recommendation:**

1. Create a content-to-image inventory for every card and confirm that the image depicts the named project or organization.
2. Replace generic/reused images with screenshots captured from the actual project, a suitable logo/brand visual where permitted, or a deliberate neutral illustration. Do not use confidential employer/customer data in screenshots.
3. Replace the generic hero background in [`HeroSection.tsx`](Rajportfolio/src/components/HeroSection.tsx) with an intentional personal/portfolio visual if it does not represent the desired brand.
4. Keep `comingsoon.jpg` only if Verdantia is intentionally presented as upcoming; otherwise hide the entry until a real preview exists.
5. Review the project-named screenshots for freshness, ownership, legibility, and fit in a landscape card. Preserve the good ones.
6. Add meaningful alt text (or empty alt text for decorative images), and use a consistent crop/aspect-ratio strategy. Consider WebP/AVIF exports for large images while retaining an appropriate fallback.

**Initial asset inventory:**

| Asset/content | Current observation | Suggested action |
| --- | --- | --- |
| `src/assets/images/*.png` | Project-named screenshots exist for many portfolio entries. | Match each one to the current live project and replace only if stale, inaccurate, or low quality. |
| `src/assets/project-1.jpg` … `project-6.jpg` | Generic portrait images reused across unrelated content types. | Replace with project-/experience-specific landscape images; avoid reusing one image to imply multiple unrelated work samples. |
| `src/assets/hero-bg.jpg` | Generic developer-at-computer visual used as the hero background. | Decide whether this is the intended personal brand; otherwise replace with an original/licensed visual. |
| `src/assets/comingsoon.jpg` | Explicit “coming soon” graphic used for Verdantia. | Keep only if the project is genuinely upcoming and labelled as such; otherwise use a real preview or remove the card. |
| `src/assets/dfd_sys_arch.png` | A 4098 × 2466 publication/architecture image; the production asset is about 1.1 MB. | Keep if it is the paper's actual figure; make a smaller web-optimized preview and provide a way to inspect the full-size figure. |
| Root-level logos, PDFs, and media | Several assets sit outside the Vite app and appear not to be referenced from app source. | Inventory ownership and usage before removing or duplicating them; pick one canonical résumé/logo source. |

**Done when:** Featured cards use accurate, intentional visuals; no generic portrait is unintentionally cropped into a project screenshot; images have reviewed alt text and are reasonably sized.

### P1 — Make the 3D section a polished extension of the portfolio (in progress)

**Current state:** [`StrangerThings3D.tsx`](Rajportfolio/src/components/StrangerThings3D.tsx) provides an opt-in original Three.js world. Visitors can drive, get out and explore six featured project displays, or skip the drive. The complete project list is available without entering the scene; details use the shared accessible dialog and include a link only when one is present in the portfolio data.

**Model issue:** `public/models/dead_by_daylight_-_the_first.glb` is only 134 bytes and `file` identifies it as ASCII text, not a binary GLB. It is not used by the current procedural scene.

**Recommendation:**

- Keep the 3D section optional and load the scene code only after activation. **Implemented:** the separate 3D chunk remains large and still triggers Vite's chunk-size warning.
- **Implemented:** featured displays show existing project imagery; details offer an external link when the record has one. Images and destinations still need content verification.
- Replace the unusable GLB with an original/licensed, optimized model only if it adds real value. Otherwise remove the stale model file and keep the lightweight procedural scene.
- **Implemented:** a keyboard-accessible project list, touch and keyboard movement controls, reduced-motion camera behavior, and a message when WebGL fails or its context is lost. Re-entering the world retries after context loss.
- Check performance and touch controls on physical low-powered devices, and continue auditing screen-reader behavior and image ownership.

**Done when:** initial page load does not download the 3D chunk/model; activating the section yields a responsive, keyboard-accessible project experience; available project destinations are verified; WebGL failure does not block the rest of the portfolio.

### P2 — Improve accessibility and make controls work without a mouse (in progress)

**Implemented:** Cards use buttons and open an accessible dialog that traps and restores focus and closes with Escape. Search, navigation, and carousel controls have accessible names; the intro can be skipped and is bypassed for reduced-motion users.

**Remaining:**

- Extend reduced-motion support beyond the intro and 3D world.
- Verify contrast, heading order, link purpose, form labels, screen-reader behavior, and reading order on mobile and desktop.

**Done when:** the contact form and 3D alternative are also usable with keyboard and a screen reader, and reduced-motion behavior is consistent throughout.

### P2 — Remove misleading or nonfunctional UI affordances (implemented)

**Implemented:** Removed the placeholder plus/like actions, bell, and sign-out item. The detail dialog offers a safe external link only when a URL exists.

### P2 — Clarify and verify portfolio content before adding more themes

**Evidence:** Many older project descriptions in [`ContentRow.tsx`](Rajportfolio/src/components/ContentRow.tsx) are generic (“a web project” / “a web application project”) and lack the visitor-facing context needed to distinguish the work. The tech stack is also represented separately in `ContentRow.tsx` and [`TechStackGraphic.tsx`](Rajportfolio/src/components/TechStackGraphic.tsx). [`LanguageGraphic.tsx`](Rajportfolio/src/components/LanguageGraphic.tsx) shows precise percentage bars (including “Native” at 100%) that may overstate how language proficiency can be measured.

**Recommendation:**

- For each featured project, record the problem, your contribution, key technical choices, outcome, and verified demo/repository link. Keep claims and metrics accurate and attributable.
- Verify all dates, titles, organization names, résumé details, certification names, publication links, and project URLs before publishing.
- Use one canonical content source for skills/technologies and render it consistently instead of duplicating lists in components.
- Prefer a recognized proficiency label (e.g. CEFR where accurate) over unsupported percentage scores.
- Keep the planned multi-theme architecture in [`THEME_ARCHITECTURE_PLAN.md`](THEME_ARCHITECTURE_PLAN.md) as a later phase; first establish accurate canonical content and a stable image mapping.

**Done when:** each visible record is specific, internally consistent, and backed by an accurate image and link; repeated facts are maintained in one place.

### P2 — Improve search, section navigation, and interaction flow

**Evidence:** The navigation in [`NetflixNav.tsx`](Rajportfolio/src/components/NetflixNav.tsx) does not include Publications or the 3D section even though both exist. Search result IDs are now unique, and the intro has a skip control.

**Recommendation:** Include the sections visitors need in navigation or add a clearly discoverable route/contents menu. Keep the current search behavior but ensure result actions work on keyboard/touch and have unique IDs. Add a skip-intro action and ensure the portfolio remains discoverable if animation/audio fails.

**Done when:** every important section is discoverable, search result identity is stable, and the intro never blocks visitors who want to skip it.

### P2 — Replace starter metadata and align project documentation

**Evidence:** [`index.html`](Rajportfolio/index.html) still has a generic meta description (“Portfolio project”), TODO comments, and a Twitter/X handle that should be verified. The nested [`Rajportfolio/README.md`](Rajportfolio/README.md) is the default React/Vite template rather than documentation for this portfolio. The app also retains `src/App.css`, which contains default Vite starter styles but is not imported by the current entry point.

**Recommendation:**

- Write a concise, accurate meta description and verify social preview image, favicon, title, and social handle.
- Replace the nested template README with the actual app setup, commands, folder layout, and deployment notes; keep it consistent with the root README.
- Remove starter files/assets only after confirming they have no intended use. The `public/placeholder.svg`, `public/vite.svg`, `src/assets/react.svg`, `public/stlightningbg.jpg`, and root-level assets appear unreferenced from app source at review time.
- Decide which of the two tracked ESLint config files is authoritative and remove stale duplicate configuration after validation.

**Done when:** documentation and metadata describe the actual app, and remaining starter assets/configuration are either used intentionally or safely removed.

### P3 — Reduce image and asset duplication

**Evidence:** The repository root contains a separate set of image/logo/media files and a résumé PDF, while the Vite app has another résumé in `public/` and its own branded images. Some assets are served/copied directly from `public/`; other assets are imported from `src/assets/`.

**Recommendation:** Establish a simple ownership rule: app-served files live under `Rajportfolio/public/` or `Rajportfolio/src/assets/`; root-level copies should have an explicit purpose (for example source material or documentation). Confirm deployment and README references before deleting duplicates. Keep generated `dist/` output out of source control.

**Done when:** each production asset has one intentional source of truth and the repository's purpose is clear to a new contributor.

## Validation results

Commands were run from `Rajportfolio/`:

| Check | Result | Notes |
| --- | --- | --- |
| `npm run lint` | **Passed with warnings** | No errors. Seven Fast Refresh warnings remain in shared UI primitives. |
| `npm run typecheck` | **Passed** | Uses the app TypeScript configuration; current compiler strictness is still relaxed. |
| `npm test` | **Passed** | Regression tests cover catalogue IDs, experience imagery, card dialogs, skip intro, and search controls. |
| `npm run build` | **Passed with warnings** | Main JS is now 561.54 kB (178.12 kB gzip); the lazy 3D chunk is 940.46 kB (266.36 kB gzip). Vite still warns about the 3D chunk and stale Browserslist data. |

The build confirms that the 134-byte ASCII model stub is copied into `dist/models/` even though the scene does not load it.

## Suggested order of work

1. **Finish stabilizing the baseline:** the lint configuration, unique search IDs, type-check command, and ID regression test are in place; add interaction tests and tighten TypeScript settings incrementally.
2. **Verify the content and image map:** collect approved screenshots, check each existing screenshot against its project, replace generic experience/skill/certificate imagery, and confirm copy and URLs.
3. **Finish polishing the 3D scene:** lazy loading and conditional project links are in place; remove or replace the stub model, reduce the 3D chunk, add image-backed interactions, build a keyboard/2D fallback, and support reduced motion/WebGL failure.
4. **Finish accessibility and UX:** cards, details, search/navigation controls, and skip intro are improved; verify the contact form and screen-reader experience and extend reduced-motion support.
5. **Performance and metadata:** split the 3D chunk, optimize the publication figure and images, update social/SEO metadata, and re-check the production bundle.
6. **Documentation and cleanup:** replace the nested template README, resolve duplicate configs and unused starter assets, and keep root/app documentation aligned.
7. **Only then expand presentation themes:** reuse verified content and the finalized image inventory rather than copying the current hard-coded records into additional layouts.

## Final acceptance checklist

- [ ] Featured project thumbnails are accurate, legible, and approved for publication.
- [ ] Generic `project-1.jpg`–`project-6.jpg` art is no longer used where it misrepresents a project or experience.
- [ ] Every content item has a unique stable identity and verified public details/links.
- [ ] 3D remains optional, lazy-loaded, performant, reduced-motion-aware, and fully usable through an accessible non-3D alternative.
- [ ] All buttons, links, search controls, dialogs, and navigation work with keyboard and touch.
- [ ] Lint, TypeScript checking, meaningful tests, and production build all pass.
- [ ] Production build has no unexpected placeholder model or oversized initial JavaScript chunk.
- [ ] Metadata, résumé, documentation, and public claims are current and consistent.
