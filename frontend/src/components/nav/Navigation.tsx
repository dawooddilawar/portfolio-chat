'use client'

import { FaGithub } from 'react-icons/fa'
import { HiDocumentText } from 'react-icons/hi'
import { BsSun, BsMoon } from 'react-icons/bs'
import styles from '@/styles/navigation.module.css'
import { useTheme } from '@/contexts/ThemeContext'
import Link from 'next/link'

const Navigation = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <nav className={styles.nav}>
      <div className={styles.links}>
        <button 
          onClick={toggleTheme}
          className={styles.link}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <BsSun size={22} /> : <BsMoon size={22} />}
        </button>
        <a 
          href="https://github.com/dawooddilawar" 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.link}
        >
          <FaGithub size={24} />
        </a>
        <a 
          href="https://read.cv/dawooddilawar" 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.link}
        >
          <HiDocumentText size={24} />
        </a>
        <Link href="/blog" className={styles.link}>Blog</Link>
      </div>
    </nav>
  )
}

export default Navigation 