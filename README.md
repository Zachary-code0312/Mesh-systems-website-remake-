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

**Netlify / Cloudflare Pages:** connect the repository. Leave the build command empty and set the publish directory to the repository root.

`404.html` uses links that start with `/`, so it works best on the real domain (or any host where the site sits at the root).

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
- **Header and footer** are repeated in every page. To change a menu item, phone number or address, use find-and-replace across all `.html` files.
- **Fonts:** Poppins (headings, matching the logo) and Inter (body text), loaded from Google Fonts.
- **Images:** the site uses drawn illustrations rather than photos, so it's complete as it stands. Real project photos would be a good addition: put them in `assets/img/` and add `<img>` tags where you want them, with `alt` text describing each photo.
- **SEO:** each page has its own title, description and share image (`assets/img/og-image.png`), plus structured data for the business, services, breadcrumbs and blog posts. `sitemap.xml` and `robots.txt` are included.

## Worth checking before going live

- Business details: phone numbers, address, and the memberships shown (CEDIA member, Control4 dealer, Reigate Business Guild, SME Surrey 2023 silver award) are taken from the current site.
- The brand names listed on the home page and service pages are the ones mentioned in the current site's copy.
- Links to Instagram (`mesh_systems`) and Facebook (`meshsystemsltd`).
