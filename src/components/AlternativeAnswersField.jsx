'use client'

import { Plus, X } from 'lucide-react'

export default function AlternativeAnswersField({ 
  answers = [], 
  onChange, 
  compact = false 
}) {
  const answerList = (Array.isArray(answers) && answers.length > 0) ? answers : ['']
  
 const handleChange = (index, value) => {
  const updated = [...answerList]
  updated[index] = value
  onChange(updated)
}
  
 const addAnswer = () => {
  const newAnswers = [...answerList, '']
  onChange(newAnswers)
}
  
  const removeAnswer = (index) => {
    if (answerList.length <= 1) return
    const updated = answerList.filter((_, i) => i !== index)
    onChange(updated)
  }
  
  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      {answerList.map((answer, idx) => (
        <div key={idx} className="flex gap-1">
          <input
            type="text"
            value={answer || ''}
            onChange={(e) => handleChange(idx, e.target.value)}
            className={`flex-1 px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:ring-2 focus:ring-blue-500 ${
              compact ? 'text-sm' : ''
            }`}
            placeholder={idx === 0 ? "Primary answer" : `Alternative ${idx}`}
          />
          {answerList.length > 1 && (
            <button
              type="button"
              onClick={() => removeAnswer(idx)}
              className="p-2 text-red-400 hover:bg-red-900 hover:bg-opacity-30 rounded transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}
      
      <button
        type="button"
        onClick={addAnswer}
        className={`flex items-center gap-1 text-blue-400 hover:text-blue-300 ${
          compact ? 'text-xs' : 'text-sm'
        }`}
      >
        <Plus className="w-3 h-3" />
        Add Alternative
      </button>
    </div>
  )
}