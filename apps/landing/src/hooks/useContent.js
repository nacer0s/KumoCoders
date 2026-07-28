import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const API_BASE = '/api/content'

// ─── Default content — always available, no flash ───
const DEFAULT_CONTENT = {
  hero: {
    section_key: 'hero',
    title: 'Clouding the Future with Code',
    metadata: {
      cta_primary: { text: 'Join Us', link: '/join' },
      cta_secondary: { text: 'Learn More', link: '#about' },
    },
  },
  about: {
    section_key: 'about',
    title: 'About Us',
    subtitle: 'Who We Are',
    body: 'KumoCoders is a technology-driven development entity and independent developer team based in Casablanca, Morocco, specializing in web solutions, digital innovation, and tech hackathons. Founded by a group of young Moroccan developers, the team frequently collaborates on software projects and engages in the local IT community.',
    metadata: {
      highlights: [
        { title: 'Web Solutions', description: 'Custom web applications, platforms, and digital products built with modern technologies.' },
        { title: 'Digital Innovation', description: 'Exploring emerging tech, building proof-of-concepts, and pushing boundaries of what is possible.' },
        { title: 'Tech Hackathons', description: 'Regular participants and organizers in Morocco competitive programming and hackathon scene.' },
        { title: 'Community First', description: 'Open-source contributors actively engaged in the local IT community of Casablanca.' },
      ],
      quickInfo: [
        { icon: 'nf-fa-location_dot', text: 'Casablanca, Morocco' },
        { icon: 'nf-fa-code', text: 'Web & Innovation' },
        { icon: 'nf-fa-sitemap', text: 'KumoCoders Association' },
      ],
    },
  },
  timeline: {
    section_key: 'timeline',
    title: 'Our Journey',
    subtitle: 'From a shared passion to a structured association',
    metadata: {
      milestones: [
        { year: '2023', title: 'The Beginning', description: 'KumoCoders was founded by a group of young Moroccan developers in Casablanca. What started as a shared passion for coding quickly grew into a structured team focused on building real-world solutions.' },
        { year: '2023', title: 'First Projects', description: 'The team delivered its first web solutions, establishing a workflow and proving that Moroccan youth could compete in the digital space with quality output.' },
        { year: '2024', title: 'Hackathons & Community', description: 'KumoCoders began participating in tech hackathons across Morocco, winning recognition and building a name in the local IT community.' },
        { year: '2025', title: 'Open Source & Growth', description: 'The team launched open-source initiatives, grew its online presence, and became an active force in Morocco developer ecosystem.' },
        { year: '2026', title: 'KumoCoders Association', description: 'The current chapter. Formalizing the team into the KumoCoders Association, building infrastructure to support more developers, organize events, and create lasting value for the community.' },
      ],
    },
  },
  stats: {
    section_key: 'stats',
    title: 'By the Numbers',
    subtitle: 'Our Impact',
    metadata: {
      items: [
        { label: 'Projects', value: '15', suffix: '+' },
        { label: 'Team Members', value: '12', suffix: '' },
        { label: 'Hackathons', value: '8', suffix: '' },
        { label: 'Community Reach', value: '500', suffix: '+' },
      ],
    },
  },
  association: {
    section_key: 'association',
    title: 'KumoCoders Association',
    subtitle: 'Our Latest Chapter',
    body: 'The current open branch of KumoCoders is the KumoCoders Association, our latest initiative to formalize our impact and expand our reach within the Moroccan tech ecosystem. We are building structures to support more developers, organize more events, and create lasting value for the community.',
    metadata: {
      badge: 'Current Branch',
      buttonText: 'Learn More About the Association',
      buttonLink: '/wiki/association',
    },
  },
  cta: {
    section_key: 'cta',
    title: 'Join KumoCoders',
    body: 'Ready to code, create, and compete with us? We are always looking for passionate developers to join our team and help shape the future of Moroccan tech.',
    metadata: {
      cta_primary: { text: 'Apply Now', link: '/join' },
      cta_secondary: { text: 'Explore Community', link: '/community' },
    },
  },
  join: {
    section_key: 'join',
    title: 'Join KumoCoders',
    subtitle: 'Become part of our developer community',
    body: 'We are always looking for passionate developers, designers, and tech enthusiasts to join our team. Whether you are a seasoned developer or just starting out, there is a place for you at KumoCoders.',
    metadata: {
      is_open: true,
      opens_at: '',
      closes_at: '',
      success_message: 'Thank you for your application! We will review it and get back to you soon. In the meantime, feel free to join our Discord community.',
      closed_message: 'Applications are currently closed. We open applications periodically — follow us on social media to stay updated.',
    },
  },
  footer: {
    section_key: 'footer',
    metadata: {
      social: [
        { icon: 'nf-fa-github', url: 'https://github.com/KumoCoders', label: 'GitHub' },
        { icon: 'nf-fa-twitter', url: 'https://twitter.com/KumoCoders', label: 'X / Twitter' },
        { icon: 'nf-fa-discord', url: 'https://discord.gg/kumocoders', label: 'Discord' },
      ],
    },
  },
}

export default function useContent() {
  // Initialize with defaults immediately — no flash / no loading delay
  const [content, setContent] = useState(DEFAULT_CONTENT)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const socketRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    // ─── Fetch initial content via REST ───
    async function fetchContent() {
      try {
        const res = await fetch(API_BASE)
        if (!res.ok) throw new Error(`API error (${res.status})`)

        const data = await res.json()
        if (!data?.content?.length) throw new Error('No content found')

        // Index content by section_key
        const indexed = {}
        for (const section of data.content) {
          indexed[section.section_key] = section
        }

        if (!cancelled) {
          setContent((prev) => ({ ...prev, ...indexed }))
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load content')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchContent()

    // ─── Connect Socket.IO for real-time updates ───
    const socket = io({ path: '/socket.io' })
    socketRef.current = socket

    socket.emit('join:app', 'landing')

    socket.on('content:updated', (payload) => {
      if (cancelled) return
      const { sectionKey, content: sectionData } = payload
      if (sectionKey && sectionData) {
        setContent((prev) => ({
          ...prev,
          [sectionKey]: sectionData,
        }))
      }
    })

    return () => {
      cancelled = true
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  const getSection = (key) => content?.[key] ?? null

  return { content, error, loading, getSection }
}
