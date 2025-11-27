'use client'

import { useState } from 'react'
import AlternativeAnswersField from '../AlternativeAnswersField'

export default function SummaryCompletionEditor({ question, onUpdate }) {
  const [formData, setFormData] = useState({
    title: question.title || '',
    summaryText: question.summaryText || '',
    wordLimit: question.wordLimit || 'ONE WORD ONLY',
    correctAnswers: question.correctAnswers || {},
  })

  const handleUpdate = (updates) => {
    const updated = { ...formData, ...updates }
    setFormData(updated)
    onUpdate(updated)
  }

  const extractGapNumbers = (text) => {
    const matches = text.match(/___(\d+)___/g)
    return matches ? matches.map(m => parseInt(m.match(/\d+/)[0])).sort((a, b) => a - b) : []
  }

  const updateCorrectAnswer = (gapNum, answer) => {
    handleUpdate({
      correctAnswers: {
        ...formData.correctAnswers,
        [gapNum]: answer
      }
    })
  }

  const allGaps = extractGapNumbers(formData.summaryText)

  const insertGapAtCursor = () => {
    const textarea = document.getElementById('summary-text-area-type')
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = formData.summaryText
    
    const nextGapNum = allGaps.length > 0 ? Math.max(...allGaps) + 1 : 1
    const gapText = `___${nextGapNum}___`
    
    const newText = text.substring(0, start) + gapText + text.substring(end)
    handleUpdate({ summaryText: newText })
    
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + gapText.length, start + gapText.length)
    }, 0)
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg p-4">
        <h4 className="text-blue-300 font-semibold mb-2">Summary Completion</h4>
        <p className="text-sm text-gray-600">
          Students type words from the passage to complete gaps in a summary. Use ___1___ format for gaps.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-2">
          Summary Title (Optional)
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleUpdate({ title: e.target.value })}
          className="w-full px-4 py-2 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Physicists' theories on gas molecules"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-2">
          Word Limit Instruction
        </label>
        <input
          type="text"
          value={formData.wordLimit}
          onChange={(e) => handleUpdate({ wordLimit: e.target.value })}
          className="w-full px-4 py-2 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., ONE WORD ONLY, NO MORE THAN TWO WORDS, ONE WORD AND/OR A NUMBER"
        />
        <p className="text-xs text-gray-500 mt-1">
          Common examples: "ONE WORD ONLY", "NO MORE THAN TWO WORDS", "NO MORE THAN THREE WORDS", "ONE WORD AND/OR A NUMBER"
        </p>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-semibold text-gray-600">
            Summary Text (use ___1___ for gaps)
          </label>
          <button
            onClick={insertGapAtCursor}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-gray-900 rounded-lg text-sm"
          >
            Insert Gap
          </button>
        </div>
        <textarea
          id="summary-text-area-type"
          value={formData.summaryText}
          onChange={(e) => handleUpdate({ summaryText: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-gray-200 font-mono"
          rows="8"
          placeholder="Write your summary text here. Use ___1___ for the first gap, ___2___ for the second, etc."
        />
        <p className="text-xs text-gray-500 mt-1">
          Tip: Place cursor where you want a gap and click "Insert Gap" button
        </p>
      </div>

      {allGaps.length > 0 && (
  <div>
    <label className="block text-sm font-semibold text-gray-600 mb-3">
      Correct Answers ({allGaps.length} gaps found)
    </label>
    <div className="space-y-4">
      {allGaps.map(gapNum => (
        <div key={gapNum} className="border border-gray-700 rounded-lg p-3 bg-gray-50">
          <div className="flex gap-2 items-start">
            <span className="text-blue-600 font-mono text-sm font-bold min-w-[50px] mt-2">
              Gap {gapNum}:
            </span>
            <div className="flex-1">
              <AlternativeAnswersField
                answers={
                  Array.isArray(formData.correctAnswers[gapNum]) 
                    ? formData.correctAnswers[gapNum]
                    : formData.correctAnswers[gapNum] 
                      ? [formData.correctAnswers[gapNum]]
                      : []
                }
                onChange={(answers) => {
                  handleUpdate({
                    correctAnswers: {
                      ...formData.correctAnswers,
                      [gapNum]: answers
                    }
                  })
                }}
                compact={true}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
    </div>
  )
}