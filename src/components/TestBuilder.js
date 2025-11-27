'use client'

import { useState, useRef } from 'react'
import { useTest } from '@/contexts/TestContext'
import { useToast } from '@/contexts/ToastContext'
import { listeningQuestionTypes, readingQuestionTypes } from '@/constants/questionTypes'
import { getAudioDuration, convertToBase64, downloadFile } from '@/lib/utils'

import QuestionForm from './QuestionForm'
import QualityChecker from './QualityChecker'
import AnswerKeyPreview from './AnswerKeyPreview'
import ExportDialog from './project/ExportDialog'
import { 
  ArrowLeft, Upload, Download, AlertTriangle, List, 
  Plus, Headphones, BookOpen, PenTool, FileText, CheckCircle 
} from 'lucide-react'

export default function TestBuilder({ testType, onBack }) {
  const { 
    state, 
    updateField, 
    updateNested, 
    updatePassage, 
    setAudio, 
    setImage, 
    addQuestion, 
    updateQuestion, 
    removeQuestion,
    duplicateQuestion
  } = useTest()
  const toast = useToast()
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState({})
  const [showQualityCheck, setShowQualityCheck] = useState(false)
  const [showAnswerKey, setShowAnswerKey] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [generatedAnswerKey, setGeneratedAnswerKey] = useState({})
  const audioInputRefs = useRef([])
  const imageInputRef = useRef(null)
  
  const testData = state[testType]
  
  const handleFileUpload = async (event, fileType, partIndex = null) => {
    const file = event.target.files[0]
    if (!file) return
    
    if (fileType === 'audio') {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('Audio file too large. Maximum size is 50MB.')
        return
      }
      
      try {
        const duration = await getAudioDuration(file)
        setAudio(partIndex, file, duration)
        toast.success(`Audio uploaded for Part ${partIndex + 1}!`)
      } catch (err) {
        toast.error('Error processing audio file')
      }
    } else if (fileType === 'image') {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image file too large. Maximum size is 10MB.')
        return
      }
      setImage(file)
      toast.success('Image uploaded successfully!')
    }
  }

  const calculateProgress = () => {
    if (testType === 'listening') {
      const totalQuestions = testData.parts.reduce((sum, part) => sum + part.questions.length, 0)
      const checks = [
        testData.title.trim() !== '',
        testData.instructions.trim() !== '',
        testData.audioFiles.some(f => f !== null),
        totalQuestions > 0,
        testData.parts.every(part => 
          part.questions.every(q => q.correctAnswer || (q.questionList && q.questionList.length > 0))
        )
      ]
      return Math.round((checks.filter(Boolean).length / checks.length) * 100)
    } else if (testType === 'reading') {
      const totalQuestions = testData.passages.reduce((sum, passage) => sum + passage.questions.length, 0)
      const checks = [
        testData.title.trim() !== '',
        testData.instructions.trim() !== '',
        testData.passages.every(p => p.title.trim() && p.text.trim()),
        totalQuestions >= 40,
        testData.passages.every(passage => 
          passage.questions.every(q => q.correctAnswer)
        )
      ]
      return Math.round((checks.filter(Boolean).length / checks.length) * 100)
    } else {
      const checks = [
        testData.title.trim() !== '',
        testData.task1.prompt.trim() !== '',
        testData.task2.prompt.trim() !== '',
        testData.task1.image !== null
      ]
      return Math.round((checks.filter(Boolean).length / checks.length) * 100)
    }
  }

  const addNewQuestion = (partOrPassageIndex) => {
    const selectedType = selectedQuestionTypes[partOrPassageIndex]
    if (!selectedType) {
      toast.error('Please select a question type first.')
      return
    }

    const newQuestion = {
  type: selectedType,
  text: '',
  correctAnswer: '',
  options: selectedType === 'multiple-choice' ? { A: '', B: '', C: '' } : 
          selectedType === 'matching-features' ? [{ id: 'A', text: '' }, { id: 'B', text: '' }] : {},
  categories: selectedType === 'matching-features' ? [{ id: 1, text: '' }] : undefined,
  correctAnswers: selectedType === 'matching-features' ? {} : undefined,
  mapImage: null,
  questionList: []
}

    addQuestion(testType, newQuestion, partOrPassageIndex)
    setSelectedQuestionTypes({ ...selectedQuestionTypes, [partOrPassageIndex]: '' })
    toast.success('Question added successfully!')
  }
