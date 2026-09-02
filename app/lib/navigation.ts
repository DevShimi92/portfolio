import type { NavLink } from '@/app/types/navlink';

export const NAV_LINKS: NavLink[] = [
  { id: 'home',    label: 'Home',    type: 'section' },
  { id: 'about',   label: 'Info',    type: 'section' },
  { id: 'projets', label: 'Projets', type: 'section' },
  //{ id: 'articles',label: 'Articles',type: 'route', path: '/articles' },
  { id: 'contact', label: 'Contact', type: 'route', path: '/contact' },
]
