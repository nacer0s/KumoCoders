import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let communityHtml = null;

async function getCommunityHtml() {
  if (!communityHtml) {
    communityHtml = await readFile(
      path.resolve(__dirname, '../../../apps/community/dist/index.html'),
      'utf-8'
    );
  }
  return communityHtml;
}

function stripHtml(text) {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export default async function injectOGTags(req, res, next) {
  const match = req.path.match(/^\/community\/post\/(\d+)/);
  if (!match) return next();

  try {
    const postId = match[1];
    const post = await db('community_posts')
      .select('community_posts.*', 'users.username as author_username', 'users.display_name as author_display_name')
      .join('users', 'community_posts.user_id', 'users.id')
      .where('community_posts.id', postId)
      .where('community_posts.status', 'published')
      .first();

    if (!post) return next();

    const title = post.title || 'KumoCoders Community Post';
    const description = post.body ? stripHtml(post.body).slice(0, 200) : 'Check out this post on KumoCoders';
    const url = `${req.protocol}://${req.get('host')}/community/post/${postId}`;
    const image = `${req.protocol}://${req.get('host')}/api/community/og-image/${postId}`;
    const siteName = 'KumoCoders';

    let html = await getCommunityHtml();

    const ogTags = `
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="${siteName}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    <title>${escapeHtml(title)} - KumoCoders</title>`;

    html = html.replace('</head>', ogTags + '\n  </head>');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600');
    res.send(html);
  } catch {
    next();
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
