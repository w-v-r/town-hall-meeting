'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

type SlideType = 'poll' | 'wordcloud' | 'qa' | 'rating'

interface Slide {
  id: string
  type: SlideType
  question: string
  options?: string[]
}

export default function AdminDashboard() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [presentationId, setPresentationId] = useState<string>('')

  const addSlide = (type: SlideType) => {
    const newSlide: Slide = {
      id: uuidv4(),
      type,
      question: '',
      options: type === 'poll' ? [''] : undefined
    }
    setSlides([...slides, newSlide])
  }

  const updateSlide = (id: string, updates: Partial<Slide>) => {
    setSlides(slides.map(slide => 
      slide.id === id ? { ...slide, ...updates } : slide
    ))
  }

  const launchPresentation = () => {
    const id = uuidv4()
    setPresentationId(id)
    // Save presentation to database/localStorage
    localStorage.setItem(`presentation_${id}`, JSON.stringify(slides))
    window.open(`/present/${id}`, '_blank')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create Presentation</h1>
      
      <div className="mb-6 space-x-4">
        <button
          onClick={() => addSlide('poll')}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add Poll
        </button>
        <button
          onClick={() => addSlide('wordcloud')}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Add Word Cloud
        </button>
        <button
          onClick={() => addSlide('qa')}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Add Q&A
        </button>
        <button
          onClick={() => addSlide('rating')}
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          Add Rating
        </button>
      </div>

      <div className="space-y-6">
        {slides.map((slide, index) => (
          <div key={slide.id} className="border p-4 rounded-lg">
            <div className="flex justify-between mb-4">
              <h3 className="text-xl font-semibold">Slide {index + 1}: {slide.type}</h3>
              <button
                onClick={() => setSlides(slides.filter(s => s.id !== slide.id))}
                className="text-red-500"
              >
                Remove
              </button>
            </div>
            
            <input
              type="text"
              value={slide.question}
              onChange={(e) => updateSlide(slide.id, { question: e.target.value })}
              placeholder="Enter your question"
              className="w-full p-2 border rounded mb-4"
            />

            {slide.type === 'poll' && (
              <div className="space-y-2">
                {slide.options?.map((option, optionIndex) => (
                  <input
                    key={optionIndex}
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(slide.options || [])]
                      newOptions[optionIndex] = e.target.value
                      updateSlide(slide.id, { options: newOptions })
                    }}
                    placeholder={`Option ${optionIndex + 1}`}
                    className="w-full p-2 border rounded"
                  />
                ))}
                <button
                  onClick={() => {
                    const newOptions = [...(slide.options || []), '']
                    updateSlide(slide.id, { options: newOptions })
                  }}
                  className="text-blue-500"
                >
                  + Add Option
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {slides.length > 0 && (
        <div className="mt-6">
          <button
            onClick={launchPresentation}
            className="bg-green-600 text-white px-6 py-3 rounded-lg"
          >
            Launch Presentation
          </button>
          {presentationId && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">Share this link with participants:</p>
              <code className="bg-gray-100 p-2 rounded block mt-2">
                {`${typeof window !== 'undefined' ? window.location.origin : ''}/join/${presentationId}`}
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 