export default function SkeletonProfile() {
  return (
    <div className="community-profile">
      <div className="skeleton-profile">
        <div className="skeleton-profile-avatar skeleton-pulse" />
        <div className="skeleton-line skeleton-pulse" style={{ width: 180 }} />
        <div className="skeleton-profile-line--sm skeleton-pulse" />
        <div className="skeleton-line skeleton-pulse" style={{ width: 260 }} />
        <div className="skeleton-line skeleton-pulse" style={{ width: 140 }} />
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          <div className="skeleton-line skeleton-line--sm skeleton-pulse" />
          <div className="skeleton-line skeleton-line--sm skeleton-pulse" />
        </div>
      </div>
      <div style={{ marginTop: 24 }}>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="skeleton-card" style={{ marginBottom: 12 }}>
            <div className="skeleton-card-header">
              <div className="skeleton-avatar skeleton-pulse" />
              <div className="skeleton-line skeleton-line--sm skeleton-pulse" />
            </div>
            <div className="skeleton-card-body">
              <div className="skeleton-line skeleton-line--xl skeleton-pulse" />
              <div className="skeleton-line skeleton-line--lg skeleton-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
