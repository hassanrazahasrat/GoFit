# GoFit PWA

A folder of static files. Host it on any HTTPS site and phones can install it like an app.

## Files
- `index.html` : your app (the file you uploaded, plus the PWA tags and an install banner)
- `manifest.webmanifest` : name, colours and icons used when installed
- `sw.js` : the service worker that makes it work offline after the first visit
- `icons/` : app icons (192, 512, maskable 512, Apple touch icon, favicon)
- `_headers` : cache rules for Netlify and Cloudflare Pages (ignored elsewhere)

## 1. Put it online (pick one, all free)
**Netlify Drop (fastest):** open app.netlify.com/drop and drag this whole folder in. You get an `https://...netlify.app` link in seconds.

**Cloudflare Pages:** Workers & Pages, Create, Pages, Upload assets, drag the folder.

**GitHub Pages:** create a repo, upload these files to the root, then Settings, Pages, deploy from the `main` branch. Your link will be `https://yourname.github.io/repo-name/`. Everything works from a sub-folder.

It must be served over HTTPS (or `localhost` for testing). Opening `index.html` straight from a phone or computer will not install.

## 2. Install on a phone
**Android (Chrome):** open the link, tap **Install** in the banner, or the menu (three dots), then **Install app**.

**iPhone / iPad (Safari):** open the link, tap **Share**, then **Add to Home Screen**.

**Desktop (Chrome/Edge):** click the install icon in the address bar.

## 3. Updating the app
1. Replace `index.html` with your new version.
2. Open `sw.js` and change `const VERSION = "gofit-v1"` to `"gofit-v2"` (then v3 and so on).
3. Upload the files again. Phones pick up the update the next time the app opens with internet.

## Good to know
- All progress is saved on the device (localStorage). There is no sync between phones.
- The installed app and the browser tab can keep separate saved data, especially on iPhone. Pick one and keep using it.
- Clearing site data or uninstalling deletes saved progress.
- To test locally: `python3 -m http.server 8000` in this folder, then open `http://localhost:8000`.
