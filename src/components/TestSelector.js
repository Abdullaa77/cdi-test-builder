'use client'

import { useState } from 'react'
import { useTest } from '@/contexts/TestContext'
import SaveLoadModal from './LoadProjectModal'
import { Headphones, BookOpen, PenTool, Save, Package } from 'lucide-react'
import JSZip from 'jszip'
import { generateListeningHTML, generateReadingHTML, generateWritingHTML } from '@/lib/htmlTemplates'
import { createClient } from '@/lib/supabase/client'

export default function TestSelector({ onTestSelect }) {
  const { state } = useTest()
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [validationError, setValidationError] = useState('')
  
  // Helper function to count gaps in summary/completion questions
  const countGapsInText = (text) => {
    if (!text) return 0
    const matches = text.match(/___(\d+)___/g)
    return matches ? matches.length : 0
  }

  // Helper function to count gaps in segments/parts format
  const countGapsInSegments = (segments) => {
    if (!Array.isArray(segments)) return 0
    return segments.filter(seg => seg.hasGap && seg.gapNumber).length
  }

  // UNIVERSAL question counter
  const countQuestions = (question) => {
    const q = question
    
    if (q.numberOfAnswers) return q.numberOfAnswers
    if (q.correctCount) return q.correctCount
    
    if (q.questionList && Array.isArray(q.questionList)) return q.questionList.length
    if (q.questions && Array.isArray(q.questions)) return q.questions.length
    if (q.statements && Array.isArray(q.statements)) return q.statements.length
    if (q.categories && Array.isArray(q.categories)) return q.categories.length
    if (q.paragraphs && Array.isArray(q.paragraphs)) return q.paragraphs.length
    if (q.sentenceBeginnings && Array.isArray(q.sentenceBeginnings)) return q.sentenceBeginnings.length
    if (q.sentences && Array.isArray(q.sentences)) return q.sentences.length
    
    if (q.type === 'note-completion' || q.type === 'form-completion' || q.type === 'table-completion') {
      let gaps = 0
      
      if (q.rows && Array.isArray(q.rows)) {
        q.rows.forEach(row => {
          const cells = row.cells || []
          cells.forEach(cell => {
            gaps += countGapsInText(cell)
          })
        })
      }
      
      if (gaps === 0 && q.items && Array.isArray(q.items)) {
        q.items.forEach(item => {
          (item.fields || []).forEach(field => {
            if (field.gapNumber) gaps++
          })
        })
      }
      
      if (gaps > 0) return gaps
    }
    
    if (q.type === 'summary-completion' || q.type === 'summary-completion-type') {
      let gaps = 0
      if (q.segments && Array.isArray(q.segments)) {
        gaps = countGapsInSegments(q.segments)
      } else if (q.summaryParts && Array.isArray(q.summaryParts)) {
        gaps = countGapsInSegments(q.summaryParts)
      }
      if (gaps === 0) {
        gaps = countGapsInText(q.summaryText || '')
      }
      if (gaps > 0) return gaps
    }
    
    if (q.type === 'flow-chart-completion') {
      let gaps = 0
      const steps = q.steps || []
      steps.forEach(step => {
        gaps += countGapsInText(step.text || '')
      })
      if (gaps > 0) return gaps
    }
    
    if (q.type === 'matching-features' && q.correctAnswers && typeof q.correctAnswers === 'object') {
      return Object.keys(q.correctAnswers).length
    }
    
    return 1
  }

  // Validation function
  const validateAllTests = () => {
    const errors = []
    
    const hasAudio = state.listening.audioFiles.some(f => f !== null)
    const listeningQuestions = state.listening.parts.reduce((sum, part) => sum + part.questions.length, 0)
    if (!hasAudio || listeningQuestions === 0) {
      errors.push('Listening test is incomplete (needs audio and questions)')
    }
    
    const hasPassages = state.reading.passages.every(p => p.text.trim())
    const readingQuestions = state.reading.passages.reduce((sum, passage) => sum + passage.questions.length, 0)
    if (!hasPassages || readingQuestions < 40) {
      errors.push('Reading test is incomplete (needs 3 passages with 40 questions)')
    }
    
    const hasWritingTasks = state.writing.task1.prompt && state.writing.task2.prompt && state.writing.task1.image
    if (!hasWritingTasks) {
      errors.push('Writing test is incomplete (needs Task 1 prompt, image, and Task 2 prompt)')
    }
    
    return errors
  }

  // Generate answer key for a test
  const generateAnswerKey = (testType) => {
    const answers = {}
    let questionNumber = 1

    if (testType === 'listening') {
      state.listening.parts?.forEach((part) => {
        part.questions?.forEach((q) => {
          if (q.type === 'plan-map-diagram') {
            q.questionList?.forEach((item) => {
              if (item.answers && Array.isArray(item.answers) && item.answers.length > 0) {
                answers[questionNumber] = item.answers.map(a => a.toUpperCase())
              } else {
                answers[questionNumber] = item.answer?.toUpperCase() || item.correctAnswer?.toUpperCase() || ''
              }
              questionNumber++
            })
          } else if (q.type === 'multiple-choice-multiple') {
            answers[questionNumber] = {
              type: 'multiple',
              answers: q.correctAnswers || [],
              count: q.numberOfAnswers || q.correctCount || 2
            }
            questionNumber += q.numberOfAnswers || q.correctCount || 2
          } else if (q.type === 'matching-features') {
            Object.entries(q.correctAnswers || {}).forEach(([key, value]) => {
              answers[questionNumber] = value
              questionNumber++
            })
          } else if (q.correctAnswer) {
            answers[questionNumber] = q.correctAnswer
            questionNumber++
          }
        })
      })
    } else if (testType === 'reading') {
      state.reading.passages?.forEach((passage) => {
        passage.questions?.forEach((q) => {
          if (q.type === 'multiple-choice-multiple') {
            answers[questionNumber] = {
              type: 'multiple',
              answers: q.correctAnswers || [],
              count: q.numberOfAnswers || q.correctCount || 2
            }
            questionNumber += q.numberOfAnswers || q.correctCount || 2
          } else if (q.correctAnswer) {
            answers[questionNumber] = q.correctAnswer
            questionNumber++
          }
        })
      })
    }
    
    return answers
  }

  // Fetch branding for export
  const fetchBranding = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('user_branding')
        .select('*')
        .eq('user_id', user.id)
        .single()
      return data
    }
    return null
  }

  // Export complete mock package
  const handleExportMockPackage = async () => {
    const errors = validateAllTests()
    if (errors.length > 0) {
      const proceed = confirm(
        '⚠️ REMINDER: Some tests may be incomplete:\n\n' + 
        errors.join('\n') + 
        '\n\nDo you want to continue anyway?'
      )
      if (!proceed) return
    }
    
    setExporting(true)
    setValidationError('')
    
    try {
      const branding = await fetchBranding()
      const zip = new JSZip()
      const projectName = state.projectName || 'IELTS_Mock_Test'
      const fileName = projectName.replace(/\s+/g, '_')
      
      const listeningAnswerKey = generateAnswerKey('listening')
      const readingAnswerKey = generateAnswerKey('reading')
      
      const listeningData = {
        type: 'listening',
        title: state.listening.title,
        duration: state.listening.duration,
        parts: state.listening.parts,
        audioFiles: state.listening.audioFiles
      }
      const listeningHTML = await generateListeningHTML(listeningData, projectName, listeningAnswerKey, branding)
      zip.file(`${fileName}_listening.html`, listeningHTML)
      
      const readingData = {
        type: 'reading',
        title: state.reading.title,
        duration: state.reading.duration,
        parts: state.reading.passages
      }
      const readingHTML = await generateReadingHTML(readingData, projectName, readingAnswerKey, branding)
      zip.file(`${fileName}_reading.html`, readingHTML)
      
      const writingData = {
        type: 'writing',
        title: state.writing.title,
        duration: state.writing.duration,
        task1: state.writing.task1,
        task2: state.writing.task2
      }
      const writingHTML = await generateWritingHTML(writingData, projectName, branding)
      zip.file(`${fileName}_writing.html`, writingHTML)
      
      const projectData = JSON.stringify(state, null, 2)
      zip.file(`${fileName}_project.json`, projectData)
      
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${fileName}_complete_mock.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setExporting(false)
    } catch (error) {
      console.error('Export error:', error)
      setValidationError('Failed to export mock package. Please try again.')
      setExporting(false)
    }
  }

  const tests = [
    { 
      id: 'listening', 
      title: 'Listening Test', 
      icon: Headphones, 
      gradient: 'from-blue-500 to-blue-700',
      description: 'Audio-based questions with multiple audio files support',
      questionCount: (() => {
        let count = 0
        state.listening.parts.forEach(part => {
          part.questions.forEach(q => {
            count += countQuestions(q)
          })
        })
        return count
      })(),
      status: state.listening.audioFiles.some(f => f !== null) ? 'configured' : 'pending'
    },
    { 
      id: 'reading', 
      title: 'Reading Test', 
      icon: BookOpen, 
      gradient: 'from-green-500 to-green-700',
      description: 'Three passages with 40 questions total',
      questionCount: (() => {
        let count = 0
        state.reading.passages.forEach(passage => {
          passage.questions.forEach(q => {
            count += countQuestions(q)
          })
        })
        return count
      })(),
      status: state.reading.passages.some(p => p.text.trim()) ? 'configured' : 'pending'
    },
    { 
      id: 'writing', 
      title: 'Writing Test', 
      icon: PenTool, 
      gradient: 'from-purple-500 to-purple-700',
      description: 'Task 1 (Academic) and Task 2 (Essay)',
      questionCount: 2,
      status: state.writing.task1.prompt && state.writing.task2.prompt ? 'configured' : 'pending'
    }
  ]

  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">CDI</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Project: {state.projectName}</h3>
        <p className="text-lg text-gray-600">Select a test type to configure</p>
        
        <div className="flex gap-4 justify-center items-center mt-6">
          <button
            onClick={() => setShowSaveModal(true)}
            className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-semibold flex items-center gap-2 transition-colors border border-gray-300 shadow-sm"
          >
            <Save className="w-5 h-5" />
            Load Project
          </button>
          
          <button
            onClick={handleExportMockPackage}
            disabled={exporting}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {exporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Package className="w-5 h-5" />
                Export Complete Mock Package
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {tests.map(test => {
          const IconComponent = test.icon
          return (
            <div
              key={test.id}
              className="bg-white rounded-2xl p-6 shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl group border border-gray-200"
              onClick={() => onTestSelect(test.id)}
            >
              <div className={`bg-gradient-to-br ${test.gradient} w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md`}>
                <IconComponent className="w-7 h-7 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">{test.title}</h3>
              <p className="text-gray-500 mb-4 text-sm">{test.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${test.status === 'configured' ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm text-gray-500">
                    {test.status === 'configured' ? 'Configured' : 'Not configured'}
                  </span>
                </div>
                <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  {test.questionCount} questions
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {showSaveModal && <SaveLoadModal onClose={() => setShowSaveModal(false)} />}
    </div>
  )
}