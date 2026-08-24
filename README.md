# Dhruv Singh — Portfolio

A freelance UI/UX developer portfolio, built for healthcare, pharma, and regulated brands.

**Live projects featured:** GoatSZN (streetwear e-commerce) · wealtr (personal-finance app).
**Concept work:** Artisan Coffee Roastery · Tata 1mg redesign (self-initiated, unaffiliated).

## Design
- **Style:** cream editorial minimalism — paper-cream palette, oversized Playfair Display headings, Inter body, mono labels.
- **Signature interactions:** custom cursor with a trailing line (flips to cream over dark sections), a subtle click/tap sound (off by default, toggle in the nav), magnetic buttons, scroll reveals, and touch ripples on mobile.
- **Accessibility:** `prefers-reduced-motion` respected, semantic HTML, descriptive alt text, keyboard-navigable.

## Stack
Plain **HTML + CSS + a single vanilla `script.js`** — no build step, no framework. Host anywhere static.

## Structure
```
index.html      # the page
styles.css      # all styling + design tokens
script.js       # cursor trail, sound, reveals, ripple
assets/         # optimized project screenshots
```

## Run locally
Open `index.html` in a browser, or serve the folder:
```
python3 -m http.server 8080
```

Screenshots of live products are captured from real deployments; wealtr uses its built-in demo account (no personal data).

© 2026 Dhruv Singh
