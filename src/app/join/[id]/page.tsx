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

export default function ParticipantView() {
  const params = useParams()
  const [currentSlide, setCurrentSlide] = useState<Slide | null>(null)
  const [socket, setSocket] = useState<any>(null)
  const [response, setResponse] = useState('')

  useEffect(() => {
    const initSocket = async () => {
      await fetch('/api/socket')
      const socket = io()
      setSocket(socket)

      socket.on('slideChange', ({ slideIndex }) => {
        // In production, fetch slide data from server
        const savedSlides = JSON.parse(localStorage.getItem(`presentation_${params.id}`) || '[]')
        setCurrentSlide(savedSlides[slideIndex])
        setResponse('')
      })
    }

    initSocket()
  }, [params.id])

  const submitResponse = () => {
    if (!currentSlide || !response) return

    socket?.emit('response', {
      presentationId: params.id,
      slideId: currentSlide.id,
      type: currentSlide.type,
      value: response
    })

    setResponse('')
  }

  if (!currentSlide) {
    return <div className="p-6 text-center">Waiting for presentation to start...</div>
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">{currentSlide.question}</h2>

      {currentSlide.type === 'poll' && (
        <div className="space-y-4">
          {currentSlide.options?.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                socket?.emit('response', {
                  presentationId: params.id,
                  slideId: currentSlide.id,
                  type: 'votes',
                  value: { [option]: 1 }
                })
              }}
              className="w-full p-3 text-left border rounded hover:bg-gray-50"
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {(currentSlide.type === 'wordcloud' || currentSlide.type === 'qa') && (
        <div className="space-y-4">
          <input
            type="text"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder={currentSlide.type === 'wordcloud' ? "Enter a word" : "Type your question"}
            className="w-full p-3 border rounded"
          />
          <button
            onClick={submitResponse}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  )
} 