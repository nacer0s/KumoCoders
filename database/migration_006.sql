-- Studio Workspace tables

-- Teams (top-level groups)
CREATE TABLE IF NOT EXISTS studio_teams (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'nf-fa-users',
  color VARCHAR(7) DEFAULT '#6366f1',
  created_by INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Team memberships
CREATE TABLE IF NOT EXISTS studio_memberships (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  role ENUM('owner','admin','member','viewer') DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_team_user (team_id, user_id),
  FOREIGN KEY (team_id) REFERENCES studio_teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Available mini-apps (seeded)
CREATE TABLE IF NOT EXISTS studio_apps (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  app_key VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'nf-fa-puzzle_piece',
  color VARCHAR(7) DEFAULT '#6366f1',
  is_enabled TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- Team → app access
CREATE TABLE IF NOT EXISTS studio_team_apps (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id INT UNSIGNED NOT NULL,
  app_id INT UNSIGNED NOT NULL,
  UNIQUE KEY uq_team_app (team_id, app_id),
  FOREIGN KEY (team_id) REFERENCES studio_teams(id) ON DELETE CASCADE,
  FOREIGN KEY (app_id) REFERENCES studio_apps(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- User → app permission override
CREATE TABLE IF NOT EXISTS studio_user_app_permissions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  app_id INT UNSIGNED NOT NULL,
  permission ENUM('none','read','write','admin') DEFAULT 'none',
  UNIQUE KEY uq_user_app (user_id, app_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (app_id) REFERENCES studio_apps(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Channels (chat / voice / video rooms)
CREATE TABLE IF NOT EXISTS studio_channels (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id INT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  type ENUM('chat','voice','video') NOT NULL DEFAULT 'chat',
  is_private TINYINT(1) NOT NULL DEFAULT 0,
  created_by INT UNSIGNED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES studio_teams(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Private channel members
CREATE TABLE IF NOT EXISTS studio_channel_members (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  channel_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  UNIQUE KEY uq_channel_user (channel_id, user_id),
  FOREIGN KEY (channel_id) REFERENCES studio_channels(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Chat messages
CREATE TABLE IF NOT EXISTS studio_messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  channel_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  content TEXT NOT NULL,
  type ENUM('text','image','file','system') DEFAULT 'text',
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (channel_id) REFERENCES studio_channels(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Task board
CREATE TABLE IF NOT EXISTS studio_tasks (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('backlog','todo','in_progress','review','done') DEFAULT 'todo',
  priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
  assignee_id INT UNSIGNED,
  created_by INT UNSIGNED NOT NULL,
  due_date DATE,
  position INT UNSIGNED DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES studio_teams(id) ON DELETE CASCADE,
  FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Files
CREATE TABLE IF NOT EXISTS studio_files (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id INT UNSIGNED NOT NULL,
  channel_id INT UNSIGNED,
  user_id INT UNSIGNED NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  size_bytes BIGINT UNSIGNED DEFAULT 0,
  storage_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES studio_teams(id) ON DELETE CASCADE,
  FOREIGN KEY (channel_id) REFERENCES studio_channels(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Documents
CREATE TABLE IF NOT EXISTS studio_documents (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  content LONGTEXT,
  created_by INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES studio_teams(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Calendar events
CREATE TABLE IF NOT EXISTS studio_events (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  all_day TINYINT(1) DEFAULT 0,
  created_by INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES studio_teams(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Whiteboards
CREATE TABLE IF NOT EXISTS studio_whiteboards (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  elements JSON,
  created_by INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES studio_teams(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Meetings (voice/video calls)
CREATE TABLE IF NOT EXISTS studio_meetings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id INT UNSIGNED NOT NULL,
  channel_id INT UNSIGNED,
  title VARCHAR(255),
  type ENUM('instant','scheduled') DEFAULT 'instant',
  status ENUM('active','ended') DEFAULT 'active',
  started_by INT UNSIGNED NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  FOREIGN KEY (team_id) REFERENCES studio_teams(id) ON DELETE CASCADE,
  FOREIGN KEY (channel_id) REFERENCES studio_channels(id) ON DELETE SET NULL,
  FOREIGN KEY (started_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Seed default mini-apps
INSERT IGNORE INTO studio_apps (app_key, name, description, icon, color) VALUES
  ('chat',       'Chat',       'Text chat rooms',              'nf-fa-comments',      '#6366f1'),
  ('voice',      'Voice',      'Always-on voice channels',     'nf-fa-microphone',    '#22c55e'),
  ('video',      'Video',      'Group video meetings',         'nf-fa-video',         '#ef4444'),
  ('calls',      '1v1 Calls',  'Direct voice/video calls',     'nf-fa-phone',         '#f59e0b'),
  ('screenshare','Screen Share','Share your screen',           'nf-fa-display',       '#8b5cf6'),
  ('tasks',      'Tasks',      'Kanban task board',            'nf-fa-list_check',    '#06b6d4'),
  ('files',      'Files',      'File sharing & storage',       'nf-fa-folder_open',   '#ec4899'),
  ('docs',       'Documents',  'Collaborative documents',      'nf-fa-file_lines',    '#10b981'),
  ('whiteboard', 'Whiteboard', 'Freeform canvas drawing',      'nf-fa-pen_fancy',     '#f97316'),
  ('calendar',   'Calendar',   'Team events & scheduling',     'nf-fa-calendar_days', '#6366f1');
