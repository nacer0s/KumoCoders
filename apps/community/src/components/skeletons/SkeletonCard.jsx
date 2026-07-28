export default function SkeletonCard({ count = 1 }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="skeleton-card">
      <div className="skeleton-card-header">
        <div className="skeleton-avatar skeleton-pulse" />
        <div className="skeleton-line skeleton-line--sm skeleton-pulse" />
      </div>
      <div className="skeleton-card-body">
        <div className="skeleton-line skeleton-line--xl skeleton-pulse" />
        <div className="skeleton-line skeleton-line--lg skeleton-pulse" />
        <div className="skeleton-line skeleton-line--md skeleton-pulse" />
      </div>
      <div className="skeleton-card-footer">
        <div className="skeleton-line skeleton-line--sm skeleton-pulse" />
        <div className="skeleton-line skeleton-line--sm skeleton-pulse" />
        <div className="skeleton-line skeleton-line--sm skeleton-pulse" />
      </div>
    </div>
  ));
}