const handleQuestionUpdate = (partOrPassageIndex, qIndex, updated) => {
  updateQuestion(testType, partOrPassageIndex, qIndex, updated)
}

const handleQuestionRemove = (partOrPassageIndex, qIndex) => {
  removeQuestion(testType, partOrPassageIndex, qIndex)
}

const handleQuestionDuplicate = (partOrPassageIndex, qIndex) => {
  duplicateQuestion(testType, partOrPassageIndex, qIndex)
}
const generateAnswerKey = () => {
  const answers = {}
  let questionNumber = 1

  // Helper function to trim whitespace from answers
  // Handles strings, arrays, and special multiple-choice-multiple objects
  const trimAnswer = (answer) => {
    if (!answer && answer !== 0 && answer !== '') return answer;

    // Handle multiple-choice-multiple object format
    if (typeof answer === 'object' && answer.type === 'multiple') {
      return {
        ...answer,
        answers: (answer.answers || []).map(a =>
          typeof a === 'string' ? a.trim() : a
        )
      };
    }

    // Handle array of alternative answers
    if (Array.isArray(answer)) {
      return answer.map(a =>
        typeof a === 'string' ? a.trim() : a
      );
    }

    // Handle single string answer
    if (typeof answer === 'string') {
      return answer.trim();
    }

    return answer;
  };

  if (testType === 'listening') {
    testData.parts?.forEach((part) => {
      part.questions?.forEach((q) => {
        if (q.type === 'plan-map-diagram') {
          q.questionList?.forEach((item) => {
            if (item.answers && Array.isArray(item.answers) && item.answers.length > 0) {
              answers[questionNumber] = trimAnswer(item.answers.map(a => a.toUpperCase()))
            } else {
              answers[questionNumber] = trimAnswer(item.answer?.toUpperCase() || item.correctAnswer?.toUpperCase() || '')
            }
            questionNumber++
          })
        } else if (q.type === 'matching-features') {
          Object.entries(q.correctAnswers || {}).forEach(([key, value]) => {
            answers[questionNumber] = trimAnswer(value)
            questionNumber++
          })
        } else if (q.type === 'note-completion' || q.type === 'form-completion') {
          // Collect all gaps with their gapNumbers
          const allGaps = [];
          (q.items || []).forEach(item => {
            (item.fields || []).forEach(field => {
              if (field.gapNumber) {
                allGaps.push(field.gapNumber);
              }
            });
          });

          // Sort gaps by gapNumber to ensure correct order
          allGaps.sort((a, b) => a - b);

          // Map each gap to sequential question numbers
          allGaps.forEach(gapNum => {
            answers[questionNumber] = trimAnswer(q.correctAnswers?.[gapNum] || '');
            questionNumber++;
          });
        } else if (q.type === 'short-answer') {
          (q.questions || []).forEach(subQ => {
            if (subQ.correctAnswers && Array.isArray(subQ.correctAnswers) && subQ.correctAnswers.length > 0) {
              answers[questionNumber] = trimAnswer(subQ.correctAnswers)
            } else {
              answers[questionNumber] = trimAnswer(subQ.correctAnswer || '')
            }
            questionNumber++
          })
        } else if (q.type === 'matching-sentence-endings') {
          (q.sentenceBeginnings || []).forEach(beginning => {
            answers[questionNumber] = trimAnswer(beginning.correctAnswer || '')
            questionNumber++
          })
        } else if (q.type === 'table-completion') {
  const rows = q.rows || []
  rows.forEach(row => {
    const cells = Array.isArray(row) ? row : row.cells || []
    cells.forEach(cell => {
      const gaps = cell.match(/___(\d+)___/g) || []
      gaps.forEach(gap => {
        const gapNum = gap.match(/\d+/)[0]
        const answerData = q.correctAnswers?.[gapNum]
        // Handle both array (alternative answers) and string format
        answers[questionNumber] = trimAnswer(Array.isArray(answerData) ? answerData : (answerData || ''))
        questionNumber++
      })
    })
  })
} else if (q.type === 'flow-chart-completion') {
          (q.steps || [])
            .filter(step => !step.isInfoStep)
            .forEach(step => {
              const gaps = step.text.match(/___(\d+)___/g) || []
              gaps.forEach(gap => {
                const gapNum = gap.match(/\d+/)[0]
                answers[questionNumber] = trimAnswer(q.gapAnswers?.[gapNum] || '')
                questionNumber++
              })
            })
        }
         else if (q.type === 'matching-statements' || q.type === 'matching-people') {
  (q.statements || []).forEach(statement => {
    answers[questionNumber] = trimAnswer(statement.correctAnswer || '')
    questionNumber++
  })
} else if (q.type === 'mcq-table') {
  (q.questions || []).forEach(question => {
    answers[questionNumber] = trimAnswer(question.correctAnswer || '')
    questionNumber++
  })
}else if (q.type === 'multiple-choice-multiple') {
          answers[questionNumber] = trimAnswer({
            type: 'multiple',
            answers: q.correctAnswers || [],
            count: q.correctCount || 2
          })
          questionNumber += (q.correctCount || 2)
        } else if (q.type === 'summary-completion') {
          // Check if it's the new drag-and-drop format with summaryText
          if (q.summaryText) {
            // New format: extract gaps from summaryText and use correctAnswers
            const gaps = (q.summaryText || '').match(/___(\d+)___/g) || []
            const gapNumbers = gaps.map(g => parseInt(g.match(/\d+/)[0])).sort((a, b) => a - b)
            gapNumbers.forEach(gapNum => {
              answers[questionNumber] = trimAnswer(q.correctAnswers?.[gapNum] || '')
              questionNumber++
            })
          } else {
            // Old format: use summaryParts with part.correctAnswer
            (q.summaryParts || []).forEach(part => {
              if (part.hasGap) {
                answers[questionNumber] = trimAnswer(part.correctAnswer || '')
                questionNumber++
              }
            })
          }
        } else if (q.type === 'matching-information') {
          (q.statements || []).forEach((statement, idx) => {
            answers[questionNumber] = trimAnswer(q.correctAnswers?.[idx + 1] || statement.correctParagraph || '')
            questionNumber++
          })
        } else if (q.type === 'sentence-completion') {
          (q.sentences || []).forEach(sentence => {
            if (sentence.correctAnswers && Array.isArray(sentence.correctAnswers) && sentence.correctAnswers.length > 0) {
              answers[questionNumber] = trimAnswer(sentence.correctAnswers)
            } else {
              answers[questionNumber] = trimAnswer(sentence.correctAnswer || '')
            }
            questionNumber++
          })
        } else if (q.correctAnswer) {
          answers[questionNumber] = trimAnswer(q.correctAnswer)
          questionNumber++
        }
      })
    })
  } else if (testType === 'reading') {
    // READING ANSWER KEY GENERATION
    testData.passages?.forEach((passage) => {
      passage.questions?.forEach((q) => {
        if (q.type === 'multiple-choice') {
          answers[questionNumber] = trimAnswer(q.correctAnswer || '')
          questionNumber++
        } else if (q.type === 'true-false-not-given' || q.type === 'yes-no-not-given') {
          answers[questionNumber] = trimAnswer(q.correctAnswer || '')
          questionNumber++
        } else if (q.type === 'multiple-choice-multiple') {
          answers[questionNumber] = trimAnswer({
            type: 'multiple',
            answers: q.correctAnswers || [],
            count: q.correctCount || 2
          })
          questionNumber += (q.correctCount || 2)
        } else if (q.type === 'matching-information') {
          (q.statements || []).forEach((statement, idx) => {
            answers[questionNumber] = trimAnswer(q.correctAnswers?.[idx + 1] || statement.correctParagraph || '')
            questionNumber++
          })
       } else if (q.type === 'matching-headings') {
  (q.paragraphs || []).forEach((para, idx) => {
    // correctAnswers are stored as numeric keys (1, 2, 3...)
    answers[questionNumber] = trimAnswer(q.correctAnswers?.[idx + 1] || '')
    questionNumber++
  })
} else if (q.type === 'matching-features') {
          (q.categories || []).forEach((category) => {
            answers[questionNumber] = trimAnswer(q.correctAnswers?.[category.id] || '')
            questionNumber++
          })
        } else if (q.type === 'summary-completion') {
          // Check if it's the new drag-and-drop format with summaryText
          if (q.summaryText) {
            // New format: extract gaps from summaryText and use correctAnswers
            const gaps = (q.summaryText || '').match(/___(\d+)___/g) || []
            const gapNumbers = gaps.map(g => parseInt(g.match(/\d+/)[0])).sort((a, b) => a - b)
            gapNumbers.forEach(gapNum => {
              answers[questionNumber] = trimAnswer(q.correctAnswers?.[gapNum] || '')
              questionNumber++
            })
          } else {
            // Old format: use summaryParts with part.correctAnswer
            (q.summaryParts || []).forEach(part => {
              if (part.hasGap) {
                answers[questionNumber] = trimAnswer(part.correctAnswer || '')
                questionNumber++
              }
            })
          }
        } else if (q.type === 'summary-completion-type') {
          const gaps = (q.summaryText || '').match(/___(\d+)___/g) || []
          gaps.forEach(gap => {
            const gapNum = gap.match(/\d+/)[0]
            answers[questionNumber] = trimAnswer(q.correctAnswers?.[gapNum] || '')
            questionNumber++
          })
        } else if (q.type === 'matching-sentence-endings') {
          (q.sentenceBeginnings || []).forEach(beginning => {
            answers[questionNumber] = trimAnswer(beginning.correctAnswer || '')
            questionNumber++
          })
        } else if (q.type === 'note-completion' || q.type === 'form-completion') {
          // Collect all gaps with their gapNumbers
          const allGaps = [];
          (q.items || []).forEach(item => {
            (item.fields || []).forEach(field => {
              if (field.gapNumber) {
                allGaps.push(field.gapNumber);
              }
            });
          });

          // Sort gaps by gapNumber to ensure correct order
          allGaps.sort((a, b) => a - b);

          // Map each gap to sequential question numbers
          allGaps.forEach(gapNum => {
            answers[questionNumber] = trimAnswer(q.correctAnswers?.[gapNum] || '');
            questionNumber++;
          });
        } else if (q.type === 'table-completion') {
          const rows = q.rows || []
          rows.forEach(row => {
            const cells = Array.isArray(row) ? row : row.cells || []
            cells.forEach(cell => {
              const gaps = cell.match(/___(\d+)___/g) || []
              gaps.forEach(gap => {
                const gapNum = gap.match(/\d+/)[0]
                answers[questionNumber] = trimAnswer(q.correctAnswers?.[gapNum] || '')
                questionNumber++
              })
            })
          })
        } else if (q.type === 'sentence-completion') {
          (q.sentences || []).forEach(sentence => {
            if (sentence.correctAnswers && Array.isArray(sentence.correctAnswers) && sentence.correctAnswers.length > 0) {
              answers[questionNumber] = trimAnswer(sentence.correctAnswers)
            } else {
              answers[questionNumber] = trimAnswer(sentence.correctAnswer || '')
            }
            questionNumber++
          })
        } else if (q.type === 'short-answer') {
          (q.questions || []).forEach(subQ => {
            if (subQ.correctAnswers && Array.isArray(subQ.correctAnswers) && subQ.correctAnswers.length > 0) {
              answers[questionNumber] = trimAnswer(subQ.correctAnswers)
            } else {
              answers[questionNumber] = trimAnswer(subQ.correctAnswer || '')
            }
            questionNumber++
          })
        } else if (q.type === 'flow-chart-completion') {
          (q.steps || [])
            .filter(step => !step.isInfoStep)
            .forEach(step => {
              const gaps = step.text.match(/___(\d+)___/g) || []
              gaps.forEach(gap => {
                const gapNum = gap.match(/\d+/)[0]
                answers[questionNumber] = trimAnswer(q.gapAnswers?.[gapNum] || '')
                questionNumber++
              })
            })
        } else if (q.correctAnswer) {
          answers[questionNumber] = trimAnswer(q.correctAnswer)
          questionNumber++
        }
      })
    })
  }

  return answers
}

 const handleExportClick = () => {
  // Validate that we have content to export
  if (!testType) {
    toast.error('Please select a test type first')
    return
  }

  if (testType === 'listening') {
    if (!testData.parts || testData.parts.length === 0) {
      toast.error('Please add at least one part with questions')
      return
    }
  }

  if (testType === 'reading') {
    if (!testData.passages || testData.passages.length === 0) {
      toast.error('Please add at least one passage with questions')
      return
    }
  }

  if (testType === 'writing') {
    if (!testData.task1?.prompt && !testData.task2?.prompt) {
      toast.error('Please add at least one writing task')
      return
    }
  }

  // GENERATE ANSWER KEY BEFORE EXPORT
  console.log('Generating answer key...');
  const answerKey = generateAnswerKey();
  console.log('Generated answer key:', answerKey);
  
  // Store it in state so ExportDialog can use it
  setGeneratedAnswerKey(answerKey);

  // Show export dialog
  setShowExportDialog(true)
}
return (
    <div className="index bg-white rounded-2xl shadow-lg p-8 border border-gray-200 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-gray-200">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-3 hover:bg-blue-600 hover:bg-opacity-20 rounded-xl transition-colors border border-gray-200"
          >
            <ArrowLeft className="w-6 h-6 text-blue-600" />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 capitalize flex items-center gap-3">
              <span className="text-blue-600 font-bold">CDI</span>
              {testType} Test Builder
            </h2>
            <p className="text-gray-500">Configure your CDI {testType} test</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowQualityCheck(true)} 
            className="flex items-center gap-2 px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-xl transition-colors border border-orange-300"
          >
            <AlertTriangle className="w-4 h-4" />
            Quality Check
          </button>
          {testType !== 'writing' && (
            <button 
              onClick={() => setShowAnswerKey(true)} 
              className="flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-xl transition-colors border border-green-300"
            >
              <List className="w-4 h-4" />
              Answer Key
            </button>
          )}
          <button 
            onClick={handleExportClick}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-300 shadow-lg font-semibold"
          >
            <Download className="w-4 h-4" />
            Export Test
          </button>
        </div>
      </div>

      <div className="bg-white bg-opacity-90 rounded-2xl p-6 mb-8 border border-gray-200">
  <h3 className="text-lg font-semibold mb-4 text-gray-900">Test Completion Progress</h3>
  <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
    <div 
      className="bg-blue-600 h-4 rounded-full transition-all duration-500 shadow-sm" 
      style={{ width: `${calculateProgress()}%` }} 
    />
  </div>
  <div className="flex justify-between items-center">
    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
      calculateProgress() === 100 ? 'bg-green-500 text-white border-2 border-green-400' :
      calculateProgress() >= 50 ? 'bg-orange-500 text-white border-2 border-orange-400' :
      'bg-gray-200 text-gray-600 border-2 border-gray-300'
    }`}>
      {calculateProgress() === 100 ? 'Ready to Export' :
       calculateProgress() >= 50 ? 'In Progress' : 'Getting Started'}
    </span>
    <span className="text-blue-600 font-bold text-xl">{calculateProgress()}% Complete</span>
  </div>
</div>

      <div className="space-y-8">
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
          <h3 className="text-xl font-semibold mb-6 text-blue-600">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Test Title</label>
              <input
                type="text"
                value={testData.title}
                onChange={(e) => updateField(testType, 'title', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-gray-200"
                placeholder="Enter your test title..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Instructions</label>
              <textarea
                value={testData.instructions}
                onChange={(e) => updateField(testType, 'instructions', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-gray-200"
                rows="3"
                placeholder="Enter test instructions..."
              />
            </div>
           <div>
  <label className="block text-sm font-semibold text-gray-600 mb-2">
    Test Duration (minutes)
  </label>
  <input
    type="number"
    min="1"
    max="180"
    value={testData.duration !== undefined ? testData.duration : (testType === 'listening' ? 30 : testType === 'reading' ? 60 : 60)}
    onChange={(e) => {
      const value = e.target.value
      // Allow empty string while typing
      if (value === '') {
        updateField(testType, 'duration', '')
      } else {
        const numValue = parseInt(value)
        if (!isNaN(numValue) && numValue >= 1 && numValue <= 180) {
          updateField(testType, 'duration', numValue)
        }
      }
    }}
    onBlur={(e) => {
      // Set default if empty on blur
      if (e.target.value === '') {
        updateField(testType, 'duration', testType === 'listening' ? 30 : 60)
      }
    }}
    className="w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-gray-200"
    placeholder={`Default: ${testType === 'listening' ? '30' : '60'} minutes`}
  />
  <p className="text-sm text-gray-500 mt-2">
    {testType === 'listening' && 'Default: 30 minutes for Listening test'}
    {testType === 'reading' && 'Default: 60 minutes for Reading test'}
    {testType === 'writing' && 'Default: 60 minutes for Writing test'}
  </p>
</div>
          </div>
        </div>

        {testType === 'listening' && (
          <>
            {testData.parts.map((part, partIndex) => (
              <div key={partIndex} className="bg-gray-50 rounded-2xl p-6 border-2 border-blue-500">
                <h3 className="text-xl font-semibold mb-6 text-blue-400 flex items-center gap-3">
                  <Headphones className="w-6 h-6" />
                  Part {partIndex + 1}
                  {testData.audioFiles[partIndex] && (
                    <span className="ml-3 text-sm font-normal text-green-400 flex items-center gap-1 bg-green-900 bg-opacity-30 px-3 py-1 rounded-full border border-green-500">
                      <CheckCircle className="w-4 h-4" />
                      Audio uploaded
                    </span>
                  )}
                </h3>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Audio File for Part {partIndex + 1}</label>
                  <div
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                      testData.audioFiles[partIndex] ? 'border-gray-200 bg-blue-600 bg-opacity-10' : 'border-gray-300 hover:border-gray-200'
                    }`}
                    onClick={() => audioInputRefs.current[partIndex]?.click()}
                  >
                    <input
                      ref={el => audioInputRefs.current[partIndex] = el}
                      type="file"
                      accept=".mp3,.wav,.ogg,.m4a"
                      onChange={(e) => handleFileUpload(e, 'audio', partIndex)}
                      className="hidden"
                    />
                    <Upload className="w-12 h-12 text-gray-500 mb-4 mx-auto" />
                    {testData.audioFiles[partIndex] ? (
                      <div>
                        <p className="text-lg font-semibold text-blue-600 mb-2">{testData.audioFiles[partIndex].name}</p>
                        <p className="text-sm text-gray-500">
                          Size: {(testData.audioFiles[partIndex].size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg font-semibold text-gray-600 mb-2">Click to upload audio for Part {partIndex + 1}</p>
                        <p className="text-sm text-gray-500">MP3, WAV, OGG, M4A (max 50MB)</p>
                      </div>
                    )}
                  </div>
                </div>

 

{/* Questions list */}
{part.questions.map((question, qIndex) => (
  <QuestionForm
    key={question.id}
    question={question}
    testType="listening"
    onUpdate={(updated) => handleQuestionUpdate(partIndex, qIndex, updated)}
    onRemove={() => handleQuestionRemove(partIndex, qIndex)}
    onDuplicate={() => handleQuestionDuplicate(partIndex, qIndex)}
    questionIndex={qIndex}
  />
))}

{/* Fixed add question controls at bottom */}
<div className="bg-white border border-gray-200 rounded-xl p-4 shadow-lg mb-6">
    <h4 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-3">
      <Headphones className="w-5 h-5 text-blue-400" />
      Questions for Part {partIndex + 1}
      <span className="ml-3 text-sm font-normal text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-300">
        {part.questions?.length || 0} questions
      </span>
    </h4>
    <div className="flex gap-4">
      <select
        value={selectedQuestionTypes[partIndex] || ''}
        onChange={(e) => setSelectedQuestionTypes({ ...selectedQuestionTypes, [partIndex]: e.target.value })}
        className="flex-1 px-4 py-3 border border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-gray-200"
      >
        <option value="">Select question type...</option>
        {listeningQuestionTypes.map(type => (
          <option key={type.id} value={type.id}>{type.name}</option>
        ))}
      </select>
      <button
        onClick={() => addNewQuestion(partIndex)}
        className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-gray-900 rounded-xl transition-all duration-300 shadow-lg font-semibold"
      >
        <Plus className="w-4 h-4" />
        Add Question
      </button>
    </div>
</div>
              </div>
            ))}
          </>
        )}

        {testType === 'reading' && (
          <>
            {testData.passages.map((passage, passageIndex) => (
              <div key={passageIndex} className="bg-gray-50 rounded-2xl p-6 border border-green-300">
                <h3 className="text-xl font-semibold mb-6 text-green-400 flex items-center gap-3">
                  <BookOpen className="w-6 h-6" />
                  Passage {passageIndex + 1}
                </h3>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Passage Title</label>
                    <input
                      type="text"
                      value={passage.title}
                      onChange={(e) => updatePassage(passageIndex, 'title', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-gray-200"
                      placeholder={`Enter title for passage ${passageIndex + 1}...`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Passage Text</label>
                    <textarea
                      value={passage.text}
                      onChange={(e) => updatePassage(passageIndex, 'text', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-gray-200"
                      rows="8"
                      placeholder={`Enter the full text for passage ${passageIndex + 1}...`}
                    />
                  </div>
                </div>



{/* Questions list */}


{passage.questions.map((question, qIndex) => (
  <QuestionForm
    key={question.id}
    question={question}
    testType={testType}
    onUpdate={(updated) => handleQuestionUpdate(passageIndex, qIndex, updated)}
    onRemove={() => handleQuestionRemove(passageIndex, qIndex)}
    onDuplicate={() => handleQuestionDuplicate(passageIndex, qIndex)}
    questionIndex={qIndex}
  />
))}

{/* Add question controls - now appears after all questions */}
<div>
  <h4 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-3">
    <FileText className="w-5 h-5 text-green-400" />
    Questions for Passage {passageIndex + 1}
    <span className="ml-3 text-sm font-normal text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-300">
      {passage.questions?.length || 0} questions
    </span>
  </h4>
  <div className="flex gap-4 mb-6">
    <select
      value={selectedQuestionTypes[passageIndex] || ''}
      onChange={(e) => setSelectedQuestionTypes({ ...selectedQuestionTypes, [passageIndex]: e.target.value })}
      className="flex-1 px-4 py-3 border border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-gray-200"
    >
      <option value="">Select question type...</option>
      {readingQuestionTypes.map(type => (
        <option key={type.id} value={type.id}>{type.name}</option>
      ))}
    </select>
    <button
      onClick={() => addNewQuestion(passageIndex)}
      className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-gray-900 rounded-xl transition-all duration-300 shadow-lg font-semibold"
    >
      <Plus className="w-4 h-4" />
      Add Question
    </button>
  </div>
</div>
              </div>
            ))}
          </>
        )}

        {testType === 'writing' && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-2xl p-6 border-2 border-purple-500">
              <h3 className="text-xl font-semibold mb-6 text-purple-400 flex items-center gap-3">
                <PenTool className="w-6 h-6" />
                Writing Task 1 (Academic)
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Task 1 Prompt</label>
                  <textarea
                    value={testData.task1.prompt}
                    onChange={(e) => updateNested(testType, 'task1', 'prompt', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-gray-200"
                    rows="4"
                    placeholder="Enter Task 1 instructions..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Task 1 Chart/Graph/Diagram</label>
                  <div
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                      testData.task1.image ? 'border-gray-200 bg-blue-600 bg-opacity-10' : 'border-gray-300 hover:border-gray-200'
                    }`}
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.gif,.svg"
                      onChange={(e) => handleFileUpload(e, 'image')}
                      className="hidden"
                    />
                    <Upload className="w-12 h-12 text-gray-500 mb-4 mx-auto" />
                    {testData.task1.image ? (
                      <div>
                        <p className="text-lg font-semibold text-blue-600 mb-2">{testData.task1.image.name}</p>
                        <p className="text-sm text-gray-500">
                          Size: {(testData.task1.image.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg font-semibold text-gray-600 mb-2">Click to upload chart/graph</p>
                        <p className="text-sm text-gray-500">JPG, PNG, GIF, SVG (max 10MB)</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border-2 border-purple-500">
              <h3 className="text-xl font-semibold mb-6 text-purple-400 flex items-center gap-3">
                <PenTool className="w-6 h-6" />
                Writing Task 2 (Essay)
              </h3>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Task 2 Prompt</label>
                <textarea
                  value={testData.task2.prompt}
                  onChange={(e) => updateNested(testType, 'task2', 'prompt', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-gray-200"
                  rows="6"
                  placeholder="Enter Task 2 essay question..."
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {showQualityCheck && <QualityChecker testType={testType} testData={testData} onClose={() => setShowQualityCheck(false)} />}
      {showAnswerKey && <AnswerKeyPreview testType={testType} testData={testData} onClose={() => setShowAnswerKey(false)} />}
        {/* Export Dialog */}
        {showExportDialog && (() => {
  console.log('Project Name being passed to ExportDialog:', state.projectName);
  return null;
})()}
{showExportDialog && (
  <ExportDialog 
    answerKey={generatedAnswerKey}
    project={{
      type: testType,
      projectName: state.projectName || 'IELTS Test',
      listening: state.listening,
      reading: state.reading,
      writing: state.writing,
    }}
    onClose={() => setShowExportDialog(false)}
  />
)}
    </div>
  )
}