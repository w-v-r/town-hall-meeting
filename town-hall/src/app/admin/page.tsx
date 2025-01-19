'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

type ActivityType = 'poll' | 'wordcloud' | 'swot' | 'qa' | 'text'

interface Slide {
  id: string
  title: string
  content?: string
  activity?: {
    type: ActivityType
    question?: string
    options?: string[]
    sections?: { [key: string]: string[] } // For SWOT analysis
  }
}

export default function AdminPage() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [selectedSlide, setSelectedSlide] = useState<string | null>(null)
  const [presentationId, setPresentationId] = useState<string>('')

  const addSlide = () => {
    const newSlide: Slide = {
      id: uuidv4(),
      title: `Slide ${slides.length + 1}`,
    }
    setSlides([...slides, newSlide])
    setSelectedSlide(newSlide.id)
  }

  const updateSlide = (id: string, updates: Partial<Slide>) => {
    setSlides(slides.map(slide => 
      slide.id === id ? { ...slide, ...updates } : slide
    ))
  }

  const addActivity = (slideId: string, type: ActivityType) => {
    const activity = {
      type,
      question: '',
      options: type === 'poll' ? [''] : undefined,
      sections: type === 'swot' ? {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: []
      } : undefined
    }
    updateSlide(slideId, { activity })
  }

  const launchPresentation = () => {
    const id = uuidv4()
    setPresentationId(id)
    localStorage.setItem(`presentation_${id}`, JSON.stringify(slides))
    window.open(`/present/${id}`, '_blank')
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Slide thumbnails sidebar */}
      <div className="w-64 bg-gray-800 p-4 border-r border-gray-700">
        <button
          onClick={addSlide}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded mb-4 hover:bg-blue-700"
        >
          + New Slide
        </button>
        <div className="space-y-2">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              onClick={() => setSelectedSlide(slide.id)}
              className={`p-3 rounded cursor-pointer border ${
                selectedSlide === slide.id 
                  ? 'border-blue-500 bg-gray-700' 
                  : 'border-gray-700 hover:bg-gray-750'
              }`}
            >
              <h3 className="font-medium text-gray-200">{slide.title}</h3>
              {slide.activity && (
                <span className="text-sm text-gray-400">
                  {slide.activity.type.toUpperCase()}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main editing area */}
      <div className="flex-1 p-6 overflow-y-auto bg-gray-900">
        {selectedSlide ? (
          <div className="max-w-3xl mx-auto">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
              <input
                type="text"
                value={slides.find(s => s.id === selectedSlide)?.title || ''}
                onChange={(e) => updateSlide(selectedSlide, { title: e.target.value })}
                className="text-2xl font-bold w-full mb-4 p-2 rounded bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                placeholder="Slide Title"
              />

              {!slides.find(s => s.id === selectedSlide)?.activity ? (
                <div className="space-y-4">
                  <textarea
                    value={slides.find(s => s.id === selectedSlide)?.content || ''}
                    onChange={(e) => updateSlide(selectedSlide, { content: e.target.value })}
                    className="w-full h-32 p-2 rounded bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Add slide content..."
                  />
                  <div className="border-t border-gray-700 pt-4">
                    <h3 className="text-lg font-medium mb-2 text-gray-200">Add Activity</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => addActivity(selectedSlide, 'poll')}
                        className="p-3 border border-gray-600 rounded hover:bg-gray-700 text-gray-200"
                      >
                        Poll
                      </button>
                      <button
                        onClick={() => addActivity(selectedSlide, 'wordcloud')}
                        className="p-3 border border-gray-600 rounded hover:bg-gray-700 text-gray-200"
                      >
                        Word Cloud
                      </button>
                      <button
                        onClick={() => addActivity(selectedSlide, 'swot')}
                        className="p-3 border border-gray-600 rounded hover:bg-gray-700 text-gray-200"
                      >
                        SWOT Analysis
                      </button>
                      <button
                        onClick={() => addActivity(selectedSlide, 'qa')}
                        className="p-3 border border-gray-600 rounded hover:bg-gray-700 text-gray-200"
                      >
                        Q&A
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-200">
                      {slides.find(s => s.id === selectedSlide)?.activity?.type.toUpperCase()}
                    </h3>
                    <button
                      onClick={() => updateSlide(selectedSlide, { activity: undefined })}
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove Activity
                    </button>
                  </div>
                  <ActivityEditor
                    activity={slides.find(s => s.id === selectedSlide)?.activity}
                    onChange={(updates) => 
                      updateSlide(selectedSlide, { 
                        activity: { 
                          ...slides.find(s => s.id === selectedSlide)?.activity,
                          ...updates
                        }
                      })
                    }
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 mt-20">
            Select a slide to edit or create a new one
          </div>
        )}
      </div>

      {/* Launch button */}
      {slides.length > 0 && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={launchPresentation}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 shadow-lg"
          >
            Launch Presentation
          </button>
        </div>
      )}
    </div>
  )
}

// Update ActivityEditor component styles
function ActivityEditor({ activity, onChange }: {
  activity?: Slide['activity'],
  onChange: (updates: Partial<NonNullable<Slide['activity']>>) => void
}) {
  if (!activity) return null

  const inputClasses = "w-full p-2 rounded bg-gray-700 border-gray-600 text-white placeholder-gray-400"
  const buttonClasses = "text-blue-400 hover:text-blue-300"

  switch (activity.type) {
    case 'poll':
      return (
        <div className="space-y-4">
          <input
            type="text"
            value={activity.question || ''}
            onChange={(e) => onChange({ question: e.target.value })}
            placeholder="Poll question"
            className={inputClasses}
          />
          <div className="space-y-2">
            {activity.options?.map((option, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...(activity.options || [])]
                    newOptions[index] = e.target.value
                    onChange({ options: newOptions })
                  }}
                  placeholder={`Option ${index + 1}`}
                  className={inputClasses}
                />
                <button
                  onClick={() => {
                    const newOptions = activity.options?.filter((_, i) => i !== index)
                    onChange({ options: newOptions })
                  }}
                  className="text-red-400 hover:text-red-300 px-2"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => onChange({ options: [...(activity.options || []), ''] })}
              className={buttonClasses}
            >
              + Add Option
            </button>
          </div>
        </div>
      )

    case 'swot':
      return (
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(activity.sections || {}).map(([section, items]) => (
            <div key={section} className="border border-gray-700 p-4 rounded bg-gray-750">
              <h4 className="font-medium capitalize mb-2 text-gray-200">{section}</h4>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <input
                    key={index}
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const newSections = { ...activity.sections }
                      newSections[section][index] = e.target.value
                      onChange({ sections: newSections })
                    }}
                    className={inputClasses}
                    placeholder={`Add ${section} item...`}
                  />
                ))}
                <button
                  onClick={() => {
                    const newSections = { ...activity.sections }
                    newSections[section] = [...items, '']
                    onChange({ sections: newSections })
                  }}
                  className={buttonClasses}
                >
                  + Add Item
                </button>
              </div>
            </div>
          ))}
        </div>
      )

    default:
      return (
        <input
          type="text"
          value={activity.question || ''}
          onChange={(e) => onChange({ question: e.target.value })}
          placeholder={`${activity.type} question`}
          className={inputClasses}
        />
      )
  }
} 