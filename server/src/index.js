import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { initSocket } from './socket/index.js';
import { verifyToken } from './middleware/auth.js';
import { generalLimiter, strictLimiter } from './middleware/rateLimit.js';
import { requestLogger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import injectOGTags from './middleware/ogTags.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import contentRoutes from './routes/content.js';
import communityRoutes from './routes/community.js';
import adminRoutes from './routes/admin.js';
import statsRoutes from './routes/stats.js';
import projectsRoutes from './routes/projects.js';
import blogRoutes from './routes/blog.js';
import wikiRoutes from './routes/wiki.js';
import galleryRoutes from './routes/gallery.js';
import joinRoutes from './routes/join.js';
import reportRoutes from './routes/reports.js';
import studioRoutes from './routes/studio.js';
import uploadRoutes from './routes/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);

// ─── Middleware ───────────────────────────────────────────
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", 'https://v2.jokeapi.dev', 'https://api.github.com', 'https://www.google-analytics.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'blob:'],
      workerSrc: ["'self'", 'blob:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://www.nerdfonts.com'],
      fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com', 'https://www.nerdfonts.com'],
    },
  },
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(requestLogger);

// ─── Rate Limiting ───────────────────────────────────────
app.use('/api/', generalLimiter);
app.use('/api/auth/', strictLimiter);

// ─── API Routes ──────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', verifyToken, userRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/wiki', wikiRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/join', joinRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/studio', studioRoutes);
app.use('/api/upload', uploadRoutes);

// ─── Health Check ────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Serve Static SPAs ──────────────────────────────────
const landingDist = path.resolve(__dirname, '../../apps/landing/dist');
const adminDist = path.resolve(__dirname, '../../apps/admin/dist');
const communityDist = path.resolve(__dirname, '../../apps/community/dist');
const projectsDist = path.resolve(__dirname, '../../apps/projects/dist');
const galleryDist = path.resolve(__dirname, '../../apps/gallery/dist');
const blogDist = path.resolve(__dirname, '../../apps/blog/dist');
const wikiDist = path.resolve(__dirname, '../../apps/wiki/dist');
const reportsDist = path.resolve(__dirname, '../../apps/reports/dist');
const studioDist = path.resolve(__dirname, '../../apps/studio/dist');

app.use(express.static(landingDist));

// Serve admin app at /admin
app.use('/admin', express.static(adminDist));

// Serve community app at /community
app.use('/community', express.static(communityDist));

// OG meta tags for community post pages (social media previews)
app.use('/community/post', injectOGTags);

// Serve projects app at /projects
app.use('/projects', express.static(projectsDist));

// Serve gallery app at /gallery
app.use('/gallery', express.static(galleryDist));

// Serve blog app at /blog
app.use('/blog', express.static(blogDist));

// Serve wiki app at /wiki
app.use('/wiki', express.static(wikiDist));

// Serve reports app at /reports
app.use('/reports', express.static(reportsDist));

// Serve studio app at /studio
app.use('/studio', express.static(studioDist));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// For all non-API routes, serve the landing page
app.use((req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  // Community SPA — support client-side routing
  if (req.path.startsWith('/community/')) {
    return res.sendFile(path.join(communityDist, 'index.html'));
  }
  // Projects SPA — support client-side routing
  if (req.path.startsWith('/projects/')) {
    return res.sendFile(path.join(projectsDist, 'index.html'));
  }
	  // Gallery SPA — support client-side routing
	  if (req.path.startsWith('/gallery/')) {
	    return res.sendFile(path.join(galleryDist, 'index.html'));
	  }
	  // Blog SPA — support client-side routing
	  if (req.path.startsWith('/blog/')) {
	    return res.sendFile(path.join(blogDist, 'index.html'));
	  }
    // Wiki SPA — support client-side routing
    if (req.path.startsWith('/wiki/')) {
      return res.sendFile(path.join(wikiDist, 'index.html'));
    }
    // Reports SPA — support client-side routing
    if (req.path.startsWith('/reports/')) {
      return res.sendFile(path.join(reportsDist, 'index.html'));
    }
    // Studio SPA — support client-side routing
    if (req.path.startsWith('/studio/')) {
      return res.sendFile(path.join(studioDist, 'index.html'));
    }
  // Admin SPA — support client-side routing by serving index.html for /admin/*
  if (req.path.startsWith('/admin/')) {
    return res.sendFile(path.join(adminDist, 'index.html'));
  }
  res.sendFile(path.join(landingDist, 'index.html'));
});

// ─── Error Handler (must be last) ───────────────────────
app.use(errorHandler);

// ─── Socket.IO ───────────────────────────────────────────
initSocket(httpServer);

// ─── Start Server ────────────────────────────────────────
const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`\n  🚀 KumoCoders Platform`);
  console.log(`  ─────────────────────`);
  console.log(`  Server  : http://localhost:${PORT}`);
  console.log(`  API     : http://localhost:${PORT}/api`);
  console.log(`  Socket  : http://localhost:${PORT}/socket.io`);
  console.log(`\n  Ready! ✨\n`);
});
