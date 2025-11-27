'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

export default function MatchingQuestionEditor({ question, onUpdate }) {
  const [formData, setFormData] = useState({
    instruction: question.instruction || 'Which option matches each description?',
    subInstruction: question.subInstruction || 'Choose your answers from the box and write the correct letter next to the questions.',
    categories: question.categories || [{ id: 1, text: '' }],
    options: question.options || [
      { id: 'A', text: '' },
      { id: 'B', text: '' },
    ],
    correctAnswers: question.correctAnswers || {},
  })
  
  console.log('MatchingQuestionEditor - question:', question)
  console.log('MatchingQuestionEditor - formData:', formData)
  console.log('MatchingQuestionEditor - formData.options:', formData.options)
  
  const handleUpdate = (updates) => {
    const updated = { ...formData, ...updates }
    setFormData(updated)
    onUpdate(updated)
  }

  const addCategory = () => {
    const newId = Math.max(...formData.categories.map(c => c.id), 0) + 1
    handleUpdate({
      categories: [...formData.categories, { id: newId, text: '' }]
    })
  }

  const removeCategory = (id) => {
    const updated = formData.categories.filter(c => c.id !== id)
    const newCorrectAnswers = { ...formData.correctAnswers }
    delete newCorrectAnswers[id]
    handleUpdate({
      categories: updated,
      correctAnswers: newCorrectAnswers
    })
  }

  const updateCategory = (id, text) => {
    const updated = formData.categories.map(c =>
      c.id === id ? { ...c, text } : c
    )
    handleUpdate({ categories: updated })
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
      options: formData.options.filter(o => o.id !== id)
    })
  }

  const updateOption = (id, text) => {
    const updated = formData.options.map(o =>
      o.id === id ? { ...o, text } : o
    )
    handleUpdate({ options: updated })
  }

  const updateCorrectAnswer = (categoryId, optionId) => {
    handleUpdate({
      correctAnswers: {
        ...formData.correctAnswers,
        [categoryId]: optionId
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg p-4">
        <h4 className="text-blue-300 font-semibold mb-2">Matching Question Format</h4>
        <p className="text-sm text-gray-600">
          Students will see options in a box and write the correct letter (A, B, C...) next to each question.
        </p>
      </div>

      {/* Instructions */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-2">
          Main Instruction
        </label>
        <input
          type="text"
          value={formData.instruction}
          onChange={(e) => handleUpdate({ instruction: e.target.value })}
          className="w-full px-4 py-2 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Which hotel matches each description?"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-2">
          Sub Instruction (Optional)
        </label>
        <input
          type="text"
          value={formData.subInstruction}
          onChange={(e) => handleUpdate({ subInstruction: e.target.value })}
          className="w-full px-4 py-2 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Choose your answers from the box..."
        />
      </div>

      {/* Options Box */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-semibold text-gray-600">
            Options (Will appear in box - A, B, C...)
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
            <div key={option.id} className="flex gap-2">
              <span className="text-blue-600 font-mono font-bold text-lg pt-2 min-w-[40px] text-center border-2 border-gray-600 rounded bg-gray-50">
                {option.id}
              </span>
              <input
                type="text"
                value={option.text}
                onChange={(e) => updateOption(option.id, e.target.value)}
                className="flex-1 px-4 py-2 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={`Option ${option.id} (e.g., The Bridge Hotel)`}
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
      </div>

      {/* Questions/Categories */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-semibold text-gray-600">
            Questions (Students write letter A-E here)
          </label>
          <button
            onClick={addCategory}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-gray-900 rounded-lg text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        </div>
        <div className="space-y-2">
          {formData.categories.map((category, idx) => (
            <div key={category.id} className="flex gap-2">
              <span className="text-blue-600 font-mono text-sm pt-2 min-w-[30px]">
                {idx + 1}.
              </span>
              <input
                type="text"
                value={category.text}
                onChange={(e) => updateCategory(category.id, e.target.value)}
                className="flex-1 px-4 py-2 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={`Question ${idx + 1} (e.g., is in a rural area)`}
              />
              <select
                value={formData.correctAnswers[category.id] || ''}
                onChange={(e) => updateCorrectAnswer(category.id, e.target.value)}
                className="px-3 py-2 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 min-w-[100px]"
              >
                <option value="">✓ Answer</option>
                {formData.options.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.id}</option>
                ))}
              </select>
              {formData.categories.length > 1 && (
                <button
                  onClick={() => removeCategory(category.id)}
                  className="p-2 text-red-400 hover:bg-red-900 hover:bg-opacity-30 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}