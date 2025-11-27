'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

export default function MatchingInformationEditor({ question, onUpdate }) {
  const [formData, setFormData] = useState({
    instruction: question.instruction || 'Which paragraph contains the following information?',
    statements: question.statements || [
      { id: 1, text: '', correctParagraph: '' }
    ],
  })

  const handleUpdate = (updates) => {
    const updated = { ...formData, ...updates }
     // Convert statements to correctAnswers format for answer key generation
  if (updated.statements) {
    const correctAnswers = {}
    updated.statements.forEach((statement, index) => {
      correctAnswers[index + 1] = statement.correctParagraph || ''
    })
    updated.correctAnswers = correctAnswers
  }
  
  setFormData(updated)
  onUpdate(updated)
}

  const addStatement = () => {
    const newId = Math.max(...formData.statements.map(s => s.id), 0) + 1
    handleUpdate({
      statements: [...formData.statements, { id: newId, text: '', correctParagraph: '' }]
    })
  }

  const removeStatement = (id) => {
    if (formData.statements.length > 1) {
      handleUpdate({
        statements: formData.statements.filter(s => s.id !== id)
      })
    }
  }

  const updateStatement = (id, field, value) => {
    handleUpdate({
      statements: formData.statements.map(s =>
        s.id === id ? { ...s, [field]: value } : s
      )
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg p-4">
        <h4 className="text-blue-300 font-semibold mb-2">Matching Information to Paragraphs</h4>
        <p className="text-sm text-gray-600">
          Create statements that students match to paragraph letters (A-H). Multiple statements can map to the same paragraph.
        </p>
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
          placeholder="e.g., Which paragraph contains the following information?"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-semibold text-gray-600">
            Information Statements
          </label>
          <button
            onClick={addStatement}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-gray-900 rounded-lg text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Statement
          </button>
        </div>

        <div className="space-y-3">
          {formData.statements.map((statement, index) => (
            <div key={statement.id} className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-8 h-10 flex items-center justify-center">
                <span className="text-blue-600 font-bold text-lg">{index + 1}.</span>
              </div>
              
              <textarea
                value={statement.text}
                onChange={(e) => updateStatement(statement.id, 'text', e.target.value)}
                className="flex-1 px-4 py-2 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="2"
                placeholder="Enter the information statement..."
              />

              <input
                type="text"
                value={statement.correctParagraph}
                onChange={(e) => updateStatement(statement.id, 'correctParagraph', e.target.value.toUpperCase())}
                className="w-16 px-3 py-2 border-2 border-gray-200 bg-white text-blue-600 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-blue-500"
                placeholder="A"
                maxLength="1"
              />

              {formData.statements.length > 1 && (
                <button
                  onClick={() => removeStatement(statement.id)}
                  className="p-2 text-red-400 hover:bg-red-900 hover:bg-opacity-30 rounded-lg transition-colors flex-shrink-0"
                  title="Remove statement"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-700 rounded-lg p-4">
        <h5 className="text-sm font-semibold text-gray-600 mb-2">Preview</h5>
        <p className="text-xs text-gray-500 mb-3">{formData.instruction}</p>
        <div className="space-y-2">
          {formData.statements.map((statement, index) => (
            <div key={statement.id} className="flex gap-2 text-sm">
              <span className="text-blue-600 font-bold">{index + 1}.</span>
              <span className="text-gray-600 flex-1">{statement.text || '(empty)'}</span>
              <span className="text-blue-600 font-bold">→ {statement.correctParagraph || '?'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}