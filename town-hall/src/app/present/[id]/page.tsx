'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import io from 'socket.io-client'

interface Slide {
  id: string
  title: string
  content?: string
  activity?: {
    type: 'poll' | 'wordcloud' | 'swot' | 'qa' | 'text'
    question?: string
    options?: string[]
    sections?: { [key: string]: string[] }
  }
}

export default function PresentationView() {
  const params = useParams()
  const [slides, setSlides] = useState<Slide[]>([])
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [socket, setSocket] = useState<any>(null)
  const [responses, setResponses] = useState<Record<string, any>>({})

  useEffect(() => {
    // Load slides from localStorage
    const savedSlides = localStorage.getItem(`presentation_${params.id}`)
    if (savedSlides) {
      setSlides(JSON.parse(savedSlides))
    }

    // Initialize socket connection
    const initSocket = async () => {
      try {
        await fetch('/api/socket')
        const newSocket = io()
        setSocket(newSocket)

        newSocket.on('response', (data) => {
          setResponses(prev => ({
            ...prev,
            [data.slideId]: {
              ...prev[data.slideId],
              [data.type]: data.value
            }
          }))
        })
      } catch (error) {
        console.error('Socket connection failed:', error)
      }
    }

    initSocket()

    // Cleanup socket on unmount
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
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

  if (!currentSlide) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-200">
        <p>Loading presentation...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Navigation controls */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={previousSlide}
            disabled={currentSlideIndex === 0}
            className="px-4 py-2 bg-gray-800 rounded disabled:opacity-50 hover:bg-gray-700"
          >
            Previous
          </button>
          <span className="text-xl">
            Slide {currentSlideIndex + 1} of {slides.length}
          </span>
          <button
            onClick={nextSlide}
            disabled={currentSlideIndex === slides.length - 1}
            className="px-4 py-2 bg-gray-800 rounded disabled:opacity-50 hover:bg-gray-700"
          >
            Next
          </button>
        </div>

        {/* Slide content */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-700">
          <h2 className="text-3xl font-bold mb-6">{currentSlide.title}</h2>
          
          {currentSlide.content && (
            <div className="mb-8 text-lg">
              {currentSlide.content}
            </div>
          )}

          {currentSlide.activity && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">
                {currentSlide.activity.question}
              </h3>

              {/* Poll Results */}
              {currentSlide.activity.type === 'poll' && (
                <div className="space-y-4">
                  {currentSlide.activity.options?.map((option, index) => {
                    const votes = responses[currentSlide.id]?.votes?.[option] || 0
                    const totalVotes = Object.values(responses[currentSlide.id]?.votes || {})
                      .reduce((a: number, b: number) => a + b, 0)
                    const percentage = totalVotes ? Math.round((votes / totalVotes) * 100) : 0

                    return (
                      <div key={index} className="bg-gray-700 rounded p-4">
                        <div className="flex justify-between mb-2">
                          <span>{option}</span>
                          <span>{percentage}% ({votes} votes)</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-blue-500 rounded-full h-2"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Word Cloud */}
              {currentSlide.activity.type === 'wordcloud' && (
                <div className="min-h-[300px] bg-gray-700 rounded p-6">
                  <div className="flex flex-wrap gap-4 justify-center">
                    {Object.entries(responses[currentSlide.id]?.words || {}).map(([word, count]: [string, any]) => (
                      <span
                        key={word}
                        className="inline-block"
                        style={{
                          fontSize: `${Math.min(count * 2 + 16, 48)}px`,
                          opacity: 0.7 + (count * 0.1)
                        }}
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* SWOT Analysis */}
              {currentSlide.activity.type === 'swot' && (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(currentSlide.activity.sections || {}).map(([section, items]) => (
                    <div key={section} className="bg-gray-700 p-4 rounded">
                      <h4 className="font-bold capitalize mb-3">{section}</h4>
                      <ul className="list-disc list-inside space-y-2">
                        {items.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Q&A */}
              {currentSlide.activity.type === 'qa' && (
                <div className="space-y-4">
                  {Object.entries(responses[currentSlide.id]?.questions || {}).map(([id, question]: [string, any]) => (
                    <div key={id} className="bg-gray-700 p-4 rounded">
                      <p>{question}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 