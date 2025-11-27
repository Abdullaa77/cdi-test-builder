'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import AlternativeAnswersInput from '../AlternativeAnswersField'
export default function ShortAnswerEditor({ question, onUpdate }) {
  const [formData, setFormData] = useState({
    instruction: question.instruction || 'Answer the questions below.',
    wordLimit: question.wordLimit || 3,
    questions: question.questions || [
      { id: 1, text: '', correctAnswer: '', alternativeAnswers: '' }
    ],
  })

  const handleUpdate = (updates) => {
    const updated = { ...formData, ...updates }
    setFormData(updated)
    onUpdate(updated)
  }

  const addQuestion = () => {
    const newId = Math.max(...formData.questions.map(q => q.id), 0) + 1
    handleUpdate({
      questions: [...formData.questions, { id: newId, text: '', correctAnswer: '', alternativeAnswers: '' }]
    })
  }

  const removeQuestion = (id) => {
    if (formData.questions.length > 1) {
      handleUpdate({
        questions: formData.questions.filter(q => q.id !== id)
      })
    }
  }

  const updateQuestion = (id, field, value) => {
    handleUpdate({
      questions: formData.questions.map(q =>
        q.id === id ? { ...q, [field]: value } : q
      )
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg p-4">
        <h4 className="text-blue-300 font-semibold mb-2">Short Answer Questions</h4>
        <p className="text-sm text-gray-600">
          Create questions where students type short answers. Set word limit and accept alternative correct answers.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">
            Instruction Text
          </label>
          <input
            type="text"
            value={formData.instruction}
            onChange={(e) => handleUpdate({ instruction: e.target.value })}
            className="w-full px-4 py-2 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Answer the questions below"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">
            Word Limit
          </label>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">NO MORE THAN</span>
            <input
              type="number"
              value={formData.wordLimit}
              onChange={(e) => handleUpdate({ wordLimit: parseInt(e.target.value) || 1 })}
              className="w-20 px-3 py-2 border-2 border-gray-200 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 text-center font-bold"
              min="1"
              max="10"
            />
            <span className="text-gray-500 text-sm">WORD(S)</span>
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-semibold text-gray-600">
            Questions
          </label>
          <button
            onClick={addQuestion}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-gray-900 rounded-lg text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        </div>

        <div className="space-y-4">
          {formData.questions.map((q, index) => (
            <div key={q.id} className="border-2 border-gray-700 rounded-lg p-4 bg-gray-50">
              <div className="flex gap-3 items-start mb-3">
                <span className="text-blue-600 font-bold text-lg flex-shrink-0 mt-2">{index + 1}.</span>
                
                <textarea
                  value={q.text}
                  onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                  className="flex-1 px-4 py-2 border-2 border-gray-600 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="Enter the question..."
                />

                {formData.questions.length > 1 && (
                  <button
                    onClick={() => removeQuestion(q.id)}
                    className="p-2 text-red-400 hover:bg-red-900 hover:bg-opacity-30 rounded-lg transition-colors flex-shrink-0"
                    title="Remove question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pl-8">
                <div>
  <label className="block text-xs font-semibold text-gray-500 mb-1">
    Correct Answer(s)
  </label>
  <AlternativeAnswersInput
    answers={q.correctAnswers || (q.correctAnswer ? [q.correctAnswer] : [])}
    onChange={(answers) => {
      const updated = formData.questions.map(item =>
        item.id === q.id
          ? { ...item, correctAnswers: answers, correctAnswer: answers[0] || '' }
          : item
      )
      handleUpdate({ questions: updated })
    }}
    compact={true}
  />
</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-700 rounded-lg p-4">
        <h5 className="text-sm font-semibold text-gray-600 mb-2">Preview</h5>
        <p className="text-xs text-gray-500 mb-1">{formData.instruction}</p>
        <p className="text-xs font-bold text-blue-600 mb-4">
          NO MORE THAN {formData.wordLimit} WORD{formData.wordLimit > 1 ? 'S' : ''}
        </p>
        <div className="space-y-3">
          {formData.questions.map((q, index) => (
            <div key={q.id}>
              <p className="text-sm text-gray-600 mb-1">
                <span className="text-blue-600 font-bold">{index + 1}.</span> {q.text || '(empty question)'}
              </p>
              <div className="pl-6">
                <div className="w-full h-8 border-b-2 border-gray-600 bg-white"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}