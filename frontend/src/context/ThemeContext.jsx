import { useEffect, useState } from 'react'
import { ThemeContext } from './theme.js'

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') ?? 'light')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggle = () => setTheme((current) => (current === 'light' ? 'dark' : 'light'))

  return <ThemeContext value={{ theme, toggle }}>{children}</ThemeContext>
}
