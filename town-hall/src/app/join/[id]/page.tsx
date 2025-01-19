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
  }
}

export default function ParticipantView() {
  const params = useParams()
  const [currentSlide, setCurrentSlide] = useState<Slide | null>(null)
  const [socket, setSocket] = useState<any>(null)
  const [response, setResponse] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const initSocket = async () => {
      try {
        await fetch('/api/socket')
        const newSocket = io()
        setSocket(newSocket)

        newSocket.on('slideChange', ({ slideIndex }) => {
          // Get current presentation data
          const savedSlides = JSON.parse(localStorage.getItem(`presentation_${params.id}`) || '[]')
          setCurrentSlide(savedSlides[slideIndex])
          setSubmitted(false)
          setResponse('')
        })
      } catch (error) {
        console.error('Socket connection failed:', error)
      }
    }

    initSocket()
  }, [params.id])

  const submitResponse = () => {
    if (!currentSlide || !response) return

    let responseData = {
      presentationId: params.id,
      slideId: currentSlide.id,
      type: currentSlide.activity?.type,
      value: response
    }

    // Format response based on activity type
    if (currentSlide.activity?.type === 'poll') {
      responseData.type = 'votes'
      responseData.value = { [response]: 1 }
    } else if (currentSlide.activity?.type === 'wordcloud') {
      responseData.type = 'words'
      responseData.value = { [response.toLowerCase()]: 1 }
    } else if (currentSlide.activity?.type === 'qa') {
      responseData.type = 'questions'
      responseData.value = { [Date.now()]: response }
    }

    socket?.emit('response', responseData)
    setSubmitted(true)
    setResponse('')
  }

  if (!currentSlide) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-200">
        <p>Waiting for presentation to start...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4">{currentSlide.title}</h2>
          
          {currentSlide.activity && !submitted ? (
            <div className="space-y-4">
              <h3 className="text-xl mb-4">
                {currentSlide.activity.question}
              </h3>

              {/* Poll Options */}
              {currentSlide.activity.type === 'poll' && (
                <div className="space-y-2">
                  {currentSlide.activity.options?.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setResponse(option)
                        submitResponse()
                      }}
                      className="w-full p-3 text-left bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {/* Word Cloud & Q&A Input */}
              {(currentSlide.activity.type === 'wordcloud' || currentSlide.activity.type === 'qa') && (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder={currentSlide.activity.type === 'wordcloud' ? 
                      "Enter a word" : "Type your question"
                    }
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
                    maxLength={currentSlide.activity.type === 'wordcloud' ? 20 : undefined}
                  />
                  <button
                    onClick={submitResponse}
                    className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Submit
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              {submitted ? (
                <p className="text-green-400">Thanks for your response!</p>
              ) : (
                <p className="text-gray-400">This slide has no interactive elements</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 