'use client'

import { useState } from 'react'
import { Plus, Trash2, Upload } from 'lucide-react'

export default function FlowchartCompletionEditor({ question, onUpdate }) {
  const [formData, setFormData] = useState({
  backgroundImage: question.backgroundImage || '',
  wordLimitText: question.wordLimitText || 'NO MORE THAN TWO WORDS',
  steps: Array.isArray(question.steps) ? question.steps : [{ id: 1, text: '' }],
  options: Array.isArray(question.options) ? question.options : [
    { id: 'A', text: '' },
    { id: 'B', text: '' },
  ],
  gapAnswers: question.gapAnswers || {},
})

  const handleUpdate = (updates) => {
    const updated = { ...formData, ...updates }
    setFormData(updated)
    onUpdate(updated)
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        handleUpdate({ backgroundImage: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  const addStep = () => {
    const newId = Math.max(...formData.steps.map(s => s.id), 0) + 1
    handleUpdate({
      steps: [...formData.steps, { id: newId, text: '' }]
    })
  }

  const removeStep = (id) => {
    handleUpdate({
      steps: formData.steps.filter(s => s.id !== id)
    })
  }

  const updateStep = (id, text) => {
    const updated = formData.steps.map(s =>
      s.id === id ? { ...s, text } : s
    )
    handleUpdate({ steps: updated })
  }
const insertGap = (stepId) => {
  const allGapNumbers = formData.steps.flatMap(step => extractGapNumbers(step.text))
  const nextGapNumber = allGapNumbers.length > 0 ? Math.max(...allGapNumbers.map(Number)) + 1 : 1
  
  const updated = formData.steps.map(s => {
    if (s.id === stepId) {
      return { ...s, text: s.text + ` ___${nextGapNumber}___` }
    }
    return s
  })
  handleUpdate({ steps: updated })
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

  const extractGapNumbers = (text) => {
    const matches = text.match(/___(\d+)___/g)
    return matches ? matches.map(m => m.match(/\d+/)[0]) : []
  }

  const updateGapAnswer = (gapNum, optionId) => {
    handleUpdate({
      gapAnswers: {
        ...formData.gapAnswers,
        [gapNum]: optionId
      }
    })
  }

  const allGaps = formData.steps.flatMap(step => extractGapNumbers(step.text))

  return (
    <div className="space-y-6">
      <div className="bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg p-4">
        <h4 className="text-blue-300 font-semibold mb-2">Flow-chart Completion</h4>
        <p className="text-sm text-gray-600">
          Use ___26___ format for gaps. Students drag options into numbered gaps.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-2">
          Background Image (Optional)
        </label>
        <div className="flex gap-4 items-start">
          <label className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-900 rounded-lg cursor-pointer flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Image
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
          {formData.backgroundImage && (
            <div className="relative">
              <img
                src={formData.backgroundImage}
                alt="Flow-chart background"
                className="h-32 rounded border-2 border-gray-600"
              />
              <button
                onClick={() => handleUpdate({ backgroundImage: '' })}
                className="absolute -top-2 -right-2 bg-red-500 text-gray-900 rounded-full p-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
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
          placeholder="e.g., NO MORE THAN TWO WORDS, ONE WORD ONLY"
        />
        <p className="text-xs text-gray-500 mt-1">
          Specify how many words students can write for each answer
        </p>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-semibold text-gray-600">
            Flow-chart Steps (use ___26___ for gaps)
          </label>
          <button
            onClick={addStep}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-gray-900 rounded-lg text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Step
          </button>
        </div>
        <div className="space-y-2">
          {formData.steps.map((step, idx) => (
  <div key={step.id} className="flex gap-2">
    <span className="text-blue-600 font-mono text-sm pt-2 min-w-[30px]">
      {idx + 1}.
    </span>
    <textarea
      value={step.text}
      onChange={(e) => updateStep(step.id, e.target.value)}
      className="flex-1 px-4 py-2 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
      rows="2"
      placeholder="Step text with gap like: The rover collects ___26___ from the site."
    />
    <button
      onClick={() => insertGap(step.id)}
      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-gray-900 rounded-lg text-sm whitespace-nowrap"
      title="Insert gap at end"
    >
      + Gap
    </button>
    {formData.steps.length > 1 && (
      <button
        onClick={() => removeStep(step.id)}
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
            Options (Draggable Choices)
          </label>
          <button
            onClick={addOption}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-gray-900 rounded-lg text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Option
          </button>
        </div>
        <div className="space-y-2">
          {formData.options.map((option) => (
            <div key={option.id} className="flex gap-2">
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
      </div>

      {allGaps.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-3">
            Correct Answers for Gaps
          </label>
          <div className="space-y-2">
            {allGaps.map(gapNum => (
              <div key={gapNum} className="flex gap-2 items-center">
                <span className="text-blue-600 font-mono text-sm min-w-[60px]">
                  Gap {gapNum}:
                </span>
                <select
                  value={formData.gapAnswers[gapNum] || ''}
                  onChange={(e) => updateGapAnswer(gapNum, e.target.value)}
                  className="px-4 py-2 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select answer</option>
                  {formData.options.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.id}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}