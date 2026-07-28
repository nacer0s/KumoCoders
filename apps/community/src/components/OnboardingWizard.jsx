import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

const STEPS = ['Welcome', 'Interests', 'Profile', 'Notifications'];

const INTEREST_TAGS = [
  'javascript', 'react', 'python', 'css', 'nodejs', 'typescript',
  'devops', 'database', 'mobile', 'design', 'ai', 'security',
];

export default function OnboardingWizard({ onComplete, onDismiss }) {
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [selectedTags, setSelectedTags] = useState([]);
  const [saving, setSaving] = useState(false);

  function toggleTag(tag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function finish() {
    setSaving(true);
    try {
      // Save display_name and bio
      if (displayName.trim()) {
        await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ display_name: displayName.trim() }),
        });
      }

      localStorage.setItem('kc_show_onboarding', '0');

      // Mark onboarding complete
      const res = await fetch('/api/community/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ onboarding_complete: true }),
      });

      if (res.ok) {
        showToast('Welcome aboard!', 'success');
        onComplete();
      }
    } catch {
      showToast('Something went wrong', 'error');
    } finally {
      setSaving(false);
    }
  }

  function dismiss() {
    localStorage.setItem('kc_show_onboarding', '0');
    if (onDismiss) onDismiss();
    if (onComplete) onComplete();
  }

  return (
    <div className="community-onboarding-overlay" onClick={dismiss}>
      <div className="community-onboarding-card glass" onClick={(e) => e.stopPropagation()}>
        <div className="community-onboarding-steps">
          {STEPS.map((s, i) => (
            <div key={s} className={`community-onboarding-step ${i === step ? 'active' : i < step ? 'done' : ''}`}>
              <div className="community-onboarding-step-dot">{i < step ? '✓' : i + 1}</div>
              <span className="community-onboarding-step-label">{s}</span>
            </div>
          ))}
        </div>

        <div className="community-onboarding-body">
          {step === 0 && (
            <div className="community-onboarding-content">
              <span className="nf nf-fa-hand_wave text-4xl mb-2" />
              <h2>Welcome to KumoCoders!</h2>
              <p className="community-text-muted">Let's get your profile set up so you can start connecting with the community.</p>
            </div>
          )}

          {step === 1 && (
            <div className="community-onboarding-content">
              <h2>Pick your interests</h2>
              <p className="community-text-muted mb-space-md">Select topics you'd like to see in your feed.</p>
              <div className="community-onboarding-tags">
                {INTEREST_TAGS.map((tag) => (
                  <button
                    key={tag}
                    className={`community-tag-filter-btn ${selectedTags.includes(tag) ? 'community-tag-filter-btn--active' : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="community-onboarding-content">
              <h2>Set up your profile</h2>
              <p className="community-text-muted mb-space-md">How should others see you?</p>
              <div className="community-form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  className="community-input"
                  placeholder="Your display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div className="community-form-group">
                <label>Bio</label>
                <textarea
                  className="community-input community-textarea"
                  placeholder="Tell us about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="community-onboarding-content">
              <span className="nf nf-fa-bell text-4xl mb-2" />
              <h2>Stay in the loop</h2>
              <p className="community-text-muted">You'll get notifications for likes, comments, and follows. You can change this anytime in Settings.</p>
              <p className="community-text-muted mt-space-md">Ready to explore?</p>
            </div>
          )}
        </div>

        <div className="community-onboarding-footer">
          <button className="community-btn community-btn--ghost" onClick={dismiss} disabled={saving}>
            Skip
          </button>
          <div className="community-onboarding-footer-right">
            {step > 0 && (
              <button className="community-btn community-btn--ghost" onClick={() => setStep((s) => s - 1)} disabled={saving}>
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button className="community-btn community-btn--primary" onClick={() => setStep((s) => s + 1)}>
                Next
              </button>
            ) : (
              <button className="community-btn community-btn--primary" onClick={finish} disabled={saving}>
                {saving ? 'Getting ready...' : 'Get Started'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
