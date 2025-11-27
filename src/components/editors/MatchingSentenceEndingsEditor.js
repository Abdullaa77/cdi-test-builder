'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

export default function MatchingSentenceEndingsEditor({ question, onUpdate }) {
  const [formData, setFormData] = useState({
    instructions: question.instructions || 'Complete each sentence with the correct ending, A-H.',
    sentenceBeginnings: question.sentenceBeginnings || [
      { id: 1, text: '' }
    ],
    sentenceEndings: question.sentenceEndings || [
      { id: 'A', text: '' },
      { id: 'B', text: '' },
      { id: 'C', text: '' }
    ],
    correctAnswers: question.correctAnswers || {},
  })

  const handleUpdate = (updates) => {
  const updated = { ...formData, ...updates }
  
  // Convert correctAnswers to match what template expects
  // Add correctAnswer directly to each beginning
  if (updated.sentenceBeginnings && updated.correctAnswers) {
    updated.sentenceBeginnings = updated.sentenceBeginnings.map(beginning => ({
      ...beginning,
      correctAnswer: updated.correctAnswers[beginning.id] || ''
    }))
  }
  
  setFormData(updated)
  onUpdate(updated)
}

  const addBeginning = () => {
    const newId = Math.max(...formData.sentenceBeginnings.map(s => s.id), 0) + 1
    handleUpdate({
      sentenceBeginnings: [...formData.sentenceBeginnings, { id: newId, text: '' }]
    })
  }

  const removeBeginning = (id) => {
    if (formData.sentenceBeginnings.length <= 1) return
    const newCorrectAnswers = { ...formData.correctAnswers }
    delete newCorrectAnswers[id]
    handleUpdate({
      sentenceBeginnings: formData.sentenceBeginnings.filter(s => s.id !== id),
      correctAnswers: newCorrectAnswers
    })
  }

  const updateBeginning = (id, text) => {
    const updated = formData.sentenceBeginnings.map(s =>
      s.id === id ? { ...s, text } : s
    )
    handleUpdate({ sentenceBeginnings: updated })
  }

  const addEnding = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const usedLetters = formData.sentenceEndings.map(e => e.id)
    const nextLetter = letters.split('').find(l => !usedLetters.includes(l))
    
    if (nextLetter) {
      handleUpdate({
        sentenceEndings: [...formData.sentenceEndings, { id: nextLetter, text: '' }]
      })
    }
  }

  const removeEnding = (id) => {
    if (formData.sentenceEndings.length <= 2) return
    handleUpdate({
      sentenceEndings: formData.sentenceEndings.filter(e => e.id !== id),
      correctAnswers: Object.fromEntries(
        Object.entries(formData.correctAnswers).filter(([_, v]) => v !== id)
      )
    })
  }

  const updateEnding = (id, text) => {
    const updated = formData.sentenceEndings.map(e =>
      e.id === id ? { ...e, text } : e
    )
    handleUpdate({ sentenceEndings: updated })
  }

  const updateCorrectAnswer = (beginningId, endingId) => {
    handleUpdate({
      correctAnswers: {
        ...formData.correctAnswers,
        [beginningId]: endingId
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg p-4">
        <h4 className="text-blue-300 font-semibold mb-2">Matching Sentence Endings</h4>
        <p className="text-sm text-gray-600">
          Students drag sentence endings (A-H) to complete sentence beginnings (1-5). Usually more endings than beginnings.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-2">
          Instructions
        </label>
        <textarea
          value={formData.instructions}
          onChange={(e) => handleUpdate({ instructions: e.target.value })}
          className="w-full px-4 py-2 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows="2"
          placeholder="e.g., Complete each sentence with the correct ending, A-H."
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-semibold text-gray-600">
            Sentence Beginnings (1, 2, 3...)
          </label>
          <button
            onClick={addBeginning}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-gray-900 rounded-lg text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Beginning
          </button>
        </div>
        <div className="space-y-3">
          {formData.sentenceBeginnings.map((beginning) => (
            <div key={beginning.id} className="border-2 border-gray-700 rounded-lg p-4 bg-gray-50">
              <div className="flex gap-3 items-start">
                <span className="text-blue-600 font-mono font-bold text-lg pt-2 min-w-[40px]">
                  {beginning.id}.
                </span>
                <div className="flex-1 space-y-3">
                  <textarea
                    value={beginning.text}
                    onChange={(e) => updateBeginning(beginning.id, e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-600 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    placeholder="Sentence beginning (e.g., 'The research shows that...')"
                  />
                  <div className="flex gap-2 items-center">
                    <label className="text-sm text-gray-600 min-w-[120px]">Correct Ending:</label>
                    <select
                      value={formData.correctAnswers[beginning.id] || ''}
                      onChange={(e) => updateCorrectAnswer(beginning.id, e.target.value)}
                      className="flex-1 px-4 py-2 border-2 border-gray-600 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select ending</option>
                      {formData.sentenceEndings.map(ending => (
                        <option key={ending.id} value={ending.id}>
                          {ending.id} - {ending.text.substring(0, 50) || '(not set)'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {formData.sentenceBeginnings.length > 1 && (
                  <button
                    onClick={() => removeBeginning(beginning.id)}
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

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-semibold text-gray-600">
            Sentence Endings (A, B, C...)
          </label>
          <button
            onClick={addEnding}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-gray-900 rounded-lg text-sm flex items-center gap-1"
            disabled={formData.sentenceEndings.length >= 26}
          >
            <Plus className="w-4 h-4" />
            Add Ending
          </button>
        </div>
        <div className="space-y-2">
          {formData.sentenceEndings.map((ending) => (
            <div key={ending.id} className="flex gap-2">
              <span className="text-blue-600 font-mono font-bold text-lg pt-2 min-w-[40px]">
                {ending.id}
              </span>
              <textarea
                value={ending.text}
                onChange={(e) => updateEnding(ending.id, e.target.value)}
                className="flex-1 px-4 py-3 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="2"
                placeholder={`Ending ${ending.id} (e.g., '...has significant implications.')`}
              />
              {formData.sentenceEndings.length > 2 && (
                <button
                  onClick={() => removeEnding(ending.id)}
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
        <h5 className="text-sm font-semibold text-gray-600 mb-2">Format:</h5>
        <p className="text-xs text-gray-500 mb-2">
          Students will see incomplete sentences (1-{formData.sentenceBeginnings.length}) with drop zones next to them.
        </p>
        <p className="text-xs text-gray-500">
          Below, they'll see draggable endings (A-{formData.sentenceEndings[formData.sentenceEndings.length - 1]?.id}) to complete the sentences.
        </p>
      </div>
    </div>
  )
}