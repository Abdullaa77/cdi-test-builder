'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import AlternativeAnswersInput from '../AlternativeAnswersField'
export default function SentenceCompletionEditor({ question, onUpdate }) {
  const [formData, setFormData] = useState({
    instruction: question.instruction || 'Complete the sentences.',
    wordLimit: question.wordLimit || 1,
    wordLimitText: question.wordLimitText || 'ONE WORD ONLY',
    sentences: question.sentences || [
      { id: 1, prefix: '', suffix: '', correctAnswer: '', alternativeAnswers: '' }
    ],
  })

  const handleUpdate = (updates) => {
    const updated = { ...formData, ...updates }
    setFormData(updated)
    onUpdate(updated)
  }

  const addSentence = () => {
    const newId = Math.max(...formData.sentences.map(s => s.id), 0) + 1
    handleUpdate({
      sentences: [...formData.sentences, { id: newId, prefix: '', suffix: '', correctAnswer: '', alternativeAnswers: '' }]
    })
  }

  const removeSentence = (id) => {
    if (formData.sentences.length > 1) {
      handleUpdate({
        sentences: formData.sentences.filter(s => s.id !== id)
      })
    }
  }

  const updateSentence = (id, field, value) => {
    handleUpdate({
      sentences: formData.sentences.map(s =>
        s.id === id ? { ...s, [field]: value } : s
      )
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg p-4">
        <h4 className="text-blue-300 font-semibold mb-2">Sentence Completion</h4>
        <p className="text-sm text-gray-600">
          Create sentences with gaps that students complete with words from the passage. The gap appears inline within the sentence.
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
            placeholder="e.g., Complete the sentences"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">
            Word Limit Instruction
          </label>
          <input
            type="text"
            value={formData.wordLimitText}
            onChange={(e) => handleUpdate({ wordLimitText: e.target.value })}
            className="w-full px-4 py-2 border-2 border-gray-200 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., ONE WORD ONLY"
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-semibold text-gray-600">
            Sentences
          </label>
          <button
            onClick={addSentence}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-gray-900 rounded-lg text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Sentence
          </button>
        </div>

        <div className="space-y-4">
          {formData.sentences.map((sentence, index) => (
            <div key={sentence.id} className="border-2 border-gray-700 rounded-lg p-4 bg-gray-50">
              <div className="flex gap-2 items-start mb-3">
                <span className="text-blue-600 font-bold text-lg flex-shrink-0 mt-2">{index + 1}.</span>
                
                <div className="flex-1 space-y-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Text before gap
                    </label>
                    <textarea
                      value={sentence.prefix}
                      onChange={(e) => updateSentence(sentence.id, 'prefix', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-600 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows="2"
                      placeholder="e.g., Huxley formulated his theory while studying a dinosaur belonging to a group called"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Text after gap
                    </label>
                    <textarea
                      value={sentence.suffix}
                      onChange={(e) => updateSentence(sentence.id, 'suffix', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-600 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows="2"
                      placeholder="e.g., . (optional - can be left empty if sentence ends with gap)"
                    />
                  </div>
                </div>

                {formData.sentences.length > 1 && (
                  <button
                    onClick={() => removeSentence(sentence.id)}
                    className="p-2 text-red-400 hover:bg-red-900 hover:bg-opacity-30 rounded-lg transition-colors flex-shrink-0"
                    title="Remove sentence"
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
    answers={sentence.correctAnswers || (sentence.correctAnswer ? [sentence.correctAnswer] : [])}
    onChange={(answers) => {
      const updated = formData.sentences.map(item =>
        item.id === sentence.id
          ? { ...item, correctAnswers: answers, correctAnswer: answers[0] || '' }
          : item
      )
      handleUpdate({ sentences: updated })
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
          Write <strong>{formData.wordLimitText}</strong> from the text for each answer.
        </p>
        <div className="space-y-3">
          {formData.sentences.map((sentence, index) => (
            <div key={sentence.id} className="flex gap-2 text-sm">
              <span className="text-blue-600 font-bold flex-shrink-0">{index + 1}.</span>
              <p className="text-gray-600">
                {sentence.prefix || '(text before gap)'}
                <span className="inline-block mx-1 px-3 py-1 border-b-2 border-gray-200 bg-white text-blue-600 font-mono">
                  {index + 1}
                </span>
                {sentence.suffix}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}