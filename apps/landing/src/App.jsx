import { useState, useEffect, useCallback } from 'react'
import useContent from './hooks/useContent.js'
import Navbar from '@kumocoders/ui/Navbar.jsx'
import Footer from '@kumocoders/ui/Footer.jsx'
import Hero from './sections/Hero.jsx'
import About from './sections/About.jsx'
import Timeline from './sections/Timeline.jsx'
import Stats from './sections/Stats.jsx'
import LatestCommunity from './sections/LatestCommunity.jsx'
import LatestBlog from './sections/LatestBlog.jsx'
import LatestWiki from './sections/LatestWiki.jsx'
import LatestProjects from './sections/LatestProjects.jsx'
import LatestGallery from './sections/LatestGallery.jsx'
import Association from './sections/Association.jsx'
import CTA from './sections/CTA.jsx'
import Button from '@kumocoders/ui/Button.jsx'
import PrivacyPage from './pages/PrivacyPage.jsx'
import TermsPage from './pages/TermsPage.jsx'
import CookiesPage from './pages/CookiesPage.jsx'
import JoinPage from './pages/JoinPage.jsx'
import JoinStatus from './pages/JoinStatus.jsx'

function getInitialTheme() {
  const stored = localStorage.getItem('kumocoders-theme')
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getRoute() {
  const path = window.location.pathname
  if (path === '/privacy' || path === '/privacy/') return { route: 'privacy' }
  if (path === '/terms' || path === '/terms/') return { route: 'terms' }
  if (path === '/cookies' || path === '/cookies/') return { route: 'cookies' }
  if (path === '/join' || path === '/join/') return { route: 'join' }
  if (path === '/join/status' || path === '/join/status/') return { route: 'joinStatus' }
  return { route: 'home' }
}

function LoadingSkeleton() {
  return (
    <main className="w-full">
      <div className="relative w-full h-screen min-h-[600px] flex flex-col items-center justify-center gap-space-xl px-space-lg">
        <div className="skeleton-pulse w-[clamp(12rem,40vw,28rem)] h-[clamp(2rem,5vw,4rem)] rounded-radius-md" />
        <div className="skeleton-pulse w-[clamp(14rem,30vw,22rem)] h-6 rounded-radius-md" />
        <div className="flex gap-space-md mt-space-sm">
          <div className="skeleton-pulse w-28 h-10 rounded-radius-full" />
          <div className="skeleton-pulse w-32 h-10 rounded-radius-full" />
        </div>
      </div>

      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="section">
          <div className="section__header">
            <div className="skeleton-pulse w-48 h-5 mx-auto mb-space-md rounded-radius-md" />
            <div className="skeleton-pulse w-[clamp(12rem,50vw,24rem)] h-8 mx-auto rounded-radius-md" />
            <div className="skeleton-pulse w-[clamp(14rem,40vw,20rem)] h-4 mx-auto mt-space-md rounded-radius-md" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg max-w-[900px] mx-auto">
            <div className="skeleton-pulse h-32 rounded-radius-lg" />
            <div className="skeleton-pulse h-32 rounded-radius-lg" />
            <div className="skeleton-pulse h-32 rounded-radius-lg" />
          </div>
        </div>
      ))}
    </main>
  )
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-space-lg text-center gap-space-lg">
      <div className="w-16 h-16 rounded-radius-full bg-error/10 flex items-center justify-center">
        <span className="nf nf-fa-warning text-2xl text-error" />
      </div>
      <h2 className="font-headline text-font-size-2xl font-font-weight-bold text-text">Something went wrong</h2>
      <p className="text-font-size-lg text-text-muted max-w-md">{message || 'Failed to load content. Please try again.'}</p>
      <Button variant="primary" onClick={onRetry}>
        <span className="nf nf-fa-refresh mr-space-xs" /> Try Again
      </Button>
    </div>
  )
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme)
  const { error, loading, getSection } = useContent()
  const [routeInfo, setRouteInfo] = useState(getRoute)

  // Auto-redirect logged-in users to community
  useEffect(() => {
    const token = localStorage.getItem('kc_token')
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => { if (r.ok) window.location.replace('/community') })
        .catch(() => {})
    }
  }, [])

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('kumocoders-theme', theme)

    const favicon = document.getElementById('favicon')
    if (favicon) {
      favicon.href = theme === 'dark' ? '/favicon-dark.svg' : '/favicon-light.svg'
    }
  }, [theme])

  // Listen for popstate (back/forward navigation)
  useEffect(() => {
    function handlePop() { setRouteInfo(getRoute()) }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }, [])

  const { route } = routeInfo

  const handleRetry = useCallback(() => {
    window.location.reload()
  }, [])

  const isHome = route === 'home'

  return (
    <>
      <Navbar
        logoLight="/logo-light.svg"
        logoDark="/logo-dark.svg"
        currentTheme={theme}
        onToggleTheme={toggleTheme}
        transparent={isHome}
      />

      {loading && isHome && <LoadingSkeleton />}

      {!loading && (
        <main>
          {route === 'privacy' && <PrivacyPage />}
          {route === 'terms' && <TermsPage />}
          {route === 'cookies' && <CookiesPage />}
          {route === 'join' && <JoinPage />}
          {route === 'joinStatus' && <JoinStatus />}
          {isHome && error && (
            <ErrorState message={error} onRetry={handleRetry} />
          )}
          {isHome && !error && (
            <>
              <Hero theme={theme} data={getSection('hero')} error={error} />
              <About data={getSection('about')} error={error} />
              <Timeline data={getSection('timeline')} error={error} />
              <Stats data={getSection('stats')} error={error} />
              <LatestCommunity />
              <LatestBlog />
              <LatestWiki />
              <LatestProjects />
              <LatestGallery />
              <Association data={getSection('association')} error={error} />
              <CTA data={getSection('cta')} error={error} />
            </>
          )}
        </main>
      )}

      <Footer
        logoLight="/logo-light.svg"
        logoDark="/logo-dark.svg"
        currentTheme={theme}
        data={getSection('footer')}
      />
    </>
  )
}
