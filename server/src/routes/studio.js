import { Router } from 'express';
import { z } from 'zod';
import { verifyToken } from '../middleware/auth.js';
import db from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import StudioTeam from '../models/StudioTeam.js';
import StudioMembership from '../models/StudioMembership.js';
import StudioApp from '../models/StudioApp.js';
import StudioChannel from '../models/StudioChannel.js';
import StudioMessage from '../models/StudioMessage.js';
import StudioTask from '../models/StudioTask.js';
import StudioFile from '../models/StudioFile.js';
import StudioDocument from '../models/StudioDocument.js';
import StudioEvent from '../models/StudioEvent.js';
import StudioWhiteboard from '../models/StudioWhiteboard.js';
import StudioMeeting from '../models/StudioMeeting.js';
import StudioAppData from '../models/StudioAppData.js';
import StudioNotification from '../models/StudioNotification.js';
import StudioActivityLog from '../models/StudioActivityLog.js';
import { getIO, getOnlineUsers, getOnlineUsersInApp } from '../socket/index.js';
import User from '../models/User.js';
import crypto from 'crypto';

const router = Router();

// ─── Middleware: check team membership ────────────────────
async function requireTeamMember(req, res, next) {
  const teamId = parseInt(req.params.teamId || req.body.teamId);
  if (!teamId) return res.status(400).json({ error: 'Team ID required' });
  const membership = await StudioMembership.find(teamId, req.user.id);
  if (!membership) return res.status(403).json({ error: 'Not a member of this team' });
  req.teamId = teamId;
  req.membership = membership;
  next();
}

// ═══════════════════════════════════════════════════════════
//  TEAMS
// ═══════════════════════════════════════════════════════════

