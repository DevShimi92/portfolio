export interface Project {
  title:      string
  label:      string
  description: string
  href:       string | null
  hrefLabel:  string | null
  isHobby: boolean
  video: {
      src: string
    } | null
}
