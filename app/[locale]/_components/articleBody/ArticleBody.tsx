import './ArticleBody.css'

interface ArticleBodyProps {
  contentHtml: string
}

// injecte le HTML déjà transformé par markdownToHtml
export default function ArticleBody({ contentHtml }: ArticleBodyProps) {
  return (
    <div
      className="articleBody"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: contentHtml }}
    />
  )
}