// GET /api/studio/teams — list user's teams
router.get('/teams', verifyToken, async (req, res) => {
  try {
    const teams = await StudioTeam.findByUser(req.user.id);
    res.json(teams);
  } catch (err) {
    console.error('Studio teams error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/studio/teams — create team
router.post('/teams', verifyToken, async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      icon: z.string().optional(),
      color: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();
    const team = await StudioTeam.create({ ...data, slug, createdBy: req.user.id });
    await StudioMembership.add(team.id, req.user.id, 'owner');
    for (const app of await StudioApp.findAll()) {
      await StudioApp.enableForTeam(team.id, app.id);
    }
    res.status(201).json(team);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    console.error('Studio create team error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/studio/teams/:teamId — team details
router.get('/teams/:teamId', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const team = await StudioTeam.findById(req.teamId);
    const members = await StudioMembership.findByTeam(req.teamId);
    const apps = await StudioApp.allWithTeamStatus(req.teamId);
    res.json({ ...team, members, apps, membership_role: req.membership.role });
  } catch (err) {
    console.error('Studio team detail error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/studio/teams/:teamId — update team
router.put('/teams/:teamId', verifyToken, requireTeamMember, async (req, res) => {
  try {
    if (req.membership.role !== 'owner' && req.membership.role !== 'admin') {
      return res.status(403).json({ error: 'Only owners and admins can update the team' });
    }
    const team = await StudioTeam.update(req.teamId, {
      name: req.body.name,
      description: req.body.description,
      icon: req.body.icon,
      color: req.body.color,
    });
    res.json(team);
  } catch (err) {
    console.error('Studio update team error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/studio/teams/:teamId — delete team
router.delete('/teams/:teamId', verifyToken, requireTeamMember, async (req, res) => {
  try {
    if (req.membership.role !== 'owner') {
      return res.status(403).json({ error: 'Only the owner can delete the team' });
    }
    await StudioTeam.delete(req.teamId);
    res.json({ success: true });
  } catch (err) {
    console.error('Studio delete team error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════
//  MEMBERSHIPS
// ═══════════════════════════════════════════════════════════

// GET /api/studio/teams/:teamId/members — list members
router.get('/teams/:teamId/members', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const members = await StudioMembership.findByTeam(req.teamId);
    res.json(members);
  } catch (err) {
    console.error('Studio members list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/studio/teams/:teamId/members — add member
router.post('/teams/:teamId/members', verifyToken, requireTeamMember, async (req, res) => {
  try {
    if (req.membership.role !== 'owner' && req.membership.role !== 'admin') {
      return res.status(403).json({ error: 'Only owners and admins can manage members' });
    }
    const schema = z.object({
      userId: z.number().int().positive(),
      role: z.enum(['admin', 'member', 'viewer']).optional().default('member'),
    });
    const data = schema.parse(req.body);
    const existing = await StudioMembership.find(req.teamId, data.userId);
    if (existing) return res.status(409).json({ error: 'User is already a member' });
    const membership = await StudioMembership.add(req.teamId, data.userId, data.role);
    const user = await User.findById(data.userId);
    res.status(201).json({ ...membership, ...user });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    console.error('Studio add member error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/studio/teams/:teamId/members/:userId — update role
router.put('/teams/:teamId/members/:userId', verifyToken, requireTeamMember, async (req, res) => {
  try {
    if (req.membership.role !== 'owner' && req.membership.role !== 'admin') {
      return res.status(403).json({ error: 'Only owners and admins can manage members' });
    }
    const { role } = req.body;
    if (!['admin', 'member', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const membership = await StudioMembership.updateRole(req.teamId, parseInt(req.params.userId), role);
    res.json(membership);
  } catch (err) {
    console.error('Studio update member error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/studio/teams/:teamId/members/:userId — remove member
router.delete('/teams/:teamId/members/:userId', verifyToken, requireTeamMember, async (req, res) => {
  try {
    if (req.membership.role !== 'owner' && req.membership.role !== 'admin') {
      return res.status(403).json({ error: 'Only owners and admins can manage members' });
    }
    await StudioMembership.remove(req.teamId, parseInt(req.params.userId));
    res.json({ success: true });
  } catch (err) {
    console.error('Studio remove member error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════
//  APPS (mini-app access control)
// ═══════════════════════════════════════════════════════════

// GET /api/studio/apps — list all available apps
router.get('/apps', verifyToken, async (req, res) => {
  try {
    const apps = await StudioApp.findAll();
    res.json(apps);
  } catch (err) {
    console.error('Studio apps error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/studio/teams/:teamId/apps/:appId — toggle app for team
router.put('/teams/:teamId/apps/:appId', verifyToken, requireTeamMember, async (req, res) => {
  try {
    if (req.membership.role !== 'owner' && req.membership.role !== 'admin') {
      return res.status(403).json({ error: 'Only owners and admins can manage apps' });
    }
    const { enabled } = req.body;
    if (enabled) {
      await StudioApp.enableForTeam(req.teamId, parseInt(req.params.appId));
    } else {
      await StudioApp.disableForTeam(req.teamId, parseInt(req.params.appId));
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Studio toggle app error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/studio/user-app-permissions/:appKey — check current user's permission
router.get('/user-app-permissions/:appKey', verifyToken, async (req, res) => {
  try {
    const app = await StudioApp.findByKey(req.params.appKey);
    if (!app) return res.status(404).json({ error: 'App not found' });
    const perm = await db('studio_user_app_permissions')
      .where({ user_id: req.user.id, app_id: app.id })
      .first();
    res.json({ permission: perm?.permission || 'none' });
  } catch (err) {
    console.error('Studio user app perm error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════
//  CHANNELS
// ═══════════════════════════════════════════════════════════

// GET /api/studio/teams/:teamId/channels
router.get('/teams/:teamId/channels', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const { type } = req.query;
    const channels = await StudioChannel.findByTeam(req.teamId, type);
    res.json(channels);
  } catch (err) {
    console.error('Studio channels error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/studio/teams/:teamId/channels
router.post('/teams/:teamId/channels', verifyToken, requireTeamMember, async (req, res) => {
  try {
    if (req.membership.role !== 'owner' && req.membership.role !== 'admin') {
      return res.status(403).json({ error: 'Only owners and admins can create channels' });
    }
    const schema = z.object({
      name: z.string().min(1).max(100),
      type: z.enum(['chat', 'voice', 'video']).optional().default('chat'),
      isPrivate: z.boolean().optional().default(false),
    });
    const data = schema.parse(req.body);
    const channel = await StudioChannel.create({
      ...data,
      teamId: req.teamId,
      createdBy: req.user.id,
    });
    res.status(201).json(channel);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    console.error('Studio create channel error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/studio/channels/:channelId
router.delete('/channels/:channelId', verifyToken, async (req, res) => {
  try {
    const channel = await StudioChannel.findById(parseInt(req.params.channelId));
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    const membership = await StudioMembership.find(channel.team_id, req.user.id);
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    await StudioChannel.delete(channel.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Studio delete channel error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════
//  MESSAGES
// ═══════════════════════════════════════════════════════════

// GET /api/studio/channels/:channelId/messages
router.get('/channels/:channelId/messages', verifyToken, async (req, res) => {
  try {
    const channel = await StudioChannel.findById(parseInt(req.params.channelId));
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    const membership = await StudioMembership.find(channel.team_id, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Not a member' });
    const { page = 1, limit = 50 } = req.query;
    const result = await StudioMessage.findByChannel(channel.id, parseInt(page), Math.min(parseInt(limit), 100));
    res.json(result);
  } catch (err) {
    console.error('Studio messages error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/studio/channels/:channelId/messages
router.post('/channels/:channelId/messages', verifyToken, async (req, res) => {
  try {
    const channel = await StudioChannel.findById(parseInt(req.params.channelId));
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    const membership = await StudioMembership.find(channel.team_id, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Not a member' });
    const { content, type } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Content is required' });
    const message = await StudioMessage.create({
      channelId: channel.id,
      userId: req.user.id,
      content: content.trim(),
      type: type || 'text',
    });
    res.status(201).json(message);
  } catch (err) {
    console.error('Studio create message error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════
//  TASKS
// ═══════════════════════════════════════════════════════════

// GET /api/studio/teams/:teamId/tasks
router.get('/teams/:teamId/tasks', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const tasks = await StudioTask.findByTeam(req.teamId);
    res.json(tasks);
  } catch (err) {
    console.error('Studio tasks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/studio/teams/:teamId/tasks
router.post('/teams/:teamId/tasks', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const schema = z.object({
      title: z.string().min(1).max(255),
      description: z.string().optional(),
      status: z.enum(['backlog', 'todo', 'in_progress', 'review', 'done']).optional().default('todo'),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
      assigneeId: z.number().int().positive().optional(),
      dueDate: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const task = await StudioTask.create({ ...data, teamId: req.teamId, createdBy: req.user.id });
    res.status(201).json(task);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    console.error('Studio create task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/studio/tasks/:taskId
router.put('/tasks/:taskId', verifyToken, async (req, res) => {
  try {
    const existing = await StudioTask.findById(parseInt(req.params.taskId));
    if (!existing) return res.status(404).json({ error: 'Task not found' });
    const membership = await StudioMembership.find(existing.team_id, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Not a member' });
    const task = await StudioTask.update(parseInt(req.params.taskId), req.body);
    res.json(task);
  } catch (err) {
    console.error('Studio update task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/studio/tasks/:taskId
router.delete('/tasks/:taskId', verifyToken, async (req, res) => {
  try {
    const task = await StudioTask.findById(parseInt(req.params.taskId));
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const membership = await StudioMembership.find(task.team_id, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Not a member' });
    await StudioTask.delete(parseInt(req.params.taskId));
    res.json({ success: true });
  } catch (err) {
    console.error('Studio delete task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════
//  FILES
// ═══════════════════════════════════════════════════════════

// GET /api/studio/teams/:teamId/files
router.get('/teams/:teamId/files', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const { channelId } = req.query;
    const files = await StudioFile.findByTeam(req.teamId, channelId ? parseInt(channelId) : null);
    res.json(files);
  } catch (err) {
    console.error('Studio files error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/studio/teams/:teamId/files (accepts base64 content)
router.post('/teams/:teamId/files', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const schema = z.object({
      filename: z.string().min(1),
      originalName: z.string().min(1),
      mimeType: z.string().optional(),
      sizeBytes: z.number().optional().default(0),
      content: z.string().optional(),
      channelId: z.number().int().positive().optional(),
    });
    const data = schema.parse(req.body);
    let storagePath = '';
    if (data.content) {
      const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'studio', String(req.teamId));
      fs.mkdirSync(uploadDir, { recursive: true });
      const safeName = Date.now() + '-' + data.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = path.join(uploadDir, safeName);
      fs.writeFileSync(filePath, Buffer.from(data.content, 'base64'));
      storagePath = `/uploads/studio/${req.teamId}/${safeName}`;
    }
    const file = await StudioFile.create({ ...data, teamId: req.teamId, userId: req.user.id, storagePath });
    res.status(201).json(file);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    console.error('Studio create file error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/studio/files/:fileId
router.delete('/files/:fileId', verifyToken, async (req, res) => {
  try {
    const file = await StudioFile.findById(parseInt(req.params.fileId));
    if (!file) return res.status(404).json({ error: 'File not found' });
    const membership = await StudioMembership.find(file.team_id, req.user.id);
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin' && file.user_id !== req.user.id)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    await StudioFile.delete(file.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Studio delete file error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════
//  DOCUMENTS
// ═══════════════════════════════════════════════════════════

// GET /api/studio/teams/:teamId/documents
router.get('/teams/:teamId/documents', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const docs = await StudioDocument.findByTeam(req.teamId);
    res.json(docs);
  } catch (err) {
    console.error('Studio documents error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/studio/teams/:teamId/documents
router.post('/teams/:teamId/documents', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const schema = z.object({
      title: z.string().min(1).max(255),
      content: z.string().optional().default(''),
    });
    const data = schema.parse(req.body);
    const doc = await StudioDocument.create({ ...data, teamId: req.teamId, createdBy: req.user.id });
    res.status(201).json(doc);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    console.error('Studio create document error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/studio/documents/:docId
router.get('/documents/:docId', verifyToken, async (req, res) => {
  try {
    const doc = await StudioDocument.findById(parseInt(req.params.docId));
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    const membership = await StudioMembership.find(doc.team_id, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Not a member' });
    res.json(doc);
  } catch (err) {
    console.error('Studio get document error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/studio/documents/:docId
router.put('/documents/:docId', verifyToken, async (req, res) => {
  try {
    const doc = await StudioDocument.findById(parseInt(req.params.docId));
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    const membership = await StudioMembership.find(doc.team_id, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Not a member' });
    const updated = await StudioDocument.update(doc.id, req.body);
    res.json(updated);
  } catch (err) {
    console.error('Studio update document error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/studio/documents/:docId
router.delete('/documents/:docId', verifyToken, async (req, res) => {
  try {
    const doc = await StudioDocument.findById(parseInt(req.params.docId));
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    const membership = await StudioMembership.find(doc.team_id, req.user.id);
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin' && doc.created_by !== req.user.id)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    await StudioDocument.delete(doc.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Studio delete document error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════
//  CALENDAR EVENTS
// ═══════════════════════════════════════════════════════════

// GET /api/studio/teams/:teamId/events
router.get('/teams/:teamId/events', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const { month, year } = req.query;
    const events = await StudioEvent.findByTeam(req.teamId, month ? parseInt(month) : null, year ? parseInt(year) : null);
    res.json(events);
  } catch (err) {
    console.error('Studio events error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/studio/teams/:teamId/events
router.post('/teams/:teamId/events', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const schema = z.object({
      title: z.string().min(1).max(255),
      description: z.string().optional(),
      eventDate: z.string(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      allDay: z.boolean().optional().default(false),
    });
    const data = schema.parse(req.body);
    const event = await StudioEvent.create({ ...data, teamId: req.teamId, createdBy: req.user.id });
    res.status(201).json(event);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    console.error('Studio create event error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/studio/events/:eventId
router.put('/events/:eventId', verifyToken, async (req, res) => {
  try {
    const event = await StudioEvent.update(parseInt(req.params.eventId), req.body);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const membership = await StudioMembership.find(event.team_id, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Not a member' });
    res.json(event);
  } catch (err) {
    console.error('Studio update event error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/studio/events/:eventId
router.delete('/events/:eventId', verifyToken, async (req, res) => {
  try {
    const event = await StudioEvent.findById(parseInt(req.params.eventId));
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const membership = await StudioMembership.find(event.team_id, req.user.id);
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin' && event.created_by !== req.user.id)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    await StudioEvent.delete(event.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Studio delete event error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════
//  WHITEBOARDS
// ═══════════════════════════════════════════════════════════

// GET /api/studio/teams/:teamId/whiteboards
router.get('/teams/:teamId/whiteboards', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const boards = await StudioWhiteboard.findByTeam(req.teamId);
    res.json(boards);
  } catch (err) {
    console.error('Studio whiteboards error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/studio/teams/:teamId/whiteboards
router.post('/teams/:teamId/whiteboards', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const schema = z.object({
      title: z.string().min(1).max(255),
      elements: z.any().optional(),
    });
    const data = schema.parse(req.body);
    const board = await StudioWhiteboard.create({ ...data, teamId: req.teamId, createdBy: req.user.id });
    res.status(201).json(board);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    console.error('Studio create whiteboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/studio/whiteboards/:boardId
router.get('/whiteboards/:boardId', verifyToken, async (req, res) => {
  try {
    const board = await StudioWhiteboard.findById(parseInt(req.params.boardId));
    if (!board) return res.status(404).json({ error: 'Whiteboard not found' });
    const membership = await StudioMembership.find(board.team_id, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Not a member' });
    res.json(board);
  } catch (err) {
    console.error('Studio get whiteboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/studio/whiteboards/:boardId
router.put('/whiteboards/:boardId', verifyToken, async (req, res) => {
  try {
    const board = await StudioWhiteboard.findById(parseInt(req.params.boardId));
    if (!board) return res.status(404).json({ error: 'Whiteboard not found' });
    const membership = await StudioMembership.find(board.team_id, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Not a member' });
    const updated = await StudioWhiteboard.update(board.id, req.body);
    res.json(updated);
  } catch (err) {
    console.error('Studio update whiteboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/studio/whiteboards/:boardId
router.delete('/whiteboards/:boardId', verifyToken, async (req, res) => {
  try {
    const board = await StudioWhiteboard.findById(parseInt(req.params.boardId));
    if (!board) return res.status(404).json({ error: 'Whiteboard not found' });
    const membership = await StudioMembership.find(board.team_id, req.user.id);
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin' && board.created_by !== req.user.id)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    await StudioWhiteboard.delete(board.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Studio delete whiteboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════
//  MEETINGS
// ═══════════════════════════════════════════════════════════

// GET /api/studio/teams/:teamId/meetings — active meetings
router.get('/teams/:teamId/meetings', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const meetings = await StudioMeeting.findActiveByTeam(req.teamId);
    res.json(meetings);
  } catch (err) {
    console.error('Studio meetings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/studio/teams/:teamId/meetings — start a meeting
router.post('/teams/:teamId/meetings', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const schema = z.object({
      title: z.string().optional(),
      type: z.enum(['instant', 'scheduled']).optional().default('instant'),
      channelId: z.number().int().positive().optional(),
    });
    const data = schema.parse(req.body);
    const meeting = await StudioMeeting.create({
      ...data,
      teamId: req.teamId,
      startedBy: req.user.id,
    });
    res.status(201).json(meeting);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    console.error('Studio start meeting error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/studio/meetings/:meetingId/end
router.post('/meetings/:meetingId/end', verifyToken, async (req, res) => {
  try {
    const meeting = await StudioMeeting.end(parseInt(req.params.meetingId));
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    res.json(meeting);
  } catch (err) {
    console.error('Studio end meeting error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════
//  USER SEARCH (for inviting)
// ═══════════════════════════════════════════════════════════

// GET /api/studio/users/search?q=
router.get('/users/search', verifyToken, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json([]);
    const users = await User.searchByUsername(q.trim());
    res.json(users);
  } catch (err) {
    console.error('Studio user search error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Helpers ───
async function notify(io, teamId, userId, appKey, title, body, link) {
  if (!io) return;
  try {
    const notif = await StudioNotification.create({ teamId, userId, appKey, title, body, link });
    io.to(`user:${userId}`).emit('notification:new', notif);
    const cnt = await StudioNotification.unreadCount(teamId, userId);
    io.to(`user:${userId}`).emit('notification:unread', cnt);
  } catch {}
}

async function logActivity(teamId, userId, appKey, action, description, metadata) {
  try {
    await StudioActivityLog.create({ teamId, userId, appKey, action, description, metadata });
  } catch {}
}

// ═══════════════════════════════════════════════════════════
//  NOTIFICATIONS
// ═══════════════════════════════════════════════════════════

router.get('/notifications/:teamId', verifyToken, async (req, res) => {
  try {
    const notifs = await StudioNotification.findByUser(parseInt(req.params.teamId), req.user.id);
    res.json(notifs);
  } catch (err) { console.error('Notifications error:', err); res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/notifications/:teamId/unread', verifyToken, async (req, res) => {
  try {
    const cnt = await StudioNotification.unreadCount(parseInt(req.params.teamId), req.user.id);
    res.json({ count: cnt });
  } catch (err) { console.error('Notifications unread error:', err); res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/notifications/:id/read', verifyToken, async (req, res) => {
  try {
    await StudioNotification.markRead(parseInt(req.params.id), req.user.id);
    res.json({ success: true });
  } catch (err) { console.error('Notification read error:', err); res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/notifications/:teamId/read-all', verifyToken, async (req, res) => {
  try {
    await StudioNotification.markAllRead(parseInt(req.params.teamId), req.user.id);
    res.json({ success: true });
  } catch (err) { console.error('Notification read-all error:', err); res.status(500).json({ error: 'Internal server error' }); }
});

// ═══════════════════════════════════════════════════════════
//  ACTIVITY LOG
// ═══════════════════════════════════════════════════════════

router.get('/activity/:teamId', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const entries = await StudioActivityLog.findByTeam(parseInt(req.params.teamId));
    res.json(entries);
  } catch (err) { console.error('Activity log error:', err); res.status(500).json({ error: 'Internal server error' }); }
});

// ═══════════════════════════════════════════════════════════
//  APP DATA (generic JSON storage for all custom apps)
// ═══════════════════════════════════════════════════════════

// GET /api/studio/teams/:teamId/apps/:appKey/data
router.get('/teams/:teamId/apps/:appKey/data', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const items = await StudioAppData.findAll(req.teamId, req.params.appKey);
    res.json(items);
  } catch (err) {
    console.error('Studio app data list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/studio/teams/:teamId/apps/:appKey/data
router.post('/teams/:teamId/apps/:appKey/data', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const item = await StudioAppData.create({
      teamId: req.teamId,
      appKey: req.params.appKey,
      itemKey: req.body.itemKey || '',
      appData: req.body.data || {},
      createdBy: req.user.id,
    });
    res.status(201).json(item);
  } catch (err) {
    console.error('Studio app data create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/studio/apps/data/:id
router.put('/apps/data/:id', verifyToken, async (req, res) => {
  try {
    const existing = await StudioAppData.findById(parseInt(req.params.id));
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const membership = await StudioMembership.find(existing.team_id, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Not a member' });
    const updated = await StudioAppData.update(existing.id, req.body);
    res.json(updated);
  } catch (err) {
    console.error('Studio app data update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/studio/apps/data/:id
router.delete('/apps/data/:id', verifyToken, async (req, res) => {
  try {
    const existing = await StudioAppData.findById(parseInt(req.params.id));
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const membership = await StudioMembership.find(existing.team_id, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Not a member' });
    await StudioAppData.delete(existing.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Studio app data delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════
//  EMAIL TEST
// ═══════════════════════════════════════════════════════════

router.post('/teams/:teamId/apps/email/test', verifyToken, requireTeamMember, async (req, res) => {
  try {
    res.json({ success: true, message: 'Email configuration saved (SMTP not connected — placeholder).' });
  } catch (err) { console.error('Email test error:', err); res.status(500).json({ error: 'Internal server error' }); }
});

// ═══════════════════════════════════════════════════════════
//  APP PERMISSIONS
// ═══════════════════════════════════════════════════════════

router.get('/teams/:teamId/apps', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const apps = await StudioApp.allWithTeamStatus(req.teamId);
    res.json(apps);
  } catch (err) { console.error('Team apps error:', err); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/teams/:teamId/apps/:appId/permissions', verifyToken, requireTeamMember, async (req, res) => {
  try {
    if (req.membership.role !== 'owner' && req.membership.role !== 'admin') {
      return res.status(403).json({ error: 'Only owners and admins can manage permissions' });
    }
    const { userId, role } = req.body;
    if (!['admin', 'edit', 'view', 'none'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const existing = await db('studio_user_app_permissions').where({ user_id: userId, app_id: parseInt(req.params.appId), team_id: req.teamId }).first();
    if (existing) {
      if (role === 'none') {
        await db('studio_user_app_permissions').where({ id: existing.id }).del();
      } else {
        await db('studio_user_app_permissions').where({ id: existing.id }).update({ permission: role, updated_at: new Date() });
      }
    } else if (role !== 'none') {
      await db('studio_user_app_permissions').insert({ user_id: userId, app_id: parseInt(req.params.appId), team_id: req.teamId, permission: role });
    }
    res.json({ success: true });
  } catch (err) { console.error('App permissions error:', err); res.status(500).json({ error: 'Internal server error' }); }
});

// ═══════════════════════════════════════════════════════════
//  AI ASSISTANT
// ═══════════════════════════════════════════════════════════

function generateMockResponse(message, ctx) {
  const lower = (message || '').toLowerCase();
  const { taskCount = 0, fileCount = 0, docCount = 0, memberCount = 0 } = ctx || {};

  if (lower.includes('task') || lower.includes('todo') || lower.includes('sprint')) {
    return `I found **${taskCount} tasks** in your team workspace. ${
      taskCount > 0
        ? 'Some are in progress and others are waiting. Would you like me to help organize them by priority or assignees?'
        : 'You can create a new task to get started.'
    }`;
  }
  if (lower.includes('file') || lower.includes('document') || lower.includes('upload')) {
    return `Your team has **${fileCount} files** and **${docCount} documents** stored. ${
      fileCount + docCount > 0
        ? 'I can help you search through them or organize them into folders.'
        : 'Try uploading a file to share with your team.'
    }`;
  }
  if (lower.includes('member') || lower.includes('team') || lower.includes('people') || lower.includes('user')) {
    return `Your team has **${memberCount} member${memberCount !== 1 ? 's' : ''}**. ${
      memberCount > 1
        ? 'Collaboration is key! You can mention them with @name or assign them to tasks.'
        : 'Invite more members to collaborate on projects together.'
    }`;
  }
  if (lower.includes('hello') || lower.includes('hi ') || lower.includes('hey')) {
    return `Hello! I'm your Kumo AI assistant. I can help you manage tasks, find files, answer questions about your team, and more. How can I assist you today?`;
  }
  if (lower.includes('help') || lower.includes('what can you')) {
    return `I can help you with:
• **Tasks** — create, assign, track progress
• **Files & Docs** — search and organize
• **Team** — member info and collaboration
• **Events** — schedule and reminders
• **Notifications** — stay updated

What would you like to explore?`;
  }

  return `That's an interesting question! Based on your team workspace with **${memberCount} members**, **${taskCount} tasks**, and **${fileCount} files**, here's what I can tell you: I'm your AI assistant and I'm here to help with any questions about your projects, tasks, or team collaboration. Feel free to ask me about tasks, files, team members, or anything else!`;
}

// POST /api/studio/teams/:teamId/ai/chat
router.post('/teams/:teamId/ai/chat', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const schema = z.object({
      message: z.string().min(1),
      context: z.any().optional(),
    });
    const { message, context } = schema.parse(req.body);

    const [tasks, files, docs, members] = await Promise.all([
      StudioTask.findByTeam(req.teamId),
      StudioFile.findByTeam(req.teamId),
      StudioDocument.findByTeam(req.teamId),
      StudioMembership.findByTeam(req.teamId),
    ]);

    const ctx = {
      taskCount: tasks.length,
      fileCount: files.length,
      docCount: docs.length,
      memberCount: members.length,
      ...(context || {}),
    };

    const response = generateMockResponse(message, ctx);
    res.json({ response, context: ctx });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    console.error('Studio AI chat error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════
//  INTEGRATIONS
// ═══════════════════════════════════════════════════════════

const INTEGRATION_TYPES = ['github', 'slack', 'figma', 'google_drive', 'stripe'];

// GET /api/studio/teams/:teamId/integrations
router.get('/teams/:teamId/integrations', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const items = await StudioAppData.findAll(req.teamId, 'integrations');
    res.json(items);
  } catch (err) {
    console.error('Studio integrations list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/studio/teams/:teamId/integrations
router.post('/teams/:teamId/integrations', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const schema = z.object({
      type: z.enum(INTEGRATION_TYPES),
      name: z.string().min(1).max(100),
      config: z.any().optional().default({}),
    });
    const data = schema.parse(req.body);
    const item = await StudioAppData.create({
      teamId: req.teamId,
      appKey: 'integrations',
      itemKey: `${data.type}-${Date.now()}`,
      appData: {
        type: data.type,
        name: data.name,
        config: data.config,
        enabled: true,
        lastSync: null,
      },
      createdBy: req.user.id,
    });
    res.status(201).json(item);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    console.error('Studio create integration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/studio/integrations/:id
router.put('/integrations/:id', verifyToken, async (req, res) => {
  try {
    const existing = await StudioAppData.findById(parseInt(req.params.id));
    if (!existing) return res.status(404).json({ error: 'Integration not found' });
    const membership = await StudioMembership.find(existing.team_id, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Not a member' });
    const schema = z.object({
      name: z.string().min(1).max(100).optional(),
      config: z.any().optional(),
      enabled: z.boolean().optional(),
    });
    const data = schema.parse(req.body);
    const appData = typeof existing.data === 'string' ? JSON.parse(existing.data) : existing.data;
    const updated = await StudioAppData.update(existing.id, { appData: { ...appData, ...data } });
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    console.error('Studio update integration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/studio/integrations/:id
router.delete('/integrations/:id', verifyToken, async (req, res) => {
  try {
    const existing = await StudioAppData.findById(parseInt(req.params.id));
    if (!existing) return res.status(404).json({ error: 'Integration not found' });
    const membership = await StudioMembership.find(existing.team_id, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Not a member' });
    await StudioAppData.delete(existing.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Studio delete integration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/studio/integrations/:id/test
router.post('/integrations/:id/test', verifyToken, async (req, res) => {
  try {
    const existing = await StudioAppData.findById(parseInt(req.params.id));
    if (!existing) return res.status(404).json({ error: 'Integration not found' });
    const membership = await StudioMembership.find(existing.team_id, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Not a member' });
    res.json({ success: true, message: 'Connection test successful (simulated).' });
  } catch (err) {
    console.error('Studio test integration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════
//  AUTOMATIONS
// ═══════════════════════════════════════════════════════════

const AUTOMATION_TRIGGER_TYPES = ['task.status_changed', 'file.uploaded', 'event.created', 'schedule.daily'];
const AUTOMATION_ACTION_TYPES = ['notify.channel', 'task.create', 'email.send', 'webhook.call'];

// GET /api/studio/teams/:teamId/automations
router.get('/teams/:teamId/automations', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const items = await StudioAppData.findAll(req.teamId, 'automations');
    res.json(items);
  } catch (err) {
    console.error('Studio automations list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/studio/teams/:teamId/automations
router.post('/teams/:teamId/automations', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(100),
      trigger: z.object({
        type: z.enum(AUTOMATION_TRIGGER_TYPES),
        config: z.any().optional().default({}),
      }),
      actions: z.array(z.object({
        type: z.enum(AUTOMATION_ACTION_TYPES),
        config: z.any().optional().default({}),
      })).min(1),
    });
    const data = schema.parse(req.body);
    const item = await StudioAppData.create({
      teamId: req.teamId,
      appKey: 'automations',
      itemKey: `auto-${Date.now()}`,
      appData: {
        name: data.name,
        trigger: data.trigger,
        actions: data.actions,
        enabled: true,
      },
      createdBy: req.user.id,
    });
    res.status(201).json(item);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    console.error('Studio create automation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/studio/automations/:id
router.put('/automations/:id', verifyToken, async (req, res) => {
  try {
    const existing = await StudioAppData.findById(parseInt(req.params.id));
    if (!existing) return res.status(404).json({ error: 'Automation not found' });
    const membership = await StudioMembership.find(existing.team_id, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Not a member' });
    const schema = z.object({
      name: z.string().min(1).max(100).optional(),
      trigger: z.object({
        type: z.enum(AUTOMATION_TRIGGER_TYPES),
        config: z.any().optional(),
      }).optional(),
      actions: z.array(z.object({
        type: z.enum(AUTOMATION_ACTION_TYPES),
        config: z.any().optional(),
      })).optional(),
      enabled: z.boolean().optional(),
    });
    const data = schema.parse(req.body);
    const appData = typeof existing.data === 'string' ? JSON.parse(existing.data) : existing.data;
    const updated = await StudioAppData.update(existing.id, { appData: { ...appData, ...data } });
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    console.error('Studio update automation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/studio/automations/:id
router.delete('/automations/:id', verifyToken, async (req, res) => {
  try {
    const existing = await StudioAppData.findById(parseInt(req.params.id));
    if (!existing) return res.status(404).json({ error: 'Automation not found' });
    const membership = await StudioMembership.find(existing.team_id, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Not a member' });
    await StudioAppData.delete(existing.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Studio delete automation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/studio/automations/:id/test
router.post('/automations/:id/test', verifyToken, async (req, res) => {
  try {
    const existing = await StudioAppData.findById(parseInt(req.params.id));
    if (!existing) return res.status(404).json({ error: 'Automation not found' });
    const membership = await StudioMembership.find(existing.team_id, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Not a member' });
    res.json({ success: true, message: 'Automation test run completed (simulated).' });
  } catch (err) {
    console.error('Studio test automation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════
//  CLIENT PORTAL
// ═══════════════════════════════════════════════════════════

// GET /api/studio/teams/:teamId/portal
router.get('/teams/:teamId/portal', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const items = await StudioAppData.findAll(req.teamId, 'clientportal');
    const settings = items.find(i => i.item_key === 'settings');
    res.json(settings || { name: 'Client Portal', welcomeMessage: '', enabled: false });
  } catch (err) {
    console.error('Studio portal settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/studio/teams/:teamId/portal
router.put('/teams/:teamId/portal', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().max(100).optional(),
      welcomeMessage: z.string().optional(),
      enabled: z.boolean().optional(),
    });
    const data = schema.parse(req.body);
    const items = await StudioAppData.findAll(req.teamId, 'clientportal');
    let settings = items.find(i => i.item_key === 'settings');
    if (settings) {
      const appData = typeof settings.data === 'string' ? JSON.parse(settings.data) : settings.data;
      settings = await StudioAppData.update(settings.id, { appData: { ...appData, ...data } });
    } else {
      settings = await StudioAppData.create({
        teamId: req.teamId,
        appKey: 'clientportal',
        itemKey: 'settings',
        appData: {
          name: data.name || 'Client Portal',
          welcomeMessage: data.welcomeMessage || '',
          enabled: data.enabled || false,
        },
        createdBy: req.user.id,
      });
    }
    res.json(settings);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    console.error('Studio update portal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/studio/teams/:teamId/portal/clients
router.get('/teams/:teamId/portal/clients', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const items = await StudioAppData.findAll(req.teamId, 'clientportal');
    const clients = items.filter(i => i.item_key.startsWith('client:'));
    res.json(clients);
  } catch (err) {
    console.error('Studio portal clients list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/studio/teams/:teamId/portal/clients
router.post('/teams/:teamId/portal/clients', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(100),
      email: z.string().email(),
      scopedApps: z.array(z.string()).optional().default([]),
    });
    const data = schema.parse(req.body);
    const token = crypto.randomBytes(32).toString('hex');
    const item = await StudioAppData.create({
      teamId: req.teamId,
      appKey: 'clientportal',
      itemKey: `client:${Date.now()}`,
      appData: {
        name: data.name,
        email: data.email,
        token,
        scopedApps: data.scopedApps,
        status: 'invited',
        invitedAt: new Date().toISOString(),
        lastAccess: null,
      },
      createdBy: req.user.id,
    });
    res.status(201).json(item);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    console.error('Studio invite client error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/studio/portal/clients/:id
router.delete('/portal/clients/:id', verifyToken, async (req, res) => {
  try {
    const existing = await StudioAppData.findById(parseInt(req.params.id));
    if (!existing) return res.status(404).json({ error: 'Client not found' });
    const membership = await StudioMembership.find(existing.team_id, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Not a member' });
    await StudioAppData.delete(existing.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Studio delete client error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════
//  DATA EXPORT
// ═══════════════════════════════════════════════════════════

router.get('/teams/:teamId/export', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const typesParam = (req.query.types || 'tasks,files,docs,events,appdata').split(',').map(s => s.trim());
    const result = { exportedAt: new Date().toISOString(), teamId: req.teamId };

    if (typesParam.includes('tasks')) {
      result.tasks = await StudioTask.findByTeam(req.teamId);
    }
    if (typesParam.includes('files')) {
      result.files = await StudioFile.findByTeam(req.teamId);
    }
    if (typesParam.includes('docs')) {
      result.documents = await StudioDocument.findByTeam(req.teamId);
    }
    if (typesParam.includes('events')) {
      result.events = await StudioEvent.findByTeam(req.teamId);
    }
    if (typesParam.includes('appdata')) {
      const apps = await StudioApp.allWithTeamStatus(req.teamId);
      const appData = {};
      for (const app of apps) {
        if (app.enabled) {
          const key = app.app_key || app.key;
          appData[key] = await StudioAppData.findAll(req.teamId, key);
        }
      }
      result.appData = appData;
    }

    res.json(result);
  } catch (err) {
    console.error('Studio export error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════
//  VIDEOS
// ═══════════════════════════════════════════════════════════

router.get('/teams/:teamId/videos', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const files = await StudioFile.findByTeam(req.teamId);
    const videos = files.filter(f => f.mime_type && f.mime_type.startsWith('video/'));
    res.json(videos);
  } catch (err) {
    console.error('Studio videos error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════
//  PRESENCE (online users)
// ═══════════════════════════════════════════════════════════

router.get('/teams/:teamId/presence', verifyToken, requireTeamMember, async (req, res) => {
  try {
    const online = getOnlineUsers(req.teamId);
    res.json(online);
  } catch (err) {
    console.error('Studio presence error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
