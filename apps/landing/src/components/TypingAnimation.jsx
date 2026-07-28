import { useState, useEffect, useRef } from 'react'

const JOKE_API = 'https://v2.jokeapi.dev/joke/Programming?type=single&safe-mode'

const fallbackJokes = [
  "Why do programmers prefer dark mode? Because light attracts bugs.",
  "How many programmers does it take to change a light bulb? None, that's a hardware problem.",
  "A SQL query walks into a bar, walks up to two tables and asks: 'Can I join you?'",
  "Why do Java developers wear glasses? Because they can't C#.",
  "I told my computer I needed a break, and now it won't stop sending me vacation ads.",
  "There are only 10 types of people in the world: those who understand binary and those who don't.",
  "Why was the JavaScript developer sad? Because he didn't know how to 'null' his feelings.",
  "Debugging: Being the detective in a crime movie where you're also the murderer.",
]

function shuffle(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function TypingAnimation({
  typingSpeed = 35,
  deletingSpeed = 18,
  pauseDuration = 4000,
}) {
  const [displayed, setDisplayed] = useState('')
  const queueRef = useRef([])
  const jokeIdxRef = useRef(0)
  const charIdxRef = useRef(0)
  const timerRef = useRef(null)
  const mountedRef = useRef(true)

  // Fetch jokes once on mount
  useEffect(() => {
    mountedRef.current = true

    async function load() {
      try {
        const res = await fetch(JOKE_API)
        const data = await res.json()
        if (data.joke && data.joke.length < 200) {
          queueRef.current = [data.joke, ...shuffle(fallbackJokes)]
        } else {
          queueRef.current = shuffle(fallbackJokes)
        }
      } catch {
        queueRef.current = shuffle(fallbackJokes)
      }

      // Start the typing loop
      if (mountedRef.current) {
        typeNext()
      }
    }

    load()

    return () => {
      mountedRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function typeNext() {
    if (!mountedRef.current) return
    const joke = getCurrentJoke()
    charIdxRef.current = 0
    typeChar(joke)
  }

  function getCurrentJoke() {
    const queue = queueRef.current
    if (queue.length === 0) return 'Loading...'
    return queue[jokeIdxRef.current % queue.length]
  }

  function typeChar(joke) {
    if (!mountedRef.current) return

    if (charIdxRef.current < joke.length) {
      charIdxRef.current++
      setDisplayed(joke.slice(0, charIdxRef.current))
      timerRef.current = setTimeout(() => typeChar(joke), typingSpeed)
    } else {
      // Full joke displayed — pause, then delete
      timerRef.current = setTimeout(() => deleteChar(joke), pauseDuration)
    }
  }

  function deleteChar(joke) {
    if (!mountedRef.current) return

    if (charIdxRef.current > 0) {
      charIdxRef.current--
      setDisplayed(joke.slice(0, charIdxRef.current))
      timerRef.current = setTimeout(() => deleteChar(joke), deletingSpeed)
    } else {
      // Move to next joke
      jokeIdxRef.current++
      timerRef.current = setTimeout(() => typeNext(), 300)
    }
  }

  return (
    <span className="inline">
      <span>{displayed}</span>
      <span className="inline-block w-0.5 h-[1.1em] bg-text ml-0.5 align-text-bottom animate-blink" />
    </span>
  )
}
