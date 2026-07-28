import nodemailer from 'nodemailer';
import UserSettings from '../models/UserSettings.js';
import db from '../config/db.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

const FROM = process.env.SMTP_FROM || 'noreply@kumocoders.com';

const TEMPLATES = {
  like: ({ username, actorName, postTitle }) => ({
    subject: `${actorName} liked your post`,
    html: `<p>Hey <strong>${username}</strong>,</p>
<p><strong>${actorName}</strong> liked your post: "${postTitle}"</p>
<p style="color:#888;font-size:12px;">You can disable email notifications in your Settings.</p>`,
  }),
  comment: ({ username, actorName, postTitle }) => ({
    subject: `${actorName} commented on your post`,
    html: `<p>Hey <strong>${username}</strong>,</p>
<p><strong>${actorName}</strong> commented on: "${postTitle}"</p>
<p style="color:#888;font-size:12px;">You can disable email notifications in your Settings.</p>`,
  }),
  follow: ({ username, actorName }) => ({
    subject: `${actorName} followed you`,
    html: `<p>Hey <strong>${username}</strong>,</p>
<p><strong>${actorName}</strong> started following you!</p>
<p style="color:#888;font-size:12px;">You can disable email notifications in your Settings.</p>`,
  }),
  mention: ({ username, actorName, postTitle }) => ({
    subject: `${actorName} mentioned you`,
    html: `<p>Hey <strong>${username}</strong>,</p>
<p><strong>${actorName}</strong> mentioned you in: "${postTitle}"</p>
<p style="color:#888;font-size:12px;">You can disable email notifications in your Settings.</p>`,
  }),
  badge: ({ username, badgeName }) => ({
    subject: `You earned a new badge: ${badgeName}`,
    html: `<p>Hey <strong>${username}</strong>,</p>
<p>Congratulations! You earned the <strong>${badgeName}</strong> badge.</p>
<p style="color:#888;font-size:12px;">You can disable email notifications in your Settings.</p>`,
  }),
};

const NOTIF_TYPE_TO_SETTING = {
  like: 'notify_likes',
  comment: 'notify_comments',
  follow: 'notify_follows',
  mention: 'notify_mentions',
  badge: 'notify_badges',
};

export async function sendNotificationEmail({ userId, type, actorId, postTitle, badgeName }) {
  try {
    // Check if transporter is configured
    if (!process.env.SMTP_HOST) return;

    // Check user email preference
    const settings = await UserSettings.get(userId);
    const settingKey = NOTIF_TYPE_TO_SETTING[type];
    if (settingKey && settings[settingKey] === false) return;

    // Get user email
    const user = await db('users').where({ id: userId }).select('email', 'username', 'display_name').first();
    if (!user || !user.email) return;

    // Get actor name
    let actorName = 'Someone';
    if (actorId) {
      const actor = await db('users').where({ id: actorId }).select('display_name', 'username').first();
      if (actor) actorName = actor.display_name || actor.username;
    }

    const template = TEMPLATES[type];
    if (!template) return;

    const { subject, html } = template({
      username: user.display_name || user.username,
      actorName,
      postTitle: postTitle || 'a post',
      badgeName: badgeName || '',
    });

    await transporter.sendMail({
      from: FROM,
      to: user.email,
      subject,
      html: `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:20px;max-width:600px;margin:0 auto;color:#333;">
<div style="border:1px solid #e0e0e0;border-radius:8px;padding:24px;">
<div style="font-size:18px;font-weight:bold;margin-bottom:16px;">KumoCoders</div>
${html}
<hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
<p style="color:#aaa;font-size:11px;">KumoCoders Community &bull; You're receiving this because you have notifications enabled.</p>
</div></body></html>`,
    });
  } catch (err) {
    console.error('Email notification error:', err);
  }
}
