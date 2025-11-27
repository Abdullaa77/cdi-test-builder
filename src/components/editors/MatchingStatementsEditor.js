'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

export default function MatchingStatementsEditor({ question, onUpdate }) {
  const [formData, setFormData] = useState({
    instructions: question.instructions || 'Match each statement with the correct person, A-F',
    listTitle: question.listTitle || 'List of People',
    people: question.people || [
      { id: 'A', name: '' },
      { id: 'B', name: '' },
      { id: 'C', name: '' }
    ],
    statements: question.statements || [
      { number: 1, text: '', correctAnswer: '' }
    ],
  })

  const handleUpdate = (updates) => {
    const updated = { ...formData, ...updates }
    setFormData(updated)
    onUpdate(updated)
  }

  const addPerson = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const usedLetters = formData.people.map(p => p.id)
    const nextLetter = letters.split('').find(l => !usedLetters.includes(l))
    
    if (nextLetter) {
      handleUpdate({
        people: [...formData.people, { id: nextLetter, name: '' }]
      })
    }
  }

  const removePerson = (id) => {
    if (formData.people.length <= 2) return
    handleUpdate({
      people: formData.people.filter(p => p.id !== id),
      statements: formData.statements.map(s => ({
        ...s,
        correctAnswer: s.correctAnswer === id ? '' : s.correctAnswer
      }))
    })
  }

  const updatePerson = (id, name) => {
    const updated = formData.people.map(p =>
      p.id === id ? { ...p, name } : p
    )
    handleUpdate({ people: updated })
  }

  const addStatement = () => {
    const newNumber = formData.statements.length > 0 
      ? Math.max(...formData.statements.map(s => s.number)) + 1 
      : 1
    handleUpdate({
      statements: [...formData.statements, { number: newNumber, text: '', correctAnswer: '' }]
    })
  }

  const removeStatement = (number) => {
    if (formData.statements.length <= 1) return
    handleUpdate({
      statements: formData.statements.filter(s => s.number !== number)
    })
  }

  const updateStatement = (number, field, value) => {
    const updated = formData.statements.map(s =>
      s.number === number ? { ...s, [field]: value } : s
    )
    handleUpdate({ statements: updated })
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg p-4">
        <h4 className="text-blue-300 font-semibold mb-2">Matching Statements to People/Categories</h4>
        <p className="text-sm text-gray-600">
          Students match statements to people/categories listed above. Common in Reading passages with multiple experts or sources.
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
          placeholder="e.g., Match each statement with the correct person, A-F"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-2">
          List Title
        </label>
        <input
          type="text"
          value={formData.listTitle}
          onChange={(e) => handleUpdate({ listTitle: e.target.value })}
          className="w-full px-4 py-2 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., List of People, List of Researchers, etc."
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-semibold text-gray-600">
            People/Categories (A-Z)
          </label>
          <button
            onClick={addPerson}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-gray-900 rounded-lg text-sm flex items-center gap-1"
            disabled={formData.people.length >= 26}
          >
            <Plus className="w-4 h-4" />
            Add Person
          </button>
        </div>
        <div className="space-y-2">
          {formData.people.map((person) => (
            <div key={person.id} className="flex gap-2">
              <span className="text-blue-600 font-mono font-bold text-lg pt-1 min-w-[40px]">
                {person.id}
              </span>
              <input
                type="text"
                value={person.name}
                onChange={(e) => updatePerson(person.id, e.target.value)}
                className="flex-1 px-4 py-2 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={`Person ${person.id} name`}
              />
              {formData.people.length > 2 && (
                <button
                  onClick={() => removePerson(person.id)}
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
            Statements to Match
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
          {formData.statements.map((statement) => (
            <div key={statement.number} className="border-2 border-gray-700 rounded-lg p-4 bg-gray-50">
              <div className="flex gap-3 items-start">
                <span className="text-blue-600 font-mono font-bold text-lg pt-2 min-w-[40px]">
                  {statement.number}
                </span>
                <div className="flex-1 space-y-3">
                  <textarea
                    value={statement.text}
                    onChange={(e) => updateStatement(statement.number, 'text', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-600 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    placeholder="Statement text"
                  />
                  <div className="flex gap-2 items-center">
                    <label className="text-sm text-gray-600 min-w-[120px]">Correct Answer:</label>
                    <select
                      value={statement.correctAnswer}
                      onChange={(e) => updateStatement(statement.number, 'correctAnswer', e.target.value)}
                      className="flex-1 px-4 py-2 border-2 border-gray-600 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select person</option>
                      {formData.people.map(person => (
                        <option key={person.id} value={person.id}>
                          {person.id} - {person.name || '(not set)'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {formData.statements.length > 1 && (
                  <button
                    onClick={() => removeStatement(statement.number)}
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

      <div className="bg-gray-50 border border-gray-700 rounded-lg p-4">
        <h5 className="text-sm font-semibold text-gray-600 mb-2">Preview Format:</h5>
        <p className="text-xs text-gray-500">
          Students will see a table with statements on the left and columns A-F on the right where they select the correct person for each statement.
        </p>
      </div>
    </div>
  )
}