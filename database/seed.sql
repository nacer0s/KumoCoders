-- KumoCoders Seed Data
USE kumocoders;

-- Default admin user (password: admin123 — change on first login)
INSERT IGNORE INTO users (username, email, password_hash, display_name, role_id) VALUES
  ('admin', 'admin@kumocoders.dev', '$2a$10$KBdANOiRdR.OHRWtTDgDeOBXEKtrJ/ISdhp3yGFe7LTpcCb/FR2TS', 'Admin', 1);

-- Landing page content for all sections
INSERT IGNORE INTO landing_content (section_key, title, subtitle, body, metadata) VALUES
-- Hero
('hero',
  'Clouding the Future with Code',
  NULL,
  NULL,
  '{
    "cta_primary": {"text": "Join Us", "link": "/join"},
    "cta_secondary": {"text": "Learn More", "link": "#about"}
  }'),

-- About
('about',
  'About Us',
  'Who We Are',
  'KumoCoders is a technology-driven development entity and independent developer team based in Casablanca, Morocco, specializing in web solutions, digital innovation, and tech hackathons. Founded by a group of young Moroccan developers, the team frequently collaborates on software projects and engages in the local IT community.',
  '{
    "highlights": [
      {
        "title": "Web Solutions",
        "description": "Custom web applications, platforms, and digital products built with modern technologies.",
        "icon": "nf-fa-globe"
      },
      {
        "title": "Digital Innovation",
        "description": "Exploring emerging tech, building proof-of-concepts, and pushing boundaries of what is possible.",
        "icon": "nf-fa-lightbulb"
      },
      {
        "title": "Tech Hackathons",
        "description": "Regular participants and organizers in Morocco competitive programming and hackathon scene.",
        "icon": "nf-fa-trophy"
      },
      {
        "title": "Community First",
        "description": "Open-source contributors actively engaged in the local IT community of Casablanca.",
        "icon": "nf-fa-users"
      }
    ],
    "quickInfo": [
      {"icon": "nf-fa-location_dot", "text": "Casablanca, Morocco"},
      {"icon": "nf-fa-code", "text": "Web & Innovation"},
      {"icon": "nf-fa-sitemap", "text": "KumoCoders Association"}
    ]
  }'),

-- Timeline
('timeline',
  'Our Journey',
  'From a shared passion to a structured association',
  NULL,
  '{
    "milestones": [
      {
        "year": "2023",
        "title": "The Beginning",
        "description": "KumoCoders was founded by a group of young Moroccan developers in Casablanca. What started as a shared passion for coding quickly grew into a structured team focused on building real-world solutions."
      },
      {
        "year": "2023",
        "title": "First Projects",
        "description": "The team delivered its first web solutions, establishing a workflow and proving that Moroccan youth could compete in the digital space with quality output."
      },
      {
        "year": "2024",
        "title": "Hackathons & Community",
        "description": "KumoCoders began participating in tech hackathons across Morocco, winning recognition and building a name in the local IT community."
      },
      {
        "year": "2025",
        "title": "Open Source & Growth",
        "description": "The team launched open-source initiatives, grew its online presence, and became an active force in Morocco developer ecosystem."
      },
      {
        "year": "2026",
        "title": "KumoCoders Association",
        "description": "The current chapter. Formalizing the team into the KumoCoders Association, building infrastructure to support more developers, organize events, and create lasting value for the community."
      }
    ]
  }'),

-- Stats
('stats',
  'By the Numbers',
  'Our Impact',
  NULL,
  '{
    "items": [
      {"label": "Projects", "value": "15", "suffix": "+"},
      {"label": "Team Members", "value": "12", "suffix": ""},
      {"label": "Hackathons", "value": "8", "suffix": ""},
      {"label": "Community Reach", "value": "500", "suffix": "+"}
    ]
  }'),

-- Association
('association',
  'KumoCoders Association',
  'Our Latest Chapter',
  'The current open branch of KumoCoders is the KumoCoders Association, our latest initiative to formalize our impact and expand our reach within the Moroccan tech ecosystem. We are building structures to support more developers, organize more events, and create lasting value for the community.',
  '{
    "badge": "Current Branch",
    "buttonText": "Learn More About the Association",
    "buttonLink": "/wiki/association"
  }'),

-- CTA
('cta',
  'Join KumoCoders',
  NULL,
  'Ready to code, create, and compete with us? We are always looking for passionate developers to join our team and help shape the future of Moroccan tech.',
  '{
    "cta_primary": {"text": "Apply Now", "link": "/join"},
    "cta_secondary": {"text": "Explore Community", "link": "/community"}
  }'),

-- Footer (social links + copyright)
('footer',
  NULL,
  NULL,
  NULL,
  '{
    "social": [
      {"icon": "nf-fa-github", "url": "https://github.com/KumoCoders", "label": "GitHub"},
      {"icon": "nf-fa-twitter", "url": "https://twitter.com/KumoCoders", "label": "X / Twitter"},
      {"icon": "nf-fa-discord", "url": "https://discord.gg/kumocoders", "label": "Discord"}
    ]
  }');
