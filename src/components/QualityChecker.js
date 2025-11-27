'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'

export default function QualityChecker({ testType, testData, onClose }) {
  const [issues, setIssues] = useState([])

  useEffect(() => {
    checkQuality()
  }, [])

  const checkQuality = () => {
    const foundIssues = []

    if (!testData.title?.trim()) {
      foundIssues.push({ type: 'error', category: 'Basic Info', message: 'Test title is missing' })
    }

    if (!testData.instructions?.trim()) {
      foundIssues.push({ type: 'error', category: 'Basic Info', message: 'Test instructions are missing' })
    }

    if (testType === 'listening') {
      const hasAnyAudio = testData.audioFiles?.some(f => f !== null)
      if (!hasAnyAudio) {
        foundIssues.push({ type: 'error', category: 'Audio', message: 'No audio files uploaded' })
      }

      const totalQuestions = testData.parts.reduce((sum, part) => sum + part.questions.length, 0)
      if (totalQuestions === 0) {
        foundIssues.push({ type: 'error', category: 'Questions', message: 'No questions added' })
      }

      testData.parts.forEach((part, partIdx) => {
        part.questions.forEach((q, idx) => {
          if (!q.text?.trim() && q.type !== 'plan-map-diagram') {
            foundIssues.push({ type: 'warning', category: 'Questions', message: `Part ${partIdx + 1}, Question ${idx + 1}: Missing question text` })
          }

          if (q.type === 'plan-map-diagram') {
            if (!q.mapImage) {
              foundIssues.push({ type: 'error', category: 'Questions', message: `Part ${partIdx + 1}, Question ${idx + 1}: Map image is missing` })
            }
            if (!q.questionList?.length) {
              foundIssues.push({ type: 'error', category: 'Questions', message: `Part ${partIdx + 1}, Question ${idx + 1}: No map labels configured` })
            }
          } else {
            if (!q.correctAnswer?.trim()) {
              foundIssues.push({ type: 'error', category: 'Answers', message: `Part ${partIdx + 1}, Question ${idx + 1}: Missing correct answer` })
            }
          }
        })
      })
    }

    if (testType === 'reading') {
      testData.passages?.forEach((p, idx) => {
        if (!p.title?.trim()) {
          foundIssues.push({ type: 'warning', category: 'Passages', message: `Passage ${idx + 1}: Missing title` })
        }
        if (!p.text?.trim()) {
          foundIssues.push({ type: 'error', category: 'Passages', message: `Passage ${idx + 1}: Missing text content` })
        }
      })

      const totalQuestions = testData.passages.reduce((sum, passage) => sum + passage.questions.length, 0)
      if (totalQuestions < 40) {
        foundIssues.push({ type: 'warning', category: 'Questions', message: `Only ${totalQuestions} questions (IELTS reading requires 40)` })
      }
    }

    if (testType === 'writing') {
      if (!testData.task1?.prompt?.trim()) {
        foundIssues.push({ type: 'error', category: 'Task 1', message: 'Task 1 prompt is missing' })
      }
      if (!testData.task1?.image) {
        foundIssues.push({ type: 'warning', category: 'Task 1', message: 'Task 1 chart/diagram is missing' })
      }
      if (!testData.task2?.prompt?.trim()) {
        foundIssues.push({ type: 'error', category: 'Task 2', message: 'Task 2 prompt is missing' })
      }
    }

    setIssues(foundIssues)
  }

  const errorCount = issues.filter(i => i.type === 'error').length
  const warningCount = issues.filter(i => i.type === 'warning').length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden border-2 border-gray-200">
        <div className="bg-blue-600 p-6 text-gray-900">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <AlertTriangle className="w-7 h-7" />
                Quality Assurance Report
              </h2>
              <p className="mt-2 font-semibold">
                {errorCount === 0 && warningCount === 0 ? 'All checks passed!' : 
                 `Found ${errorCount} error(s) and ${warningCount} warning(s)`}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)] bg-gray-50">
          {issues.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Excellent!</h3>
              <p className="text-gray-400">No issues found. Your test is ready to export.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {['error', 'warning'].map(type => {
                const typeIssues = issues.filter(i => i.type === type)
                if (!typeIssues.length) return null

                return (
                  <div key={type} className={`rounded-xl border-2 p-4 ${
                    type === 'error' ? 'bg-red-900 bg-opacity-30 border-red-500' : 'bg-yellow-900 bg-opacity-30 border-yellow-500'
                  }`}>
                    <h3 className={`font-semibold mb-3 flex items-center gap-2 ${
                      type === 'error' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {type === 'error' ? <XCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                      {type === 'error' ? 'Errors (Must Fix)' : 'Warnings (Recommended)'}
                    </h3>
                    <div className="space-y-2">
                      {typeIssues.map((issue, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-white rounded-lg p-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            type === 'error' ? 'bg-red-500 text-gray-900' : 'bg-yellow-500 text-gray-900'
                          }`}>
                            {issue.category}
                          </span>
                          <p className="flex-1 text-sm text-gray-300">{issue.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="border-t-2 border-gray-200 p-4 bg-white flex justify-between items-center">
          <div className="text-sm text-gray-400">
            {errorCount > 0 && (
              <span className="text-red-400 font-semibold">Fix all errors before exporting</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-gray-900 rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}