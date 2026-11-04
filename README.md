# Mesh Systems website (remake)

A rebuild of [meshsystems.co.uk](https://meshsystems.co.uk) as a fast, plain static site: HTML, CSS and a little JavaScript. There's no build step and nothing to install.

## What's included

| Page | File |
| --- | --- |
| Home | `index.html` |
| About (principles, process, team) | `about.html` |
| Services overview | `services.html` |
| WiFi and home data networks | `data-networks.html` |
| Lighting control systems | `lighting-control-systems.html` |
| TVs and audio systems | `tvs-and-audio-systems.html` |
| Home cinema | `custom-home-cinema-installations.html` |
| Electric blinds and curtains | `electric-blinds-and-curtains.html` |
| Control systems | `controls.html` |
| Security systems | `security.html` |
| Projects (5 case studies) | `projects.html` |
| News (blog index + 14 posts) | `news/index.html`, `news/*.html` |
| Contact (with enquiry form) | `contact.html` |
| Not found | `404.html` |

The page names match the old site's web addresses (for example `/data-networks` and `/news/simple`), so existing Google results and links keep working on hosts that serve `page.html` at `/page` (GitHub Pages, Netlify, Cloudflare Pages and Vercel all do).

The copy is carried over from the current site, tidied into plain English, with typos fixed. All 14 blog posts and all 5 projects are included.

### Interactive touches

- **Home:** an animated "mesh" network behind the hero, and a coverage map of the areas served.
- **WiFi page:** a floor plan that switches between "before" (one router, dead spots) and "after Mesh" (wired access points) coverage.
- **Lighting page:** a working keypad (Bright / Relax / Film / Off) that changes the room's lighting.
- **Blinds page:** a window with a blind you can raise and lower.

All animations switch off for visitors who have "reduce motion" turned on.

## Preview it

Open `index.html` in a browser, or run a local server from this folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Publish it

**GitHub Pages:** in the repository settings, go to Pages, choose "Deploy from a branch", pick the branch and the `/ (root)` folder. To use `meshsystems.co.uk`, add the domain under Pages > Custom domain and point the domain's DNS at GitHub.

**Vercel:** import the repository at vercel.com, choose the "Other" framework preset, leave the build command empty, and deploy. `vercel.json` turns on clean URLs, so `/about` serves `about.html` and the old site's addresses keep working.

**Netlify / Cloudflare Pages:** connect the repository. Leave the build command empty and set the publish directory to the repository root.

`404.html` uses links that start with `/`, so it works best on the real domain (or any host where the site sits at the root).

## Owners area (`/owners`)

A private area for the owners, with:
- **Quotes:** customer and project details, line items grouped by service, discount, VAT, deposit, and a private cost and margin box. Saves as you type. Statuses (draft, sent, accepted, declined) with totals for each.
- **Printable quote:** a branded A4 quote, which you can print or save as a PDF.
- **Price list:** your usual items with your price and your cost, ready to add to quotes.
- **Settings:** business details shown on quotes, quote numbering, VAT, default terms, and backup files.
- **Install as an app:** the owners area can be added to a phone's home screen or installed on a computer (Chrome or Edge). It opens full screen as "Mesh Owners" with its own icon. Settings has the steps for each device.

**Switching it on (Vercel):**
1. In the Vercel project, go to **Settings → Environment Variables**.
2. Add `OWNER_PASSWORD` with a long password, at least 12 characters (four or five random words works well).
3. Redeploy: **Deployments → the latest one → ⋯ → Redeploy**. Environment variable changes only apply to new deployments.
4. Visit `/owners` and sign in.

Until `OWNER_PASSWORD` is set, the owners area is locked for everyone. Changing the password signs everyone out.

**How it's protected:** `middleware.js` runs on Vercel's servers before any `/owners` page is sent. The owners pages' styles and script live in `assets/owners/` so they load without the sign-in cookie. They hold no prices, quotes or passwords. Without a valid sign-in, all anyone gets is the login page. Signing in sets a secure, signed cookie that lasts 30 days ("Keep me signed in") or 12 hours. The password is never stored in the code. This only works on Vercel. On other hosts, or when opening the files directly, `/owners` isn't protected.

**Where the data lives:** quotes, prices and settings are saved in the browser on each device (localStorage). Nothing is uploaded. To move data between devices, or between the two owners, use **Settings → Save backup file**, then **Import backup** on the other device. Importing combines the two, keeping the newest version of each quote. Back up regularly: clearing the browser's data deletes it.

The code for the owners area is visible to anyone while this repository is public, but no prices or quotes are stored in it. To keep the code private too, make the repository private on GitHub (Vercel keeps working).

## Contact form

By default, the form checks the fields, then opens the visitor's email app with the enquiry ready to send to info@meshsystems.co.uk (subject "Website Enquiry"). That works anywhere with no setup.

To receive submissions directly instead, create a form with a service such as [Formspree](https://formspree.io), then put its URL in the form's `data-endpoint` attribute in `contact.html`:

```html
<form id="enquiry-form" novalidate data-endpoint="https://formspree.io/f/your-id">
```

The form then posts the enquiry as JSON and shows a thank-you message.

## Editing

- **Styles:** `assets/css/styles.css`. Colours are set once at the top: brand blue `#3d85c6` (from the logo), plus a deeper blue for buttons and links so text stays readable.
- **Scripts:** `assets/js/main.js` (menus, scroll reveals, hero animation, demos, contact form).
- **Owners area:** `owners/` (the two protected pages), `assets/owners/` (styles, script, app icons and app manifest) and `middleware.js` (the login check). `package.json` only marks the project as using modern JavaScript modules, which Vercel needs for `middleware.js`. There's still no build step.
- **Header and footer** are repeated in every page. To change a menu item, phone number or address, use find-and-replace across all `.html` files.
- **Fonts:** Poppins (headings, matching the logo) and Inter (body text), loaded from Google Fonts.
- **Images:** the site uses drawn illustrations rather than photos, so it's complete as it stands. Real project photos would be a good addition: put them in `assets/img/` and add `<img>` tags where you want them, with `alt` text describing each photo.
- **SEO:** each page has its own title, description and share image (`assets/img/og-image.png`), plus structured data for the business, services, breadcrumbs and blog posts. `sitemap.xml` and `robots.txt` are included.

## Worth checking before going live

- Business details: phone numbers, address, and the memberships shown (CEDIA member, Control4 dealer, Reigate Business Guild, SME Surrey 2023 silver award) are taken from the current site.
- The brand names listed on the home page and service pages are the ones mentioned in the current site's copy.
- Links to Instagram (`mesh_systems`) and Facebook (`meshsystemsltd`).
