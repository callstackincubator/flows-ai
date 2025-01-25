// @ts-check
import react from '@astrojs/react'
import starlight from '@astrojs/starlight'
import tailwind from '@astrojs/tailwind'
import { defineConfig } from 'astro/config'

import { mermaid } from './src/plugins/mermaid'

export default defineConfig({
  vite: {
    resolve: {
      /**
       * @uiw/* packages are not compatible with ESM, as they do not import with `.js` extension.
       * We're using source in TypeScript instead.
       */
      alias: {
        '@uiw/react-codemirror': '@uiw/react-codemirror/src/index.tsx',
        '@uiw/codemirror-extensions-basic-setup':
          '@uiw/codemirror-extensions-basic-setup/src/index.ts',
        '@uiw/codemirror-theme-abyss': '@uiw/codemirror-theme-abyss/src/index.ts',
        '@uiw/codemirror-themes': '@uiw/codemirror-themes/src/index.tsx',
      },
      conditions: ['bun'],
    },
    optimizeDeps: {
      /**
       * We need to tell Vite to process @uiw/* and related packages, so we transpile them
       * properly.
       */
      include: [
        '@uiw/codemirror-extensions-basic-setup',
        '@codemirror/state',
        '@codemirror/view',
        '@codemirror/language',
        '@uiw/codemirror-theme-abyss',
        '@uiw/codemirror-themes',
        '@codemirror/lang-javascript',
      ],
    },
  },
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
    starlight({
      title: 'Flows AI',
      social: {
        github: 'https://github.com/callstackincubator/flows-ai',
      },
      customCss: ['./src/styles/base.css'],
      sidebar: [
        {
          label: 'Introduction',
          items: [
            {
              label: 'Getting Started',
              slug: '',
            },
            'introduction/options',
          ],
        },
        {
          label: 'Flows',
          autogenerate: { directory: 'flows' },
        },
        {
          label: 'Guides',
          autogenerate: { directory: 'guides' },
        },
        {
          label: 'Sandbox',
          slug: 'sandbox',
        },
      ],
    }),
  ],
  markdown: {
    remarkPlugins: [mermaid],
  },
})
