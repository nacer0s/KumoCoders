-- KumoCoders Platform Migration 010
-- More achievements

USE kumocoders;

INSERT IGNORE INTO badges (name, description, icon, criteria) VALUES
  ('Social Butterfly',  'Get 10 followers',             'nf-fa-users',        'Get 10 followers'),
  ('Bookworm',          'Bookmark 5 posts',             'nf-fa-bookmark',     'Bookmark 5 posts'),
  ('Good Citizen',      'Like 10 posts',                'nf-fa-thumbs_o_up',  'Like 10 posts'),
  ('Commenter',         'Leave 10 comments',            'nf-fa-comment_o',    'Leave 10 comments'),
  ('Diverse',           'Use 3 different tags',         'nf-fa-tags',         'Use 3 different tags'),
  ('Consistent',        'Post on 5 different days',     'nf-fa-calendar',     'Post on 5 different days'),
  ('Writer',            'Write a post with 500+ char',  'nf-fa-pencil',       'Write a 500+ char post'),
  ('Contributor',       'Reach 50 total likes',         'nf-fa-trophy',       'Reach 50 total likes received'),
  ('Veteran',           'Member for 30 days',           'nf-fa-clock_o',      'Member for 30 days'),
  ('Night Owl',         'Post between midnight and 5 AM', 'nf-fa-moon_o',     'Post between midnight and 5 AM');
