import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { navigateTo } from '../App.jsx';
import PostCard from '../components/PostCard.jsx';
import FollowList from '../components/FollowList.jsx';
import ReportButton from '../components/ReportButton.jsx';
import UserAvatar from '@kumocoders/ui/UserAvatar.jsx';
import SkeletonCard from '../components/skeletons/SkeletonCard.jsx';
import SkeletonProfile from '../components/skeletons/SkeletonProfile.jsx';
import MentionText from '../utils/mentionParser.jsx';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function Profile({ username }) {
  const { user, token } = useAuth();
  const [profilePosts, setProfilePosts] = useState([]);
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('posts');
  const [likedPosts, setLikedPosts] = useState([]);
  const [savedProfilePosts, setSavedProfilePosts] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loadingLiked, setLoadingLiked] = useState(false);
  const [loadingSavedProfile, setLoadingSavedProfile] = useState(false);
  const [loadingBadges, setLoadingBadges] = useState(false);

  // Follow state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const followVersionRef = useRef(0);

  function fetchFollowStatus(uid) {
    const v = ++followVersionRef.current;
    fetch(`/api/community/users/${uid}/follow-status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : { isFollowing: false })
      .then((d) => { if (followVersionRef.current === v) setIsFollowing(d.isFollowing || false); })
      .catch(() => {});
  }

  // Block state
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);

  // Engagement totals
  const [totalLikes, setTotalLikes] = useState(0);
  const [totalSaves, setTotalSaves] = useState(0);

  const [profileUserId, setProfileUserId] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const { showToast } = useToast();
  const isOwnProfile = user && profileUserId && String(user.id) === String(profileUserId);

  useEffect(() => {
    if (!username) {
      setError('No user specified');
      setLoading(false);
      return;
    }

    let cancelled = false;

    // Step 1: Look up user by username to get their ID
    fetch(`/api/community/users/by-username/${encodeURIComponent(username)}`)
      .then((r) => {
        if (!r.ok) throw new Error('User not found');
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const foundUser = data.user;
        const uid = foundUser.id;
        setProfileUserId(uid);
        setProfileUser(foundUser);

        // Step 2: Fetch posts, badges, counts in parallel using the ID
        Promise.all([
          fetch(`/api/community/users/${uid}/posts`, {
            headers: { Authorization: token ? `Bearer ${token}` : '' },
          }).then((r) => r.json()),
        ])
          .then(([postsData]) => {
            if (!cancelled) setProfilePosts(postsData.posts || []);
          })
          .catch(() => {});

        // Fetch badges
        setLoadingBadges(true);
        fetch(`/api/community/badges/${uid}`)
          .then((r) => r.ok ? r.json() : { badges: [] })
          .then((d) => { if (!cancelled) setBadges(d.badges || []); })
          .catch(() => {})
          .finally(() => { if (!cancelled) setLoadingBadges(false); });

        // Fetch follow counts + engagement totals
        fetch(`/api/community/users/${uid}/counts`)
          .then((r) => r.ok ? r.json() : { follower_count: 0, following_count: 0, total_likes: 0, total_saves: 0 })
          .then((d) => {
            if (cancelled) return;
            setFollowerCount(d.follower_count || 0);
            setFollowingCount(d.following_count || 0);
            setTotalLikes(d.total_likes || 0);
            setTotalSaves(d.total_saves || 0);
          })
          .catch(() => {});

        // Fetch follow status if logged in and not own profile
        if (token && !(user && String(user.id) === String(uid))) {
          fetchFollowStatus(uid);

          // Check if this user is blocked
          fetch(`/api/community/blocked/ids`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => r.ok ? r.json() : { blockedIds: [] })
            .then((d) => { if (!cancelled) setIsBlocked(d.blockedIds?.includes(uid) || false); })
            .catch(() => {});
        }
      })
      .catch(() => setError('User not found'))
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [username, token, user, retryCount]);

  // Fetch liked posts when tab switches to likes
  useEffect(() => {
    if (tab !== 'likes' || !profileUserId) return;
    setLoadingLiked(true);
    fetch(`/api/community/users/${profileUserId}/liked-posts`, {
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    })
      .then((r) => r.ok ? r.json() : { posts: [] })
      .then((d) => setLikedPosts(d.posts || []))
      .catch(() => {})
      .finally(() => setLoadingLiked(false));
  }, [tab, profileUserId, token]);

  // Fetch saved posts of the profile user when tab switches to saves
  useEffect(() => {
    if (tab !== 'saves' || !profileUserId) return;
    setLoadingSavedProfile(true);
    fetch(`/api/community/users/${profileUserId}/saved-posts`, {
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    })
      .then((r) => r.ok ? r.json() : { posts: [] })
      .then((d) => setSavedProfilePosts(d.posts || []))
      .catch(() => {})
      .finally(() => setLoadingSavedProfile(false));
  }, [tab, profileUserId, token]);

  async function handleFollowToggle() {
    if (!token) {
      navigateTo('/login');
      return;
    }
    setFollowLoading(true);
    try {
      const res = await fetch(`/api/community/users/${profileUserId}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setIsFollowing(data.following);
        setFollowerCount(data.follower_count);
        showToast(data.following ? 'Followed!' : 'Unfollowed', 'success');
        // Refetch to sync followVersionRef so stale responses are ignored
        setTimeout(() => fetchFollowStatus(profileUserId), 100);
      }
    } catch { /* ignore */ }
    setFollowLoading(false);
  }

  async function handleBlockToggle() {
    if (!token) {
      navigateTo('/login');
      return;
    }
    setBlockLoading(true);
    try {
      const endpoint = isBlocked ? 'unblock' : 'block';
      const res = await fetch(`/api/community/${endpoint}/${profileUserId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setIsBlocked(data.blocked !== undefined ? data.blocked : !isBlocked);
      }
    } catch { /* ignore */ }
    setBlockLoading(false);
  }

  if (loading) {
    return <SkeletonProfile />;
  }

  if (error) {
    return (
      <div className="community-empty p-12 px-4 text-center">
        <span className="nf nf-fa-circle_exclamation text-4xl opacity-40" />
        <h3>{error}</h3>
        <div className="flex gap-3 justify-center mt-4">
          <button className="community-btn community-btn--ghost" onClick={() => setRetryCount(c => c + 1)}>
            <span className="nf nf-fa-rotate" /> Retry
          </button>
          <button className="community-btn community-btn--primary" onClick={() => navigateTo('/')}>
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="community-profile">
      <button className="community-btn community-btn--ghost community-back-btn" onClick={() => navigateTo('/')}>
        <span className="nf nf-fa-arrow_left" /> Back to Feed
      </button>

      <div className="community-profile-card">
        <div className="community-profile-avatar">
          <div className="community-avatar community-avatar--lg">
            <UserAvatar user={profileUser} />
          </div>
        </div>
        <h1 className="community-profile-name">
          {profileUser?.display_name || profileUser?.username || 'Unknown'}
          {profileUser?.is_verified === 1 && (
            <span className={`nf nf-md-check_decagram community-verified-badge${profileUser?.role_id !== 2 ? ' community-verified-badge--gold' : ''}`} title={profileUser?.role_id !== 2 ? 'Member Verified Account' : 'Community Verified Account'} />
          )}
        </h1>
        {profileUser?.display_name && profileUser?.username && (
          <p className="community-profile-username">@{profileUser.username}</p>
        )}
        {profileUser?.bio && (
          <div className="community-profile-bio"><MentionText text={profileUser.bio} /></div>
        )}

        {/* Follow stats */}
        <div className="community-profile-follow-stats">
          <button
            className="community-profile-follow-stat"
            onClick={() => setShowFollowers(true)}
          >
            <strong>{followerCount}</strong> followers
          </button>
          <button
            className="community-profile-follow-stat"
            onClick={() => setShowFollowing(true)}
          >
            <strong>{followingCount}</strong> following
          </button>
        </div>

        {/* Stat cards */}
        <div className="community-profile-stats-grid">
          <div className="community-profile-stat-card">
            <span className="nf nf-fa-newspaper community-profile-stat-icon" />
            <span className="community-profile-stat-value">{profilePosts.length}</span>
            <span className="community-profile-stat-label">posts</span>
          </div>
          <div className="community-profile-stat-card">
            <span className="nf nf-fa-heart community-profile-stat-icon" />
            <span className="community-profile-stat-value">{totalLikes}</span>
            <span className="community-profile-stat-label">likes received</span>
          </div>
          <div className="community-profile-stat-card">
            <span className="nf nf-fa-bookmark community-profile-stat-icon" />
            <span className="community-profile-stat-value">{totalSaves}</span>
            <span className="community-profile-stat-label">saves received</span>
          </div>
          {profileUser?.created_at && (
            <div className="community-profile-stat-card">
              <span className="nf nf-fa-calendar community-profile-stat-icon" />
              <span className="community-profile-stat-value">{new Date(profileUser.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              <span className="community-profile-stat-label">joined</span>
            </div>
          )}
        </div>

        {/* Follow / Block / Badges */}
        <div className="community-profile-actions">
          {!isOwnProfile && token ? (
            <>
              <button
                className={`community-btn ${isFollowing ? 'community-btn--outline' : 'community-btn--primary'} community-profile-follow-btn`}
                onClick={handleFollowToggle}
                disabled={followLoading}
              >
                <span className={`nf ${isFollowing ? 'nf-fa-user_check' : 'nf-fa-user_plus'}`} />
                {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
              </button>
              <button
                className={`community-btn ${isBlocked ? 'community-btn--outline' : 'community-btn--ghost'} community-profile-block-btn`}
                onClick={handleBlockToggle}
                disabled={blockLoading}
              >
                <span className={`nf ${isBlocked ? 'nf-fa-user_check' : 'nf-fa-ban'}`} />
                {blockLoading ? '...' : isBlocked ? 'Blocked' : 'Block'}
              </button>
            </>
          ) : !isOwnProfile ? (
            <button
              className="community-btn community-btn--outline community-profile-follow-btn"
              onClick={() => navigateTo('/login')}
            >
              <span className="nf nf-fa-user_plus" /> Follow
            </button>
          ) : null}
          {badges.length > 0 && (
            <div className="community-profile-achievements">
              <button className="community-profile-achievements-btn" onClick={() => navigateTo('/achievements')}>
                <span className="nf nf-fa-trophy" />
                <span>Achievements earned ({badges.length})</span>
              </button>
              <div className="community-profile-achievements-badges">
                {badges.map((badge) => (
                  <div key={badge.id} className="community-badge-item" title={badge.description || badge.name}>
                    <span className={`nf ${badge.icon || 'nf-fa-award'} community-badge-icon`} />
                    <span className="community-badge-name">{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Followers / Following modals */}
      {showFollowers && (
        <FollowList
          type="followers"
          userId={profileUserId}
          onClose={() => setShowFollowers(false)}
        />
      )}
      {showFollowing && (
        <FollowList
          type="following"
          userId={profileUserId}
          onClose={() => setShowFollowing(false)}
        />
      )}

      <div className="community-profile-content">
        {/* Tabs */}
        <div className="community-profile-tabs">
          <button
            className={`community-profile-tab ${tab === 'posts' ? 'community-profile-tab--active' : ''}`}
            onClick={() => setTab('posts')}
          >
            <span className="nf nf-fa-newspaper" /> Posts
          </button>
          <button
            className={`community-profile-tab ${tab === 'likes' ? 'community-profile-tab--active' : ''}`}
            onClick={() => setTab('likes')}
          >
            <span className="nf nf-fa-heart" /> Likes
          </button>
          <button
            className={`community-profile-tab ${tab === 'saves' ? 'community-profile-tab--active' : ''}`}
            onClick={() => setTab('saves')}
          >
            <span className="nf nf-fa-bookmark" /> Saves
          </button>
        </div>

        {tab === 'posts' && (
          <>
            {profilePosts.length === 0 ? (
              <div className="community-empty">
                <p>No posts yet.</p>
              </div>
            ) : (
              <div className="community-post-list">
                {profilePosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'likes' && (
          <>
            {loadingLiked ? (
              <SkeletonCard count={3} />
            ) : likedPosts.length === 0 ? (
              <div className="community-empty">
                <span className="nf nf-fa-heart text-3xl block mb-4 opacity-30" />
                <p>No liked posts yet.</p>
              </div>
            ) : (
              <div className="community-post-list">
                {likedPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'saves' && (
          <>
            {loadingSavedProfile ? (
              <SkeletonCard count={3} />
            ) : savedProfilePosts.length === 0 ? (
              <div className="community-empty">
                <span className="nf nf-fa-bookmark text-3xl block mb-4 opacity-30" />
                <p>No saved posts yet.</p>
              </div>
            ) : (
              <div className="community-post-list">
                {savedProfilePosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
