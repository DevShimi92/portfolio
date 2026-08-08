export type NavLink =
  | { id: string; label: string; type: 'section' }
  | { id: string; label: string; type: 'route'; path: string }
