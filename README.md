# Your Life, In Receipts

An interactive reconstruction of 2017 from 2,032 life receipts.

## Problem

Transform a year of fragmented digital traces into meaningful,
discoverable moments.

## Features

- Story-based yearly reconstruction
- Interactive moments
- Connection web
- Pattern detection
- Timeline exploration
- Insights and statistics
- Day-level receipt exploration
- Responsive mobile navigation
- Keyboard accessible interactions

## Dataset

2,032 records across:

- Purchases: 889
- Music: 456
- Places: 258
- Searches: 121
- Messages: 82
- Photos: 97
- Movies: 51
- Events: 34
- Notes: 44

Purchases and music originate from real source datasets;
the remaining categories are synthesized and anchored to
real timestamps/categories.

## Architecture

Dataset
↓
Normalization
↓
Moment / Graph / Pattern engines
↓
View layer
↓
Reusable components

## Performance

- Memoized derived datasets
- Lazy-loaded Insights view
- Reduced-motion support
- Minimal repeated computation
- Responsive rendering

## Accessibility

- Semantic HTML
- Keyboard navigation
- ARIA labels
- Focus management
- Skip-to-content navigation
- Reduced-motion support

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Motion
- Lucide React
- Recharts

## Run locally

npm install
npm run dev

## Build

npm run build

## Deployment

Deployed with Vercel.
