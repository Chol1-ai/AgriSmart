Gemini API Quota & Billing — Quick Steps

1) Verify project and API key
- Ensure `GEMINI_API_KEY` in `backend/.env` corresponds to the Google Cloud project you intend to use.
- You can list accessible models with:

```bash
node backend/gemini-list-models.js
```

2) Enable Billing for the project
- Open the Google Cloud Console: https://console.cloud.google.com/
- Select the project that owns the `GEMINI_API_KEY`.
- Navigate to `Billing` → `Overview` and attach a billing account if none is attached.

3) Enable the Generative AI / Generative Language API
- In the console, go to `APIs & Services` → `Library`.
- Search for "Generative Language API" (or "Generative AI") and click `Enable`.

4) Review and request quota increases
- Navigate to `IAM & Admin` -> `Quotas` or `APIs & Services` -> `Quotas`.
- Filter for `generativelanguage.googleapis.com` and the relevant metrics such as `generate_content requests` or `input token count`.
- If you see limits of 0 or insufficient quotas, click `Edit Quotas` and submit a quota request.

5) Check usage and billing alerts
- `Monitoring` -> `Metrics Explorer` to view usage of `generativelanguage.googleapis.com`.
- Set up billing alerts under `Billing` -> `Budgets & alerts`.

6) Test after enabling billing
- Restart your backend so the updated environment is picked up:

```bash
# from backend/
npm run dev
```

- Re-run the debug helper to confirm:

```bash
node backend/gemini-direct-debug.js
```

7) If quota remains limited or you want a low-cost path
- Consider using a smaller model variant (e.g., `gemini-3.1-flash-lite-image`, `gemini-2.0-flash`) if available for your project.
- Or configure an alternate provider via `GEMINI_FALLBACK_PROVIDER` in `backend/.env` and implement integration.

Security notes
- Do not commit `backend/.env` or API keys to version control.
- Rotate keys periodically and restrict the API key to the required APIs and IP ranges where possible.

Support links
- Quotas & limits: https://ai.google.dev/gemini-api/docs/rate-limits
- Model list / docs: https://developers.generativeai.google/models
