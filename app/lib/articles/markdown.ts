import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import { visit } from 'unist-util-visit'
import type { Root, Element } from 'hast'

/**
 * Réécrit les chemins d'images relatifs vers leur URL publique finale.
 */
function rehypeRewriteImageSrc(slug: string) {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'img') return
      const src = node.properties?.src
      if (typeof src !== 'string') return
      if (/^https?:\/\//.test(src) || src.startsWith('/')) return

      const cleaned = src.replace(/^\.?\/+/, '')
      node.properties.src = `/content/articles/${slug}/${cleaned}`
    })
  }
}

/**
 * Transforme le contenu markdown brut d'un article en HTML.
 * - remark-gfm : tables, strikethrough, listes de tâches, etc.
 * - rehype-slug : ajoute des id sur les titres (utile plus tard pour une TOC)
 */
export async function markdownToHtml(markdown: string, slug: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeRewriteImageSrc, slug)
    .use(rehypeStringify)
    .process(markdown)

  return String(file)
}
