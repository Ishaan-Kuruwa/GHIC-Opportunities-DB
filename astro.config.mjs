// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Used to build absolute/canonical URLs (see BaseLayout.astro). Update this if the site
  // ever moves to a different domain.
  site: 'https://ghic-opportunities-db.ishaan-wizard.workers.dev',
  vite: {
    plugins: [tailwindcss()]
  }
});