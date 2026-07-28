import { useState, useEffect, useCallback } from 'react'
import Navbar from '@kumocoders/ui/Navbar.jsx'
import Footer from '@kumocoders/ui/Footer.jsx'
import BlogList from './pages/BlogList.jsx'
import BlogDetail from './pages/BlogDetail.jsx'

function getInitialTheme() {
  const stored = localStorage.getItem('kumocoders-theme')
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getRoute() {
  const path = window.location.pathname
  if (path === '/blog' || path === '/blog/') return { route: 'list', params: {} }
  const detailMatch = path.match(/^\/blog\/([^/]+)$/)
  if (detailMatch) return { route: 'detail', params: { slug: detailMatch[1] } }
  return { route: 'list', params: {} }
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme)
  const [routeInfo, setRouteInfo] = useState(getRoute)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('kumocoders-theme', theme)
    const favicon = document.getElementById('favicon')
    if (favicon) favicon.href = theme === 'dark' ? '/favicon-dark.svg' : '/favicon-light.svg'
  }, [theme])

  useEffect(() => {
    function handlePop() { setRouteInfo(getRoute()) }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  const toggleTheme = useCallback(() => setTheme(prev => prev === 'dark' ? 'light' : 'dark'), [])

  function navigateTo(path) {
    window.history.pushState(null, '', path)
    window.dispatchEvent(new Event('popstate'))
  }

  const { route, params } = routeInfo

  return (
    <>
      <Navbar logoLight="/logo-light.svg" logoDark="/logo-dark.svg" currentTheme={theme} onToggleTheme={toggleTheme} transparent />
      <main className="blog-main">
        {route === 'detail' ? <BlogDetail slug={params.slug} navigateTo={navigateTo} /> : <BlogList navigateTo={navigateTo} />}
      </main>
      <Footer logoLight="/logo-light.svg" logoDark="/logo-dark.svg" currentTheme={theme} />
    </>
  )
}
