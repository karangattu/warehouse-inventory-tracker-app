# Warehouse Inventory Tracker

Minimal inventory app for warehouse stock-in, stock-out, browsing, and admin operations.

## Setup

```bash
npm install
cp .env.example .env.local
npm run db:push
npm run db:seed
npm run dev
```

## Scripts

- `npm run dev` - start local app
- `npm run build` - production build
- `npm run db:push` - apply schema
- `npm run db:seed` - seed demo data
