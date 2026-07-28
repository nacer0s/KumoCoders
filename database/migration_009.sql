-- KumoCoders Platform Migration 009
-- Post drafts (status column)

USE kumocoders;

SET @columnname = 'status';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = 'kumocoders' AND TABLE_NAME = 'community_posts' AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE community_posts ADD COLUMN ', @columnname, " ENUM('draft','published') NOT NULL DEFAULT 'published' AFTER is_nsfw;")
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
