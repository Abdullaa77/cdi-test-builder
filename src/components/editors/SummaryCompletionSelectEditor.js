'use client'

import { useState } from 'react'

export default function SummaryCompletionSelectEditor({ question, onUpdate }) {
  const [formData, setFormData] = useState({
    title: question.title || '',
    instruction: question.instruction || 'Complete the summary using the list of words below.',
    summaryText: question.summaryText || '',
    wordBank: question.wordBank || [],
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

  const insertGapAtCursor = () => {
    const textarea = document.getElementById('summary-text-area-select')
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = formData.summaryText
    
    const allGaps = extractGapNumbers(text)
    const nextGapNum = allGaps.length > 0 ? Math.max(...allGaps) + 1 : 1
    const gapText = `___${nextGapNum}___`
    
    const newText = text.substring(0, start) + gapText + text.substring(end)
    handleUpdate({ summaryText: newText })
    
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + gapText.length, start + gapText.length)
    }, 0)
  }

  const addWordToBank = () => {
    const nextLetter = String.fromCharCode(65 + formData.wordBank.length) // A, B, C, etc.
    handleUpdate({
      wordBank: [...formData.wordBank, { letter: nextLetter, word: '' }]
    })
  }

  const updateWord = (index, word) => {
    const updated = [...formData.wordBank]
    updated[index] = { ...updated[index], word }
    handleUpdate({ wordBank: updated })
  }

  const removeWord = (index) => {
    const updated = formData.wordBank.filter((_, i) => i !== index)
    // Reassign letters
    const reassigned = updated.map((item, i) => ({
      ...item,
      letter: String.fromCharCode(65 + i)
    }))
    handleUpdate({ wordBank: reassigned })
  }

  const updateCorrectAnswer = (gapNum, letter) => {
    handleUpdate({
      correctAnswers: {
        ...formData.correctAnswers,
        [gapNum]: letter
      }
    })
  }

  const allGaps = extractGapNumbers(formData.summaryText)

  return (
    <div className="space-y-6">
      <div className="bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg p-4">
        <h4 className="text-blue-300 font-semibold mb-2">Summary Completion (Select from Word Bank)</h4>
        <p className="text-sm text-gray-600">
          Students drag words from a word bank to complete gaps in a summary. Use ___1___ format for gaps.
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
          placeholder="e.g., The Importance of Language"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-2">
          Instruction
        </label>
        <input
          type="text"
          value={formData.instruction}
          onChange={(e) => handleUpdate({ instruction: e.target.value })}
          className="w-full px-4 py-2 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Complete the summary using the list of words below."
        />
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
            + Insert Gap
          </button>
        </div>
        <textarea
          id="summary-text-area-select"
          value={formData.summaryText}
          onChange={(e) => handleUpdate({ summaryText: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-gray-200 font-mono"
          rows="8"
          placeholder="Write your summary text here. Use ___1___ for the first gap, ___2___ for the second, etc."
        />
        <p className="text-xs text-gray-500 mt-1">
          💡 Tip: Place cursor where you want a gap and click "Insert Gap" button
        </p>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-semibold text-gray-600">
            Word Bank ({formData.wordBank.length} words)
          </label>
          <button
            onClick={addWordToBank}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-gray-900 rounded-lg text-sm"
          >
            + Add Word
          </button>
        </div>
        <div className="space-y-2">
          {formData.wordBank.map((item, index) => (
            <div key={index} className="flex gap-2 items-center">
              <span className="px-3 py-2 bg-blue-600 text-white font-bold rounded-lg min-w-[45px] text-center">
                {item.letter}
              </span>
              <input
                type="text"
                value={item.word}
                onChange={(e) => updateWord(index, e.target.value)}
                className="flex-1 px-4 py-2 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={`Word ${item.letter}`}
              />
              <button
                onClick={() => removeWord(index)}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-gray-900 rounded-lg"
              >
                🗑️
              </button>
            </div>
          ))}
          {formData.wordBank.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-gray-600 rounded-lg text-gray-500">
              No words in word bank. Click "Add Word" to start.
            </div>
          )}
        </div>
      </div>

      {allGaps.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-3">
            Correct Answers ({allGaps.length} gaps found)
          </label>
          <div className="space-y-3">
            {allGaps.map(gapNum => (
              <div key={gapNum} className="border border-gray-700 rounded-lg p-3 bg-gray-50">
                <div className="flex gap-3 items-center">
                  <span className="text-blue-600 font-mono text-sm font-bold min-w-[60px]">
                    Gap {gapNum}:
                  </span>
                  <select
                    value={formData.correctAnswers[gapNum] || ''}
                    onChange={(e) => updateCorrectAnswer(gapNum, e.target.value)}
                    className="flex-1 px-4 py-2 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select correct answer...</option>
                    {formData.wordBank.map(item => (
                      <option key={item.letter} value={item.letter}>
                        {item.letter} - {item.word || '(empty)'}
                      </option>
                    ))}
                  </select>
                  {formData.correctAnswers[gapNum] && (
                    <span className="px-3 py-2 bg-green-600 text-gray-900 font-bold rounded-lg min-w-[45px] text-center">
                      {formData.correctAnswers[gapNum]}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {allGaps.length > 0 && formData.wordBank.length > 0 && (
        <div className="bg-yellow-900 bg-opacity-20 border border-yellow-500 rounded-lg p-4">
          <h4 className="text-yellow-300 font-semibold mb-2">📊 Summary</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• {allGaps.length} gaps in summary</p>
            <p>• {formData.wordBank.length} words in word bank</p>
            <p>• {Object.keys(formData.correctAnswers).length} correct answers set</p>
          </div>
        </div>
      )}
    </div>
  )
}