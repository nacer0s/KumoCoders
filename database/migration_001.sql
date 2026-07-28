-- KumoCoders Platform Migration 001
-- Add bio column to users, seed badges

USE kumocoders;

-- Add bio column if not exists
SET @dbname = 'kumocoders';
SET @tablename = 'users';
SET @columnname = 'bio';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TEXT AFTER display_name;')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Seed badges (ignore if already exist)
INSERT IGNORE INTO badges (id, name, description, icon, criteria) VALUES
  (1, 'First Post', 'Create your first post', 'nf-fa-pen_to_square', 'Create your first post'),
  (2, 'Rising Star', 'Reach 5 posts', 'nf-fa-star', 'Reach 5 posts'),
  (3, 'Popular', 'Reach 10 likes on one post', 'nf-fa-fire', 'Reach 10 likes on one post'),
  (4, 'Chatter', 'Reach 50 comments', 'nf-fa-comments', 'Reach 50 comments'),
  (5, 'Heartbreaker', 'Reach 100 likes received', 'nf-fa-heart', 'Reach 100 likes received');
