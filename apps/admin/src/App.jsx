import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ContentList from './pages/ContentList.jsx'
import EditSection from './pages/EditSection.jsx'
import UsersList from './pages/UsersList.jsx'
import EditUser from './pages/EditUser.jsx'
import Profile from './pages/Profile.jsx'
import Settings from './pages/Settings.jsx'
import ProjectList from './pages/ProjectList.jsx'
import EditProject from './pages/EditProject.jsx'
import BlogList from './pages/BlogList.jsx'
import EditBlog from './pages/EditBlog.jsx'
import WikiList from './pages/WikiList.jsx'
import EditWiki from './pages/EditWiki.jsx'
import GalleryList from './pages/GalleryList.jsx'
import EditGallery from './pages/EditGallery.jsx'
import CommunityPosts from './pages/CommunityPosts.jsx'
import ReportsList from './pages/ReportsList.jsx'
import SendNotification from './pages/SendNotification.jsx'
import WordFilters from './pages/WordFilters.jsx'
import JoinSettings from './pages/JoinSettings.jsx'
import JoinApplications from './pages/JoinApplications.jsx'
import JoinApplicationDetail from './pages/JoinApplicationDetail.jsx'
import CreateUserFromApplication from './pages/CreateUserFromApplication.jsx'

/**
 * Extract the current route pathname relative to /admin
 * Returns { route, params }
 */
function getRouteInfo() {
  const path = window.location.pathname

  // /admin/login
  if (path === '/admin/login') return { route: 'login', params: {} }

  // /admin/edit/:sectionKey
  const editMatch = path.match(/^\/admin\/edit\/([^/]+)$/)
  if (editMatch) return { route: 'edit', params: { sectionKey: editMatch[1] } }

  // /admin/edit-user/:id
  const editUserMatch = path.match(/^\/admin\/edit-user\/(\d+)$/)
  if (editUserMatch) return { route: 'editUser', params: { userId: editUserMatch[1] } }

  // /admin/profile
  if (path === '/admin/profile') return { route: 'profile', params: {} }

  // /admin/settings
  if (path === '/admin/settings') return { route: 'settings', params: {} }

  // /admin/users
  if (path === '/admin/users') return { route: 'users', params: {} }

  // /admin/content
  if (path === '/admin/content') return { route: 'content', params: {} }

  // /admin/projects
  if (path === '/admin/projects') return { route: 'projects', params: {} }

  // /admin/projects/edit/:id
  const projectEditMatch = path.match(/^\/admin\/projects\/edit\/(\d+)$/)
  if (projectEditMatch) return { route: 'editProject', params: { projectId: projectEditMatch[1] } }

  // /admin/blog
  if (path === '/admin/blog') return { route: 'blog', params: {} }

  // /admin/blog/edit/:id
  const blogEditMatch = path.match(/^\/admin\/blog\/edit\/(\d+)$/)
  if (blogEditMatch) return { route: 'editBlog', params: { postId: blogEditMatch[1] } }

  // /admin/wiki
  if (path === '/admin/wiki') return { route: 'wiki', params: {} }

  // /admin/wiki/edit/:id
  const wikiEditMatch = path.match(/^\/admin\/wiki\/edit\/(\d+)$/)
  if (wikiEditMatch) return { route: 'editWiki', params: { pageId: wikiEditMatch[1] } }

  // /admin/gallery
  if (path === '/admin/gallery') return { route: 'gallery', params: {} }

  // /admin/gallery/edit/:id
  const galleryEditMatch = path.match(/^\/admin\/gallery\/edit\/(\d+)$/)
  if (galleryEditMatch) return { route: 'editGallery', params: { itemId: galleryEditMatch[1] } }

  // /admin/community
  if (path === '/admin/community') return { route: 'community', params: {} }

  // /admin/reports
  if (path === '/admin/reports') return { route: 'reports', params: {} }

  // /admin/send-notification
  if (path === '/admin/send-notification') return { route: 'sendNotification', params: {} }

  // /admin/filters
  if (path === '/admin/filters') return { route: 'filters', params: {} }

  // /admin/join/applications/:id/create-user
  const createUserMatch = path.match(/^\/admin\/join\/applications\/(\d+)\/create-user$/)
  if (createUserMatch) return { route: 'createUserFromApp', params: { submissionId: createUserMatch[1] } }

  // /admin/join/applications/:id
  const joinAppMatch = path.match(/^\/admin\/join\/applications\/(\d+)$/)
  if (joinAppMatch) return { route: 'joinApplicationDetail', params: { submissionId: joinAppMatch[1] } }

  // /admin/join/applications
  if (path === '/admin/join/applications') return { route: 'joinApplications', params: {} }

  // /admin/join
  if (path === '/admin/join') return { route: 'joinSettings', params: {} }

  // /admin or /admin/...
  if (path.startsWith('/admin')) return { route: 'dashboard', params: {} }

  return { route: null, params: {} }
}

function navigateTo(path) {
  window.history.pushState(null, '', path)
  window.dispatchEvent(new Event('popstate'))
}

function Router() {
  const { user, loading } = useAuth()
  const [routeInfo, setRouteInfo] = useState(getRouteInfo)

  // Listen for popstate (back/forward navigation)
  useEffect(() => {
    function handlePop() {
      setRouteInfo(getRouteInfo())
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  const isAuthenticated = !!user

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p>Loading...</p>
      </div>
    )
  }

  const { route, params } = routeInfo

  // Protected routes: redirect to login if not authenticated
  if (!isAuthenticated && route !== 'login') {
    navigateTo('/admin/login')
    return null
  }

  // If authenticated and on login, redirect to dashboard
  if (isAuthenticated && route === 'login') {
    navigateTo('/admin')
    return null
  }

  switch (route) {
    case 'login':
      return <Login />
    case 'dashboard':
      return <Dashboard />
    case 'content':
      return <ContentList />
    case 'edit':
      return <EditSection sectionKey={params.sectionKey} />
    case 'users':
      return <UsersList />
    case 'editUser':
      return <EditUser userId={params.userId} />
    case 'profile':
      return <Profile />
    case 'settings':
      return <Settings />
    case 'projects':
      return <ProjectList />
    case 'editProject':
      return <EditProject projectId={params.projectId} />
    case 'blog':
      return <BlogList />
    case 'editBlog':
      return <EditBlog postId={params.postId} />
    case 'wiki':
      return <WikiList />
    case 'editWiki':
      return <EditWiki pageId={params.pageId} />
    case 'gallery':
      return <GalleryList />
    case 'editGallery':
      return <EditGallery itemId={params.itemId} />
    case 'community':
      return <CommunityPosts />
    case 'reports':
      return <ReportsList />
    case 'sendNotification':
      return <SendNotification />
    case 'filters':
      return <WordFilters />
    case 'joinSettings':
      return <JoinSettings />
    case 'joinApplications':
      return <JoinApplications />
    case 'joinApplicationDetail':
      return <JoinApplicationDetail submissionId={params.submissionId} />
    case 'createUserFromApp':
      return <CreateUserFromApplication submissionId={params.submissionId} />
    default:
      navigateTo('/admin')
      return null
  }
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  )
}

export { navigateTo }
