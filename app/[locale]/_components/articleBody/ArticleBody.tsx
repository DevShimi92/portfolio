import type { ReactElement } from 'react'
import './ArticleBody.css'

interface ArticleBodyProps {
  content: ReactElement
}

// rend le JSX déjà compilé par compileArticleMdx
export default function ArticleBody({ content }: ArticleBodyProps) {
  return <div className="articleBody">{content}</div>
}
