import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { navigateTo } from '../App.jsx';

export default function PollDisplay({ postId }) {
  const { token, user } = useAuth();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!postId) return;

    fetch(`/api/community/polls/by-post/${postId}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
      .then((r) => {
        if (r.status === 404) return null;
        if (!r.ok) throw new Error('Failed to load poll');
        return r.json();
      })
      .then((d) => {
        if (d && d.poll) {
          setPoll(d.poll);
          if (d.poll.user_vote) setSelectedOption(d.poll.user_vote);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  async function handleVote() {
    if (!selectedOption || !token || !poll) return;

    setVoting(true);
    setError('');

    try {
      const res = await fetch(`/api/community/polls/${poll.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ option_id: selectedOption }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Vote failed');
      }

      const data = await res.json();
      setPoll(data.poll);
    } catch (err) {
      setError(err.message);
    } finally {
      setVoting(false);
    }
  }

  if (loading || !poll) return null;

  const hasVoted = poll.user_vote !== null && poll.user_vote !== undefined;
  const isExpired = poll.is_expired;
  const canVote = !hasVoted && !isExpired && !!token;

  return (
    <div className="community-poll">
      <div className="community-poll-header">
        <h3 className="community-poll-question">
          <span className="nf nf-fa-chart_simple" /> {poll.question}
        </h3>
        {isExpired && <span className="community-poll-expired">Closed</span>}
        {hasVoted && !isExpired && <span className="community-poll-voted">Voted</span>}
      </div>

      {error && <div className="community-error">{error}</div>}

      <div className="community-poll-options">
        {poll.options.map((opt) => {
          const isSelected = selectedOption === opt.id;
          const isUserVote = poll.user_vote === opt.id;

          return (
            <div
              key={opt.id}
              className={`community-poll-option ${hasVoted || isExpired ? 'community-poll-option--result' : ''} ${isUserVote ? 'community-poll-option--voted' : ''}`}
              onClick={() => {
                if (canVote) setSelectedOption(opt.id);
              }}
              role={canVote ? 'button' : undefined}
              tabIndex={canVote ? 0 : undefined}
              onKeyDown={(e) => { if (canVote && e.key === 'Enter') setSelectedOption(opt.id); }}
            >
              {!hasVoted && !isExpired ? (
                <div className="community-poll-option-select">
                  <div className={`community-radio ${isSelected ? 'community-radio--selected' : ''}`} />
                  <span>{opt.text}</span>
                </div>
              ) : (
                <div className="community-poll-option-result">
                  <div className="community-poll-option-text">
                    <span>{opt.text}</span>
                    <span className="community-poll-option-pct">{opt.percentage}%</span>
                  </div>
                  <div className="community-poll-bar-bg">
                    <div
                      className={`community-poll-bar-fill ${isUserVote ? 'community-poll-bar-fill--mine' : ''}`}
                      style={{ width: `${opt.percentage}%` }}
                    />
                  </div>
                  <span className="community-poll-option-count">{opt.vote_count} vote{opt.vote_count !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {canVote && selectedOption && (
        <div className="community-poll-actions">
          <button
            className="community-btn community-btn--primary"
            onClick={handleVote}
            disabled={voting}
          >
            {voting ? 'Voting...' : 'Vote'}
          </button>
        </div>
      )}

      {!user && !hasVoted && !isExpired && (
        <div className="community-poll-login">
          <button className="community-link-btn" onClick={() => navigateTo('/login')}>Sign in</button> to vote
        </div>
      )}

      <div className="community-poll-footer">
        <span className="community-poll-total">{poll.total_votes} total vote{poll.total_votes !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}
