import { navigateTo } from '../App.jsx';

/**
 * Renders @mention patterns in text as clickable links to user profiles.
 *
 * @param {string} text - The text content to parse
 * @returns {Array<{type: string, value: string, username?: string}>} Array of tokens
 */
export function parseMentionTokens(text) {
  if (!text) return [{ type: 'text', value: '' }];

  const tokens = [];
  const parts = text.split(/(@[a-zA-Z0-9_-]+)/g);

  for (const part of parts) {
    if (part.startsWith('@') && part.length > 1) {
      const username = part.slice(1);
      tokens.push({ type: 'mention', value: part, username });
    } else {
      tokens.push({ type: 'text', value: part });
    }
  }

  return tokens;
}

/**
 * React component to render mention-parsed text.
 * Usage: <MentionText text={post.body} />
 */
export default function MentionText({ text, className = '' }) {
  if (!text) return null;

  const tokens = parseMentionTokens(text);

  return (
    <span className={className}>
      {tokens.map((token, i) => {
        if (token.type === 'mention') {
          return (
            <span
              key={i}
              className="community-mention"
              onClick={(e) => {
                e.stopPropagation();
                navigateTo(`/profile/${token.username}`);
              }}
            >
              {token.value}
            </span>
          );
        }
        return <span key={i}>{token.value}</span>;
      })}
    </span>
  );
}
