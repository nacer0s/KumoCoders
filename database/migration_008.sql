-- KumoCoders Platform Migration 008
-- Post reactions (emoji reactions on posts)

USE kumocoders;

CREATE TABLE IF NOT EXISTS post_reactions (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  post_id     INT UNSIGNED NOT NULL,
  reaction    VARCHAR(10) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_reaction (user_id, post_id, reaction),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
) ENGINE=InnoDB;
