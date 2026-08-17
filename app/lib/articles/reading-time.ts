const WORDS_PER_MINUTE = 200

// Estime le temps de lecture (en minutes, arrondi au supérieur) à partir du texte brut markdown.
export function estimateReadingTime(rawMarkdown: string): number {
  const wordCount = rawMarkdown
    .replace(/```[\s\S]*?```/g, ' ') // blocs de code
    .replace(/`[^`]*`/g, ' ') // code inline
    .replace(/!\[.*?\]\(.*?\)/g, ' ') // images
    .replace(/\[.*?\]\(.*?\)/g, ' ') // liens
    .replace(/[#>*_~-]/g, ' ') // syntaxe markdown basique
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE))
}
