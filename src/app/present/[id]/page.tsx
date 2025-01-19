'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import io from 'socket.io-client'

interface Slide {
  id: string
  type: string
  question: string
  options?: string[]
}

export default function PresentationView() {
  const params = useParams()
  const [slides, setSlides] = useState<Slide[]>([])
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [socket, setSocket] = useState<any>(null)
  const [responses, setResponses] = useState<Record<string, any>>({})

  useEffect(() => {
    // Load slides from localStorage (in production, this would be from a database)
    const savedSlides = localStorage.getItem(`presentation_${params.id}`)
    if (savedSlides) {
      setSlides(JSON.parse(savedSlides))
    }

    // Initialize socket connection
    const initSocket = async () => {
      await fetch('/api/socket')
      const socket = io()
      setSocket(socket)

      socket.on('response', (data) => {
        setResponses(prev => ({
          ...prev,
          [data.slideId]: {
            ...prev[data.slideId],
            [data.type]: data.value
          }
        }))
      })
    }

    initSocket()
  }, [params.id])

  const currentSlide = slides[currentSlideIndex]

  const nextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1)
      socket?.emit('slideChange', { presentationId: params.id, slideIndex: currentSlideIndex + 1 })
    }
  }

  const previousSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1)
      socket?.emit('slideChange', { presentationId: params.id, slideIndex: currentSlideIndex - 1 })
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between mb-6">
          <button
            onClick={previousSlide}
            disabled={currentSlideIndex === 0}
            className="bg-gray-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-xl">
            Slide {currentSlideIndex + 1} of {slides.length}
          </span>
          <button
            onClick={nextSlide}
            disabled={currentSlideIndex === slides.length - 1}
            className="bg-gray-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>

        {currentSlide && (
          <div className="border p-6 rounded-lg bg-white shadow-lg">
            <h2 className="text-2xl font-bold mb-4">{currentSlide.question}</h2>
            
            {/* Display responses based on slide type */}
            {currentSlide.type === 'poll' && (
              <div className="space-y-4">
                {currentSlide.options?.map((option, index) => {
                  const voteCount = responses[currentSlide.id]?.votes?.[option] || 0
                  const totalVotes = Object.values(responses[currentSlide.id]?.votes || {}).reduce((a: number, b: number) => a + b, 0)
                  const percentage = totalVotes ? Math.round((voteCount / totalVotes) * 100) : 0
                  
                  return (
                    <div key={index} className="relative">
                      <div className="flex justify-between mb-1">
                        <span>{option}</span>
                        <span>{percentage}% ({voteCount} votes)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-blue-600 rounded-full h-4"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {currentSlide.type === 'wordcloud' && (
              <div className="min-h-[300px] bg-gray-50 rounded p-4">
                {/* Word cloud visualization would go here */}
                {Object.entries(responses[currentSlide.id]?.words || {}).map(([word, count]: [string, any]) => (
                  <span
                    key={word}
                    className="inline-block m-2"
                    style={{ fontSize: `${Math.min(count * 2 + 16, 48)}px` }}
                  >
                    {word}
                  </span>
                ))}
              </div>
            )}

            {currentSlide.type === 'qa' && (
              <div className="space-y-4">
                {Object.entries(responses[currentSlide.id]?.questions || {}).map(([id, question]: [string, any]) => (
                  <div key={id} className="bg-gray-50 p-4 rounded">
                    <p>{question}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 