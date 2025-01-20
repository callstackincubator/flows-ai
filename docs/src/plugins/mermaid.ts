/**
 * Borrowed from
 * https://github.com/JuanM04/portfolio/blob/295a5d32a1929b9eb54f8e428ff3ca965525169d/src/plugins/mermaid.ts
 */

import type { RemarkPlugin } from '@astrojs/markdown-remark'
import type { MdxjsEsm, MdxJsxFlowElement } from 'mdast-util-mdx'
import { visit } from 'unist-util-visit'

const escapeMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

const escapeHtml = (str: string) => str.replace(/[&<>"']/g, (c) => escapeMap[c])

export const mermaid: RemarkPlugin<[]> = () => (tree) => {
  let hasMermaidDiagram = false

  visit(tree, 'code', (node) => {
    if (node.lang !== 'mermaid') {
      return
    }

    // @ts-ignore
    node.type = 'html'
    node.value = `
      <div class="mermaid" data-content="${escapeHtml(node.value)}">
        <p>Loading graph...</p>
      </div>
    `

    hasMermaidDiagram = true
  })

  if (hasMermaidDiagram) {
    tree.children.unshift(
      {
        type: 'mdxjsEsm',
        value: 'import Mermaid from "@/components/Mermaid.astro"',
        data: {
          estree: {
            type: 'Program',
            sourceType: 'module',
            body: [
              {
                type: 'ImportDeclaration',
                specifiers: [
                  {
                    type: 'ImportDefaultSpecifier',
                    local: { type: 'Identifier', name: 'Mermaid' },
                  },
                ],
                source: { type: 'Literal', value: '@/components/Mermaid.astro' },
              },
            ],
          },
        },
      } satisfies MdxjsEsm,
      {
        type: 'mdxJsxFlowElement',
        name: 'Mermaid',
        attributes: [],
        children: [],
      } satisfies MdxJsxFlowElement
    )
  }
}
