import type { ReactElement } from 'react'
import { evaluate } from 'next-mdx-remote-client/rsc'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import { visit } from 'unist-util-visit'
import type { Root, Element } from 'hast'

// Réécrit les chemins d'images relatifs vers leur URL publique finale.
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

export async function compileArticleMdx(mdxSource: string, slug: string): Promise<ReactElement> {
  const { content, error } = await evaluate({
    source: mdxSource,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, [rehypeRewriteImageSrc, slug]],
      },
    },
  })

  if (error) throw error

  return content
}
