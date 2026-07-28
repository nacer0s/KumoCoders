export default function GuidelinesPage() {
  const sections = [
    { icon: 'nf-fa-heart', title: 'Be Respectful', text: 'Treat everyone with respect. Disagreements are fine, but personal attacks, harassment, and hate speech are not tolerated.' },
    { icon: 'nf-fa-message', title: 'Stay On Topic', text: 'Keep discussions relevant to the post or community. Off-topic content may be removed.' },
    { icon: 'nf-fa-shield', title: 'No Spam', text: 'Do not post spam, excessive self-promotion, or irrelevant links. Quality over quantity.' },
    { icon: 'nf-fa-lock', title: 'Protect Privacy', text: 'Do not share personal information about yourself or others. No doxxing.' },
    { icon: 'nf-fa-flag', title: 'Report Violations', text: 'See something that breaks the rules? Use the report button to flag it for moderation.' },
    { icon: 'nf-fa-gavel', title: 'Consequences', text: 'Violations may result in content removal, warnings, temporary suspension, or permanent ban depending on severity and history.' },
  ];

  return (
    <div className="community-page">
      <div className="community-page-header">
        <h1><span className="nf nf-fa-scale_balanced" /> Community Guidelines</h1>
        <p>Our rules for keeping this community safe and welcoming</p>
      </div>

      <div className="community-card">
        {sections.map((s, i) => (
          <section key={i} className="community-guideline-section">
            <h2><span className={`nf ${s.icon}`} /> {s.title}</h2>
            <p>{s.text}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
