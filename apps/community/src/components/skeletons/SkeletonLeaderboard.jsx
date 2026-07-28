export default function SkeletonLeaderboard({ count = 10 }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="skeleton-leaderboard-item" style={{ marginBottom: 8 }}>
      <div className="skeleton-line skeleton-line--sm skeleton-pulse" style={{ width: 24 }} />
      <div className="skeleton-avatar skeleton-pulse" style={{ width: 32, height: 32 }} />
      <div className="skeleton-line skeleton-pulse" style={{ width: 140 }} />
      <div className="skeleton-line skeleton-pulse" style={{ width: 60, marginLeft: 'auto' }} />
    </div>
  ));
}
