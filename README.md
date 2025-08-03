# Gypsum Pricing Calculator

Single-page Next.js + TypeScript application for calculating costs and pricing of gypsum ceiling/partition projects. Persists state in `localStorage` and supports export to PDF/image.

## Features
- Material, labour, and project-wide inputs
- Repeatable areas with conditional modifiers
- Cost allocation, margins, rounding to nearest Rs.5
- Pricing & profit summary
- LocalStorage persistence
- Export full quote as PDF or high-resolution image

## Setup
```bash
npm install
npm run dev
```

## Deployment
Ready for Vercel/Netlify. Build with:
```bash
npm run build
npm start
```

## Notes
- All monetary display uses Rs. prefix and comma thousands separators.
- State is kept in `localStorage` under semantic keys.
