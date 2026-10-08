# Nexera IC: an unofficial interactive showcase

A cinematic single-page site that explains ion chromatography through the Shimadzu Nexera IC.

> **Independent, unofficial project.** This site is not affiliated with, sponsored or endorsed by Shimadzu Corporation.
> Nexera, Shim-pack and Shim-vial are trademarks of Shimadzu Corporation or its affiliated companies.
>
> - **Sources:** specifications and data are summarised from Shimadzu customer-facing material (the Nexera IC customer presentation, the specification sheet, the suppression-principle presentation, and Application News for EPA 300.1 A/B and ASTM D6919-17).
> - **Charts:** chromatograms are redrawn from those published figures.
> - **Visuals:** all visuals are original and procedural. No Shimadzu logos, photos or video are used.

## Sections
1. **Hero (WebGL):** one continuous liquid flow path, following the flow chart in the EPA 300.1 Part A application note: eluent → pump → injection valve and sample loop → guard + anion-exchange column → membrane suppressor → conductivity cell → suppressor regenerant channels → waste. The column is a cut-away of a packed resin bed with fixed positive (quaternary-ammonium) sites; sample anions are alternately held at sites and carried by the eluent, so bands separate with retention times from the application note. The suppressor is a labelled schematic (not the ICDS-Ai internals). The enclosed cell has a separate, magnified interior view, and a live chromatogram (min, µS/cm) is written as each band passes. Without WebGL a static labelled flow diagram is shown instead.
2. **Suppression:** a four-stage canvas story. Anions: cation-exchange membranes, H⁺ in and Na⁺ out, carbonate → carbonic acid. Cations have their own state: anion-exchange membranes, OH⁻ in and methanesulfonate out, MSA → water (S/N 125 → 3,215).
3. **Selectivity explorer:** a carbonate slider using the stoichiometric ion-exchange model, capped at 7.5 mmol/L Na₂CO₃ (15 mmol/L Na⁺, the documented ICDS-Ai limit). Predicted values are labelled as illustrative model output.
4. **The system (WebGL):** closed single system (SI-150 + IC-150), open-door views of the autosampler, pump, oven, suppressor and detector, then the IC-150D with its own separate analytical path, and a closed dual system. The interior is simplified from Shimadzu product images.
5. **Dual channel:** anion and cation chromatograms from separate application notes on a shared axis.
6. **The ions (WebGL):** a procedurally built hydrated sulfate ion in a field of nitrate, carbonate, chloride and water.
7. **Proven methods:** EPA 300.1 Part A/B and ASTM D6919-17 results, each chart linked to its source.
8. **Analytical intelligence:** a horizontal tour of the automation features.
9. **IC Solution:** four role-based apps, shown as illustrative mock-ups.
10. **Specifications:** with conflicting source values listed as unresolved discrepancies.
11. **Closing CTA:** links to Shimadzu’s own product-inquiry form and product page.

A compact **guided tour** control (play / pause / stop, Top, End) auto-scrolls the page; it is unrelated to any sales demonstration. Space or P pauses, Esc stops, and any manual scroll pauses it.

## Sources
- Application News 01-01104A-EN, EPA 300.1 Part A: https://www.shimadzu.com/an/sites/shimadzu.com.an/files/pim/pim_document_file/applications/application_note/26181/an_01-01104-en.pdf
- Application News 01-01153-EN, EPA 300.1 Part B: https://www.shimadzu.com/an/apl/26349/index.html
- Application News 01-01134-EN, ASTM D6919-17 cations: https://www.shimadzu.com/an/apl/26500/index.html
- Nexera IC specifications: https://www.shimadzu.com/an/products/liquid-chromatography/ion-chromatograph/nexera-ic/spec.html
- Nexera IC customer presentation (2026), suppression-principle presentation and IC column selection guide (customer materials, not publicly linked)

## Develop / build
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/ (relative paths, works from any folder)
```
The repository root holds the built site served by GitHub Pages. The source lives in `source/`.

Stack: React 18, TypeScript, Vite, three.js, @react-three/fiber, GSAP ScrollTrigger and Lenis.
