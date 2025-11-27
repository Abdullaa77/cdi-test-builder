import { X, Copy, CheckCircle } from 'lucide-react'
import { useState } from 'react'

export default function AnswerKeyPreview({ testType, testData, onClose }) {
  const [copied, setCopied] = useState(false)

  const generateAnswerKeyByParts = () => {
    const partKeys = []

    if (testType === 'listening') {
      testData.parts?.forEach((part, partIndex) => {
        const answers = {}
        let questionNumber = 1

        part.questions?.forEach((q) => {
          if (q.type === 'plan-map-diagram') {
            (q.questionList || []).forEach(item => {
              answers[questionNumber] = item.answer?.toUpperCase() || item.correctAnswer?.toUpperCase() || ''
              questionNumber++
            })
          } else if (q.type === 'multiple-choice-multiple') {
            (q.correctAnswers || []).forEach((answerId) => {
              answers[questionNumber] = answerId
              questionNumber++
            })
          } else if (q.type === 'matching-features') {
  (q.categories || []).forEach((category) => {
    answers[questionNumber] = q.correctAnswers?.[category.id] || ''
    questionNumber++
  })
          } else if (q.type === 'note-completion' || q.type === 'form-completion') {
            (q.items || []).forEach(item => {
              item.fields.forEach(field => {
                if (field.gapNumber) {
                  answers[questionNumber] = q.correctAnswers?.[field.gapNumber] || ''
                  questionNumber++
                }
              })
            })
          } else if (q.type === 'short-answer') {
            (q.questions || []).forEach(subQ => {
              answers[questionNumber] = subQ.correctAnswer || ''
              questionNumber++
            })
          } else if (q.type === 'matching-sentence-endings') {
            (q.sentenceBeginnings || []).forEach(beginning => {
              answers[questionNumber] = beginning.correctAnswer || ''
              questionNumber++
            })
          } else if (q.type === 'table-completion') {
  const gaps = []
  ;(q.rows || []).forEach(row => {
    const cells = Array.isArray(row) ? row : (row.cells || [])
    cells.forEach(cell => {
      // Check if cell exists and is a string before trying to match
      if (cell && typeof cell === 'string') {
        const cellGaps = cell.match(/___(\d+)___/g) || []
        cellGaps.forEach(gap => {
          const gapNum = gap.match(/\d+/)[0]
          gaps.push(gapNum)
        })
      }
    })
  })
  gaps.forEach(gapNum => {
    answers[questionNumber] = q.correctAnswers?.[gapNum] || ''
    questionNumber++
  })
          } else if (q.type === 'flow-chart-completion') {
  const allGaps = []
  ;(q.steps || []).forEach(step => {
    // Check if step.text exists before trying to match
    if (step && step.text) {
      const stepGaps = step.text.match(/___(\d+)___/g) || []
      stepGaps.forEach(gap => {
        const gapNum = gap.match(/\d+/)[0]
        allGaps.push(gapNum)
      })
    }
  })
  const uniqueGaps = [...new Set(allGaps)].sort((a, b) => a - b)
  uniqueGaps.forEach(gapNum => {
    answers[questionNumber] = q.gapAnswers?.[gapNum] || ''
    questionNumber++
  })
          } else if (q.type === 'summary-completion') {
            // Check if it's the new drag-and-drop format with summaryText
            if (q.summaryText) {
              // New format: extract gaps from summaryText and use correctAnswers
              const gaps = (q.summaryText || '').match(/___(\d+)___/g) || []
              const gapNumbers = gaps.map(g => parseInt(g.match(/\d+/)[0])).sort((a, b) => a - b)
              gapNumbers.forEach(gapNum => {
                answers[questionNumber] = q.correctAnswers?.[gapNum] || ''
                questionNumber++
              })
            } else {
              // Old format: use summaryParts with part.correctAnswer
              (q.summaryParts || []).forEach(part => {
                if (part.hasGap) {
                  answers[questionNumber] = part.correctAnswer || ''
                  questionNumber++
                }
              })
            }
          } else if (q.type === 'sentence-completion') {
            (q.sentences || []).forEach(sentence => {
              answers[questionNumber] = sentence.correctAnswer || ''
              questionNumber++
            })
          } else if (q.correctAnswer) {
            answers[questionNumber] = q.correctAnswer
            questionNumber++
          }
        })

        partKeys.push({ partNumber: partIndex + 1, answers })
      })
    } else if (testType === 'reading') {
  testData.passages?.forEach((passage, passageIndex) => {
    const answers = {}
    let questionNumber = 1

    passage.questions?.forEach((q) => {
      if (q.type === 'multiple-choice-multiple') {
        (q.correctAnswers || []).forEach((answerId) => {
          answers[questionNumber] = answerId
          questionNumber++
        })
      } else if (q.type === 'matching-information') {
        (q.statements || []).forEach((statement, idx) => {
          const answer = q.correctAnswers?.[idx + 1] || statement.correctParagraph || ''
          answers[questionNumber] = answer.toString().toUpperCase()
          questionNumber++
        })
      } else if (q.type === 'matching-headings') {
        (q.paragraphs || []).forEach((para, idx) => {
          answers[questionNumber] = q.correctAnswers?.[idx + 1] || q.correctAnswers?.[questionNumber] || ''
          questionNumber++
        })
      } else if (q.type === 'matching-features') {
        (q.categories || []).forEach((category, idx) => {
          answers[questionNumber] = q.correctAnswers?.[category.id] || q.correctAnswers?.[questionNumber] || ''
          questionNumber++
        })
      } else if (q.type === 'matching-sentence-endings') {
  (q.sentenceBeginnings || []).forEach((beginning) => {
    answers[questionNumber] = beginning.correctAnswer || q.correctAnswers?.[beginning.id] || ''
    questionNumber++
  })
} else if (q.type === 'summary-completion') {
  // Check if it's the new drag-and-drop format with summaryText
  if (q.summaryText) {
    // New format: extract gaps from summaryText and use correctAnswers
    const gaps = (q.summaryText || '').match(/___(\d+)___/g) || []
    const gapNumbers = gaps.map(g => parseInt(g.match(/\d+/)[0])).sort((a, b) => a - b)
    gapNumbers.forEach(gapNum => {
      answers[questionNumber] = q.correctAnswers?.[gapNum] || ''
      questionNumber++
    })
  } else {
    // Old format: use summaryParts with part.correctAnswer
    (q.summaryParts || []).forEach(part => {
      if (part.hasGap) {
        answers[questionNumber] = part.correctAnswer || ''
        questionNumber++
      }
    })
  }
} else if (q.type === 'summary-completion-type') {
  // TYPE version - uses correctAnswers object with gap numbers
  const gaps = (q.summaryText || '').match(/___(\d+)___/g) || []
  const gapNumbers = gaps.map(g => parseInt(g.match(/\d+/)[0])).sort((a, b) => a - b)
  gapNumbers.forEach(gapNum => {
    answers[questionNumber] = q.correctAnswers?.[gapNum] || ''
    questionNumber++
  })
      } else if (q.type === 'note-completion' || q.type === 'form-completion') {
  (q.items || []).forEach(item => {
    item.fields.forEach(field => {
      if (field.gapNumber) {
        answers[questionNumber] = q.correctAnswers?.[field.gapNumber] || ''
        questionNumber++
      }
    })
  })
} else if (q.type === 'table-completion') {
  const allGaps = []
  ;(q.rows || []).forEach(row => {
    const cells = Array.isArray(row) ? row : (row.cells || [])
    cells.forEach(cell => {
      const gaps = (cell || '').match(/___(\d+)___/g) || []
      gaps.forEach(gap => {
        const gapNum = parseInt(gap.match(/\d+/)[0])
        allGaps.push(gapNum)
      })
    })
  })
  
  const uniqueGaps = [...new Set(allGaps)].sort((a, b) => a - b)
  uniqueGaps.forEach(gapNum => {
    answers[questionNumber] = q.correctAnswers?.[gapNum] || ''
    questionNumber++
  })
      } else if (q.type === 'sentence-completion') {
        (q.sentences || []).forEach(sentence => {
          answers[questionNumber] = sentence.correctAnswer || ''
          questionNumber++
        })
      } else if (q.type === 'short-answer') {
        (q.questions || []).forEach(subQ => {
          answers[questionNumber] = subQ.correctAnswer || ''
          questionNumber++
        })
      } else if (q.correctAnswer) {
        answers[questionNumber] = q.correctAnswer
        questionNumber++
      }
    })

    partKeys.push({ partNumber: passageIndex + 1, answers })
  })
}

    return partKeys
  }

  const partKeys = generateAnswerKeyByParts()

  const copyToClipboard = () => {
    let text = `${testType.toUpperCase()} TEST - ANSWER KEY\n\n`
    
    partKeys.forEach(({ partNumber, answers }) => {
      text += `PART ${partNumber}\n`
      Object.entries(answers).forEach(([q, a]) => {
        text += `${q}. ${a}\n`
      })
      text += '\n'
    })

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900">Answer Key Preview</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors bg-[black]">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          {partKeys.map(({ partNumber, answers }) => (
            <div key={partNumber} className="mb-6">
              <h4 className="text-lg font-bold text-gray-800 mb-3 bg-blue-600 px-4 py-2 rounded-lg">
                Part {partNumber}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(answers).map(([questionNum, answer]) => (
                  <div key={questionNum} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="text-sm text-gray-600">Question {questionNum}</div>
                    <div className="text-lg font-bold text-gray-900">{answer || 'Not set'}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={copyToClipboard}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-gray-900 rounded-xl transition-all duration-300 shadow-lg font-semibold"
          >
            {copied ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copy to Clipboard
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}