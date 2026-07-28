import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

const REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'hate_speech', label: 'Hate speech' },
  { value: 'other', label: 'Other' },
];

export default function ReportDialog({ targetType, targetId, onClose }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const finalReason = reason === 'other' ? customReason : REASONS.find((r) => r.value === reason)?.label || reason;
    if (!finalReason) {
      setError('Please select or enter a reason');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/community/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          reason: finalReason,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit report');
      showToast('Report submitted. Thanks!', 'success');
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleOverlayClick(e) {
    e.stopPropagation();
    if (e.target === e.currentTarget) onClose();
  }

  return createPortal(
    <div className="community-modal-overlay" onClick={handleOverlayClick}>
      <div className="community-modal community-report-dialog">
        <div className="community-modal-header">
          <h3>Report {targetType}</h3>
          <button className="community-btn community-btn--icon" onClick={onClose} aria-label="Close">
            <span className="nf nf-fa-xmark" />
          </button>
        </div>

        {submitted ? (
          <div className="community-report-success">
            <span className="nf nf-fa-check_circle text-3xl text-success" />
            <p>Thanks for your report. Our moderators will review it.</p>
            <button className="community-btn community-btn--primary" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="community-report-form">
            <div className="community-form-group">
              <label>Reason for reporting</label>
              <select
                className="community-select"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              >
                <option value="">Select a reason...</option>
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {reason === 'other' && (
              <div className="community-form-group">
                <label>Describe the issue</label>
                <textarea
                  className="community-input community-textarea"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Please describe why you're reporting this content..."
                  rows={3}
                  required
                />
              </div>
            )}

            {error && <div className="community-error">{error}</div>}

            <div className="community-modal-actions">
              <button type="button" className="community-btn community-btn--ghost" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="community-btn community-btn--primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
