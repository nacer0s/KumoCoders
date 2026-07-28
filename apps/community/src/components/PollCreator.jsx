import { useState } from 'react';

export default function PollCreator({ onPollChange }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [enabled, setEnabled] = useState(false);

  function handleQuestionChange(value) {
    setQuestion(value);
    notify();
  }

  function handleOptionChange(index, value) {
    const next = [...options];
    next[index] = value;
    setOptions(next);
    notify();
  }

  function addOption() {
    if (options.length >= 6) return;
    setOptions([...options, '']);
  }

  function removeOption(index) {
    if (options.length <= 2) return;
    const next = options.filter((_, i) => i !== index);
    setOptions(next);
  }

  function notify() {
    if (onPollChange) {
      if (enabled && question.trim() && options.filter((o) => o.trim()).length >= 2) {
        onPollChange({
          question: question.trim(),
          options: options.filter((o) => o.trim()),
        });
      } else {
        onPollChange(null);
      }
    }
  }

  function toggleEnabled() {
    const next = !enabled;
    setEnabled(next);
    if (!next && onPollChange) onPollChange(null);
  }

  if (!enabled) {
    return (
      <div className="community-poll-creator-toggle">
        <button
          type="button"
          className="community-btn community-btn--ghost"
          onClick={toggleEnabled}
        >
          <span className="nf nf-fa-chart_simple" /> Add Poll
        </button>
      </div>
    );
  }

  return (
    <div className="community-poll-creator">
      <div className="community-poll-creator-header">
        <span className="nf nf-fa-chart_simple" /> Poll
        <button
          type="button"
          className="community-btn community-btn--icon"
          onClick={toggleEnabled}
          aria-label="Remove poll"
        >
          <span className="nf nf-fa-xmark" />
        </button>
      </div>

      <div className="community-form-group">
        <label>Question</label>
        <input
          type="text"
          className="community-input"
          placeholder="What do you want to ask?"
          value={question}
          onChange={(e) => handleQuestionChange(e.target.value)}
        />
      </div>

      {options.map((opt, i) => (
        <div key={i} className="community-poll-creator-option">
          <input
            type="text"
            className="community-input"
            placeholder={`Option ${i + 1}`}
            value={opt}
            onChange={(e) => handleOptionChange(i, e.target.value)}
          />
          {options.length > 2 && (
            <button
              type="button"
              className="community-btn community-btn--icon"
              onClick={() => removeOption(i)}
              aria-label="Remove option"
            >
              <span className="nf nf-fa-xmark" />
            </button>
          )}
        </div>
      ))}

      {options.length < 6 && (
        <button
          type="button"
          className="community-btn community-btn--ghost mt-space-sm"
          onClick={addOption}
        >
          <span className="nf nf-fa-plus" /> Add option
        </button>
      )}
    </div>
  );
}
