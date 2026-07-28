import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import CommunityLayout from './components/CommunityLayout.jsx';
import Feed from './pages/Feed.jsx';
import PostDetail from './pages/PostDetail.jsx';
import NewPost from './pages/NewPost.jsx';
import EditPost from './pages/EditPost.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import NotificationsPage from './pages/Notifications.jsx';
import AchievementsPage from './pages/Achievements.jsx';
import DraftsPage from './pages/DraftsPage.jsx';
import CollectionsPage from './pages/CollectionsPage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import PushSetup from './components/PushSetup.jsx';
import FeedbackPage from './pages/FeedbackPage.jsx';
import GuidelinesPage from './pages/GuidelinesPage.jsx';
import MutedWordsPage from './pages/MutedWordsPage.jsx';
import WebhooksPage from './pages/WebhooksPage.jsx';

// ─── Simple state-based router ────────────────────
export function getRouteInfo() {
  const path = window.location.pathname.replace(/^\/community/, '') || '/';
  const match = (pattern) => {
    const regex = new RegExp('^' + pattern.replace(/:\w+/g, '([^/]+)') + '$');
    const m = path.match(regex);
    return m ? m.slice(1) : null;
  };

  let route = null;
  let params = {};

       if (path === '/' || path === '')                    { route = 'feed'; }
  else if (path === '/login')                              { route = 'login'; }
  else if (path === '/register')                           { route = 'register'; }
  else if (path === '/new')                                { route = 'new'; }
  else if (path === '/edit')                               { route = 'edit'; }
  else if (path === '/settings')                           { route = 'settings'; }
  else if (path === '/drafts')                              { route = 'drafts'; }
  else if (path === '/notifications')                      { route = 'notifications'; }
  else if (path === '/achievements')                       { route = 'achievements'; }
  else if (path === '/collections')                         { route = 'collections'; }
  else if (path === '/leaderboard')                         { route = 'leaderboard'; }
  else if (path === '/feedback')                            { route = 'feedback'; }
  else if (path === '/guidelines')                          { route = 'guidelines'; }
  else if (path === '/muted')                               { route = 'muted'; }
  else if (path === '/webhooks')                            { route = 'webhooks'; }
  else if (match('/post/:id'))                             { route = 'post'; params = { id: match('/post/:id')[0] }; }
  else if (match('/edit/:id'))                             { route = 'edit'; params = { id: match('/edit/:id')[0] }; }
  else if (path === '/search')                              { route = 'search'; }
  else if (match('/profile/:username'))                    { route = 'profile'; params = { username: match('/profile/:username')[0] }; }
  else                                                     { route = 'notfound'; }

  return { route, params };
}

export function navigateTo(path) {
  const full = '/community' + (path.startsWith('/') ? '' : '/') + path;
  window.history.pushState(null, '', full);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

// ─── Page map ─────────────────────────────────────
function Router() {
  const { user, loading } = useAuth();
  const [routeInfo, setRouteInfo] = useState(getRouteInfo);

  useEffect(() => {
    const handler = () => setRouteInfo(getRouteInfo());
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const { route, params } = routeInfo;
  const id = params.id;
  const username = params.username;

  // Pages that don't require auth
  if (route === 'login') return <Login />;
  if (route === 'register') return <Register />;

  // Wait for auth
  if (loading) {
    return (
      <div className="community-loading-screen">
        <div className="community-loading-spinner" />
      </div>
    );
  }

  // Auth'd pages
  if (route === 'new') return <NewPost />;
  if (route === 'edit') return <EditPost id={id} />;
  if (route === 'settings') return <Settings />;
  if (route === 'drafts') return <DraftsPage />;

  // Public pages wrapped in layout
  return (
    <CommunityLayout>
      <PushSetup />
      {route === 'feed' && <Feed />}
      {route === 'notifications' && <NotificationsPage />}
      {route === 'achievements' && <AchievementsPage />}
      {route === 'collections' && <CollectionsPage />}
      {route === 'search' && <SearchPage />}
      {route === 'leaderboard' && <LeaderboardPage />}
      {route === 'feedback' && <FeedbackPage />}
      {route === 'guidelines' && <GuidelinesPage />}
      {route === 'muted' && <MutedWordsPage />}
      {route === 'webhooks' && <WebhooksPage />}
      {route === 'post' && <PostDetail id={id} />}
      {route === 'profile' && <Profile username={username} />}
      {route === 'notfound' && (
        <div className="community-notfound">
          <span className="nf nf-fa-circle_question text-5xl mb-4" />
          <h2>Page not found</h2>
          <p>The page you're looking for doesn't exist.</p>
          <button className="community-btn community-btn--primary" onClick={() => navigateTo('/')}>
            Back to Feed
          </button>
        </div>
      )}
    </CommunityLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router />
      </ToastProvider>
    </AuthProvider>
  );
}
