# Multi-Theme Portfolio Architecture Plan

## Goal

Support multiple portfolio presentations (Netflix, Minimal, Music, Professional, Fun, and a superhero-inspired theme) without duplicating portfolio content. Every theme should read the same verified profile, projects, experience, education, certifications, publications, skills, achievements, and links.

This is a plan only. Do not start implementation until Rajwardhan has supplied and verified the complete portfolio information and links.

## Current State

- The app is a React + TypeScript + Vite SPA using React Router.
- `App.tsx` currently maps `/` to one page, `Index`.
- Content records are currently hard-coded in `src/components/ContentRow.tsx`.
- Some presentation-specific content is also held in components such as `AboutSection` and `TechStackGraphic`.
- The existing portfolio is the Netflix-inspired theme.
- No Vercel rewrite configuration was found at the repository root during planning; verify direct-route behavior on the deployed Vercel project when route work begins.

## Route Design

Keep `/` as the existing Netflix experience for backward compatibility. Add explicit, shareable theme routes:

- `/themes/netflix`
- `/themes/minimal`
- `/themes/music`
- `/themes/professional`
- `/themes/fun`
- `/themes/superhero`

A theme switcher should navigate to the selected route so each theme can be bookmarked and shared. Unknown theme slugs should show a not-found state. Existing `/` links should continue to work.

## Data Organization

Keep canonical content in separate files under a dedicated data directory, for example:

```text
src/data/
  profile.json
  education.json
  experience.json
  projects.json
  publications.json
  certifications.json
  skills.json
  achievements.json
  links.json
```

Use stable IDs to relate records. Project order or featured selections may differ by theme, but themes should reference project IDs instead of copying project objects. Keep theme configuration (theme names, project order, visible sections, design tokens) separate from canonical content. Keep components, layouts, and behavior in TypeScript/TSX, not JSON.

Validate imported data with a Zod schema (Zod is already a project dependency). Fail clearly on malformed URLs, missing required fields, or duplicate IDs. Store images as repository assets and reference their paths from data; include useful alt text. Credential URLs should be included only when supplied and verified.

### Suggested Record Fields

- **Profile:** name, headline, short bio, location, email, profile links, résumé path.
- **Education:** institution, qualification, field, dates, GPA/score, optional credential links.
- **Experience:** ID, role, organization, location, start/end dates, summary, highlights, technologies, optional links and reference image.
- **Projects:** ID, name, short and detailed descriptions, role, dates, technologies, outcomes/metrics, live URL, repository URL, case-study URL, image path, image alt text, status.
- **Certifications:** ID, name, issuer, issue date (when known), credential ID (when supplied), credential URL, badge/image path.
- **Publications:** title, authors (if supplied), venue, date, abstract/summary, paper URL, reference image.
- **Skills:** groups and verified items; avoid unsupported proficiency levels.
- **Achievements:** title, issuer/event, result, date, source link (when available).

## Implementation Phases

1. **Collect and verify source content.** Receive complete project descriptions, role/date details, links, images, certifications and credential URLs, achievements, education, and profile links. Mark unknown values as unknown; do not invent them.
2. **Agree on the content schema.** Define required/optional fields, ID conventions, date format, asset organization, URL rules, and how unpublished or private work should be represented.
3. **Centralize current content.** Move verified content into separate data files, preserve every existing project and working asset/link, and remove duplicated inline content from components.
4. **Create shared data access and validation.** Parse the data once, validate it, and provide consistent typed records to search, project rows, résumé links, and other sections.
5. **Extract the Netflix presentation.** Keep its current look and behavior while making it consume the shared data. Verify the existing route and content before adding a second theme.
6. **Add route and theme registry.** Resolve `/` to Netflix and `/themes/:theme` to a registered theme. Handle unknown slugs and verify refresh/direct navigation on Vercel; add a SPA fallback only if deployment testing shows one is needed.
7. **Build the Minimal theme as the second proof.** Confirm both Netflix and Minimal display the same canonical data before adding further themes.
8. **Add remaining themes incrementally.** Implement Music, Professional, Fun, and superhero-inspired presentations as independent layouts and styles using the same data. Prefer original superhero-inspired artwork unless licensed assets are available.
9. **Add the theme switcher and finish accessibility.** Support keyboard navigation, visible focus, reduced motion, semantic labels, and mobile layouts in every theme.

## Acceptance Criteria

- Every project and credential is entered once and appears consistently in every theme.
- Theme-specific featured ordering references IDs and does not duplicate content.
- All existing working project links and images are preserved unless explicitly replaced with verified updates.
- Each theme has a stable, shareable URL and works on direct load and refresh in production.
- Unknown routes/themes show a useful not-found page.
- Data validation catches duplicate IDs, missing required fields, and malformed supplied URLs.
- Search, project details, résumé links, and credential links work across themes.
- Core routes are tested on desktop and mobile, including keyboard and reduced-motion behavior.

## Information Needed Before Implementation

Provide the verified data and preferred images/links for each section, especially:

- Every project: accurate summary, your contribution, technologies, outcomes, demo/repository/case-study links, and reference image.
- Every experience: exact title, organization, dates, location, details, and any public links.
- Every certification: exact title, issuer, date if known, credential ID if public, and verification URL.
- Education, publications, awards/achievements, skills, profile links, and the current résumé file.
- Which projects each theme should feature first, and any assets or visual references you have permission to use.
