# Nexera IC: an unofficial interactive showcase

A cinematic single-page site that explains ion chromatography through the Shimadzu Nexera IC.

> **Independent, unofficial project.** This site is not affiliated with, sponsored or endorsed by Shimadzu Corporation.
> Nexera, Shim-pack and Shim-vial are trademarks of Shimadzu Corporation or its affiliated companies.
>
> - **Sources:** specifications and data are summarised from Shimadzu customer-facing material (the Nexera IC customer presentation, the specification sheet, the suppression-principle presentation, and Application News for EPA 300.1 A/B and ASTM D6919-17).
> - **Charts:** chromatograms are redrawn from those published figures.
> - **Visuals:** all visuals are original and procedural. No Shimadzu logos, photos or video are used.

## Sections
1. **Hero (WebGL):** seven EPA 300.1 anions separate on an anion-exchange column. The carbonate eluent is removed in an electrodialytic suppressor, and the bands write a chromatogram as they cross a conductivity cell. Retention times follow the application note.
2. **Suppression:** a four-stage canvas story: a conducting eluent, membrane exchange driven by water electrolysis, lower background with higher signal, and cation suppression (S/N 125 → 3,215).
3. **Selectivity explorer:** a carbonate-concentration slider using the stoichiometric ion-exchange model, anchored to the published 4.5 mmol/L separation.
4. **The system (WebGL):** a stylised SI-150 + IC-150 + IC-150D tour of autosampler, pump, oven, suppressor, detector and dual channel.
5. **Dual channel:** anion and cation chromatograms on a shared axis.
6. **The ions (WebGL):** a procedurally built hydrated sulfate ion in a field of nitrate, carbonate, chloride and water.
7. **Proven methods:** EPA 300.1 Part A/B and ASTM D6919-17 results.
8. **Analytical intelligence:** a horizontal tour of the automation features.
9. **IC Solution:** four role-based apps, shown as illustrative mock-ups.
10. **Specifications.**
11. **Closing CTA (placeholder).**

## Develop / build
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/ (relative paths, works from any folder)
```
The repository root holds the built site served by GitHub Pages. The source lives in `source/`.

Stack: React 18, TypeScript, Vite, three.js, @react-three/fiber, GSAP ScrollTrigger and Lenis.
