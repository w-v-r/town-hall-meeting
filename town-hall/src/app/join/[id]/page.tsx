'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useWebSocket } from '@/lib/useWebSocket'
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

export default function JoinPresentation() {
  const params = useParams()
  const router = useRouter()
  const [name, setName] = useState('')
  const [isJoining, setIsJoining] = useState(true)
  const [currentSlide, setCurrentSlide] = useState<Slide | null>(null)
  const [response, setResponse] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const { sendMessage } = useWebSocket(params.id as string)
  const [socket, setSocket] = useState<any>(null)

  useEffect(() => {
    // Check if user has already joined
    const participantName = localStorage.getItem(`participant_${params.id}`)
    if (participantName) {
      setName(participantName)
      setIsJoining(false)
    }
  }, [params.id])

  useEffect(() => {
    const initSocket = async () => {
      try {
        await fetch('/api/socket')
        const newSocket = io()
        setSocket(newSocket)

        // Listen for slide changes from the presenter
        newSocket.on('slideChange', (data) => {
          if (data.slide) {
            setCurrentSlide(data.slide)
            setSubmitted(false) // Reset submission state for new slide
          }
        })

        // Join the presentation room
        newSocket.emit('joinPresentation', {
          presentationId: params.id,
          participantName: name
        })
      } catch (error) {
        console.error('Socket connection failed:', error)
      }
    }

    if (!isJoining) {  // Only connect socket after user has entered their name
      initSocket()
    }

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [params.id, isJoining, name])

  const handleJoin = () => {
    if (!name.trim()) return
    localStorage.setItem(`participant_${params.id}`, name)
    sendMessage('join', { name })
    setIsJoining(false)
  }

  if (isJoining) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full border border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-gray-200">Join Presentation</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
                placeholder="Enter your name"
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
            </div>
            <button
              onClick={handleJoin}
              className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Rest of the participant view remains the same...
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Participant info */}
        <div className="mb-6 flex justify-between items-center">
          <span className="text-gray-400">Joined as: {name}</span>
          <button
            onClick={() => {
              localStorage.removeItem(`participant_${params.id}`)
              setIsJoining(true)
              setName('')
            }}
            className="text-gray-400 hover:text-gray-300"
          >
            Change Name
          </button>
        </div>

        {/* Slide content and interaction */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          {currentSlide ? (
            <>
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
                            sendMessage('response', {
                              type: 'votes',
                              value: { [option]: 1 },
                              participant: name
                            })
                            setSubmitted(true)
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
                        onClick={() => {
                          sendMessage('response', {
                            type: currentSlide.activity?.type === 'wordcloud' ? 'words' : 'questions',
                            value: currentSlide.activity?.type === 'wordcloud' 
                              ? { [response.toLowerCase()]: 1 }
                              : { [Date.now()]: response },
                            participant: name
                          })
                          setSubmitted(true)
                          setResponse('')
                        }}
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
                    <p className="text-gray-400">Waiting for the next activity...</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">Waiting for the presentation to start...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 