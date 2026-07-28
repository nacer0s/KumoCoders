import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { navigateTo } from '../App.jsx';
import CommunityLayout from '../components/CommunityLayout.jsx';
import UserAvatar from '@kumocoders/ui/UserAvatar.jsx';
import UploadDropzone from '@kumocoders/ui/UploadDropzone.jsx';

const DEFAULT_SETTINGS = {
  profile_visibility: 'public',
  show_online_status: true,
  show_last_seen: true,
  allow_follows: 'everyone',
  allow_dms: 'everyone',
  show_liked_posts: true,
  show_saved_posts: false,
  nsfw_filter: 'blur',
  feed_density: 'comfortable',
  default_sort: 'new',
  posts_per_page: 20,
  show_preview_images: true,
  hide_downvoted_posts: false,
  notify_likes: true,
  notify_comments: true,
  notify_mentions: true,
  notify_follows: true,
  notify_badges: true,
  notify_system: true,
  theme: 'system',
  font_size: 'medium',
  reduce_motion: false,
  high_contrast: false,
  font_family: 'system',
  two_factor_auth: false,
  login_alerts: true,
  session_timeout: '24h',
};

export default function Settings() {
  const { user, token } = useAuth();
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSection, setSavingSection] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  // Profile form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Muted users
  const [mutedUsers, setMutedUsers] = useState([]);

  // Sessions
  const [sessions, setSessions] = useState([]);

  // Account info
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Tabs scroll detection
  const tabsRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrolling, setScrolling] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.display_name || '');
    setBio(user.bio || '');
    setAvatarUrl(user.avatar_url || '');
  }, [user]);

  const fetchSettings = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/community/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [token]);

  const fetchMuted = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/community/muted', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMutedUsers(data.muted || []);
      }
    } catch {}
  }, [token]);

  const fetchSessions = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    fetchSettings();
    fetchMuted();
    fetchSessions();
  }, [fetchSettings, fetchMuted, fetchSessions]);

  useEffect(() => {
    if (loading) return;
    const el = tabsRef.current;
    if (!el) return;
    let scrollTimer;
    function checkScroll() {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
      setScrolling(true);
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => setScrolling(false), 600);
    }
    checkScroll();
    el.addEventListener('scroll', checkScroll);
    const ro = new ResizeObserver(() => checkScroll());
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      ro.disconnect();
    };
  }, [loading]);

  async function handleAvatarUpload(url) {
    setAvatarUrl(url);
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ display_name: displayName.trim() || null, bio: bio.trim() || null, avatar_url: url }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update profile');
      }
      setSuccess('Profile picture updated');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          display_name: displayName.trim() || null,
          bio: bio.trim() || null,
          avatar_url: avatarUrl.trim() || null,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update profile');
      }
      setSuccess('Profile updated');
      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    setChangingPassword(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to change password');
      }
      setSuccess('Password changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleSettingChange(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSavingSection(key);
    setError('');
    setSuccess('');

    // Apply theme immediately on the client
    if (key === 'theme') {
      let resolved;
      if (value === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        resolved = value;
      }
      document.documentElement.setAttribute('data-theme', resolved);
      localStorage.setItem('kumocoders-theme', value);
      const favicon = document.getElementById('favicon');
      if (favicon) favicon.href = `/community/favicon-${resolved}.svg`;
      const manifest = document.getElementById('pwa-manifest');
      if (manifest) manifest.href = `/community/manifest-${resolved}.json`;
      const tc = document.querySelector('meta[name="theme-color"]');
      if (tc) tc.content = resolved === 'dark' ? '#0D1117' : '#FFFFFF';
    }

    try {
      const res = await fetch('/api/community/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save setting');
      }
      setSuccess('Setting saved');
    } catch (err) {
      setError(err.message);
      setSettings((prev) => ({ ...prev }));
    } finally {
      setSavingSection(null);
    }
  }

  async function handleUnmute(userId) {
    try {
      const res = await fetch(`/api/community/unmute/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMutedUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {}
  }

  async function handleRevokeSession(sessionId) {
    try {
      const res = await fetch('/api/auth/sessions/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (res.ok) fetchSessions();
    } catch {}
  }

  async function handleExportData() {
    try {
      const res = await fetch('/api/auth/export', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data.export, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kumocoders-export-${user.username}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setSuccess('Data exported');
      }
    } catch {}
  }

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'content', label: 'Content' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'display', label: 'Display' },
    { id: 'account', label: 'Account' },
  ];

  if (!user) {
    return (
      <CommunityLayout>
        <div className="community-empty p-12 px-4 text-center">
          <span className="nf nf-fa-lock text-4xl opacity-40" />
          <h3>Sign in to access settings</h3>
          <button className="community-btn community-btn--primary" onClick={() => navigateTo('/login')}>
            Sign In
          </button>
        </div>
      </CommunityLayout>
    );
  }

  if (loading) {
    return (
      <CommunityLayout>
        <div className="community-loading-screen"><div className="community-loading-spinner" /></div>
      </CommunityLayout>
    );
  }

  return (
    <CommunityLayout>
      <div className="community-settings-page">
        <button className="community-btn community-btn--ghost community-back-btn" onClick={() => navigateTo('/')}>
          <span className="nf nf-fa-arrow_left" /> Back to Feed
        </button>

        <div className="community-settings-card">
          <h1>Settings</h1>

          {error && <div className="community-error">{error}</div>}
          {success && <div className="community-success">{success}</div>}

          <div className="community-settings-tabs-wrap">
            <div className={`community-settings-tabs${canScrollLeft ? ' can-scroll-left' : ''}${canScrollRight ? ' can-scroll-right' : ''}${scrolling ? ' is-scrolling' : ''}`} ref={tabsRef}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`community-settings-tab${activeTab === tab.id ? ' active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className={`community-tabs-overlay${canScrollLeft ? ' can-scroll-left' : ''}${canScrollRight ? ' can-scroll-right' : ''}${scrolling ? ' is-scrolling' : ''}`} aria-hidden="true">
              <div className="community-tabs-overlay-left"><span>{'\u2039'}</span></div>
              <div className="community-tabs-overlay-right"><span>{'\u203A'}</span></div>
            </div>
          </div>

          <div className="community-settings-scroll">
            {/* ── Profile Tab ── */}
            {activeTab === 'profile' && (
              <>
                <section className="community-settings-section">
                  <h2>Profile</h2>
                  <form onSubmit={handleProfileSubmit}>
                    <div className="community-form-group">
                      <label htmlFor="settings-name">Display Name</label>
                      <input id="settings-name" type="text" className="community-input" placeholder="Your display name"
                        value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                    </div>
                    <div className="community-form-group">
                      <label htmlFor="settings-bio">Bio</label>
                      <textarea id="settings-bio" className="community-textarea" placeholder="Tell us about yourself..."
                        value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
                    </div>
                    <div className="community-form-group">
                      <label>Profile Picture</label>
                      <UploadDropzone type="avatar" onUpload={handleAvatarUpload}
                        className="mt-1" />
                      {avatarUrl && (
                        <div className="mt-2">
                          <p className="community-text-muted text-xs mb-1">Current:</p>
                          <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-border bg-surface"
                            onError={(e) => { e.target.style.display = 'none' }} />
                        </div>
                      )}
                    </div>
                    <div className="community-form-actions">
                      <button type="submit" className="community-btn community-btn--primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Profile'}
                      </button>
                    </div>
                  </form>
                </section>

                <section className="community-settings-section">
                  <h2>Change Password</h2>
                  <form onSubmit={handlePasswordSubmit}>
                    <div className="community-form-group">
                      <label htmlFor="settings-current-pw">Current Password</label>
                      <div className="community-password-wrapper">
                        <input id="settings-current-pw" type="password" className="community-input community-input--password"
                          placeholder="Current password" value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)} required />
                      </div>
                    </div>
                    <div className="community-form-group">
                      <label htmlFor="settings-new-pw">New Password</label>
                      <div className="community-password-wrapper">
                        <input id="settings-new-pw" type="password" className="community-input community-input--password"
                          placeholder="New password (min 6 characters)" value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)} required />
                      </div>
                    </div>
                    <div className="community-form-group">
                      <label htmlFor="settings-confirm-pw">Confirm New Password</label>
                      <div className="community-password-wrapper">
                        <input id="settings-confirm-pw" type="password" className="community-input community-input--password"
                          placeholder="Confirm new password" value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)} required />
                      </div>
                    </div>
                    <div className="community-form-actions">
                      <button type="submit" className="community-btn community-btn--primary" disabled={changingPassword}>
                        {changingPassword ? 'Changing...' : 'Change Password'}
                      </button>
                    </div>
                  </form>
                </section>
              </>
            )}

            {/* ── Privacy Tab ── */}
            {activeTab === 'privacy' && (
              <section className="community-settings-section">
                <h2>Profile & Privacy</h2>
                <p className="community-text-muted text-sm mb-space-md">Control who can see your activity and interact with you.</p>

                <SettingSelect label="Profile Visibility" desc="Who can see your profile" value={settings.profile_visibility}
                  options={[{value:'public',label:'Public'},{value:'followers',label:'Followers Only'},{value:'private',label:'Private'}]}
                  onChange={(v) => handleSettingChange('profile_visibility', v)} saving={savingSection === 'profile_visibility'} />

                <SettingToggle label="Show Online Status" desc="Display when you're active" checked={settings.show_online_status}
                  onChange={(v) => handleSettingChange('show_online_status', v)} saving={savingSection === 'show_online_status'} />

                <SettingToggle label="Show Last Seen" desc="Display when you were last active" checked={settings.show_last_seen}
                  onChange={(v) => handleSettingChange('show_last_seen', v)} saving={savingSection === 'show_last_seen'} />

                <SettingSelect label="Who Can Follow You" value={settings.allow_follows}
                  options={[{value:'everyone',label:'Everyone'},{value:'nobody',label:'Nobody'}]}
                  onChange={(v) => handleSettingChange('allow_follows', v)} saving={savingSection === 'allow_follows'} />

                <SettingSelect label="Who Can Message You" value={settings.allow_dms}
                  options={[{value:'everyone',label:'Everyone'},{value:'followers',label:'Followers Only'},{value:'nobody',label:'Nobody'}]}
                  onChange={(v) => handleSettingChange('allow_dms', v)} saving={savingSection === 'allow_dms'} />

                <SettingToggle label="Show Liked Posts" desc="Display posts you've liked on your profile" checked={settings.show_liked_posts}
                  onChange={(v) => handleSettingChange('show_liked_posts', v)} saving={savingSection === 'show_liked_posts'} />

                <SettingToggle label="Show Saved Posts" desc="Display your saved/bookmarked posts (private by default)" checked={settings.show_saved_posts}
                  onChange={(v) => handleSettingChange('show_saved_posts', v)} saving={savingSection === 'show_saved_posts'} />
              </section>
            )}

            {/* ── Content Tab ── */}
            {activeTab === 'content' && (
              <section className="community-settings-section">
                <h2>Content & Feed</h2>
                <p className="community-text-muted text-sm mb-space-md">Customize your content experience.</p>

                <SettingSelect label="NSFW Content Filter" desc="How to handle potentially sensitive content"
                  value={settings.nsfw_filter}
                  options={[{value:'blur',label:'Blur'},{value:'hide',label:'Hide'},{value:'show',label:'Show'}]}
                  onChange={(v) => handleSettingChange('nsfw_filter', v)} saving={savingSection === 'nsfw_filter'} />

                <SettingSelect label="Feed Density" desc="How much content to show per item"
                  value={settings.feed_density}
                  options={[{value:'comfortable',label:'Comfortable'},{value:'compact',label:'Compact'}]}
                  onChange={(v) => handleSettingChange('feed_density', v)} saving={savingSection === 'feed_density'} />

                <SettingSelect label="Default Sort" desc="How posts are sorted by default"
                  value={settings.default_sort}
                  options={[{value:'new',label:'New'},{value:'top',label:'Top'},{value:'hot',label:'Hot'}]}
                  onChange={(v) => handleSettingChange('default_sort', v)} saving={savingSection === 'default_sort'} />

                <SettingSelect label="Posts Per Page" value={String(settings.posts_per_page)}
                  options={[{value:'10',label:'10'},{value:'20',label:'20'},{value:'50',label:'50'}]}
                  onChange={(v) => handleSettingChange('posts_per_page', parseInt(v))} saving={savingSection === 'posts_per_page'} />

                <SettingToggle label="Show Preview Images" desc="Display image previews in the feed" checked={settings.show_preview_images}
                  onChange={(v) => handleSettingChange('show_preview_images', v)} saving={savingSection === 'show_preview_images'} />

                <SettingToggle label="Hide Downvoted Posts" desc="Automatically hide posts with low scores" checked={settings.hide_downvoted_posts}
                  onChange={(v) => handleSettingChange('hide_downvoted_posts', v)} saving={savingSection === 'hide_downvoted_posts'} />

                {/* Muted Users */}
                <div className="community-settings-subsection">
                  <h3>Muted Users</h3>
                  <p className="community-text-muted text-sm mb-space-md">Posts and comments from muted users will be hidden.</p>
                  {mutedUsers.length === 0 ? (
                    <p className="community-text-muted text-sm">No muted users.</p>
                  ) : (
                    <div className="community-blocked-list">
                      {mutedUsers.map((u) => (
                        <div key={u.id} className="community-blocked-item">
                          <div className="community-blocked-item-info">
                            <div className="community-avatar community-avatar--xs">
                              <UserAvatar user={u} />
                            </div>
                            <div>
                              <span className="community-blocked-item-name">{u.display_name || u.username}</span>
                              <span className="community-blocked-item-username">@{u.username}</span>
                            </div>
                          </div>
                          <button className="community-btn community-btn--outline community-btn--sm" onClick={() => handleUnmute(u.id)}>
                            Unmute
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ── Notifications Tab ── */}
            {activeTab === 'notifications' && (
              <section className="community-settings-section">
                <h2>Notification Preferences</h2>
                <p className="community-text-muted text-sm mb-space-md">Choose which notifications you receive on-site.</p>
                <div className="community-toggle-group">
                  <SettingToggle label="Likes" desc="When someone likes your post or comment" checked={settings.notify_likes}
                    onChange={(v) => handleSettingChange('notify_likes', v)} saving={savingSection === 'notify_likes'} />
                  <SettingToggle label="Comments" desc="When someone comments on your post" checked={settings.notify_comments}
                    onChange={(v) => handleSettingChange('notify_comments', v)} saving={savingSection === 'notify_comments'} />
                  <SettingToggle label="Mentions" desc="When someone @mentions you" checked={settings.notify_mentions}
                    onChange={(v) => handleSettingChange('notify_mentions', v)} saving={savingSection === 'notify_mentions'} />
                  <SettingToggle label="New Followers" desc="When someone follows you" checked={settings.notify_follows}
                    onChange={(v) => handleSettingChange('notify_follows', v)} saving={savingSection === 'notify_follows'} />
                  <SettingToggle label="Badges" desc="When you earn a new badge" checked={settings.notify_badges}
                    onChange={(v) => handleSettingChange('notify_badges', v)} saving={savingSection === 'notify_badges'} />
                  <SettingToggle label="System Announcements" desc="Platform updates and announcements" checked={settings.notify_system}
                    onChange={(v) => handleSettingChange('notify_system', v)} saving={savingSection === 'notify_system'} />
                </div>
              </section>
            )}

            {/* ── Display Tab ── */}
            {activeTab === 'display' && (
              <section className="community-settings-section">
                <h2>Display & Accessibility</h2>
                <p className="community-text-muted text-sm mb-space-md">Customize how the platform looks and behaves.</p>

                <SettingSelect label="Theme" desc="Choose your preferred color scheme"
                  value={settings.theme}
                  options={[{value:'system',label:'System'},{value:'light',label:'Light'},{value:'dark',label:'Dark'}]}
                  onChange={(v) => handleSettingChange('theme', v)} saving={savingSection === 'theme'} />

                <SettingSelect label="Font Size" desc="Adjust text size across the platform"
                  value={settings.font_size}
                  options={[{value:'small',label:'Small'},{value:'medium',label:'Medium'},{value:'large',label:'Large'}]}
                  onChange={(v) => handleSettingChange('font_size', v)} saving={savingSection === 'font_size'} />

                <SettingSelect label="Font Family" desc="Choose your preferred font style"
                  value={settings.font_family}
                  options={[{value:'system',label:'System'},{value:'serif',label:'Serif'},{value:'monospace',label:'Monospace'}]}
                  onChange={(v) => handleSettingChange('font_family', v)} saving={savingSection === 'font_family'} />

                <SettingToggle label="Reduce Motion" desc="Minimize animations and transitions" checked={settings.reduce_motion}
                  onChange={(v) => handleSettingChange('reduce_motion', v)} saving={savingSection === 'reduce_motion'} />

                <SettingToggle label="High Contrast" desc="Increase contrast for better readability" checked={settings.high_contrast}
                  onChange={(v) => handleSettingChange('high_contrast', v)} saving={savingSection === 'high_contrast'} />
              </section>
            )}

            {/* ── Account Tab ── */}
            {activeTab === 'account' && (
              <>
                {/* Account Info */}
                <section className="community-settings-section">
                  <h2>Account Info</h2>
                  <div className="community-account-info">
                    <div className="community-account-info-row">
                      <span className="community-account-info-label">Username</span>
                      <span className="community-account-info-value">@{user?.username}</span>
                    </div>
                    <div className="community-account-info-row">
                      <span className="community-account-info-label">Email</span>
                      <span className="community-account-info-value">{user?.email}</span>
                    </div>
                    <div className="community-account-info-row">
                      <span className="community-account-info-label">Role</span>
                      <span className="community-account-info-value">
                        {user?.role === 'admin' || user?.role_id === 1 ? 'Admin' : 'Member'}
                      </span>
                    </div>
                    <div className="community-account-info-row">
                      <span className="community-account-info-label">Joined</span>
                      <span className="community-account-info-value">
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                      </span>
                    </div>
                    <div className="community-account-info-row">
                      <span className="community-account-info-label">User ID</span>
                      <span className="community-account-info-value">#{user?.id}</span>
                    </div>
                  </div>
                </section>

                {/* Sessions */}
                <section className="community-settings-section">
                  <h2>Active Sessions</h2>
                  <p className="community-text-muted text-sm mb-space-md">Manage your active login sessions.</p>
                  {sessions.length === 0 ? (
                    <p className="community-text-muted text-sm">No active sessions found.</p>
                  ) : (
                    sessions.map((s) => (
                      <div key={s.id} className="community-session-item">
                        <div className="community-session-info">
                          <span className="nf nf-fa-laptop" />
                          <div>
                            <span className="community-session-agent">{s.user_agent || 'Unknown device'}</span>
                            {s.ip_address && <span className="community-session-ip">{s.ip_address}</span>}
                            <span className="community-session-date">
                              {s.last_used_at ? `Last used ${new Date(s.last_used_at).toLocaleDateString()}` : `Created ${new Date(s.created_at).toLocaleDateString()}`}
                            </span>
                          </div>
                        </div>
                        <button className="community-btn community-btn--outline community-btn--sm" onClick={() => handleRevokeSession(s.id)}>
                          Revoke
                        </button>
                      </div>
                    ))
                  )}
                </section>

                {/* Data & Safety */}
                <section className="community-settings-section">
                  <h2>Data & Safety</h2>

                  <SettingToggle label="Login Alerts" desc="Get notified of new sign-ins from unrecognized devices" checked={settings.login_alerts}
                    onChange={(v) => handleSettingChange('login_alerts', v)} saving={savingSection === 'login_alerts'} />

                  <SettingSelect label="Session Timeout" desc="Automatically log out after inactivity"
                    value={settings.session_timeout}
                    options={[{value:'1h',label:'1 Hour'},{value:'6h',label:'6 Hours'},{value:'24h',label:'24 Hours'},{value:'7d',label:'7 Days'},{value:'never',label:'Never'}]}
                    onChange={(v) => handleSettingChange('session_timeout', v)} saving={savingSection === 'session_timeout'} />

                  <div className="community-form-actions" style={{ marginTop: 'var(--space-lg)' }}>
                    <button className="community-btn community-btn--outline" onClick={handleExportData}>
                      <span className="nf nf-fa-download" /> Export My Data
                    </button>
                  </div>
                </section>

                {/* Blocked Users */}
                <section className="community-settings-section">
                  <h2>Blocked Users</h2>
                  <BlockedUsersList token={token} />
                </section>

                {/* Data Export */}
                <section className="community-settings-section">
                  <h2>Data & Privacy</h2>
                  <p className="community-text-muted text-sm mb-space-md">Export or manage your data.</p>
                  <button className="community-btn" onClick={() => window.open('/api/community/export', '_blank')}>
                    <span className="nf nf-fa-download" /> Export My Data (JSON)
                  </button>
                </section>

                {/* Danger Zone */}
                <section className="community-settings-section">
                  <h2>Danger Zone</h2>
                  <p className="community-text-muted text-sm mb-space-md">Irreversible destructive actions.</p>
                  {!showDeleteConfirm ? (
                    <button className="community-btn community-btn--danger" onClick={() => setShowDeleteConfirm(true)}>
                      <span className="nf nf-fa-trash" /> Delete Account
                    </button>
                  ) : (
                    <div className="community-danger-confirm">
                      <p className="community-text-muted text-sm mb-space-md">
                        This will permanently delete your account and all associated data. This cannot be undone.
                      </p>
                      <div className="community-form-actions" style={{ gap: 'var(--space-sm)' }}>
                        <button className="community-btn community-btn--danger" onClick={async () => {
                          try {
                            const res = await fetch('/api/auth/delete', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                            if (res.ok) {
                              localStorage.removeItem('kc_token');
                              window.location.href = '/';
                            }
                          } catch {}
                        }}>
                          Confirm Delete
                        </button>
                        <button className="community-btn community-btn--ghost" onClick={() => setShowDeleteConfirm(false)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </CommunityLayout>
  );
}

/* ─── Sub-components ─── */

function SettingToggle({ label, desc, checked, onChange, saving }) {
  return (
    <div className="community-toggle-row">
      <div>
        <label>{label}</label>
        {desc && <div className="community-text-muted">{desc}</div>}
        {saving && <div className="community-text-muted" style={{ fontSize: '0.7rem' }}>saving...</div>}
      </div>
      <label className="community-toggle-switch">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={!!saving} />
        <span className="community-toggle-slider" />
      </label>
    </div>
  );
}

function SettingSelect({ label, desc, value, options, onChange, saving }) {
  return (
    <div className="community-toggle-row">
      <div>
        <label>{label}</label>
        {desc && <div className="community-text-muted">{desc}</div>}
        {saving && <div className="community-text-muted" style={{ fontSize: '0.7rem' }}>saving...</div>}
      </div>
      <select className="community-select" value={value} onChange={(e) => onChange(e.target.value)} disabled={!!saving}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

/* ─── Blocked Users List ─── */
function BlockedUsersList({ token }) {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBlocked = useCallback(() => {
    if (!token) return;
    fetch('/api/community/blocked', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : { blocked: [] })
      .then((d) => setBlockedUsers(d.blocked || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { fetchBlocked(); }, [fetchBlocked]);

  async function handleUnblock(userId) {
    try {
      const res = await fetch(`/api/community/unblock/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setBlockedUsers((prev) => prev.filter((u) => u.blocked_user_id !== userId));
    } catch {}
  }

  if (loading) return <p className="community-text-muted text-sm">Loading...</p>;
  if (blockedUsers.length === 0) return <p className="community-text-muted text-sm">You haven't blocked any users.</p>;

  return (
    <div className="community-blocked-list">
      {blockedUsers.map((u) => (
        <div key={u.blocked_user_id} className="community-blocked-item">
          <div className="community-blocked-item-info">
            <div className="community-avatar community-avatar--xs">
              <UserAvatar user={u} />
            </div>
            <div>
              <span className="community-blocked-item-name">{u.display_name || u.username}</span>
              <span className="community-blocked-item-username">@{u.username}</span>
            </div>
          </div>
          <button className="community-btn community-btn--outline community-btn--sm" onClick={() => handleUnblock(u.blocked_user_id)}>
            Unblock
          </button>
        </div>
      ))}
    </div>
  );
}
