# Kumari Sandbox

**This is a learning sandbox. It is NOT the production Kumari Decors site.**

The production site is being built by Abhishek Shrestha under contract dated 2025-11-10
and lives at `kumaridecors.com` (M2 in progress). That codebase is at
`../frontend/` (cloned from `github.com/bcuAbhishek/kumari-decors-fe`).

## Purpose

This sandbox exists so that Ayush (founder) can:

1. Learn the same stack Abhishek's M2 is built on (Next.js + React + Tailwind +
   custom backend patterns) by building a parallel version with Claude Code.
2. Ship a Blender-modelled 3D hero scene as a React Three Fiber component, which
   will be reused on the production site.
3. Draft brand voice, provenance copy, maker stories, and editorial product page
   layouts that will be handed to Abhishek for inclusion in the production site.
4. Have an honest "custom-stack vs platform-stack" comparison reference once
   Abhishek's M2 ships.

## What this sandbox does NOT do

- It is **not** deployed at `kumaridecors.com`.
- It does **not** receive real customer traffic.
- It does **not** handle real money — Stripe stays in **test mode** for the duration
  of this sandbox's life.
- It does **not** compete with the production site for SEO, branding, or attention.

## Stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- Shopify Storefront API as the catalog/cart/checkout backend (sandbox uses a free
  Shopify development store, not a paid plan)
- Stripe in test mode (Klarna and EU VAT tested via Stripe Test Cards)
- React Three Fiber + drei for the 3D hero scene
- Deployed (if at all) on Vercel free hobby tier

## Who works here

- Ayush + Claude Code (pair programming)
- Abhishek does **not** touch this repo. This is the founder's learning project.

## Status

Bootstrapped 2026-05-07. Real spec to be locked via `/plan-eng-review` before any
ecommerce code is written.

## Local dev

```bash
bun install
bun dev
```

Open http://localhost:3000

## See also

- `../DESIGN.md` — full project context and dual-track plan
- `../frontend/` — Abhishek's production codebase (read-only reference)
- `AGENTS.md` — Claude Code working notes for this sandbox
