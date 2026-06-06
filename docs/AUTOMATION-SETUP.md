# GitHub Pages Automatic Store Package

This package is ready for a GitHub repository.

## Folder layout

- public/ - GitHub Pages website files.
- .github/workflows/deploy-pages.yml - automatic GitHub Pages deployment.
- utomation/cloudflare-worker/ - optional free-tier backend for order automation.
- platform-imports/ - product CSV/JSON files.
- docs/ - setup and reality-check documentation.

## What is automatic

After setup:

1. Push to GitHub.
2. GitHub Actions deploys the website automatically to GitHub Pages.
3. The storefront can POST orders to your automation endpoint.
4. The automation endpoint can create Printful orders when product mappings and API keys are configured.
5. The automation endpoint can email the owner when an email API key is configured.

## What cannot be 100% free

GitHub Pages is free, and Cloudflare Workers has a free tier. But printing clothes and shipping packages costs money per order. A real automatic workflow requires:

- A payment provider to collect money.
- A print-on-demand provider such as Printful/Printify.
- Product variant mapping.
- A billing method on the print provider account.
- API keys stored in the backend, never in GitHub Pages.

## Quick start

1. Create a new GitHub repo.
2. Upload this whole package.
3. In the repo settings, enable GitHub Pages with GitHub Actions.
4. Push to main.
5. Your site deploys from public/.

For automation, read:

- docs/AUTOMATION-SETUP.md
- docs/PRODUCT-MAPPING.md
"@ | Set-Content -LiteralPath (Join-Path C:\Users\Jeffo\Documents\Codex\2026-06-06\files-mentioned-by-the-user-pasted\outputs\zl-worldwide-github-pages-auto "README.md") -Encoding UTF8

@"
# Automation Setup

## Honest architecture

GitHub Pages cannot run private automation by itself. The safe free-tier setup is:

`	ext
Customer -> GitHub Pages storefront -> Cloudflare Worker -> Printful/Email APIs
`

## Setup steps

1. Create a free Cloudflare account.
2. Install or use Cloudflare Workers dashboard.
3. Create a Worker and paste utomation/cloudflare-worker/worker.js.
4. Add the variables from wrangler.toml.example.
5. Start in dry-run mode:

`	ext
MODE=dry_run
FULFILLMENT_PROVIDER=dry_run
`

6. Deploy the Worker.
7. Copy the Worker URL ending in /order.
8. Open public/zl-automation-config.js.
9. Paste the URL into ORDER_API_URL.
10. Commit and push.

## Printful automation

When ready:

`	ext
FULFILLMENT_PROVIDER=printful
PRINTFUL_CONFIRM=false
PRINTFUL_TOKEN=your secret token
PRINTFUL_VARIANT_MAP=your product-size map
`

Keep PRINTFUL_CONFIRM=false until you have tested everything. When false, Printful creates draft orders instead of auto-printing.

Switch to this only after a real payment provider is connected:

`	ext
PRINTFUL_CONFIRM=true
`

## Email automation

The worker includes optional Resend email support:

`	ext
RESEND_API_KEY=your secret key
OWNER_EMAIL=ZenLuxuryWorldWide@gmail.com
RESEND_FROM=ZL Worldwide <orders@yourdomain.com>
`

Most email services require domain verification, even on free tiers.

## Payment warning

Do not auto-send print orders unless payment has been confirmed. A static page can be edited by a visitor, so the backend should eventually verify a payment webhook from Stripe, PayPal, Mollie, Shopify, Wix, or another provider before confirming fulfillment.
