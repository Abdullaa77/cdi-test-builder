'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

export default function MultipleChoiceMultipleEditor({ question, onUpdate }) {
  const [formData, setFormData] = useState({
    instruction: question.instruction || 'Choose TWO answers.',
    text: question.text || '',
    questionNumbers: question.questionNumbers || '',
    options: Array.isArray(question.options) 
      ? question.options 
      : (question.options && typeof question.options === 'object')
        ? Object.entries(question.options).map(([key, value]) => ({ id: key, text: value }))
        : [
            { id: 'A', text: '' },
            { id: 'B', text: '' },
            { id: 'C', text: '' },
            { id: 'D', text: '' },
            { id: 'E', text: '' }
          ],
    correctAnswers: Array.isArray(question.correctAnswers) ? question.correctAnswers : [],
    numberOfAnswers: question.numberOfAnswers || question.correctCount || 2,
    correctCount: question.correctCount || question.numberOfAnswers || 2
  })

  const handleUpdate = (updates) => {
    const updated = { ...formData, ...updates }
    // Sync both numberOfAnswers and correctCount
    if (updates.numberOfAnswers !== undefined) {
      updated.correctCount = updates.numberOfAnswers
    }
    
    // DEBUG: Log what we're saving
    console.log('=== SAVING QUESTION DATA ===')
    console.log('correctAnswers:', updated.correctAnswers)
    console.log('numberOfAnswers:', updated.numberOfAnswers)
    console.log('correctCount:', updated.correctCount)
    console.log('Full updated data:', JSON.stringify(updated, null, 2))
    console.log('===========================')
    
    setFormData(updated)
    onUpdate(updated)
  }

  const addOption = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const usedLetters = formData.options.map(o => o.id)
    const nextLetter = letters.split('').find(l => !usedLetters.includes(l))
    
    if (nextLetter) {
      handleUpdate({
        options: [...formData.options, { id: nextLetter, text: '' }]
      })
    }
  }

  const removeOption = (id) => {
    handleUpdate({
      options: formData.options.filter(o => o.id !== id),
      correctAnswers: formData.correctAnswers.filter(a => a !== id)
    })
  }

  const updateOption = (id, text) => {
    const updated = formData.options.map(o =>
      o.id === id ? { ...o, text } : o
    )
    handleUpdate({ options: updated })
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg p-4">
        <h4 className="text-blue-300 font-semibold mb-2">Multiple Choice (Multiple Answers)</h4>
        <p className="text-sm text-gray-600">
          Students select multiple correct answers from a list of options (e.g., choose TWO from five options).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">
            Question Numbers
          </label>
          <input
            type="text"
            value={formData.questionNumbers || ''}
            onChange={(e) => handleUpdate({ questionNumbers: e.target.value })}
            className="w-full px-4 py-2 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 19-20 or 18-19"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">
            Number of Correct Answers
          </label>
          <select
            value={formData.numberOfAnswers}
            onChange={(e) => handleUpdate({ 
              numberOfAnswers: parseInt(e.target.value),
              correctAnswers: formData.correctAnswers.slice(0, parseInt(e.target.value))
            })}
            className="w-full px-4 py-2 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="2">TWO answers</option>
            <option value="3">THREE answers</option>
            <option value="4">FOUR answers</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-2">
          Question Prompt
        </label>
        <textarea
          value={formData.text}
          onChange={(e) => handleUpdate({ text: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows="3"
          placeholder="e.g., Which TWO options describe what the writer is doing?"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-semibold text-gray-600">
            Options
          </label>
          <button
            onClick={addOption}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-gray-900 rounded-lg text-sm flex items-center gap-1"
            disabled={formData.options.length >= 26}
          >
            <Plus className="w-4 h-4" />
            Add Option
          </button>
        </div>
        <div className="space-y-2">
          {formData.options.map((option) => (
            <div key={option.id} className="flex gap-2 items-center">
              <input
                type="checkbox"
                checked={formData.correctAnswers?.includes(option.id) || false}
                onChange={(e) => {
                  let newCorrectAnswers
                  if (e.target.checked) {
                    // Only add if we haven't reached the limit
                    if ((formData.correctAnswers || []).length < formData.numberOfAnswers) {
                      newCorrectAnswers = [...(formData.correctAnswers || []), option.id]
                      handleUpdate({ correctAnswers: newCorrectAnswers })
                    } else {
                      // Alert user they've reached the limit
                      alert(`You can only select ${formData.numberOfAnswers} correct answers. Uncheck one first.`)
                      e.preventDefault()
                      return
                    }
                  } else {
                    newCorrectAnswers = (formData.correctAnswers || []).filter(id => id !== option.id)
                    handleUpdate({ correctAnswers: newCorrectAnswers })
                  }
                }}
                className="w-5 h-5 text-blue-600 bg-gray-50 border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-blue-600 font-mono font-bold text-sm pt-2 min-w-[30px]">
                {option.id}
              </span>
              <input
                type="text"
                value={option.text}
                onChange={(e) => updateOption(option.id, e.target.value)}
                className="flex-1 px-4 py-2 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={`Option ${option.id}`}
              />
              {formData.options.length > 2 && (
                <button
                  onClick={() => removeOption(option.id)}
                  className="p-2 text-red-400 hover:bg-red-900 hover:bg-opacity-30 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Check the boxes to mark correct answers ({formData.correctAnswers.length}/{formData.numberOfAnswers} selected)
        </p>
      </div>
    </div>
  )
}