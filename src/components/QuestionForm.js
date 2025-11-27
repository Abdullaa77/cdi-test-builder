'use client'

import { useState } from 'react'
import { listeningQuestionTypes, readingQuestionTypes } from '@/constants/questionTypes'
import { Copy, Trash2 } from 'lucide-react'
import MapQuestionEditor from './editors/MapQuestionEditor'
import MatchingQuestionEditor from './editors/MatchingQuestionEditor'
import FlowchartCompletionEditor from './editors/FlowchartCompletionEditor'
import NoteCompletionEditor from './editors/NoteCompletionEditor'
import MatchingHeadingsEditor from './editors/MatchingHeadingsEditor'
import SummaryCompletionEditor from './editors/SummaryCompletionEditor'
import MultipleChoiceMultipleEditor from './editors/MultipleChoiceMultipleEditor'
import MCQTableEditor from './editors/MCQTableEditor'
import TableCompletionEditor from './editors/TableCompletionEditor'
import MatchingStatementsEditor from './editors/MatchingStatementsEditor'
import MatchingSentenceEndingsEditor from './editors/MatchingSentenceEndingsEditor'
import MatchingInformationEditor from './editors/MatchingInformationEditor'
import ShortAnswerEditor from './editors/ShortAnswerEditor'
import SentenceCompletionEditor from './editors/SentenceCompletionEditor'
import SummaryCompletionSelectEditor from './editors/SummaryCompletionSelectEditor'
import AlternativeAnswersInput from './AlternativeAnswersField'
export default function QuestionForm({ question, testType, onUpdate, onRemove, onDuplicate, questionIndex }) {
  const [formData, setFormData] = useState(question)

  const handleChange = (field, value) => {
    const updated = { ...formData, [field]: value }
    setFormData(updated)
    onUpdate(updated)
  }

  const getQuestionTypes = () => {
    return testType === 'listening' ? listeningQuestionTypes : readingQuestionTypes
  }

  const renderFormFields = () => {
    const questionTypeConfig = getQuestionTypes().find(qt => qt.id === question.type)
    
    if (!questionTypeConfig) return null

    switch (question.type) {
      case 'plan-map-diagram':
        return <MapQuestionEditor question={formData} onUpdate={(updated) => {
          setFormData(updated)
          onUpdate(updated)
        }} />
        case 'summary-completion':
  return <SummaryCompletionSelectEditor question={formData} onUpdate={(updated) => {
    setFormData(updated)
    onUpdate(updated)
  }} />
        case 'matching-information':
  return <MatchingInformationEditor question={formData} onUpdate={(updated) => {
    setFormData(updated)
    onUpdate(updated)
  }} />
  case 'sentence-completion':
  return <SentenceCompletionEditor question={formData} onUpdate={(updated) => {
    setFormData(updated)
    onUpdate(updated)
  }} />
  case 'short-answer':
  return <ShortAnswerEditor question={formData} onUpdate={(updated) => {
    setFormData(updated)
    onUpdate(updated)
  }} />
        case 'table-completion':
  return <TableCompletionEditor question={formData} onUpdate={(updated) => {
    setFormData(updated)
    onUpdate(updated)
  }} />
  case 'matching-sentence-endings':
  return <MatchingSentenceEndingsEditor question={formData} onUpdate={(updated) => {
    setFormData(updated)
    onUpdate(updated)
  }} />
  case 'matching-statements':
case 'matching-people':
  return <MatchingStatementsEditor question={formData} onUpdate={(updated) => {
    setFormData(updated)
    onUpdate(updated)
  }} />
case 'matching-features':
  return <MatchingQuestionEditor question={{
    ...formData,
    categories: formData.categories || [{ id: 1, text: '' }],
    options: formData.options || [
      { id: 'A', text: '' },
      { id: 'B', text: '' },
    ],
    correctAnswers: formData.correctAnswers || {},
  }} onUpdate={(updated) => {
    setFormData(updated)
    onUpdate(updated)
  }} />
  case 'multiple-choice-multiple':
  return <MultipleChoiceMultipleEditor question={formData} onUpdate={(updated) => {
    setFormData(updated)
    onUpdate(updated)
  }} />
case 'matching-headings':
  return <MatchingHeadingsEditor question={formData} onUpdate={(updated) => {
    setFormData(updated)
    onUpdate(updated)
  }} />
case 'mcq-table':
  return <MCQTableEditor question={formData} onUpdate={(updated) => {
    setFormData(updated)
    onUpdate(updated)
  }} />
case 'note-completion':
case 'form-completion':
case 'table-completion':
  return <NoteCompletionEditor question={formData} onUpdate={(updated) => {
    setFormData(updated)
    onUpdate(updated)
  }} />

  case 'summary-completion-type':
  return <SummaryCompletionEditor question={formData} onUpdate={(updated) => {
    setFormData(updated)
    onUpdate(updated)
  }} />
  
case 'flow-chart-completion':
  return <FlowchartCompletionEditor question={{
    ...formData,
    backgroundImage: formData.backgroundImage || '',
    steps: formData.steps || [{ id: 1, text: '' }],
    options: formData.options || [
      { id: 'A', text: '' },
      { id: 'B', text: '' },
    ],
    gapAnswers: formData.gapAnswers || {},
  }} onUpdate={(updated) => {
    setFormData(updated)
    onUpdate(updated)
  }} />
  case 'multiple-choice':
  const availableOptions = ['A', 'B', 'C']
  const hasOptionD = formData.options?.D !== undefined
  if (hasOptionD) availableOptions.push('D')
  
  return (
    <>
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Question Text</label>
        <textarea
          value={formData.text || ''}
          onChange={(e) => handleChange('text', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-gray-200 font-mono"
          rows="3"
          placeholder="Enter your question text here..."
        />
      </div>
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-semibold text-gray-300">Answer Options</label>
          {!hasOptionD && (
            <button
              onClick={() => {
                const newOptions = { ...formData.options, D: '' }
                handleChange('options', newOptions)
              }}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-gray-900 rounded-lg text-sm flex items-center gap-1"
            >
              + Add Option D
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {availableOptions.map(opt => (
            <div key={opt} className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-300 mb-2">Option {opt}</label>
                <input
                  type="text"
                  value={formData.options?.[opt] || ''}
                  onChange={(e) => handleChange('options', { ...formData.options, [opt]: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={`Option ${opt} text`}
                />
              </div>
              {opt === 'D' && (
                <button
                  onClick={() => {
                    const newOptions = { ...formData.options }
                    delete newOptions.D
                    const updates = { options: newOptions }
                    if (formData.correctAnswer === 'D') {
                      updates.correctAnswer = ''
                    }
                    setFormData({ ...formData, ...updates })
                    onUpdate({ ...formData, ...updates })
                  }}
                  className="p-2 text-red-400 hover:bg-red-900 hover:bg-opacity-30 rounded-lg mt-7"
                  title="Remove Option D"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Correct Answer</label>
        <select
          value={formData.correctAnswer || ''}
          onChange={(e) => handleChange('correctAnswer', e.target.value)}
          className="w-full px-4 py-2 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select correct answer</option>
          {availableOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    </>
  )

      case 'true-false-not-given':
      case 'yes-no-not-given':
        const options = question.type === 'true-false-not-given' 
          ? ['TRUE', 'FALSE', 'NOT GIVEN']
          : ['YES', 'NO', 'NOT GIVEN']
        
        return (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Statement</label>
              <textarea
                value={formData.text || ''}
                onChange={(e) => handleChange('text', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-gray-200 font-mono"
                rows="3"
                placeholder="Enter the statement to be evaluated..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Correct Answer</label>
              <select
                value={formData.correctAnswer || ''}
                onChange={(e) => handleChange('correctAnswer', e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select correct answer</option>
                {options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </>
        )

      default:
  return (
    <>
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Question Text</label>
        <textarea
          value={formData.text || ''}
          onChange={(e) => handleChange('text', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-gray-200 font-mono"
          rows="3"
          placeholder="Enter your question or prompt..."
        />
      </div>
      <AlternativeAnswersInput
        answers={formData.correctAnswers || (formData.correctAnswer ? [formData.correctAnswer] : [])}
        onChange={(answers) => {
          const updated = { 
            ...formData, 
            correctAnswers: answers,
            correctAnswer: answers[0] || ''
          }
          setFormData(updated)
          onUpdate(updated)
        }}
        label="Correct Answer(s)"
      />
    </>
  )
    }
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-4 shadow-lg hover:shadow-2xl transition-shadow">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h4 className="text-lg font-semibold text-gray-900">Question {questionIndex + 1}</h4>
          <span className="px-3 py-1 bg-blue-600 bg-opacity-20 text-blue-600 text-xs font-semibold rounded-full flex items-center gap-1 border border-gray-200">
            {getQuestionTypes().find(qt => qt.id === question.type)?.name || question.type}
          </span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onDuplicate}
            className="p-2 text-blue-400 hover:bg-blue-900 hover:bg-opacity-30 rounded-lg transition-colors"
            title="Duplicate question"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button 
            onClick={onRemove} 
            className="p-2 text-red-400 hover:bg-red-900 hover:bg-opacity-30 rounded-lg transition-colors"
            title="Remove question"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {renderFormFields()}
      </div>
    </div>
  )
}