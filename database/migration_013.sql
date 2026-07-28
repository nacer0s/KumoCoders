-- KumoCoders Platform Migration 013
-- User XP, streaks, daily challenges, mute words, scheduling, series, anonymity, webhooks, flair, feedback

USE kumocoders;

-- Helper: add column if not exists
SET @col_xp = 'xp';
SET @ps_xp = (SELECT IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='kumocoders' AND TABLE_NAME='users' AND COLUMN_NAME=@col_xp)>0,'SELECT 1',CONCAT('ALTER TABLE users ADD COLUMN ',@col_xp,' INT UNSIGNED DEFAULT 0 AFTER is_verified')));
PREPARE st FROM @ps_xp; EXECUTE st; DEALLOCATE PREPARE st;

SET @col_level = 'level';
SET @ps_level = (SELECT IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='kumocoders' AND TABLE_NAME='users' AND COLUMN_NAME=@col_level)>0,'SELECT 1',CONCAT('ALTER TABLE users ADD COLUMN ',@col_level,' INT UNSIGNED DEFAULT 1 AFTER xp')));
PREPARE st FROM @ps_level; EXECUTE st; DEALLOCATE PREPARE st;

SET @col_flair = 'flair';
SET @ps_flair = (SELECT IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='kumocoders' AND TABLE_NAME='users' AND COLUMN_NAME=@col_flair)>0,'SELECT 1',CONCAT('ALTER TABLE users ADD COLUMN ',@col_flair,' VARCHAR(100) AFTER level')));
PREPARE st FROM @ps_flair; EXECUTE st; DEALLOCATE PREPARE st;

SET @col_sched = 'scheduled_at';
SET @ps_sched = (SELECT IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='kumocoders' AND TABLE_NAME='community_posts' AND COLUMN_NAME=@col_sched)>0,'SELECT 1',CONCAT('ALTER TABLE community_posts ADD COLUMN ',@col_sched,' TIMESTAMP NULL AFTER status')));
PREPARE st FROM @ps_sched; EXECUTE st; DEALLOCATE PREPARE st;

SET @col_series = 'series_id';
SET @ps_series = (SELECT IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='kumocoders' AND TABLE_NAME='community_posts' AND COLUMN_NAME=@col_series)>0,'SELECT 1',CONCAT('ALTER TABLE community_posts ADD COLUMN ',@col_series,' INT UNSIGNED NULL AFTER scheduled_at')));
PREPARE st FROM @ps_series; EXECUTE st; DEALLOCATE PREPARE st;

SET @col_sorder = 'series_order';
SET @ps_sorder = (SELECT IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='kumocoders' AND TABLE_NAME='community_posts' AND COLUMN_NAME=@col_sorder)>0,'SELECT 1',CONCAT('ALTER TABLE community_posts ADD COLUMN ',@col_sorder,' INT UNSIGNED DEFAULT 0 AFTER series_id')));
PREPARE st FROM @ps_sorder; EXECUTE st; DEALLOCATE PREPARE st;

SET @col_anon = 'is_anonymous';
SET @ps_anon = (SELECT IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='kumocoders' AND TABLE_NAME='community_posts' AND COLUMN_NAME=@col_anon)>0,'SELECT 1',CONCAT('ALTER TABLE community_posts ADD COLUMN ',@col_anon,' TINYINT(1) DEFAULT 0 AFTER series_order')));
PREPARE st FROM @ps_anon; EXECUTE st; DEALLOCATE PREPARE st;

-- User streaks
CREATE TABLE IF NOT EXISTS user_streaks (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL UNIQUE,
  current_streak INT UNSIGNED DEFAULT 0,
  longest_streak INT UNSIGNED DEFAULT 0,
  last_active_date DATE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Daily challenges
CREATE TABLE IF NOT EXISTS daily_challenges (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  xp_reward INT UNSIGNED DEFAULT 50,
  challenge_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_challenge_completions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  challenge_id INT UNSIGNED NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_completion (user_id, challenge_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (challenge_id) REFERENCES daily_challenges(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Per-user mute words/tags
CREATE TABLE IF NOT EXISTS user_muted_words (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  pattern VARCHAR(255) NOT NULL,
  is_tag TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Post templates
CREATE TABLE IF NOT EXISTS post_templates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  title_template VARCHAR(255),
  body_template TEXT,
  tags VARCHAR(500),
  icon VARCHAR(50) DEFAULT 'nf-fa-file_lines',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Series / post threads
CREATE TABLE IF NOT EXISTS post_series (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Webhooks
CREATE TABLE IF NOT EXISTS webhooks (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  url VARCHAR(500) NOT NULL,
  events JSON NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Feedback / suggestions
CREATE TABLE IF NOT EXISTS feedback (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  status ENUM('open','planned','completed','declined') DEFAULT 'open',
  vote_count INT UNSIGNED DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS feedback_votes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  feedback_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  UNIQUE KEY unique_vote (feedback_id, user_id),
  FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
