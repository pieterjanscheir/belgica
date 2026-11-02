# belgica explorer

A Next.js site built on the package, deployed on Vercel at https://belgica.scheir.eu/. It's
a static export: every page is rendered from the package's data at build time, in each of the
docs' 13 languages, so it needs no server.

```bash
pnpm build          # the package, which the site imports from the workspace
pnpm site:dev       # http://localhost:3000
pnpm site:build     # out/; SITE_BASE for the path it's served under, if not the root
```

- Every page is under `/<locale>/` (next-intl, `i18n/routing.ts`); `/` sends the browser to the
  first of its languages the site has. The interface text is in `messages/<locale>.json`, with
  `en.json` the source.
- Official names render in Dutch, French and German at once, and the header's NL · FR · DE switch
  picks one with CSS, so the pages stay static. It follows the site's language when that's one of
  the three.
- Each page passes its client components only the message namespaces they read
  (`lib/client-messages.tsx`): the whole file in every page would add about 1 GB.
- `scripts/build-map.ts` simplifies the canton boundaries (23 MB) into `public/canton-map.json`
  (under 200 kB), which every map loads once. `app/[locale]/search-index.json/route.ts` writes
  each language's search index at build time.
- Vercel builds with `site/vercel.json`: the package first, then the site. `scripts/ignore-build.sh`
  skips the builds that can't change it: the `sources`, `data/*` and `dependabot/*` branches, and
  any push that leaves the site, the package's source and its data as they were.
