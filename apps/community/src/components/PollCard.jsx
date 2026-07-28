import { navigateTo } from '../App.jsx'

export default function PollCard({ poll, postId }) {
  if (!poll) return null

  const { question, options, total_votes, user_vote, is_expired } = poll

  return (
    <div
      className="community-poll-card"
      onClick={(e) => { e.stopPropagation(); navigateTo(`/post/${postId}`) }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigateTo(`/post/${postId}`) }}
    >
      <div className="community-poll-card-header">
        <span className="nf nf-fa-chart_simple" />
        <span className="community-poll-card-question">{question}</span>
        {is_expired && <span className="community-poll-expired">Closed</span>}
      </div>

      <div className="community-poll-card-options">
        {options.map((opt) => {
          const isMine = user_vote === opt.id
          return (
            <div
              key={opt.id}
              className={`community-poll-card-option ${isMine ? 'community-poll-card-option--voted' : ''}`}
            >
              <div className="community-poll-card-option-bar-bg">
                <div
                  className={`community-poll-card-option-bar-fill ${isMine ? 'community-poll-card-option-bar-fill--mine' : ''}`}
                  style={{ width: `${opt.percentage}%` }}
                />
              </div>
              <div className="community-poll-card-option-text">
                <span>{opt.text}</span>
                <span className="community-poll-card-option-pct">{opt.percentage}%</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="community-poll-card-footer">
        <span className="community-poll-card-total">{total_votes} vote{total_votes !== 1 ? 's' : ''}</span>
        <span className="community-poll-card-cta">
          {user_vote ? 'View details' : is_expired ? 'View results' : 'View post to vote'} &rarr;
        </span>
      </div>
    </div>
  )
}
