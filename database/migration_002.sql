-- KumoCoders Platform Migration 002
-- Community moderation: reports + blocks

USE kumocoders;

-- ============================================
-- Community reports table
-- ============================================
CREATE TABLE IF NOT EXISTS community_reports (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reporter_id INT UNSIGNED NOT NULL,
  target_type ENUM('post','comment','user') NOT NULL,
  target_id INT UNSIGNED NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('pending','reviewed','resolved','dismissed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INT UNSIGNED NULL,
  reviewed_at TIMESTAMP NULL,
  resolution_notes TEXT NULL,
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================
-- User blocks table
-- ============================================
CREATE TABLE IF NOT EXISTS community_blocks (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  blocker_id INT UNSIGNED NOT NULL,
  blocked_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_block (blocker_id, blocked_id),
  FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Add 'mention' type to community_notifications enum
ALTER TABLE community_notifications
  MODIFY COLUMN type ENUM('like','comment','badge','system','mention') NOT NULL;
