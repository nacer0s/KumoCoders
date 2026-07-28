import db from '../config/db.js';
import CommunityNotification from '../models/CommunityNotification.js';

/**
 * Parse @username mentions from text content.
 * Returns an array of unique username strings (without the @).
 */
export function parseMentions(text) {
  if (!text || typeof text !== 'string') return [];
  const matches = text.match(/@([a-zA-Z0-9_-]+)/g);
  if (!matches) return [];
  const usernames = [...new Set(matches.map((m) => m.slice(1)))];
  return usernames;
}

/**
 * Process mentions in a piece of content:
 * 1. Resolve usernames to user IDs
 * 2. Skip the author (don't notify yourself)
 * 3. Create mention notifications for each mentioned user
 *
 * @param {Object} options
 * @param {string} options.text - The content body to scan for mentions
 * @param {number} options.authorId - The user ID of the content author (to skip self-mentions)
 * @param {string} options.targetType - 'post' or 'comment'
 * @param {number} options.targetId - The ID of the post or comment
 * @param {string} options.postTitle - Optional title of the post (for notification message)
 */
export async function processMentions({ text, authorId, targetType, targetId, postTitle }) {
  try {
    const usernames = parseMentions(text);
    if (usernames.length === 0) return [];

    const notifiedUsers = [];

    for (const username of usernames) {
      const user = await db('users').where({ username }).first();
      if (!user) continue;
      // Don't notify the author of their own mentions
      if (user.id === authorId) continue;

      const link = targetType === 'post'
        ? `/community/post/${targetId}`
        : `/community/post/${targetId}`; // comments link to their parent post too

      const truncated = postTitle
        ? postTitle.length > 60
          ? postTitle.slice(0, 57) + '...'
          : postTitle
        : 'a post';

      await CommunityNotification.create({
        userId: user.id,
        type: 'mention',
        message: `You were mentioned by @${username} in ${truncated}`,
        link,
        actorId: authorId,
        postTitle: postTitle,
      });

      notifiedUsers.push(user.id);
    }

    return notifiedUsers;
  } catch (err) {
    console.error('[Mentions] Error processing mentions:', err);
    return [];
  }
}
