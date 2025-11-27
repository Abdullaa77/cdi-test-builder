'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import AlternativeAnswersField from '../AlternativeAnswersField'
export default function NoteCompletionEditor({ question, onUpdate }) {
  const [formData, setFormData] = useState({
    title: question.title || '',
    wordLimitText: question.wordLimitText || 'NO MORE THAN TWO WORDS',
    items: question.items || [
      {
        id: 1,
        label: 'Item 1:',
        fields: [
          { id: 1, prefix: '-', textBeforeGap: 'field text', gapNumber: 1, suffix: '' }
        ]
      }
    ],
    correctAnswers: question.correctAnswers || {},
  })

  const handleUpdate = (updates) => {
    const updated = { ...formData, ...updates }
    setFormData(updated)
    onUpdate(updated)
  }

  const addItem = () => {
  const newId = Math.max(...formData.items.map(i => i.id), 0) + 1
  
  // Calculate next gap number across ALL existing items
  const allGapNumbers = formData.items.flatMap(i => 
    i.fields.map(f => f.gapNumber).filter(n => n != null)
  )
  const nextGapNumber = allGapNumbers.length > 0 ? Math.max(...allGapNumbers) + 1 : 1
  
  handleUpdate({
    items: [...formData.items, {
      id: newId,
      label: `Item ${newId}:`,
      fields: [{ id: 1, prefix: '-', textBeforeGap: '', gapNumber: nextGapNumber, suffix: '' }]  // Use calculated number
    }]
  })
}

  const removeItem = (itemId) => {
    handleUpdate({
      items: formData.items.filter(i => i.id !== itemId)
    })
  }

  const updateItemLabel = (itemId, label) => {
    handleUpdate({
      items: formData.items.map(i =>
        i.id === itemId ? { ...i, label } : i
      )
    })
  }

  const addField = (itemId) => {
  // Find the highest gap number across ALL items
  const allGapNumbers = formData.items.flatMap(i => 
    i.fields.map(f => f.gapNumber).filter(n => n != null)
  )
  const nextGapNumber = allGapNumbers.length > 0 ? Math.max(...allGapNumbers) + 1 : 1

  handleUpdate({
    items: formData.items.map(i => {
      if (i.id === itemId) {
        const newFieldId = Math.max(...i.fields.map(f => f.id), 0) + 1
        return {
          ...i,
          fields: [...i.fields, { 
            id: newFieldId, 
            prefix: '-', 
            textBeforeGap: '', 
            gapNumber: nextGapNumber,  // Auto-increment gap number
            suffix: '' 
          }]
        }
      }
      return i
    })
  })
}
const addInfoField = (itemId) => {
  handleUpdate({
    items: formData.items.map(i => {
      if (i.id === itemId) {
        const newFieldId = Math.max(...i.fields.map(f => f.id), 0) + 1
        return {
          ...i,
          fields: [...i.fields, { 
            id: newFieldId, 
            prefix: '', 
            text: '', 
            gapNumber: null,  // NO gap number = info line!
            suffix: '',
            isInfoLine: true  // Flag to identify info lines
          }]
        }
      }
      return i
    })
  })
}
  const removeField = (itemId, fieldId) => {
    handleUpdate({
      items: formData.items.map(i => {
        if (i.id === itemId) {
          return { ...i, fields: i.fields.filter(f => f.id !== fieldId) }
        }
        return i
      })
    })
  }

  const updateField = (itemId, fieldId, updates) => {
    handleUpdate({
      items: formData.items.map(i => {
        if (i.id === itemId) {
          return {
            ...i,
            fields: i.fields.map(f =>
              f.id === fieldId ? { ...f, ...updates } : f
            )
          }
        }
        return i
      })
    })
  }

  const updateCorrectAnswer = (gapNumber, answer) => {
    handleUpdate({
      correctAnswers: {
        ...formData.correctAnswers,
        [gapNumber]: answer
      }
    })
  }

  const allGaps = formData.items.flatMap(item =>
    item.fields.filter(f => f.gapNumber).map(f => f.gapNumber)
  ).sort((a, b) => a - b)

  return (
    <div className="space-y-6">
      <div className="bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg p-4">
        <h4 className="text-blue-300 font-semibold mb-2">Note/Form Completion</h4>
        <p className="text-sm text-gray-600">
          Create a structured form with gaps. Students fill in ONE WORD AND/OR A NUMBER.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-2">
          Title/Heading
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleUpdate({ title: e.target.value })}
          className="w-full px-4 py-2 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Phone call about second-hand furniture"
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
          placeholder="e.g., NO MORE THAN TWO WORDS, ONE WORD ONLY, NO MORE THAN THREE WORDS AND/OR A NUMBER"
        />
        <p className="text-xs text-gray-500 mt-1">
          Specify how many words students can write for each answer
        </p>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-semibold text-gray-600">
            Form Items
          </label>
          <button
            onClick={addItem}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-gray-900 rounded-lg text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>

        <div className="space-y-4">
          {formData.items.map((item) => (
            <div key={item.id} className="border-2 border-gray-700 rounded-lg p-4 bg-gray-50">
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => updateItemLabel(item.id, e.target.value)}
                  className="flex-1 px-3 py-2 border-2 border-gray-600 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Item label (e.g., 'Dining table:')"
                />
                <button
  onClick={() => addField(item.id)}
  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-gray-900 rounded-lg text-sm flex items-center gap-1"
>
  <Plus className="w-3 h-3" />
  Gap Field
</button>
<button
  onClick={() => addInfoField(item.id)}
  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-gray-900 rounded-lg text-sm flex items-center gap-1"
>
  Info Line
</button>
                {formData.items.length > 1 && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-red-400 hover:bg-red-900 hover:bg-opacity-30 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-2 pl-4">
  {item.fields.map((field) => (
    <div key={field.id} className="flex gap-2 items-center">
      {field.isInfoLine || field.gapNumber === null ? (
        // INFO LINE (no gap)
        <>
          <span className="px-2 py-1 bg-green-600 text-gray-900 text-xs rounded font-semibold min-w-[50px] text-center">
            INFO
          </span>
          <input
            type="text"
            value={field.prefix || ''}
            onChange={(e) => updateField(item.id, field.id, { prefix: e.target.value })}
            className="w-24 px-2 py-1 border border-green-500 bg-white text-gray-900 rounded"
            placeholder="Label"
          />
          <input
            type="text"
            value={field.text || ''}
            onChange={(e) => updateField(item.id, field.id, { text: e.target.value })}
            className="flex-1 px-3 py-1 border-2 border-green-500 bg-green-900 bg-opacity-20 text-gray-900 rounded"
            placeholder="Context text (shown to students, no answer needed)"
          />
          <button
            onClick={() => removeField(item.id, field.id)}
            className="p-1 text-red-400 hover:bg-red-900 hover:bg-opacity-30 rounded"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </>
      ) : (
        // REGULAR GAP FIELD
        <>
          <input
            type="text"
            value={field.prefix || ''}
            onChange={(e) => updateField(item.id, field.id, { prefix: e.target.value })}
            className="w-12 px-2 py-1 border border-gray-600 bg-white text-gray-900 rounded text-center"
            placeholder="-"
          />
          <input
            type="text"
            value={field.textBeforeGap || ''}
            onChange={(e) => updateField(item.id, field.id, { textBeforeGap: e.target.value })}
            className="flex-1 px-3 py-1 border border-gray-600 bg-white text-gray-900 rounded"
            placeholder="Text before gap"
          />
          <input
            type="number"
            value={field.gapNumber || ''}
            onChange={(e) => updateField(item.id, field.id, { gapNumber: e.target.value ? parseInt(e.target.value) : null })}
            className="w-16 px-2 py-1 border-2 border-gray-200 bg-white text-blue-600 rounded text-center font-mono"
            placeholder="#"
            min="1"
          />
          <input
            type="text"
            value={field.suffix || ''}
            onChange={(e) => updateField(item.id, field.id, { suffix: e.target.value })}
            className="flex-1 px-3 py-1 border border-gray-600 bg-white text-gray-900 rounded"
            placeholder="Text after gap"
          />
          {item.fields.length > 1 && (
            <button
              onClick={() => removeField(item.id, field.id)}
              className="p-1 text-red-400 hover:bg-red-900 hover:bg-opacity-30 rounded"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </>
      )}
    </div>
  ))}
</div>
            </div>
          ))}
        </div>
      </div>

      {allGaps.length > 0 && (
  <div>
    <label className="block text-sm font-semibold text-gray-600 mb-3">
      Correct Answers
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