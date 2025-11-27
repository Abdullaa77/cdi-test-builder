'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

export default function MCQTableEditor({ question, onUpdate }) {
  const [formData, setFormData] = useState({
    optionsLegend: question.optionsLegend || [
      { id: 'A', text: '' },
      { id: 'B', text: '' },
      { id: 'C', text: '' }
    ],
    questions: question.questions || [
      { number: 1, text: '', correctAnswer: '' }
    ],
  })

  const handleUpdate = (updates) => {
    const updated = { ...formData, ...updates }
    setFormData(updated)
    onUpdate(updated)
  }

  const addLegendOption = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const usedLetters = formData.optionsLegend.map(o => o.id)
    const nextLetter = letters.split('').find(l => !usedLetters.includes(l))
    
    if (nextLetter) {
      handleUpdate({
        optionsLegend: [...formData.optionsLegend, { id: nextLetter, text: '' }]
      })
    }
  }

  const removeLegendOption = (id) => {
    handleUpdate({
      optionsLegend: formData.optionsLegend.filter(o => o.id !== id),
      questions: formData.questions.map(q => ({
        ...q,
        correctAnswer: q.correctAnswer === id ? '' : q.correctAnswer
      }))
    })
  }

  const updateLegendOption = (id, text) => {
    const updated = formData.optionsLegend.map(o =>
      o.id === id ? { ...o, text } : o
    )
    handleUpdate({ optionsLegend: updated })
  }

  const addQuestion = () => {
    const newNumber = formData.questions.length > 0 
      ? Math.max(...formData.questions.map(q => q.number)) + 1 
      : 1
    handleUpdate({
      questions: [...formData.questions, { number: newNumber, text: '', correctAnswer: '' }]
    })
  }

  const removeQuestion = (number) => {
    handleUpdate({
      questions: formData.questions.filter(q => q.number !== number)
    })
  }

  const updateQuestion = (number, field, value) => {
    const updated = formData.questions.map(q =>
      q.number === number ? { ...q, [field]: value } : q
    )
    handleUpdate({ questions: updated })
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg p-4">
        <h4 className="text-blue-300 font-semibold mb-2">MCQ Table Format</h4>
        <p className="text-sm text-gray-600">
          Table with questions in rows and answer options in columns. Students select one option per row.
        </p>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-semibold text-gray-600">
            Options Legend (what A, B, C mean)
          </label>
          <button
            onClick={addLegendOption}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-gray-900 rounded-lg text-sm flex items-center gap-1"
            disabled={formData.optionsLegend.length >= 26}
          >
            <Plus className="w-4 h-4" />
            Add Option
          </button>
        </div>
        <div className="space-y-2">
          {formData.optionsLegend.map((option) => (
            <div key={option.id} className="flex gap-2">
              <span className="text-blue-600 font-mono font-bold text-sm pt-2 min-w-[30px]">
                {option.id}
              </span>
              <input
                type="text"
                value={option.text}
                onChange={(e) => updateLegendOption(option.id, e.target.value)}
                className="flex-1 px-4 py-2 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={`What ${option.id} means (e.g., "really enjoys")`}
              />
              {formData.optionsLegend.length > 2 && (
                <button
                  onClick={() => removeLegendOption(option.id)}
                  className="p-2 text-red-400 hover:bg-red-900 hover:bg-opacity-30 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-semibold text-gray-600">
            Questions (Table Rows)
          </label>
          <button
            onClick={addQuestion}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-gray-900 rounded-lg text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        </div>
        <div className="space-y-3">
          {formData.questions.map((q) => (
            <div key={q.number} className="border-2 border-gray-700 rounded-lg p-3 bg-gray-50">
              <div className="flex gap-2 items-start">
                <span className="text-blue-600 font-mono font-bold text-sm pt-2 min-w-[40px]">
                  Q{q.number}
                </span>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={q.text}
                    onChange={(e) => updateQuestion(q.number, 'text', e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-600 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Question text (e.g., 'correspondence')"
                  />
                  <select
                    value={q.correctAnswer}
                    onChange={(e) => updateQuestion(q.number, 'correctAnswer', e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-600 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select correct answer</option>
                    {formData.optionsLegend.map(opt => (
                      <option key={opt.id} value={opt.id}>
                        {opt.id} - {opt.text || '(not set)'}
                      </option>
                    ))}
                  </select>
                </div>
                {formData.questions.length > 1 && (
                  <button
                    onClick={() => removeQuestion(q.number)}
                    className="p-2 text-red-400 hover:bg-red-900 hover:bg-opacity-30 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}