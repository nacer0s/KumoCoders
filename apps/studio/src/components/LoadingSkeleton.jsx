const shimmerKeyframes = `
@keyframes studioShimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
`;

const shimmerStyle = {
  background: 'linear-gradient(90deg, var(--color-surface) 25%, var(--color-surface-hover) 50%, var(--color-surface) 75%)',
  backgroundSize: '800px 100%',
  animation: 'studioShimmer 1.5s ease-in-out infinite',
  borderRadius: 'var(--radius-sm)',
};

function BaseSkeleton({ width, height, style, className, ...rest }) {
  return (
    <div
      className={className}
      style={{
        ...shimmerStyle,
        width: width || '100%',
        height: height || 20,
        ...style,
      }}
      {...rest}
    />
  );
}

function CardSkeleton({ style, ...rest }) {
  return (
    <div
      style={{
        ...shimmerStyle,
        width: '100%',
        height: 120,
        borderRadius: 'var(--radius-md)',
        ...style,
      }}
      {...rest}
    />
  );
}

function PageSkeleton({ style, ...rest }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', padding: 'var(--space-lg)', ...style }} {...rest}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <div style={{ ...shimmerStyle, width: 36, height: 36, borderRadius: 'var(--radius-full)' }} />
        <div style={{ ...shimmerStyle, width: 200, height: 24 }} />
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
        <div style={{ ...shimmerStyle, width: 240, height: 300, borderRadius: 'var(--radius-md)' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ ...shimmerStyle, height: 16, width: '60%' }} />
          <div style={{ ...shimmerStyle, height: 16, width: '80%' }} />
          <div style={{ ...shimmerStyle, height: 16, width: '40%' }} />
          <div style={{ ...shimmerStyle, height: 16, width: '70%' }} />
          <div style={{ ...shimmerStyle, height: 16, width: '50%' }} />
        </div>
      </div>
      </div>
    );
  }

function LoadingSkeleton({ width, height, style, ...rest }) {
  return (
    <div
      style={{
        ...shimmerStyle,
        width: width || '100%',
        height: height || 20,
        ...style,
      }}
      {...rest}
    />
  );
}

LoadingSkeleton.Card = CardSkeleton;
LoadingSkeleton.Page = PageSkeleton;

export default LoadingSkeleton;
