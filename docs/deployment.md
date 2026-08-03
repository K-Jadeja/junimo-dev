# Deployment

The production source branch is `main` in [`K-Jadeja/junimo-dev`](https://github.com/K-Jadeja/junimo-dev).

Vercel is connected to that repository. A push to `main` creates or updates the production deployment; other branches can be used for preview deployments when the Vercel project enables them.

The Vercel project is `k-jadejas-projects/junimo-dev`, with the default production URL at <https://junimo-dev.vercel.app>.

The project uses the repository's Next.js build configuration. Keep dependency and build changes in `package.json` and `pnpm-lock.yaml`, and do not commit local secrets or `.vercel/` metadata.

The custom domain is `junimo.dev`. Its DNS records are managed at Namecheap and must match the records shown by the Vercel domain configuration.

## Sushi lab subdomain

The Sushi browser lab is attached to this same Vercel project at
`sushi.junimo.dev`. It is intentionally separate from the portfolio case-page
path `https://junimo.dev/sushi`; host-aware Next.js rewrites expose the
standalone lab at `/`, `/llm`, `/tts`, `/llm-tts`, and the other experiment
paths.

The Vercel project is already configured for the subdomain. Namecheap still
needs this DNS record:

```text
Type: A
Host: sushi
Value: 76.76.21.21
```

After DNS propagation, verify the attachment and the live route with:

```powershell
vercel domains inspect sushi.junimo.dev
curl.exe -I https://sushi.junimo.dev/llm
```
