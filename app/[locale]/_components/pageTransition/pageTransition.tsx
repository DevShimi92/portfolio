'use client'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useActiveNavLink } from '@/app/[locale]/_hooks/useActiveNavLink'
import { getLastScrollY } from '@/app/lib/scrollMemory'

interface Props {
  children: React.ReactNode
  animate?: boolean
}

export default function PageTransition({ children, animate = true }: Props) {
  const { isStandaloneRoute } = useActiveNavLink()

  useEffect(() => {
    if (isStandaloneRoute) {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
      return
    }

    if (window.location.hash) return // une ancre explicite garde la priorité

    const y = getLastScrollY()
    if (y > 0) {
      window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior })
    }
  }, [isStandaloneRoute])

  if (!animate) return <>{children}</>

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
