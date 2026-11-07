# Civil BuildCalc

A TypeScript + React web app with civil engineering calculators for concrete, reinforcement rods, piles, beams and columns.

## Getting started

```bash
npm install
npm run dev        # local development server
npm run build      # typecheck + production build
npm run preview    # preview the production build
```

Requires Node.js 18+.

## Project structure

```
src/
  calculators/   Pure calculation logic (no UI)
  components/    Reusable UI pieces (fields, shells, result cards, navbar, footer)
  lib/           Units, validation, reinforcement math, formatting, tool registry
  pages/         One page per tool plus the homepage
  styles/        styles.css – design tokens, components, breakpoints
```

## Calculation notes

- **Rod weight:** `Weight (kg) = (D² / 162) × L`, with D in mm and L in m.
- **Standard rod length:** 39.5 ft (≈ 12.04 m). Bars longer than this are built from multiple pieces with a user-entered lap length. Each piece is counted as one purchased rod.
- **Ring and tie cut length:** core perimeter inside cover, plus a 135° hook allowance of 2 × 10 × bar diameter.
- **Beam ring zones:** L/4 gives end zones of L/4 each and a middle zone of L/2. L/3 gives end zones of L/3 each and a middle zone of L/3.
- **Pile rings:** circumference of the pile core (diameter minus 2 × 75 mm cover) plus a 0.3 m hook allowance.
- **Concrete wastage:** default 5%, adjustable per calculator.

These are estimating approximations. Verify all quantities against your applicable design code and drawings before ordering materials.

## Status

Source is complete. Dependencies were not installed or built in the authoring environment, so run `npm run build` once to confirm the typecheck passes on your machine.
