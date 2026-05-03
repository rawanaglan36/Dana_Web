# Dana Landing Page

Static landing page (HTML/CSS/JS) for Dana.

## Structure

- `index.html` — page markup
- `styles.css` — styling (includes light/dark + RTL support)
- `script.js` — interactions (FAQ accordion, tabs, reveal, language + theme toggles)
- `assets/` — images and icons

## Run locally

Any static server works. Examples:

### PowerShell (Python)

```powershell
python -m http.server 5173
```

Then open `http://localhost:5173/`.

### PowerShell (Node)

```powershell
npx serve . -l 5173
```

## Deployment

This project is static — deploy by uploading the repository contents to your web server (or the build output if your pipeline copies files).

Recommended server settings:

- Serve `index.html` for `/`
- Send long-cache headers for `assets/*` (cache-busting is handled by file names when you update them)
- Enable gzip/brotli compression for `.css`, `.js`, `.svg`, `.html`

