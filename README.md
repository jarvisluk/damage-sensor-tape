# Damage Sensor Tape

A web-based generator for the "damage sensor tape" from Death Stranding. The tool renders a live tape preview faithful to the in-game design, with customizable tape color, description text, serial number, LED code, and a PDF417 barcode that encodes random poem excerpts.

Users can tweak every detail through the side control panel and export the final design as PNG, SVG, or PDF. The project runs entirely in the browser with no build step — just open `index.html`.

## Cloudflare Pages

Deploy as a static site on [Cloudflare Pages](https://developers.cloudflare.com/pages/). With [Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/), use production branch `main`, leave **Build command** empty, and set **Build output directory** to `/` (repository root).

Alternatively, this repo includes [GitHub Actions](.github/workflows/deploy-cloudflare-pages.yml): add secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, ensure a Pages project named `damage-sensor-tape` exists (or edit the workflow), then push to `main`. Production HTTP headers are defined in `_headers`.

## License

The source code is released under the [MIT License](LICENSE). "Death Stranding" and its visual designs are trademarks and/or copyrights of Kojima Productions Co., Ltd. This is an unofficial fan project and is not affiliated with or endorsed by Kojima Productions or Sony Interactive Entertainment.
