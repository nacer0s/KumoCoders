export default function LegalPage({ title, lastUpdated, children }) {
  return (
    <article className="pt-[calc(var(--navbar-height)+var(--space-3xl))] pb-space-4xl max-w-[800px] mx-auto px-space-lg">
      <div className="mb-space-2xl">
        <h1 className="font-headline text-[clamp(2rem,4vw,3rem)] font-font-weight-bold tracking-[-0.02em] mb-space-sm">{title}</h1>
        {lastUpdated && (
          <p className="text-font-size-sm text-text-muted">Last updated: {lastUpdated}</p>
        )}
      </div>
      <div className="space-y-space-xl [&_h2]:font-headline [&_h2]:text-font-size-xl [&_h2]:font-font-weight-semibold [&_h2]:mb-space-sm [&_h2]:mt-space-lg [&_h3]:font-headline [&_h3]:text-font-size-lg [&_h3]:font-font-weight-semibold [&_h3]:mb-space-xs [&_h3]:mt-space-md [&_p]:text-font-size-base [&_p]:leading-relaxed [&_p]:text-text-muted [&_p]:mb-space-sm [&_ul]:pl-space-lg [&_ul]:mb-space-sm [&_li]:text-font-size-base [&_li]:leading-relaxed [&_li]:text-text-muted [&_li]:mb-space-xs [&_strong]:text-text">
        {children}
      </div>
    </article>
  );
}
