export default function BadgeProgressBar({ progress, size = 'sm' }) {
  if (!progress || progress.target === 0) return null;
  const pct = Math.min((progress.current / progress.target) * 100, 100);
  const height = size === 'sm' ? '4px' : '8px';
  return (
    <div style={{ width: '100%', height, background: 'var(--color-surface)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginTop: '4px' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-primary)', borderRadius: 'var(--radius-full)', transition: 'width 0.3s ease' }} />
    </div>
  );
}
