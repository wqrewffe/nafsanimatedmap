<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1P6DPSNrZStsNlxwTnowdda57bvSdxi1E

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Vercel

This project is Vite-based and can be deployed as a static site on Vercel.

Quick steps:

1. Push your project to a Git provider (GitHub, GitLab, Bitbucket) and import it into Vercel, or use the Vercel CLI to deploy from this folder.
2. In your Vercel Project Settings -> Environment Variables, add `GEMINI_API_KEY` (the API key used by the app). Do NOT commit secrets to the repo.
3. Vercel will use the following build settings automatically from `vercel.json`:
   - Build Command: `npm run build`
   - Output Directory: `dist`

Notes:
- A `vercel.json` is included to force the static build and route all requests to `index.html` for SPA routing.
- If you want preview/prod variables in Vercel, add `GEMINI_API_KEY` to both Preview and Production scopes in the Vercel dashboard.

Local smoke test before deploying:

1. Install deps: `npm install`
2. Build: `npm run build`
3. Preview: `npm run preview`

