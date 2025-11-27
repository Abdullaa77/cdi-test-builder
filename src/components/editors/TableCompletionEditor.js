'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import AlternativeAnswersField from '../AlternativeAnswersField'

export default function TableCompletionEditor({ question, onUpdate }) {
  const [formData, setFormData] = useState({
    title: question.title || '',
    wordLimitText: question.wordLimitText || 'NO MORE THAN THREE WORDS',
    headers: question.headers || ['Column 1', 'Column 2', 'Column 3'],
    rows: question.rows || [
      { id: 1, cells: ['', '', ''] }
    ],
    correctAnswers: question.correctAnswers || {},
  })

  const handleUpdate = (updates) => {
    const updated = { ...formData, ...updates }
    setFormData(updated)
    onUpdate(updated)
  }

  const addColumn = () => {
    handleUpdate({
      headers: [...formData.headers, `Column ${formData.headers.length + 1}`],
      rows: formData.rows.map(row => ({
        ...row,
        cells: [...row.cells, '']
      }))
    })
  }

  const removeColumn = (index) => {
    if (formData.headers.length <= 2) return
    handleUpdate({
      headers: formData.headers.filter((_, i) => i !== index),
      rows: formData.rows.map(row => ({
        ...row,
        cells: row.cells.filter((_, i) => i !== index)
      }))
    })
  }

  const updateHeader = (index, value) => {
    const updated = [...formData.headers]
    updated[index] = value
    handleUpdate({ headers: updated })
  }

  const addRow = () => {
    const newId = Math.max(...formData.rows.map(r => r.id), 0) + 1
    handleUpdate({
      rows: [...formData.rows, {
        id: newId,
        cells: Array(formData.headers.length).fill('')
      }]
    })
  }

  const removeRow = (id) => {
    if (formData.rows.length <= 1) return
    handleUpdate({
      rows: formData.rows.filter(r => r.id !== id)
    })
  }

  const updateCell = (rowId, cellIndex, value) => {
    const updated = formData.rows.map(row => {
      if (row.id === rowId) {
        const newCells = [...row.cells]
        newCells[cellIndex] = value
        return { ...row, cells: newCells }
      }
      return row
    })
    handleUpdate({ rows: updated })
  }

  const extractGapNumbers = () => {
    const gaps = []
    formData.rows.forEach(row => {
      row.cells.forEach(cell => {
        const matches = cell.match(/___(\d+)___/g)
        if (matches) {
          matches.forEach(m => {
            const num = parseInt(m.match(/\d+/)[0])
            if (!gaps.includes(num)) gaps.push(num)
          })
        }
      })
    })
    return gaps.sort((a, b) => a - b)
  }

  const insertGap = (rowId, cellIndex) => {
    const allGaps = extractGapNumbers()
    const nextGapNum = allGaps.length > 0 ? Math.max(...allGaps) + 1 : 1
    const currentCell = formData.rows.find(r => r.id === rowId).cells[cellIndex]
    updateCell(rowId, cellIndex, currentCell + ` ___${nextGapNum}___`)
  }

  const updateCorrectAnswer = (gapNum, answer) => {
    handleUpdate({
      correctAnswers: {
        ...formData.correctAnswers,
        [gapNum]: answer
      }
    })
  }

  const allGaps = extractGapNumbers()

  return (
    <div className="space-y-6">
      <div className="bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg p-4">
        <h4 className="text-blue-300 font-semibold mb-2">Table Completion</h4>
        <p className="text-sm text-gray-600">
          Create a table with gaps. Use ___9___ format for gaps where students fill in answers.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-2">
          Table Title (Optional)
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleUpdate({ title: e.target.value })}
          className="w-full px-4 py-2 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Key Developments in Detective Fiction"
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
          placeholder="e.g., NO MORE THAN THREE WORDS, ONE WORD AND/OR A NUMBER"
        />
        <p className="text-xs text-gray-500 mt-1">
          Specify how many words students can write for each answer
        </p>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-semibold text-gray-600">
            Table Headers
          </label>
          <div className="flex gap-2">
            <button
              onClick={addColumn}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-gray-900 rounded-lg text-sm"
            >
              + Column
            </button>
          </div>
        </div>
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${formData.headers.length}, 1fr)` }}>
          {formData.headers.map((header, idx) => (
            <div key={idx} className="flex gap-1">
              <input
                type="text"
                value={header}
                onChange={(e) => updateHeader(idx, e.target.value)}
                className="flex-1 px-3 py-2 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder={`Header ${idx + 1}`}
              />
              {formData.headers.length > 2 && (
                <button
                  onClick={() => removeColumn(idx)}
                  className="p-2 text-red-400 hover:bg-red-900 hover:bg-opacity-30 rounded-lg"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-semibold text-gray-600">
            Table Rows
          </label>
          <button
            onClick={addRow}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-gray-900 rounded-lg text-sm"
          >
            + Row
          </button>
        </div>
        <div className="space-y-2">
          {formData.rows.map((row) => (
            <div key={row.id} className="border-2 border-gray-700 rounded-lg p-3 bg-gray-50">
              <div className="flex gap-2 items-start mb-2">
                <span className="text-blue-600 font-mono text-xs pt-2">
                  Row {row.id}
                </span>
                {formData.rows.length > 1 && (
                  <button
                    onClick={() => removeRow(row.id)}
                    className="ml-auto p-1 text-red-400 hover:bg-red-900 hover:bg-opacity-30 rounded-lg"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${formData.headers.length}, 1fr)` }}>
                {row.cells.map((cell, cellIdx) => (
                  <div key={cellIdx} className="flex flex-col gap-1">
                    <textarea
                      value={cell}
                      onChange={(e) => updateCell(row.id, cellIdx, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-600 bg-white text-gray-900 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      rows="2"
                      placeholder={`Cell ${cellIdx + 1}`}
                    />
                    <button
                      onClick={() => insertGap(row.id, cellIdx)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      + Insert Gap
                    </button>
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