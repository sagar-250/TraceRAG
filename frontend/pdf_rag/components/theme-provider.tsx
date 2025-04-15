'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ 
  children, 
  ...props 
}: ThemeProviderProps) {
  // Set up theme variables when the component mounts
  React.useEffect(() => {
    // Add CSS variables for dark mode with purple accent
    document.documentElement.style.setProperty('--purple-dark', '#9333ea') // Purple 600
    document.documentElement.style.setProperty('--purple-dark-hover', '#a855f7') // Purple 500
    document.documentElement.style.setProperty('--purple-dark-foreground', '#f3e8ff') // Purple 50
    
    // Background and foreground colors
    document.documentElement.style.setProperty('--background-dark', '#09090b') // Zinc 950
    document.documentElement.style.setProperty('--foreground-dark', '#fafafa') // Zinc 50
    
    // Apply these colors in dark mode using a style tag
    const styleTag = document.createElement('style')
    styleTag.innerHTML = `
      :root[class~="dark"] {
        --background: var(--background-dark);
        --foreground: var(--foreground-dark);
        
        --primary: var(--purple-dark);
        --primary-foreground: var(--purple-dark-foreground);
        
        --muted-foreground: #a1a1aa; /* Zinc 400 */
        --accent: #3f3f46; /* Zinc 700 */
        --accent-foreground: #f4f4f5; /* Zinc 100 */
        
        --border: #27272a; /* Zinc 800 */
        --input: #27272a; /* Zinc 800 */
        --ring: var(--purple-dark);
        
        --card: #18181b; /* Zinc 900 */
        --card-foreground: #fafafa; /* Zinc 50 */
      }
    `
    document.head.appendChild(styleTag)
    
    return () => {
      document.head.removeChild(styleTag)
    }
  }, [])

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}