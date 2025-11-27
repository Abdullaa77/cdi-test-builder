'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'

export default function MatchingHeadingsEditor({ question, onUpdate }) {
  const [formData, setFormData] = useState({
    instruction: question.instruction || 'The reading passage has several paragraphs. Choose the most suitable heading for each paragraph from the list of headings below.',
    paragraphs: question.paragraphs || ['A', 'B', 'C'],
    headingsList: question.headingsList || [
      { id: 'i', text: '' },
      { id: 'ii', text: '' },
      { id: 'iii', text: '' },
      { id: 'iv', text: '' },
      { id: 'v', text: '' }
    ],
    correctAnswers: question.correctAnswers || {}
  })

  const handleUpdate = (updates) => {
    const updated = { ...formData, ...updates }
    setFormData(updated)
    onUpdate(updated)
  }

  const addParagraph = () => {
    const nextLetter = String.fromCharCode(65 + formData.paragraphs.length)
    handleUpdate({
      paragraphs: [...formData.paragraphs, nextLetter]
    })
  }

  const removeParagraph = (index) => {
    if (formData.paragraphs.length > 1) {
      const newParagraphs = formData.paragraphs.filter((_, i) => i !== index)
      const newCorrectAnswers = { ...formData.correctAnswers }
      delete newCorrectAnswers[index + 1]
      handleUpdate({
        paragraphs: newParagraphs,
        correctAnswers: newCorrectAnswers
      })
    }
  }

  const updateCorrectAnswer = (paragraphIndex, headingId) => {
    handleUpdate({
      correctAnswers: {
        ...formData.correctAnswers,
        [paragraphIndex + 1]: headingId
      }
    })
  }

  const addHeading = () => {
    const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii', 'xiii', 'xiv', 'xv']
    const usedIds = formData.headingsList.map(h => h.id)
    const nextId = romanNumerals.find(num => !usedIds.includes(num))
    
    if (nextId) {
      handleUpdate({
        headingsList: [...formData.headingsList, { id: nextId, text: '' }]
      })
    }
  }

  const removeHeading = (id) => {
    if (formData.headingsList.length > 2) {
      handleUpdate({
        headingsList: formData.headingsList.filter(h => h.id !== id)
      })
    }
  }

  const updateHeading = (id, text) => {
    handleUpdate({
      headingsList: formData.headingsList.map(h =>
        h.id === id ? { ...h, text } : h
      )
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg p-4">
        <h4 className="text-blue-300 font-semibold mb-2">Matching Headings to Paragraphs</h4>
        <p className="text-sm text-gray-600 mb-2">
          Students match headings to paragraphs A, B, C, etc. in the passage text.
        </p>
        <p className="text-sm text-yellow-300">
          💡 In the passage text field, format your text like this:
        </p>
        <div className="mt-2 bg-gray-50 p-3 rounded text-xs text-gray-600 font-mono">
          Paragraph A<br/>
          Your first paragraph content here...<br/>
          <br/>
          Paragraph B<br/>
          Your second paragraph content here...<br/>
          <br/>
          Paragraph C<br/>
          Your third paragraph content here...
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-2">
          Instruction Text
        </label>
        <input
          type="text"
          value={formData.instruction}
          onChange={(e) => handleUpdate({ instruction: e.target.value })}
          className="w-full px-4 py-2 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-semibold text-gray-600">
            List of Headings
          </label>
          <button
            onClick={addHeading}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-gray-900 rounded-lg text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Heading
          </button>
        </div>
        <div className="space-y-2">
          {formData.headingsList.map((heading) => (
            <div key={heading.id} className="flex gap-2 items-center">
              <span className="text-blue-600 font-bold text-lg min-w-[40px]">
                {heading.id}
              </span>
              <input
                type="text"
                value={heading.text}
                onChange={(e) => updateHeading(heading.id, e.target.value)}
                className="flex-1 px-4 py-2 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={`Heading ${heading.id}`}
              />
              {formData.headingsList.length > 2 && (
                <button
                  onClick={() => removeHeading(heading.id)}
                  className="p-2 text-red-400 hover:bg-red-900 hover:bg-opacity-30 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Add more headings than paragraphs to create distractors
        </p>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-semibold text-gray-600">
            Paragraphs to Match
          </label>
          <button
            onClick={addParagraph}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-gray-900 rounded-lg text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Paragraph
          </button>
        </div>
        <div className="space-y-3">
          {formData.paragraphs.map((para, index) => (
            <div key={index} className="flex gap-3 items-center bg-gray-50 border border-gray-700 rounded-lg p-3">
              <span className="text-blue-600 font-bold text-lg min-w-[30px]">
                {index + 1}.
              </span>
              <span className="text-gray-900 font-semibold min-w-[100px]">
                Paragraph {para}
              </span>
              <select
                value={formData.correctAnswers[index + 1] || ''}
                onChange={(e) => updateCorrectAnswer(index, e.target.value)}
                className="flex-1 px-3 py-2 border-2 border-gray-200 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select correct heading</option>
                {formData.headingsList.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.id} - {h.text || '(empty)'}
                  </option>
                ))}
              </select>
              {formData.paragraphs.length > 1 && (
                <button
                  onClick={() => removeParagraph(index)}
                  className="p-2 text-red-400 hover:bg-red-900 hover:bg-opacity-30 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-700 rounded-lg p-4">
        <h5 className="text-sm font-semibold text-gray-600 mb-3">Preview</h5>
        <p className="text-xs text-gray-500 mb-4">{formData.instruction}</p>
        
        <div className="mb-4 bg-blue-900 bg-opacity-20 p-3 rounded">
          <h6 className="text-xs font-bold text-blue-300 mb-2">List of Headings:</h6>
          <div className="space-y-1">
            {formData.headingsList.map(h => (
              <div key={h.id} className="text-sm text-gray-600">
                <strong className="text-blue-600">{h.id}</strong> {h.text || '(empty)'}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4">
          <h6 className="text-xs font-bold text-gray-500 mb-2">Match these paragraphs:</h6>
          {formData.paragraphs.map((para, index) => (
            <div key={index} className="mb-2 text-sm flex items-center gap-2">
              <span className="text-blue-600 font-bold">{index + 1}.</span>
              <span className="text-gray-900">Paragraph {para}</span>
              <span className="text-green-400 text-xs">
                (Answer: {formData.correctAnswers[index + 1] || '?'})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}