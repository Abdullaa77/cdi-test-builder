async function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
async function audioToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
import { generateAuthComponent, generateAuthStyles, generateAuthScript } from './authComponent'
import { generateStartScreenComponent, generateStartScreenStyles, generateStartScreenScript } from './startScreenComponent'
import { JSPDF_INLINE_SCRIPT } from './jspdfBundle'

export async function generateListeningHTML(testData, projectName, answerKey, branding) {
  // Default branding values - handle null/undefined branding
  const safeBranding = branding || {}
  const {
    primary_color = '#3B82F6',
    secondary_color = '#1E40AF', 
    accent_color = '#F59E0B',
    logo_base64 = null,
    telegram_username = '',
    academy_name = 'Your Academy'
  } = safeBranding

  // Generate questions HTML for all parts
 for (let part of testData.parts) {
    for (let question of part.questions) {
      if (question.type === 'plan-map-diagram' && question.mapImage) {
        // Handle different storage formats
        if (question.mapImage.base64) {
          // Already has base64 property
          question.mapImageBase64 = question.mapImage.base64
        } else if (question.mapImage.file instanceof File) {
          // Has file object, convert it
          question.mapImageBase64 = await imageToBase64(question.mapImage.file)
        } else if (typeof question.mapImage === 'string') {
          // Already a base64 string
          question.mapImageBase64 = question.mapImage
        } else if (question.mapImage instanceof File) {
          // Direct File object
          question.mapImageBase64 = await imageToBase64(question.mapImage)
        }
      }
    }
  }
  // Convert audio files to base64
console.log('Starting audio conversion...')
console.log('Audio files array:', testData.audioFiles)

for (let partIndex = 0; partIndex < testData.parts.length; partIndex++) {
  const audioFile = testData.audioFiles?.[partIndex]
  console.log(`Part ${partIndex + 1} audio file:`, audioFile)
  
  if (audioFile instanceof File) {
    console.log(`Converting audio for Part ${partIndex + 1}...`)
    testData.parts[partIndex].audioBase64 = await audioToBase64(audioFile)
    console.log(`Part ${partIndex + 1} audio converted. Base64 preview:`, testData.parts[partIndex].audioBase64?.substring(0, 100))
  } else {
    console.log(`Part ${partIndex + 1} has no valid audio file`)
  }
}

console.log('Audio conversion complete')
  let questionsHTML = ''
  let questionNumber = 1
  
  testData.parts.forEach((part, partIndex) => {
  const partStartQuestion = questionNumber
  const partEndQuestion = partStartQuestion + part.questions.reduce((total, q) => {
  // Count actual number of questions for each type
  if (q.type === 'plan-map-diagram' && q.questionList) {
    return total + q.questionList.length
  } else if (q.type === 'table-completion' && q.rows) {
    // Count gaps in table cells
    const gapCount = q.rows.reduce((count, row) => {
      const cells = Array.isArray(row) ? row : row.cells || []
      return count + cells.join('').match(/___\d+___/g)?.length || 0
    }, 0)
    return total + gapCount
  } else if (q.type === 'flow-chart-completion' && q.steps) {
    // Count gaps in flowchart steps
    const gapCount = q.steps.reduce((count, step) => {
      return count + (step.text.match(/___\d+___/g)?.length || 0)
    }, 0)
    return total + gapCount
  } else if (q.type === 'summary-completion') {
    // FIXED: Hardcoded HTML always has 6 gaps
    return total + 6
  } else if (q.type === 'multiple-choice-multiple') {
    // FIX: Count required answers for MCQ multiple
    return total + (q.numberOfAnswers || q.correctCount || 2)
  } else if (q.type === 'sentence-completion' && q.sentences) {
    return total + q.sentences.length
  } else if (q.type === 'note-completion' && q.items) {
    const gapCount = q.items.reduce((count, item) => {
      return count + item.fields.filter(f => f.gapNumber).length
    }, 0)
    return total + gapCount
  } else if (q.type === 'form-completion' && q.items) {
    // Same as note-completion
    const gapCount = q.items.reduce((count, item) => {
      return count + item.fields.filter(f => f.gapNumber).length
    }, 0)
    return total + gapCount
  } else if (q.type === 'short-answer' && q.questions) {
    return total + q.questions.length
  } else if (q.type === 'matching-sentence-endings' && q.sentenceBeginnings) {
    return total + q.sentenceBeginnings.length
  } else if (q.type === 'matching-features' && q.categories) {
    return total + q.categories.length
  }
  return total + 1
}, 0) - 1

  questionsHTML += `
    <div id="part-${partIndex + 1}" class="question-part ${partIndex > 0 ? 'hidden' : ''}">
      <div class="part-header">
        <p><strong>Part ${partIndex + 1}</strong></p>
        <p>Listen and answer questions ${partStartQuestion}-${partEndQuestion}.</p>
      </div>
      ${part.audioBase64 ? `
      <audio id="audio-part-${partIndex + 1}" controls>
        <source src="${part.audioBase64}" type="audio/mpeg">
      </audio>
      <script>
        console.log('Audio element created for Part ${partIndex + 1}')
        console.log('Audio src length:', '${part.audioBase64}'.length)
      </script>
    ` : `
      <script>
        console.log('No audio base64 found for Part ${partIndex + 1}')
      </script>
    `}
    <div class="questions-container">
  `
  
  part.questions.forEach((question) => {
    if (question.type === 'multiple-choice') {
      questionsHTML += `
        <div class="question" data-q="${questionNumber}">
          <p class="question-text"><span class="question-number">${questionNumber}.</span> ${question.text || ''}</p>
          <div class="options">
            ${Object.entries(question.options || {}).map(([key, value]) => `
              <label class="option-label">
                <input type="radio" name="q${questionNumber}" value="${key}">
                <span class="option-text"><strong>${key})</strong> ${value}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `
      questionNumber++
    } else if (question.type === 'fill-in-blank' ) {
      questionsHTML += `
        <div class="question" data-q="${questionNumber}">
          <p class="question-text"><span class="question-number">${questionNumber}.</span> ${question.text || ''}</p>
          <input type="text" class="answer-input" id="q${questionNumber}" placeholder="Your answer">
        </div>
      `
      questionNumber++
    } else if (question.type === 'true-false-not-given' || question.type === 'yes-no-not-given') {
      const options = question.type === 'true-false-not-given' ? ['TRUE', 'FALSE', 'NOT GIVEN'] : ['YES', 'NO', 'NOT GIVEN']
      questionsHTML += `
        <div class="question" data-q="${questionNumber}">
          <p class="question-text"><span class="question-number">${questionNumber}.</span> ${question.text || ''}</p>
          <div class="options">
            ${options.map(opt => `
              <label class="option-label">
                <input type="radio" name="q${questionNumber}" value="${opt}">
                <span class="option-text">${opt}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `
      questionNumber++
    } else if (question.type === 'plan-map-diagram') {
      questionsHTML += `
        <div class="question map-diagram-question" data-q-start="${questionNumber}">
          <p class="question-instruction">${question.text || ''}</p>
          <div class="map-container">
            <div class="map-image-panel">
              ${question.mapImageBase64 ? `<img src="${question.mapImageBase64}" class="map-image" alt="Map diagram">` : '<div class="no-image-placeholder">No map image provided</div>'}
            </div>
            <div class="map-questions-panel">
              <div class="map-questions">
                ${(question.questionList || []).map(item => {
                  const currentQ = questionNumber++
                  return `
                    <div class="map-question-item">
                      <span class="question-number">${currentQ}.</span>
                      <span class="question-word">${item.word}</span>
                      <input type="text" class="answer-input" id="q${currentQ}" placeholder="Your answer">
                    </div>
                  `
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      `
      } else if (question.type === 'matching-features') {
  questionsHTML += `
    <div class="question matching-features-box-style">
      <p class="question-instruction">${question.instruction || 'Which option matches each description?'}</p>
      <p class="matching-subtext">${question.subInstruction || 'Choose your answers from the box and write the correct letter next to the questions.'}</p>
      
      <!-- Options Box -->
      <div class="options-box">
        ${(question.options || []).map(opt => `
          <div class="option-row">
            <span class="option-letter-label">${opt.id}</span>
            <span class="option-text-label">${opt.text}</span>
          </div>
        `).join('')}
      </div>
      
      <!-- Questions List -->
      <div class="matching-questions-list">
        ${(question.categories || []).map(category => {
          const currentQ = questionNumber++
          return `
            <div class="matching-question-item">
              <span class="question-number">${currentQ}</span>
              <span class="question-text">${category.text}</span>
              <input type="text" class="answer-input letter-input" id="q${currentQ}" placeholder="..." maxlength="1">
            </div>
          `
        }).join('')}
      </div>
    </div>
  `
}
     else if (question.type === 'note-completion' || question.type === 'form-completion') {
  // FIX: Collect all gapNumbers and create mapping to sequential question numbers
  // This matches the answer key generation logic in TestBuilder.js
  const gapToQuestionMap = {};
  const allGaps = [];

  (question.items || []).forEach(item => {
    (item.fields || []).forEach(field => {
      if (field.gapNumber || (!field.isInfoLine && field.gapNumber !== null)) {
        allGaps.push(field.gapNumber);
      }
    });
  });

  // Sort and assign sequential question numbers (matching answer key logic)
  allGaps.sort((a, b) => a - b);
  allGaps.forEach(gapNum => {
    gapToQuestionMap[gapNum] = questionNumber++;
  });

  questionsHTML += `
    <div class="question note-completion-question">
      <p class="word-limit-notice">Write <strong>${question.wordLimitText || 'NO MORE THAN TWO WORDS'}</strong></p>
      ${question.title ? `<h4 class="note-title">${question.title}</h4>` : ''}
      <div class="note-items">
        ${(question.items || []).map(item => `
          <div class="note-item">
            <div class="note-item-label">${item.label}</div>
            <div class="note-fields">
              ${item.fields.map(field => {
                if (field.gapNumber || (!field.isInfoLine && field.gapNumber !== null)) {
                  // Field with gap - use pre-assigned question number from sorted mapping
                  const currentQ = gapToQuestionMap[field.gapNumber];
                  return `
                    <div class="note-field">
                      <span class="field-prefix">${field.prefix} </span>
                      ${field.textBeforeGap ? `<span class="field-text">${field.textBeforeGap} </span>` : ''}
                      <span class="question-number">${field.gapNumber}.</span>
                      <input type="text" class="answer-input note-gap-input" id="q${currentQ}" placeholder="Answer">
                      ${field.suffix ? `<span class="field-suffix"> ${field.suffix}</span>` : ''}
                    </div>
                  `
                } else {
                  // Info field (no gap)
                  return `
                    <div class="note-field-info" style="padding: 8px 0; color: #555; font-style: italic;">
                      ${field.prefix ? `<span class="field-prefix" style="font-weight: 500;">${field.prefix} </span>` : ''}
                      <span class="field-text">${field.text || field.textBeforeGap || ''}</span>
                    </div>
                  `
                }
              }).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `
} else if (question.type === 'short-answer') {
  if (question.questions && Array.isArray(question.questions)) {
    // Multiple sub-questions format
    questionsHTML += `
      <div class="question short-answer-group">
        <p class="question-instruction">${question.instruction || 'Answer the questions below.'}</p>
        <p class="word-limit-notice">Write NO MORE THAN <strong>${question.wordLimit || 3}</strong> WORD${(question.wordLimit || 3) > 1 ? 'S' : ''}</p>
        <div class="short-answer-questions">
          ${question.questions.map(subQ => {
            const currentQ = questionNumber++
            return `
              <div class="short-answer-item">
                <label class="short-answer-label">
                  <span class="question-number">${currentQ}.</span>
                  <span class="question-text">${subQ.text}</span>
                </label>
                <input type="text" class="answer-input" id="q${currentQ}" placeholder="Your answer">
              </div>
            `
          }).join('')}
        </div>
      </div>
    `
  } else {
    // Single question format (fallback)
    questionsHTML += `
      <div class="question" data-q="${questionNumber}">
        <p class="question-text"><span class="question-number">${questionNumber}.</span> ${question.text || ''}</p>
        <input type="text" class="answer-input" id="q${questionNumber}" placeholder="Your answer">
      </div>
    `
    questionNumber++
  }} else if (question.type === 'matching-sentence-endings') {
  questionsHTML += `
    <div class="question matching-sentence-endings">
      <p class="question-instruction">${question.instructions || 'Complete each sentence with the correct ending.'}</p>
      
      <div class="sentence-beginnings">
        ${(question.sentenceBeginnings || []).map(beginning => {
          const currentQ = questionNumber++
          return `
            <div class="sentence-beginning-item">
              <div class="beginning-text">
                <span class="question-number">${currentQ}.</span>
                <span>${beginning.text}</span>
              </div>
              <select class="sentence-ending-select" id="q${currentQ}" name="q${currentQ}">
                <option value="">Choose ending</option>
                ${(question.sentenceEndings || []).map(ending => `
                  <option value="${ending.id}">${ending.id}</option>
                `).join('')}
              </select>
            </div>
          `
        }).join('')}
      </div>
      
      <div class="sentence-endings-box">
        <h5 class="endings-title">Sentence Endings:</h5>
        <div class="sentence-endings-list">
          ${(question.sentenceEndings || []).map(ending => `
            <div class="ending-item">
              <span class="ending-letter">${ending.id}</span>
              <span class="ending-text">${ending.text}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `}
           else if (question.type === 'table-completion') {
  questionsHTML += `
    <div class="question table-completion-question" data-q-start="${questionNumber}">
      <p class="question-instruction">${question.text || 'Complete the table below.'}</p>
      <p class="word-limit-notice">Write <strong>${question.wordLimitText || 'NO MORE THAN THREE WORDS'}</strong></p>
      ${question.title ? `<h4 style="text-align: center; margin: 15px 0; font-weight: 600;">${question.title}</h4>` : ''}
      
      <table>
        <thead>
          <tr>
            ${(question.headers || []).map(header => `
              <th style="border: 2px solid #ddd; padding: 12px; background: #f5f5f5; font-weight: 600; text-align: left;">${header}</th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${(question.rows || []).map(row => `
  <tr>
    ${(Array.isArray(row) ? row : row.cells || []).map(cell => {
                const parts = cell.split(/___(\d+)___/)
                let cellHTML = '<td style="border: 2px solid #ddd; padding: 10px;">'
                
                for (let i = 0; i < parts.length; i++) {
                  if (i % 2 === 0) {
                    cellHTML += parts[i]
                  } else {
                    const currentQ = questionNumber++
                    cellHTML += `<input type="text" class="answer-input" id="q${currentQ}" 
                      style="display: inline-block; width: 100px; padding: 6px 8px; border: 2px solid #ddd; border-radius: 4px; font-size: 14px;" 
                      placeholder="${currentQ}">`
                  }
                }
                
                cellHTML += '</td>'
                return cellHTML
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
     </div>
    `
}
   else if (question.type === 'flow-chart-completion') {
  questionsHTML += `
    <div class="question flowchart-question" data-q-start="${questionNumber}">
      <p class="question-instruction">${question.text || 'Complete the flow-chart below.'}</p>
      <p class="word-limit-notice">Write <strong>${question.wordLimitText || 'NO MORE THAN TWO WORDS'}</strong></p>
      
      ${question.backgroundImage ? `
        <div class="flowchart-bg-container">
          <img src="${question.backgroundImage}" class="flowchart-bg-image" alt="Flowchart background">
        </div>
      ` : ''}
      
      <div class="flowchart-steps">
        ${(question.steps || []).map((step, idx) => {
          const gapMatches = step.text.match(/___(\d+)___/g) || []
          let stepHTML = step.text
          
          gapMatches.forEach(match => {
            const currentQ = questionNumber++
            stepHTML = stepHTML.replace(match, `
              <select class="flowchart-gap-select" id="q${currentQ}" name="q${currentQ}">
                <option value="">Choose</option>
                ${(question.options || []).map(opt => `
                  <option value="${opt.id}">${opt.id}</option>
                `).join('')}
              </select>
            `)
          })
          
          return `
            <div class="flowchart-step">
              <span class="step-number">${idx + 1}.</span>
              <div class="step-content">${stepHTML}</div>
            </div>
          `
        }).join('')}
      </div>
      
      <div class="flowchart-options-box">
        <h5 class="options-title">Options:</h5>
        <div class="flowchart-options-grid">
          ${(question.options || []).map(opt => `
            <div class="flowchart-option-item">
              <span class="option-letter">${opt.id}</span>
              <span class="option-text">${opt.text}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `
} else if (question.type === 'summary-completion') {
  const startQ = questionNumber;
  
  questionsHTML += `
    <div class="question summary-completion-question drag-drop-question" data-q-start="${startQ}">
      <p class="question-instruction">${question.instruction || 'Complete the summary using the list of words below.'}</p>
      <p class="drag-instruction"><em>Choose the correct answer and drag it into the gap.</em></p>
      ${question.title ? `<h4 class="summary-title">${question.title}</h4>` : ''}
      
      <div class="summary-text-content">
        Students need to complete their 
        <span class="summary-drop-zone drop-zone empty" data-question="${questionNumber}">
          <span class="gap-number">1</span>
          <input type="hidden" id="q${questionNumber++}" value="">
        </span>
        and submit it to get 
        <span class="summary-drop-zone drop-zone empty" data-question="${questionNumber}">
          <span class="gap-number">2</span>
          <input type="hidden" id="q${questionNumber++}" value="">
        </span>
        from their employer. They must follow 
        <span class="summary-drop-zone drop-zone empty" data-question="${questionNumber}">
          <span class="gap-number">3</span>
          <input type="hidden" id="q${questionNumber++}" value="">
        </span>
        regulations and cannot expect the same 
        <span class="summary-drop-zone drop-zone empty" data-question="${questionNumber}">
          <span class="gap-number">4</span>
          <input type="hidden" id="q${questionNumber++}" value="">
        </span>
        as recent graduates. During the process, they need 
        <span class="summary-drop-zone drop-zone empty" data-question="${questionNumber}">
          <span class="gap-number">5</span>
          <input type="hidden" id="q${questionNumber++}" value="">
        </span>
        and 
        <span class="summary-drop-zone drop-zone empty" data-question="${questionNumber}">
          <span class="gap-number">6</span>
          <input type="hidden" id="q${questionNumber++}" value="">
        </span>
        from the employer.
      </div>
      
      <div class="word-bank-section">
        <div class="word-bank-title">Word Bank</div>
        <div class="summary-word-bank word-bank" data-question-start="${startQ}">
          ${(question.wordBank || []).map(word => `
            <div class="draggable-word summary-draggable" draggable="true" data-letter="${word.letter}" data-word="${word.word}">
              <span class="word-letter">${word.letter}</span>
              <span class="word-text">${word.word}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
} else if (question.type === 'multiple-choice-multiple') {
  const answerCount = question.numberOfAnswers || question.correctCount || 2;
  questionsHTML += `
    <div class="question mcq-multiple" data-q-start="${questionNumber}" data-q-count="${answerCount}">
      <p class="question-instruction">${question.instruction || 'Choose TWO answers.'}</p>
      <p class="question-text">${question.prompt || question.text || ''}</p>
      <p class="question-number">${questionNumber}-${questionNumber + answerCount - 1}.</p>
      <div class="options">
        ${(Array.isArray(question.options) ? question.options : []).map(option => `
          <label class="option-label">
            <input type="checkbox" name="q${questionNumber}_group" value="${option.id}" class="mcq-multiple-checkbox">
            <span class="option-text"><strong>${option.id})</strong> ${option.text}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `
  questionNumber += answerCount
}

  })
  
  
  questionsHTML += `
      </div>
    </div>
  `
  
})

  // Generate navigation buttons with proper question counts
  const navButtons = testData.parts.map((part, index) => {
    // Count questions for this part
    const questionCount = part.questions.reduce((total, q) => {
      if (q.type === 'multiple-choice' && q.options) {
        return total + 1
      } else if (q.type === 'table-completion' && q.rows) {
        const gapCount = q.rows.reduce((count, row) => {
          const cells = Array.isArray(row) ? row : (row.cells || [])
          return count + cells.reduce((cellCount, cell) => {
            const gaps = (cell || '').match(/___\d+___/g) || []
            return cellCount + gaps.length
          }, 0)
        }, 0)
        return total + gapCount
      } else if (q.type === 'flow-chart-completion' && q.steps) {
        // FIX BUG #2: Count gaps in flowchart steps
        const gapCount = q.steps.reduce((count, step) => {
          return count + (step.text.match(/___\d+___/g)?.length || 0)
        }, 0)
        return total + gapCount
      } else if (q.type === 'summary-completion') {
        // FIXED BUG #1: Always return 6 (hardcoded HTML has 6 gaps)
        // TODO: Make summary-completion dynamic like reading template
        return total + 6
      } else if (q.type === 'multiple-choice-multiple') {
        // FIX BUG #3: Count required answers for MCQ multiple
        return total + (q.numberOfAnswers || q.correctCount || 2)
      } else if (q.type === 'sentence-completion' && q.sentences) {
        return total + q.sentences.length
      } else if (q.type === 'note-completion' && q.items) {
        const gapCount = q.items.reduce((count, item) => {
          return count + item.fields.filter(f => f.gapNumber).length
        }, 0)
        return total + gapCount
      } else if (q.type === 'form-completion' && q.items) {
        // Same as note-completion
        const gapCount = q.items.reduce((count, item) => {
          return count + item.fields.filter(f => f.gapNumber).length
        }, 0)
        return total + gapCount
      } else if (q.type === 'short-answer' && q.questions) {
        return total + q.questions.length
      } else if (q.type === 'matching-sentence-endings' && q.sentenceBeginnings) {
        return total + q.sentenceBeginnings.length
      } else if (q.type === 'matching-features' && q.categories) {
        return total + q.categories.length
      } else if (q.type === 'plan-map-diagram' && q.questionList) {
        return total + q.questionList.length
      }
      return total + 1
    }, 0)
    
    return `
      <div class="footer__questionWrapper___1tZ46 ${index === 0 ? 'selected' : ''}">
        <button class="footer__questionNo___3WNct" onclick="switchToPart(${index + 1})">
          <span>
            <span class="section-prefix">Part </span>
            <span class="sectionNr">${index + 1}</span>
            <span class="attemptedCount">0 of ${questionCount}</span>
          </span>
        </button>
      </div>
    `
  }).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${testData.title} - ${academy_name}</title>
    ${JSPDF_INLINE_SCRIPT}
    <style>
        :root {
            --primary-color: ${primary_color};
            --secondary-color: ${secondary_color};
            --accent-color: ${accent_color};
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: Arial, sans-serif; 
            background-color: #ffffff;
            line-height: 1.4;
            font-size: 16px;
        }
        
        ${generateAuthStyles()}
        ${generateStartScreenStyles()}
        
        /* Header */
        .header {
            background-color: #ffffff;
            padding: 12px 20px;
            border-bottom: 2px solid #e0e0e0;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 100;
            height: 70px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
            /* Short Answer Questions */
.short-answer-group {
    background: #f9f9f9;
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 25px;
}

.question-instruction {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 10px;
    color: #333;
}

.word-limit-notice {
    background: #fff3cd;
    border: 1px solid #ffc107;
    padding: 10px 15px;
    border-radius: 5px;
    margin-bottom: 20px;
    font-size: 14px;
    color: #856404;
    text-align: center;
}

.short-answer-questions {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.short-answer-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.short-answer-label {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 16px;
    color: #333;
}

.short-answer-label .question-text {
    flex: 1;
    line-height: 1.5;
}
            /* Sentence Completion */
.sentence-completion-question {
    background: #f9f9f9;
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 25px;
    margin-bottom: 30px;
}

.sentence-list {
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
    margin-top: 15px;
}

.sentence-item {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    padding: 12px;
    background: #fafafa;
    border-radius: 6px;
    border-left: 3px solid var(--primary-color, #3B82F6);
}

.sentence-item:last-child {
    margin-bottom: 0;
}

.sentence-content {
    flex: 1;
    line-height: 1.8;
    font-size: 16px;
    color: #333;
}

.sentence-gap-input {
    display: inline-block;
    min-width: 150px;
    max-width: 250px;
    padding: 6px 12px;
    margin: 0 4px;
    border: 2px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
    vertical-align: middle;
}

.sentence-gap-input:focus {
    border-color: var(--primary-color, #3B82F6);
    outline: none;
    box-shadow: 0 0 0 3px rgba(254, 208, 1, 0.1);
}
            /* Summary Completion (Select) */
.summary-select-question {
    background: #f9f9f9;
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 25px;
    margin-bottom: 30px;
}

.summary-title {
    text-align: center;
    font-size: 18px;
    font-weight: 600;
    margin: 15px 0 20px 0;
    color: #333;
    padding-bottom: 10px;
    border-bottom: 2px solid #e0e0e0;
}

.summary-content, .summary-text-content {
    background: white;
    border-left: 4px solid var(--primary-color, #3B82F6);
    padding: 20px;
    margin: 20px 0;
    line-height: 2;
    font-size: 16px;
    color: #333;
}

.summary-gap-select {
    display: inline-block;
    min-width: 70px;
    padding: 4px 8px;
    margin: 0 3px;
    border: 2px solid var(--primary-color, #3B82F6);
    border-radius: 4px;
    background: #fffbf0;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    vertical-align: middle;
}

.summary-gap-select:focus {
    outline: none;
    border-color: var(--accent-color, #F59E0B);
    box-shadow: 0 0 0 3px rgba(254, 208, 1, 0.15);
}

.word-bank-box {
    background: #e8f4f8;
    border: 2px solid #b3d9e8;
    border-radius: 8px;
    padding: 20px;
    margin-top: 25px;
}

.word-bank-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 15px;
    color: #333;
}

.word-bank-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
}

.word-bank-item {
    display: flex;
    gap: 8px;
    padding: 8px 12px;
    background: white;
    border-radius: 6px;
    border: 1px solid #b3d9e8;
    align-items: center;
}

.word-letter {
    font-weight: bold;
    color: var(--primary-color, #3B82F6);
    background: #1a1d29;
    padding: 3px 8px;
    border-radius: 4px;
    min-width: 25px;
    text-align: center;
    font-size: 14px;
}

.word-text {
    flex: 1;
    color: #333;
    font-size: 15px;
}

/* Drag and Drop Zones for Summary Completion */
.summary-drop-zone {
    display: inline-block;
    min-width: 60px;
    min-height: 35px;
    padding: 6px 12px;
    margin: 0 4px;
    border: 2px dashed var(--primary-color, #3B82F6);
    border-radius: 6px;
    background: #fffbf0;
    text-align: center;
    vertical-align: middle;
    position: relative;
    cursor: pointer;
    transition: all 0.3s ease;
}

.summary-drop-zone.empty {
    border-style: dashed;
    background: #fffbf0;
}

.summary-drop-zone.filled {
    border-style: solid;
    border-color: var(--primary-color, #3B82F6);
    background: #fffbf0;
}

.summary-drop-zone.drag-over {
    border-color: #007bff;
    background: #f0f8ff;
    transform: scale(1.05);
}

.summary-drop-zone .gap-number {
    font-weight: bold;
    color: var(--primary-color, #3B82F6);
    font-size: 14px;
}

.summary-drop-zone .dropped-word {
    color: #333;
    font-weight: 600;
    font-size: 15px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.summary-drop-zone .remove-btn {
    background: #ff4444;
    color: white;
    border: none;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    font-size: 12px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: 6px;
    transition: all 0.2s ease;
}

.summary-drop-zone .remove-btn:hover {
    background: #cc0000;
    transform: scale(1.1);
}

/* Draggable Words */
.summary-draggable {
    cursor: grab;
    user-select: none;
    transition: all 0.3s ease;
}

.summary-draggable:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.summary-draggable.dragging {
    opacity: 0.5;
    transform: rotate(5deg) scale(1.1);
    cursor: grabbing;
}

.summary-draggable.used {
    opacity: 0.4;
    pointer-events: none;
    background: #f5f5f5 !important;
    border-color: #ccc !important;
}

.summary-word-bank {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 10px;
    margin-top: 15px;
}
            /* Flowchart Completion */
.flowchart-question {
    background: #f9f9f9;
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 25px;
    margin-bottom: 30px;
}

.flowchart-bg-container {
    text-align: center;
    margin: 20px 0;
}

.flowchart-bg-image {
    max-width: 100%;
    max-height: 400px;
    border: 2px solid #ddd;
    border-radius: 8px;
}

.flowchart-steps {
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
}

.flowchart-step {
    display: flex;
    gap: 12px;
    margin-bottom: 15px;
    padding: 12px;
    background: #fafafa;
    border-radius: 6px;
    border-left: 4px solid var(--primary-color, #3B82F6);
}

.flowchart-step:last-child {
    margin-bottom: 0;
}

.step-number {
    font-weight: bold;
    color: var(--primary-color, #3B82F6);
    min-width: 30px;
}

.step-content {
    flex: 1;
    line-height: 1.6;
}

.flowchart-gap-select {
    display: inline-block;
    min-width: 80px;
    padding: 6px 10px;
    margin: 0 4px;
    border: 2px solid var(--primary-color, #3B82F6);
    border-radius: 4px;
    background: white;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
}

.flowchart-gap-select:focus {
    outline: none;
    border-color: var(--accent-color, #F59E0B);
    box-shadow: 0 0 0 3px rgba(254, 208, 1, 0.1);
}

.flowchart-options-box {
    background: #e8f4f8;
    border: 2px solid #b3d9e8;
    border-radius: 8px;
    padding: 20px;
    margin-top: 20px;
}

.options-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 15px;
    color: #333;
}

.flowchart-options-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 12px;
}

.flowchart-option-item {
    display: flex;
    gap: 10px;
    padding: 10px;
    background: white;
    border-radius: 6px;
    border: 1px solid #b3d9e8;
}

.option-letter {
    font-weight: bold;
    color: var(--primary-color, #3B82F6);
    background: #1a1d29;
    padding: 4px 10px;
    border-radius: 4px;
    min-width: 35px;
    text-align: center;
}

.option-text {
    flex: 1;
    color: #333;
}
            /* Table Completion */
.table-completion-question {
    background: #f9f9f9;
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 25px;
}

.table-completion-question table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    background: white;
}

.table-completion-question th {
    border: 2px solid #ddd;
    padding: 12px;
    background: #f5f5f5;
    font-weight: 600;
    text-align: left;
}

.table-completion-question td {
    border: 2px solid #ddd;
    padding: 12px;
    vertical-align: middle;
}

.table-completion-question .answer-input {
    display: inline-block;
    width: 120px;
    min-width: 80px;
    padding: 6px 10px;
    margin: 0 4px;
    border: 2px solid var(--primary-color, #3B82F6);
    border-radius: 4px;
    font-size: 14px;
}

.table-completion-question .answer-input:focus {
    border-color: var(--accent-color, #F59E0B);
    outline: none;
    box-shadow: 0 0 0 3px rgba(254, 208, 1, 0.1);
}
            /* Matching Sentence Endings */
.matching-sentence-endings {
    background: #f9f9f9;
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 25px;
}

.sentence-beginnings {
    margin-bottom: 25px;
}

.sentence-beginning-item {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 15px;
    padding: 12px;
    background: white;
    border-radius: 6px;
    border: 1px solid #e0e0e0;
}

.beginning-text {
    flex: 1;
    display: flex;
    align-items: flex-start;
    gap: 8px;
}

.sentence-ending-select {
    min-width: 80px;
    padding: 8px 12px;
    border: 2px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
    background: white;
    cursor: pointer;
}

.sentence-ending-select:focus {
    border-color: var(--primary-color, #3B82F6);
    outline: none;
}

.sentence-endings-box {
    background: #e8f4f8;
    border: 2px solid #b3d9e8;
    border-radius: 8px;
    padding: 15px;
}

.endings-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    color: #333;
}

.sentence-endings-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.ending-item {
    display: flex;
    gap: 10px;
    align-items: flex-start;
}

.ending-letter {
    font-weight: bold;
    color: var(--primary-color, #3B82F6);
    background: white;
    padding: 4px 10px;
    border-radius: 4px;
    min-width: 35px;
    text-align: center;
}

.ending-text {
    flex: 1;
    color: #333;
}
        /* Short Answer Questions */
.short-answer-group {
    background: #f9f9f9;
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 25px;
}

.question-instruction {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 10px;
    color: #333;
}

.word-limit-notice {
    background: #fff3cd;
    border: 1px solid #ffc107;
    padding: 10px 15px;
    border-radius: 5px;
    margin-bottom: 20px;
    font-size: 14px;
    color: #856404;
    text-align: center;
}

.short-answer-questions {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.short-answer-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.short-answer-label {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 16px;
    color: #333;
}

.short-answer-label .question-text {
    flex: 1;
    line-height: 1.5;
}
        .header-logo {
            height: 50px;
        }
        
        .header-logo img {
            height: 100%;
            width: auto;
            object-fit: contain;
        }
        
        .timer-container {
            position: absolute;
            left: 20px;
            color: #333;
            font-size: 18px;
            font-weight: 600;
        }
        
        .candidate-info {
            position: absolute;
            right: 20px;
            color: #333;
            font-size: 14px;
            font-weight: 500;
        }
        
        /* Main Container */
        .main-container {
            margin-top: 70px;
            padding: 20px;
            padding-bottom: 100px;
            max-width: 1200px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .part-header {
            background-color: #f1f2ec;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            border: 1px solid #e0e0e0;
        }
        
        .part-header p {
            margin: 5px 0;
        }
        
        /* Questions */
        .question-part {
    display: block;
    width: 100%;
}
    .questions-container {
    width: 100%;
}
        .question {
            margin-bottom: 30px;
            padding: 15px;
            background: #fafafa;
            border-radius: 8px;
        }
        
        .question-text {
            margin-bottom: 15px;
            font-size: 16px;
            line-height: 1.6;
        }
        
        .question-number {
            font-weight: bold;
            color: #333;
            margin-right: 8px;
        }
        
        .question-instruction {
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: 500;
        }
        
        .answer-input {
            border: 2px solid #ddd;
            border-radius: 4px;
            padding: 8px 12px;
            font-size: 16px;
            width: 100%;
            max-width: 400px;
            transition: border-color 0.3s;
        }
        
        .answer-input:focus {
            border-color: var(--primary-color, #3B82F6);
            outline: none;
            box-shadow: 0 0 0 3px rgba(254, 208, 1, 0.1);
        }
        
        .options {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .option-label {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            background: #fff;
            border: 2px solid #ddd;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .option-label:hover {
            background: #fffbf0;
            border-color: var(--primary-color, #3B82F6);
        }
        
        .option-label input[type="radio"] {
            margin-right: 12px;
            transform: scale(1.2);
        }
        
        .option-label input[type="radio"]:checked {
            accent-color: var(--primary-color, #3B82F6);
        }
        /* Matching Questions */
/* Matching Features - Box Style */
.matching-features-box-style {
    background: #f9f9f9;
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 25px;
    margin-bottom: 30px;
}

.matching-subtext {
    font-style: italic;
    color: #666;
    font-size: 15px;
    margin-bottom: 20px;
}

.options-box {
    background: white;
    border: 3px solid #333;
    padding: 20px;
    margin: 20px auto;
    max-width: 500px;
}

.option-row {
    display: flex;
    gap: 15px;
    padding: 10px 0;
    border-bottom: 1px solid #eee;
}

.option-row:last-child {
    border-bottom: none;
}

.option-letter-label {
    font-weight: bold;
    font-size: 18px;
    min-width: 30px;
}

.option-text-label {
    flex: 1;
    font-size: 16px;
}

.matching-questions-list {
    margin-top: 25px;
}

.matching-question-item {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;
    padding: 12px;
    background: white;
    border-radius: 6px;
}

.matching-question-item .question-text {
    flex: 1;
}

.letter-input {
    max-width: 60px !important;
    text-align: center;
    font-size: 18px;
    font-weight: bold;
    text-transform: uppercase;
}
    /* Note/Form Completion */
.note-completion-question {
    background: #f9f9f9;
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 25px;
}

.note-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 15px;
    color: #333;
    text-align: center;
    padding-bottom: 10px;
    border-bottom: 2px solid #e0e0e0;
}

.note-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.note-item {
    background: white;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #e0e0e0;
}

.note-item-label {
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
}

.note-fields {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-left: 15px;
}

.note-field {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.field-prefix {
    color: #666;
    min-width: 20px;
}

.field-text {
    color: #333;
}

.field-suffix {
    color: #333;
}

.note-gap-input {
    max-width: 200px;
    min-width: 150px;
    display: inline-block;
}
        /* Map/Diagram Questions */
        .map-diagram-question {
            margin-bottom: 30px;
        }
        
        .map-container {
            display: flex;
            gap: 20px;
            align-items: flex-start;
            margin-top: 20px;
        }
        
        .map-image-panel {
            flex: 1;
            min-width: 0; /* Prevents flex item from overflowing */
        }
        
        .map-questions-panel {
            flex: 1;
            min-width: 300px; /* Ensures questions have minimum space */
        }
        
        .map-image {
            width: 100%;
            height: auto;
            border: 2px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .no-image-placeholder {
            width: 100%;
            height: 300px;
            border: 2px dashed #ccc;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
            font-style: italic;
            background-color: #f9f9f9;
        }
        
        .map-questions {
            background: #f8f9fa;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            height: fit-content;
        }
        
        .map-question-item {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 15px;
            padding: 8px 0;
        }
        
        .map-question-item:last-child {
            margin-bottom: 0;
        }
        
        .map-question-item .question-number {
            font-weight: 600;
            color: #333;
            min-width: 25px;
        }
        
        .map-question-item .question-word {
            min-width: 120px;
            font-weight: 500;
            color: #555;
        }
        
        .map-question-item .answer-input {
            flex: 1;
            min-width: 120px;
        }
        
        /* Responsive design for smaller screens */
        @media (max-width: 768px) {
            .map-container {
                flex-direction: column;
                gap: 15px;
            }
            
            .map-questions-panel {
                min-width: auto;
            }
            
            .map-questions {
                padding: 15px;
            }
            
            .map-question-item {
                flex-wrap: wrap;
                gap: 8px;
            }
            
            .map-question-item .question-word {
                min-width: 100px;
            }
        }
        
        /* Bottom Navigation */
        .nav-row {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #ffffff;
            border-top: 2px solid #e0e0e0;
            padding: 0;
            display: flex;
            align-items: center;
            height: 80px;
            z-index: 100;
            overflow-x: auto;
        }
        
        .footer__questionWrapper___1tZ46 {
            display: flex;
            align-items: center;
            margin-right: 20px;
            flex-shrink: 0;
        }
        
        .footer__questionNo___3WNct {
            background: none;
            border: none;
            padding: 10px 15px;
            font-size: 16px;
            font-weight: 600;
            color: #333;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 5px;
            transition: background-color 0.2s;
            border-radius: 4px;
        }
        
        .footer__questionNo___3WNct:hover {
            background-color: #fffbf0;
        }
        
        .footer__questionWrapper___1tZ46.selected .footer__questionNo___3WNct {
            background-color: #fff8e1;
        }
        
        .section-prefix, .sectionNr {
            font-size: 16px;
        }
        
        .attemptedCount {
            font-size: 14px;
            color: #666;
            margin-left: 5px;
        }
        
        .footer__deliverButton___3FM07 {
            margin-left: auto;
            margin-right: 20px;
            background-color: var(--accent-color);
            color: #1a1a1a;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .footer__deliverButton___3FM07:hover {
            filter: brightness(1.1);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        
        .hidden { 
            display: none !important; 
        }
        
        /* Audio Player */
        audio {
            width: 100%;
            max-width: 600px;
            margin: 20px 0;
            display:none;
        }
        .mcq-multiple-checkbox {
    transform: scale(1.3);
    margin-right: 12px;
    accent-color: var(--primary-color, #3B82F6);
}

.mcq-multiple {
    background: #fff9e6;
}
        /* Completion Screen */
        .completion-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #ffffff;
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            flex-direction: column;
            text-align: center;
        }
        
        .completion-message {
            font-size: 32px;
            font-weight: 600;
            color: #333;
            margin-bottom: 40px;
        }
        
        .navigation-button {
            background: var(--primary-color, #3B82F6);
            color: #1a1d29;
            border: none;
            padding: 16px 32px;
            font-size: 18px;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        
        .navigation-button:hover {
            background: var(--accent-color, #F59E0B);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(254, 208, 1, 0.3);
        }
    </style>
</head>
<body>
    ${generateAuthComponent(safeBranding)}
    ${generateStartScreenComponent('listening', safeBranding)}
    
    <div class="header" style="background: ${primary_color};">
        <div class="timer-container">
            <span class="timer-display">${testData.duration || 30}:00</span>
        </div>
        <div class="header-logo">
            ${logo_base64 
              ? `<img src="${logo_base64}" alt="${academy_name}" style="max-height: 40px; object-fit: contain;">` 
              : `<span style="color: white; font-weight: bold; font-size: 18px;">${academy_name}</span>`
            }
        </div>
        <div class="candidate-info">
            Candidate: <span id="header-candidate-id"></span>
            ${telegram_username ? `<span style="margin-left: 15px; opacity: 0.9;">| @${telegram_username}</span>` : ''}
        </div>
    </div>
    
    <div class="main-container">
        ${questionsHTML}
    </div>
    
    <nav class="nav-row">
        ${navButtons}
        <button class="footer__deliverButton___3FM07" onclick="submitTest()">Submit Answers</button>
    </nav>
    
    <div id="completion-screen" class="completion-screen">
        <div class="completion-message">Listening section ended</div>
        <a href="#" onclick="navigateToNextTest(); return false;" class="navigation-button">Move to Reading Section</a>
    </div>
    
    <script>
        ${generateAuthScript()}
        ${generateStartScreenScript()}
        
        let currentPart = 1;
        let timeInSeconds = ${testData.duration ? testData.duration * 60 : 1800}; // Custom duration
        let timerInterval;
        
        const answerKey = ${JSON.stringify(answerKey)};
        const projectName = '${projectName}';

        function initializeTest() {
            switchToPart(1);
        }
        
        function startTimer() {
            timerInterval = setInterval(() => {
                timeInSeconds--;
                const minutes = Math.floor(timeInSeconds / 60);
                const seconds = timeInSeconds % 60;
                document.querySelector('.timer-display').textContent = 
                    minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
                
                if (timeInSeconds <= 0) {
                    clearInterval(timerInterval);
                    submitTest();
                }
            }, 1000);
        }
        
        function switchToPart(partNumber) {
            currentPart = partNumber;
            document.querySelectorAll('.question-part').forEach(part => {
                part.classList.add('hidden');
            });
            document.getElementById('part-' + partNumber).classList.remove('hidden');
            
            document.querySelectorAll('.footer__questionWrapper___1tZ46').forEach((wrapper, index) => {
                wrapper.classList.toggle('selected', (index + 1) === partNumber);
            });
            
            updateAttemptedCount();
        }
        
        function updateAttemptedCount() {
            document.querySelectorAll('.footer__questionWrapper___1tZ46').forEach((wrapper, index) => {
                const partNum = index + 1;
                
                // Get the pre-calculated total from the footer element
                const countSpan = wrapper.querySelector('.attemptedCount');
                if (!countSpan) return;
                
                // Extract the total from "0 of ?" format
                const totalQuestions = parseInt(countSpan.textContent.split(' of ')[1]) || 0;
                
                // Get questions section
                const questionsSection = document.querySelector('#part-' + partNum);
                
                // Count ONLY answered questions
                let answered = 0;
                
                if (questionsSection) {
                    // Count answered text inputs (note completion, form completion, gap fill, etc.)
                    const textInputs = questionsSection.querySelectorAll('input[type="text"]');
                    textInputs.forEach(input => {
                        if (input.value.trim()) answered++;
                    });
                    
                    // Count answered hidden inputs (drag-and-drop summary completion, etc.)
                    const hiddenInputs = questionsSection.querySelectorAll('input[type="hidden"][id^="q"]');
                    hiddenInputs.forEach(input => {
                        if (input.value.trim()) answered++;
                    });
                    
                    // Count answered select dropdowns
                    const selects = questionsSection.querySelectorAll('select');
                    selects.forEach(select => {
                        if (select.value) answered++;
                    });
                    
                    // Count answered radio button groups
                    const answeredRadioGroups = new Set();
                    questionsSection.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
                        if (radio.name) answeredRadioGroups.add(radio.name);
                    });
                    answered += answeredRadioGroups.size;
                    
                    // Count MCQ-multiple specially
                    questionsSection.querySelectorAll('.mcq-multiple[data-q-count]').forEach(mcqDiv => {
                        const requiredCount = parseInt(mcqDiv.getAttribute('data-q-count')) || 2;
                        const checkboxes = mcqDiv.querySelectorAll('input[type="checkbox"]');
                        const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
                        
                        // Only count as answered if they selected the required number
                        if (checkedCount === requiredCount) {
                            answered += requiredCount;
                        }
                    });
                }
                
                // Update display with pre-calculated total
                countSpan.textContent = answered + ' of ' + totalQuestions;
            });
        }
        
        document.addEventListener('input', updateAttemptedCount);
        document.addEventListener('change', updateAttemptedCount);
        
 function submitTest() {
    if (!confirm('Submit your Listening answers now?')) return;
    
    clearInterval(timerInterval);
    
    let correctCount = 0;
    const results = [];
    let q = 1;
    
    // Debug: Log answer key for verification
    console.log('Answer Key:', answerKey);
    
    while (q <= 40) {
        const answerData = answerKey[q];
        
        // Skip if no answer key for this question
        if (!answerData && answerData !== 0 && answerData !== '') {
            console.warn('No answer key found for Q' + q + ', skipping...');
            q++;
            continue;
        }
        
        if (answerData && typeof answerData === 'object' && answerData.type === 'multiple') {
            // MCQ MULTIPLE ANSWERS
            const checkboxes = document.querySelectorAll('input[name="q' + q + '_group"]:checked');
            const userAnswers = Array.from(checkboxes).map(cb => cb.value);
            const correctAnswers = answerData.answers || [];
            const requiredCount = answerData.count || 2;
            
            console.log('Q' + q + ' (MCQ-Multiple): User=' + userAnswers.join(',') + ', Correct=' + correctAnswers.join(','));
            
            let pointsForThisQuestion = 0;
            
            if (userAnswers.length === requiredCount) {
                userAnswers.forEach(userAns => {
                    if (correctAnswers.includes(userAns)) {
                        pointsForThisQuestion++;
                    }
                });
            }
            
            correctCount += pointsForThisQuestion;
            
            for (let i = 0; i < answerData.count; i++) {
                const correctAns = correctAnswers[i];
                const gotThisOne = userAnswers.includes(correctAns);
                
                results.push({
                    q: q + i,
                    userAnswer: userAnswers.join(', ') || 'No Answer',
                    correctAnswer: correctAnswers.join(', '),
                    isCorrect: gotThisOne
                });
            }
            
            q += answerData.count;
        } else {
            // SINGLE ANSWER QUESTIONS
            let userAnswer = '';
            let elementType = 'not found';
            
            const textInput = document.getElementById('q' + q);
            const radioInput = document.querySelector('input[name="q' + q + '"]:checked');
            const selectInput = document.getElementById('q' + q);
            const hiddenInput = document.querySelector('input[type="hidden"][id="q' + q + '"]');
            
            if (textInput && textInput.type === 'text') {
                userAnswer = textInput.value.trim();
                elementType = 'text';
            } else if (hiddenInput && hiddenInput.type === 'hidden') {
                userAnswer = hiddenInput.value.trim();
                elementType = 'hidden';
            } else if (radioInput) {
                userAnswer = radioInput.value;
                elementType = 'radio';
            } else if (selectInput && selectInput.tagName === 'SELECT') {
                userAnswer = selectInput.value;
                elementType = 'select';
            } else {
                // Check if radio exists but not checked
                const radioExists = document.querySelector('input[name="q' + q + '"]');
                if (radioExists) {
                    elementType = 'radio (not checked)';
                } else if (textInput) {
                    elementType = textInput.tagName + '/' + textInput.type;
                }
            }
            
            // Validate answer data exists
            if (answerData === undefined || answerData === null) {
                console.error('Q' + q + ': Answer key is undefined! Element type: ' + elementType);
                q++;
                continue;
            }
            
            // Handle both single answer (string) and alternative answers (array)
            let isCorrect = false;
            if (Array.isArray(answerData)) {
                // Check if user's answer matches any of the alternatives
                isCorrect = answerData.some(alt => 
                    userAnswer.toLowerCase() === String(alt).toLowerCase()
                );
            } else {
                // Single answer (backward compatibility)
                isCorrect = userAnswer.toLowerCase() === String(answerData).toLowerCase();
            }
            const correctAnswer = Array.isArray(answerData) ? answerData.join(' / ') : (answerData || '');
            
            // Debug log
            console.log('Q' + q + ' [' + elementType + ']: User="' + userAnswer + '", Correct="' + correctAnswer + '", Match=' + isCorrect);
            
            if (isCorrect) correctCount++;
            
            results.push({
                q: q,
                userAnswer: userAnswer || 'No Answer',
                correctAnswer: correctAnswer,
                isCorrect: isCorrect
            });
            
            q++;
        }
    }
    
    console.log('Final Score: ' + correctCount + '/40');
    console.log('Results:', results);
    
    downloadResultsPDF(correctCount, results);
    
    setTimeout(() => {
        document.getElementById('completion-screen').style.display = 'flex';
    }, 1000);
} 
        function playAllAudiosInSequence() {
    const totalParts = 4; // Change this if you have different number of parts
    let currentAudioPart = 1;
    
    function playNextAudio() {
        if (currentAudioPart > totalParts) {
            console.log('All audio playback completed');
            return;
        }
        
        const audio = document.getElementById('audio-part-' + currentAudioPart);
        if (audio) {
            console.log('Playing audio for Part ' + currentAudioPart);
            
            // When this audio ends, play the next one
            audio.onended = function() {
                currentAudioPart++;
                playNextAudio();
            };
            
            audio.play().catch(err => {
                console.error('Error playing audio:', err);
                alert('Please click OK to enable audio playback');
                audio.play();
            });
        } else {
            console.log('No audio found for Part ' + currentAudioPart + ', skipping...');
            currentAudioPart++;
            playNextAudio();
        }
    }
    
    // Start playing from Part 1
    setTimeout(() => {
        playNextAudio();
    }, 500);
}
        function downloadResultsPDF(score, results) {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            doc.setFontSize(20);
            doc.setFont(undefined, 'bold');
            doc.text('IELTS Listening Test Results', 105, 20, { align: 'center' });
            
            doc.setFontSize(14);
            doc.setFont(undefined, 'normal');
            doc.text('Name: ' + candidateName, 20, 40);
doc.text('Candidate ID: ' + candidateId, 20, 50);
doc.text('Score: ' + score + ' / 40', 20, 60);
doc.text('Date: ' + new Date().toLocaleDateString(), 20, 70);

let yPos = 90;
            doc.setFontSize(12);
            doc.text('Q#', 20, yPos);
            doc.text('Your Answer', 40, yPos);
            doc.text('Correct Answer', 100, yPos);
            doc.text('Result', 160, yPos);
            
            yPos += 10;
            results.forEach(result => {
                doc.text(String(result.q), 20, yPos);
                doc.text(result.userAnswer, 40, yPos);
                doc.text(String(result.correctAnswer), 100, yPos);
                doc.text(result.isCorrect ? 'Correct' : 'Incorrect', 160, yPos);
                yPos += 8;
                
                if (yPos > 280) {
                    doc.addPage();
                    yPos = 20;
                }
            });
            
            doc.save('IELTS_Listening_Results_' + candidateName.replace(/\\s+/g, '_') + '_' + candidateId + '.pdf');
        }
            document.addEventListener('DOMContentLoaded', function() {
            const mcqMultipleQuestions = document.querySelectorAll('.mcq-multiple');
            
            mcqMultipleQuestions.forEach(question => {
                const checkboxes = question.querySelectorAll('.mcq-multiple-checkbox');
                const questionNumber = parseInt(question.getAttribute('data-q-start'));
                
                const answerData = answerKey[questionNumber];
                const maxSelections = answerData && answerData.count ? answerData.count : 2;
                
                checkboxes.forEach(checkbox => {
                    checkbox.addEventListener('change', function() {
                        const checked = question.querySelectorAll('.mcq-multiple-checkbox:checked');
                        
                        if (checked.length > maxSelections) {
                            this.checked = false;
                            alert('You can only select ' + maxSelections + ' answers for this question.');
                             }
                    });
                });
            });

            // Drag and Drop functionality for Summary Completion
            function initializeDragAndDrop() {
                const draggableWords = document.querySelectorAll('.summary-draggable');
                const dropZones = document.querySelectorAll('.summary-drop-zone');

                // Add drag event listeners to draggable words
                draggableWords.forEach(word => {
                    word.addEventListener('dragstart', handleDragStart);
                    word.addEventListener('dragend', handleDragEnd);
                });

                // Add drop event listeners to drop zones
                dropZones.forEach(zone => {
                    zone.addEventListener('dragover', handleDragOver);
                    zone.addEventListener('dragenter', handleDragEnter);
                    zone.addEventListener('dragleave', handleDragLeave);
                    zone.addEventListener('drop', handleDrop);
                    zone.addEventListener('click', handleZoneClick);
                });
            }

            let draggedElement = null;

            function handleDragStart(e) {
                draggedElement = this;
                this.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', this.outerHTML);
            }

            function handleDragEnd(e) {
                this.classList.remove('dragging');
                draggedElement = null;
            }

            function handleDragOver(e) {
                if (e.preventDefault) {
                    e.preventDefault();
                }
                e.dataTransfer.dropEffect = 'move';
                return false;
            }

            function handleDragEnter(e) {
                this.classList.add('drag-over');
            }

            function handleDragLeave(e) {
                this.classList.remove('drag-over');
            }

            function handleDrop(e) {
                if (e.stopPropagation) {
                    e.stopPropagation();
                }

                this.classList.remove('drag-over');

                if (draggedElement && draggedElement !== this) {
                    // Get the data
                    const letter = draggedElement.dataset.letter;
                    const word = draggedElement.dataset.word;
                    const questionId = this.dataset.question;

                    // Clear previous content
                    this.innerHTML = '';

                    // Add the dropped word
                    this.innerHTML = 
    '<span class="dropped-word">' + letter + '. ' + word + 
    '<button class="remove-btn" onclick="removeAnswer(this)" title="Remove answer">×</button>' +
    '</span>' +
    '<input type="hidden" id="q' + questionId + '" value="' + letter + '">';

                    // Update visual state
                    this.classList.remove('empty');
                    this.classList.add('filled');

                    // Mark the draggable word as used
                    draggedElement.classList.add('used');
                    draggedElement.draggable = false;

                    // Update attempt count
                    updateAttemptedCount();
                }

                return false;
            }

            function handleZoneClick(e) {
                // Allow clicking to remove a dropped word
                if (this.classList.contains('filled')) {
                    const questionId = this.dataset.question;
                    const hiddenInput = this.querySelector('input[type="hidden"]');
                    const letter = hiddenInput ? hiddenInput.value : '';

                    // Find and restore the original draggable word
                    const originalWord = document.querySelector('.summary-draggable[data-letter="' + letter + '"]');
                    if (originalWord) {
                        originalWord.classList.remove('used');
                        originalWord.draggable = true;
                    }

                    // Reset the drop zone
                    this.innerHTML = 
    '<span class="gap-number">' + this.dataset.question + '</span>' +
    '<input type="hidden" id="q' + questionId + '" value="">';
                    this.classList.remove('filled');
                    this.classList.add('empty');

                    // Update attempt count
                    updateAttemptedCount();
                }
            }

            // Function to remove answers
            function removeAnswer(btn) {
                const dropZone = btn.closest('.summary-drop-zone');
                const questionId = dropZone.dataset.question;
                const hiddenInput = dropZone.querySelector('input[type="hidden"]');
                const letter = hiddenInput ? hiddenInput.value : '';

                // Find and restore the original draggable word
                const originalWord = document.querySelector('.summary-draggable[data-letter="' + letter + '"]');
                if (originalWord) {
                    originalWord.classList.remove('used');
                    originalWord.draggable = true;
                }

                // Reset the drop zone
                dropZone.innerHTML = 
                    '<span class="gap-number">' + dropZone.dataset.question + '</span>' +
                    '<input type="hidden" id="q' + questionId + '" value="">';
                dropZone.classList.remove('filled');
                dropZone.classList.add('empty');

                // Update attempt count
                updateAttemptedCount();
            }

            // Initialize drag and drop after DOM is loaded
            initializeDragAndDrop();
        });
        function navigateToNextTest() {
    const nextFile = projectName.replace(/\\s+/g, '_') + '_reading.html';
    window.location.href = nextFile;
}

        // ==================== HIGHLIGHTING FUNCTIONALITY ====================
        let isHighlighting = false;
        let highlightColor = 'var(--primary-color, #3B82F6)';
        let highlights = [];

        function initializeHighlighting() {
          const mainContent = document.querySelector('.main-container, body');

          if (!mainContent) return;

          mainContent.addEventListener('contextmenu', function(e) {
            if (e.target.closest('.student-highlight')) {
              return;
            }
            // Allow highlighting of text, but not interactive elements
            if (e.target.closest('input, button, select, textarea, .options, .word-bank, .answer-input')) {
              return;
            }
            e.preventDefault();
            return false;
          });

          mainContent.addEventListener('mousedown', function(e) {
            // Allow highlighting everywhere except interactive elements
            if (e.button === 2 && !e.target.closest('.student-highlight, input, button, select, textarea, .options, .word-bank, .answer-input, label')) {
              isHighlighting = true;
              e.preventDefault();
            }
          });

          document.addEventListener('mouseup', function(e) {
            if (e.button === 2 && isHighlighting) {
              isHighlighting = false;
              setTimeout(() => highlightSelectedText(), 10);
            }
          });
        }

        function highlightSelectedText() {
          const selection = window.getSelection();
          if (selection.rangeCount === 0 || selection.toString().trim().length === 0) return;

          const range = selection.getRangeAt(0);
          const container = range.commonAncestorContainer;
          const parentElement = container.nodeType === 3 ? container.parentNode : container;

          // Prevent highlighting interactive elements only, allow question text
          if (parentElement.closest('input, button, select, textarea, .answer-input, .options, .word-bank, label')) {
            selection.removeAllRanges();
            return;
          }

          const highlightSpan = document.createElement('span');
          highlightSpan.className = 'student-highlight';
          highlightSpan.style.backgroundColor = highlightColor;
          highlightSpan.style.padding = '2px 0';
          highlightSpan.style.borderRadius = '2px';
          highlightSpan.style.cursor = 'pointer';
          highlightSpan.style.transition = 'all 0.2s';
          highlightSpan.title = 'Right-click to remove';
          
          highlightSpan.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            e.stopPropagation();
            removeHighlight(this);
            return false;
          });

          highlightSpan.addEventListener('mouseenter', function() {
            this.style.opacity = '0.7';
          });

          highlightSpan.addEventListener('mouseleave', function() {
            this.style.opacity = '1';
          });

          try {
            range.surroundContents(highlightSpan);
            highlights.push(highlightSpan);
          } catch (e) {
            console.log('Cannot highlight this selection');
          }

          selection.removeAllRanges();
        }

        function removeHighlight(highlightElement) {
          const parent = highlightElement.parentNode;
          while (highlightElement.firstChild) {
            parent.insertBefore(highlightElement.firstChild, highlightElement);
          }
          parent.removeChild(highlightElement);
          parent.normalize();
          highlights = highlights.filter(h => h !== highlightElement);
        }

        function clearAllHighlights() {
          highlights.forEach(h => {
            if (h && h.parentNode) {
              const parent = h.parentNode;
              while (h.firstChild) {
                parent.insertBefore(h.firstChild, h);
              }
              parent.removeChild(h);
              parent.normalize();
            }
          });
          highlights = [];
        }

        function addHighlightControls() {
          const controlsHTML = \`
            <div class="highlight-controls" style="position: fixed; bottom: 80px; right: 20px; z-index: 999; background: white; padding: 12px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
              <div style="font-size: 11px; font-weight: 600; color: #333; margin-bottom: 8px; text-align: center;">Highlight Color</div>
              <div style="display: flex; gap: 6px; margin-bottom: 10px; justify-content: center;">
                <button class="color-btn" data-color="var(--primary-color, #3B82F6)" style="width: 28px; height: 28px; border-radius: 50%; background: var(--primary-color, #3B82F6); border: 3px solid #333; cursor: pointer; transition: transform 0.2s;" title="Yellow"></button>
                <button class="color-btn" data-color="#90EE90" style="width: 28px; height: 28px; border-radius: 50%; background: #90EE90; border: 2px solid #ddd; cursor: pointer; transition: transform 0.2s;" title="Green"></button>
                <button class="color-btn" data-color="#FFB6C1" style="width: 28px; height: 28px; border-radius: 50%; background: #FFB6C1; border: 2px solid #ddd; cursor: pointer; transition: transform 0.2s;" title="Pink"></button>
                <button class="color-btn" data-color="#87CEEB" style="width: 28px; height: 28px; border-radius: 50%; background: #87CEEB; border: 2px solid #ddd; cursor: pointer; transition: transform 0.2s;" title="Blue"></button>
              </div>
              <button onclick="clearAllHighlights()" style="width: 100%; padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 600;">Clear All</button>
            </div>
          \`;

          document.body.insertAdjacentHTML('beforeend', controlsHTML);

          document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', function() {
              highlightColor = this.getAttribute('data-color');
              document.querySelectorAll('.color-btn').forEach(b => {
                b.style.border = '2px solid #ddd';
                b.style.transform = 'scale(1)';
              });
              this.style.border = '3px solid #333';
              this.style.transform = 'scale(1.15)';
            });
          });
        }

        function addHighlightInstructions() {
          const instructionsHTML = \`
            <div class="highlight-instructions" style="position: fixed; top: 70px; right: 20px; z-index: 999; background: #1a1d29; color: white; padding: 12px 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-size: 12px; max-width: 260px; animation: fadeIn 0.3s;">
              <div style="font-weight: 600; margin-bottom: 6px; color: var(--primary-color, #3B82F6);">💡 Highlighting</div>
              <div style="line-height: 1.6;">
                Hold <strong>right mouse button</strong> and drag to highlight text. Right-click highlighted text to remove it.
              </div>
              <button onclick="this.parentElement.remove()" style="margin-top: 8px; padding: 4px 10px; background: var(--primary-color, #3B82F6); color: #1a1d29; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 10px;">Got it!</button>
            </div>
            <style>
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
              }
            </style>
          \`;

          if (!sessionStorage.getItem('highlightInstructionsShown')) {
            setTimeout(() => {
              document.body.insertAdjacentHTML('beforeend', instructionsHTML);
            }, 1000);
            sessionStorage.setItem('highlightInstructionsShown', 'true');
          }
        }

        setTimeout(() => {
          initializeHighlighting();
          addHighlightControls();
          addHighlightInstructions();
        }, 500);
        // ==================== END HIGHLIGHTING FUNCTIONALITY ====================
    </script>
</body>
</html>`
}