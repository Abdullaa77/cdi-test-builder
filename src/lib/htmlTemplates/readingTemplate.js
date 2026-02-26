import { generateAuthComponent, generateAuthStyles, generateAuthScript } from './authComponent'
import { generateStartScreenComponent, generateStartScreenStyles, generateStartScreenScript } from './startScreenComponent'
import { JSPDF_INLINE_SCRIPT } from './jspdfBundle'

// Helper function to convert new summary-completion format to old format
function convertSummaryCompletionData(question) {
  // If already has summaryParts, return as-is (old format)
  if (question.summaryParts) {
    return question;
  }

  // If has summaryText, convert it to summaryParts (new format)
  if (question.summaryText) {
    const parts = [];
    const textParts = question.summaryText.split(/___\d+___/);
    const gaps = question.summaryText.match(/___(\d+)___/g) || [];
    
    textParts.forEach((text, index) => {
      if (text) {
        parts.push({ text: text, hasGap: false });
      }
      if (index < gaps.length) {
        const gapNum = parseInt(gaps[index].match(/\d+/)[0]);
        parts.push({ 
          text: '', 
          hasGap: true, 
          gapNumber: gapNum 
        });
      }
    });

    return {
      ...question,
      summaryParts: parts
    };
  }

  return question;
}

export function generateReadingHTML(testData, projectName, answerKey, branding) {
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

  // Generate passages and questions HTML for all parts
  let passagesHTML = ''
  let questionsHTML = ''
  let questionNumber = 1
  
testData.parts.forEach((passage, passageIndex) => {
  const startQuestion = questionNumber; // Track starting question for this passage
  
  // Add passage content to passagesHTML (left panel)
  passagesHTML += `
    <div id="passage-${passageIndex + 1}" class="reading-passage ${passageIndex > 0 ? 'hidden' : ''}">
      <div class="part-header">
        <p><strong>Passage ${passageIndex + 1}</strong></p>
        <p>Read the text and answer questions...</p>
      </div>
      <h3 class="passage-title">${passage.title || 'Reading Passage ' + (passageIndex + 1)}</h3>
      ${passage.text ? `<div class="passage-content">
        ${(() => {
          // Split by "Paragraph X" markers
          const sections = passage.text.split(/Paragraph\s+([A-Z])/i)
          let html = ''
          
          for (let i = 1; i < sections.length; i += 2) {
            const letter = sections[i].toUpperCase()
            const content = sections[i + 1]
            if (content && content.trim()) {
              html += `<div class="paragraph-block">
                <span class="paragraph-letter">${letter}</span>
                <p>${content.trim()}</p>
              </div>`
            }
          }
          
          // Fallback: if no markers found, split by double newlines
          if (!html) {
            html = passage.text.split('\n\n').map((paragraph, idx) => {
              const letter = String.fromCharCode(65 + idx)
              return `<div class="paragraph-block">
                <span class="paragraph-letter">${letter}</span>
                <p>${paragraph}</p>
              </div>`
            }).join('')
          }
          
          return html
        })()}
      </div>` : ''}
    </div>
  `
    // Generate questions
    questionsHTML += `
      <div id="questions-${passageIndex + 1}" class="questions-section ${passageIndex > 0 ? 'hidden' : ''}">
    `
    
    passage.questions.forEach((question) => {
      // Convert summary-completion format if needed
      if (question.type === 'summary-completion') {
        question = convertSummaryCompletionData(question);
      }
      
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
      }  else if (question.type === 'true-false-not-given' || question.type === 'yes-no-not-given') {
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
      }  else if (question.type === 'multiple-choice-multiple') {
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
} else if (question.type === 'matching-information') {
  questionsHTML += `
    <div class="question matching-information-question" data-q-start="${questionNumber}">
      <p class="question-instruction">${question.instruction || 'Which paragraph contains the following information?'}</p>
      <p class="note-text">NB: You may use any letter more than once.</p>
      <div class="matching-info-list">
        ${(question.statements || []).map((statement, idx) => {
          const currentQ = questionNumber++
          return `
            <div class="matching-info-item">
              <span class="question-number">${currentQ}.</span>
              <div class="statement-content">
                <p class="statement-text">${statement.text || statement || ''}</p>
                <input type="text" class="answer-input paragraph-input" id="q${currentQ}" placeholder="Paragraph" maxlength="1">
              </div>
            </div>
          `
        }).join('')}
      </div>
    </div>
  `
} else if (question.type === 'matching-headings') {
  // Store question range for this matching-headings question
  const startQ = questionNumber;
  const questionIds = (question.paragraphs || []).map((para, idx) => {
    return questionNumber++;
  });
  
  questionsHTML += `
    <div class="question matching-headings-dragdrop" data-q-start="${startQ}" data-question-ids="${questionIds.join(',')}">
      <div class="matching-headings-header">
        <h4 class="matching-headings-title">Questions ${startQ}–${startQ + questionIds.length - 1}</h4>
        <p class="question-instruction">${question.instruction || 'The reading passage has several paragraphs. Choose the correct heading for each paragraph from the list of headings below.'}</p>
      </div>
      
      <!-- Draggable Headings List -->
      <div class="headings-dragdrop-container">
        <div class="keyboard-help-box">
          <i class="fas fa-keyboard"></i> <strong>Keyboard Help:</strong> Click and drag headings to the drop zones in the passage.
        </div>
        
        <h5 class="headings-list-title">List of Headings</h5>
        <div class="headings-dragdrop-list" id="headings-list-${startQ}">
          ${(question.headingsList || []).map(heading => `
            <div class="heading-draggable" 
                 draggable="true" 
                 data-heading-id="${heading.id}"
                 data-heading-text="${heading.text.replace(/"/g, '&quot;')}"
                 tabindex="0">
              <span class="heading-identifier">${heading.id}</span>
              <span class="heading-content">${heading.text}</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Hidden input fields to store answers -->
      ${questionIds.map((qId, idx) => `
        <input type="hidden" id="q${qId}" class="matching-heading-answer" data-paragraph="${question.paragraphs[idx]}">
      `).join('')}
    </div>
  `
  
  // Add drop zones to passages (they will be inserted via JavaScript)
  // Store the mapping for later JavaScript processing
  const dropZoneData = questionIds.map((qId, idx) => ({
    questionId: qId,
    paragraph: question.paragraphs[idx],
    correctAnswer: question.correctAnswers ? question.correctAnswers[idx + 1] : ''
  }));
  
  // Add a script tag to inject drop zones after the page loads
  questionsHTML += `
    <script class="dropzone-initializer" data-start-q="${startQ}">
      // This will be processed by the main init function
      window.matchingHeadingsData = window.matchingHeadingsData || {};
      window.matchingHeadingsData['q${startQ}'] = ${JSON.stringify(dropZoneData)};
    </script>
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
} else if (question.type === 'summary-completion') {
  // Drag-and-drop type - with draggable word bank
  const startQ = questionNumber;
  
  // Check if it's the new format with summaryText
  let summaryContent = '';
  if (question.summaryText) {
    // NEW FORMAT: Parse summaryText with ___1___, ___2___ gaps
    let text = question.summaryText;
    const gaps = [...text.matchAll(/___(\d+)___/g)];
    
    // Sort gaps by their position to maintain order
    const replacements = [];
    gaps.forEach(match => {
      const gapNum = parseInt(match[1]);
      const currentQ = questionNumber++;
      const gapDisplay = currentQ - startQ + 1;
      replacements.push({
        original: match[0],
        replacement: '<span class="summary-drop-zone drop-zone empty" data-question="' + currentQ + '">' +
          '<span class="gap-number">' + gapDisplay + '</span>' +
          '<input type="hidden" id="q' + currentQ + '" value="">' +
        '</span>'
      });
    });
    
    // Replace all gaps with drop zones
    summaryContent = text;
    replacements.forEach(r => {
      summaryContent = summaryContent.replace(r.original, r.replacement);
    });
  } else {
    // OLD FORMAT: Use summaryParts
    summaryContent = (question.summaryParts || []).map(part => {
      if (part.hasGap) {
        const currentQ = questionNumber++;
        return '<span class="summary-drop-zone drop-zone empty" data-question="' + currentQ + '">' +
          '<span class="gap-number">' + (currentQ - startQ + 1) + '</span>' +
          '<input type="hidden" id="q' + currentQ + '" value="">' +
        '</span>';
      } else {
        return part.text;
      }
    }).join(' ');
  }
  
  questionsHTML += `
    <div class="question summary-completion-question drag-drop-question" data-q-start="${startQ}">
      <p class="question-instruction">${question.instruction || 'Complete the summary using the list of words below.'}</p>
      <p class="drag-instruction"><em>Choose the correct answer and drag it into the gap.</em></p>
      ${question.title ? `<h4 class="summary-title">${question.title}</h4>` : ''}
      <div class="summary-text-content">
        ${summaryContent}
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
} else if (question.type === 'summary-completion-type') {
  // TYPE type - with text inputs
  const gaps = (question.summaryText || '').match(/___(\d+)___/g) || []
  let summaryHTML = question.summaryText || ''
  
  gaps.forEach(gap => {
    const gapNum = gap.match(/\d+/)[0]
    const currentQ = questionNumber++
    summaryHTML = summaryHTML.replace(
      gap,
      `<input type="text" class="answer-input summary-input" id="q${currentQ}" placeholder="${gapNum}" style="display: inline-block; min-width: 120px; max-width: 200px; margin: 0 4px; padding: 6px 10px; vertical-align: middle;">`
    )
  })
  
  questionsHTML += `
    <div class="question summary-type-question" data-q-start="${questionNumber - gaps.length}">
      <p class="question-instruction">Complete the summary. Write <strong>${question.wordLimit || 'ONE WORD ONLY'}</strong> for each answer.</p>
      ${question.title ? `<h4 class="summary-title">${question.title}</h4>` : ''}
      <div class="summary-text-content">
        ${summaryHTML}
      </div>
    </div>
  `
} else if (question.type === 'matching-sentence-endings') {
  questionsHTML += `
    <div class="question matching-sentence-endings-question drag-drop-question" data-q-start="${questionNumber}">
      <p class="question-instruction">${question.instructions || question.instruction || 'Complete each sentence with the correct ending.'}</p>
      <p class="drag-instruction"><em>Drag the correct answer from the options below and drop it into the gap.</em></p>
      
      <div class="sentences-container-drag">
        ${(question.sentenceBeginnings || []).map((beginning, idx) => {
          const currentQ = questionNumber++
          return `
            <div class="sentence-row-drag">
              <div class="q-number-drag">${currentQ}</div>
              <div class="sentence-content-drag">
                <div class="sentence-text-drag">${beginning.text}</div>
                <div class="drop-zone" data-question="${currentQ}" data-answer-id="q${currentQ}">
                  <span class="placeholder-text">Drop answer here</span>
                </div>
                <input type="hidden" class="answer-input" id="q${currentQ}" name="q${currentQ}" value="">
              </div>
            </div>
          `
        }).join('')}
      </div>

      <div class="options-container-drag">
        <div class="options-title-drag">Sentence Endings:</div>
        <div class="options-grid-drag">
          ${(question.sentenceEndings || []).map(ending => `
            <div class="draggable-option" draggable="true" data-option="${ending.id}">
              <div class="option-text-drag">${ending.text}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `
} else if (question.type === 'note-completion' || question.type === 'form-completion') {
  // FIX: Collect all gapNumbers and create mapping to sequential question numbers
  // This matches the answer key generation logic in TestBuilder.js
  const gapToQuestionMap = {};
  const allGaps = [];

  (question.items || []).forEach(item => {
    (item.fields || []).forEach(field => {
      if (field.type === 'gap' || field.gapNumber) {
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
    <div class="question note-completion-question" data-q-start="${questionNumber - allGaps.length}">
      <p class="question-instruction">${question.instruction || 'Complete the notes below.'}</p>
      <p class="word-limit-notice">Write <strong>${question.wordLimitText || 'NO MORE THAN TWO WORDS'}</strong> for each answer.</p>
      ${question.title ? `<h4 class="note-title">${question.title}</h4>` : ''}
      <div class="note-items-list">
        ${(question.items || []).map(item => `
          <div class="note-item">
            ${item.label ? `<div class="note-label">${item.label}</div>` : ''}
            <div class="note-fields-list">
              ${(item.fields || []).map(field => {
                if (field.type === 'gap' || field.gapNumber) {
                  // Field with gap - use pre-assigned question number from sorted mapping
                  const currentQ = gapToQuestionMap[field.gapNumber];
                  return `<div class="note-field-gap">
                    <span class="field-prefix">${field.prefix || ''}</span>
                    <span class="field-text-before">${field.textBeforeGap || ''}</span>
                    <span class="question-number">${field.gapNumber}.</span>
                    <input type="text" class="answer-input note-input" id="q${currentQ}" placeholder="Answer">
                    <span class="field-suffix">${field.suffix || ''}</span>
                  </div>`
                } else if (field.type === 'info' || field.text) {
                  return `<div class="note-field-text">${field.prefix || ''}${field.text || ''}${field.suffix || ''}</div>`
                } else {
                  return ''
                }
              }).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `
} else if (question.type === 'table-completion') {
  questionsHTML += `
    <div class="question table-completion-question" data-q-start="${questionNumber}">
      <p class="question-instruction">${question.instruction || 'Complete the table below.'}</p>
      <p class="word-limit-notice">Write <strong>${question.wordLimitText || 'NO MORE THAN THREE WORDS'}</strong> for each answer.</p>
      ${question.title ? `<h4 class="table-title">${question.title}</h4>` : ''}
      <table class="completion-table">
        ${question.headers ? `
          <thead>
            <tr>
              ${question.headers.map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
        ` : ''}
        <tbody>
          ${(question.rows || []).map(row => {
            const cells = Array.isArray(row) ? row : (row.cells || [])
            return `<tr>
              ${cells.map(cell => {
                // Replace gaps with input fields
                let cellContent = cell || ''
                const gaps = cellContent.match(/___(\d+)___/g) || []
                gaps.forEach(gap => {
                  const gapNum = gap.match(/\d+/)[0]
                  const currentQ = questionNumber++
                  cellContent = cellContent.replace(
                    gap,
                    `<span class="table-gap"><span class="question-number">${gapNum}.</span><input type="text" class="answer-input table-input" id="q${currentQ}" placeholder="___"></span>`
                  )
                })
                return `<td>${cellContent}</td>`
              }).join('')}
            </tr>`
          }).join('')}
        </tbody>
      </table>
    </div>
  `
} else if (question.type === 'sentence-completion') {
  questionsHTML += `
    <div class="question sentence-completion-question" data-q-start="${questionNumber}">
      <p class="question-instruction">${question.instruction || 'Complete the sentences below.'}</p>
      <p class="word-limit-notice">Write <strong>${question.wordLimitText || 'NO MORE THAN TWO WORDS'}</strong> for each answer.</p>
      <div class="sentence-list">
        ${(question.sentences || []).map((sentence, idx) => {
          const currentQ = questionNumber++
          return `
            <div class="sentence-item">
              <span class="question-number">${currentQ}.</span>
              <div class="sentence-content">
                ${sentence.prefix || ''} 
                <input type="text" class="answer-input sentence-gap" id="q${currentQ}" placeholder="______">
                ${sentence.suffix || ''}
              </div>
            </div>
          `
        }).join('')}
      </div>
    </div>
  `
} else if (question.type === 'short-answer') {
  questionsHTML += `
    <div class="question short-answer-question" data-q-start="${questionNumber}">
      <p class="question-instruction">${question.instruction || 'Answer the questions below.'}</p>
      <p class="word-limit-notice">Write NO MORE THAN <strong>${question.wordLimit || 3}</strong> WORD${(question.wordLimit || 3) > 1 ? 'S' : ''} for each answer.</p>
      <div class="short-answer-list">
        ${(question.questions || []).map((subQ, idx) => {
          const currentQ = questionNumber++
          return `
            <div class="short-answer-item">
              <span class="question-number">${currentQ}.</span>
              <span class="question-text">${subQ.text}</span>
              <input type="text" class="answer-input short-answer-input" id="q${currentQ}" placeholder="Your answer">
            </div>
          `
        }).join('')}
      </div>
    </div>
  `
      }else if (question.type === 'flow-chart-completion') {
  const steps = Array.isArray(question.steps) ? question.steps : []
  const options = Array.isArray(question.options) ? question.options : []
  
  questionsHTML += `
    <div class="question flow-chart-question" data-q-start="${questionNumber}">
      <p class="question-instruction">${question.instruction || 'Complete the flow-chart below.'}</p>
      <p class="word-limit-notice">Write <strong>${question.wordLimitText || 'NO MORE THAN TWO WORDS'}</strong> for each answer.</p>
      ${question.backgroundImage ? `
        <div class="flowchart-bg" style="text-align: center; margin: 20px 0;">
          <img src="${question.backgroundImage}" alt="Flow-chart" style="max-width: 100%; height: auto; border: 2px solid #ddd; border-radius: 8px;">
        </div>
      ` : ''}
      <div class="flowchart-steps" style="display: flex; flex-direction: column; gap: 15px; margin: 20px 0;">
        ${steps.map((step, idx) => {
          if (step.isInfoStep) {
            // Info step - no gaps, just display text
            return `
              <div class="flowchart-step info-step" style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 6px;">
                <div class="step-text" style="color: #1e40af; font-style: italic;">${step.text || ''}</div>
              </div>
            `
          } else {
            // Regular step with gaps
            let stepText = step.text || ''
            const gapMatches = stepText.match(/___(\d+)___/g) || []
            
            gapMatches.forEach(match => {
              const gapNum = match.match(/\d+/)[0]
              const currentQ = questionNumber++
              stepText = stepText.replace(match, `
                <span class="gap-container" style="display: inline-flex; align-items: center; gap: 5px; margin: 0 5px;">
                  <span class="question-number" style="font-weight: bold;">${gapNum}.</span>
                  <input type="text" class="answer-input flowchart-gap-input" id="q${currentQ}" placeholder="Answer" style="min-width: 120px; display: inline-block;">
                </span>
              `)
            })
            
            return `
              <div class="flowchart-step" style="display: flex; gap: 10px; align-items: flex-start; padding: 12px; background: white; border-radius: 6px; border: 1px solid #e0e0e0;">
                <div class="step-number" style="font-weight: bold; color: var(--primary-color, #3B82F6); background: #1a1d29; padding: 4px 10px; border-radius: 4px; min-width: 30px; text-align: center;">${idx + 1}</div>
                <div class="step-text" style="flex: 1; line-height: 1.8;">${stepText}</div>
              </div>
            `
          }
        }).join('')}
      </div>
      ${options.length > 0 ? `
        <div class="flowchart-options-box" style="background: #e8f4f8; border: 2px solid #b3d9e8; border-radius: 8px; padding: 20px; margin-top: 20px;">
          <h5 style="font-size: 16px; font-weight: 600; margin-bottom: 15px;">Options:</h5>
          <div class="flowchart-options" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
            ${options.map(opt => `
              <div class="flowchart-option-item" style="padding: 10px; background: white; border-radius: 6px; border: 1px solid #b3d9e8;">
                <span style="font-weight: bold; color: var(--primary-color, #3B82F6); margin-right: 8px;">${opt.id || ''}.</span>
                <span>${opt.text || ''}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `
}
    })
    
    questionsHTML += `
      </div>
    `.replace('<div id="questions-' + (passageIndex + 1), 
              '<div id="questions-' + (passageIndex + 1) + '" data-total-questions="' + (questionNumber - startQuestion) + '"')
  })

  // Function to count total questions in a passage
  function countQuestionsInPassage(questions) {
    let total = 0;
    questions.forEach(q => {
      if (q.type === 'note-completion' || q.type === 'form-completion') {
        // Count gaps in note/form completion
        (q.items || []).forEach(item => {
          (item.fields || []).forEach(field => {
            if (field.type === 'gap' || field.gapNumber) {
              total++;
            }
          });
        });
      } else if (q.type === 'table-completion') {
        // Count gaps in table (___1___ format)
        (q.rows || []).forEach(row => {
          const cells = Array.isArray(row) ? row : (row.cells || []);
          cells.forEach(cell => {
            const gaps = (cell || '').match(/___(\d+)___/g) || [];
            total += gaps.length;
          });
        });
      } else if (q.type === 'flow-chart-completion') {
        // Count gaps in flowchart (___1___ format)
        (q.steps || []).forEach(step => {
          const gaps = (step.text || '').match(/___(\d+)___/g) || [];
          total += gaps.length;
        });
      } else if (q.type === 'summary-completion-type') {
        // Count gaps in summary (___1___ format)
        const gaps = (q.summaryText || '').match(/___(\d+)___/g) || [];
        total += gaps.length;
      } else if (q.type === 'summary-completion') {
        // Count gaps in summary with word bank
        if (q.summaryParts) {
          q.summaryParts.forEach(part => {
            if (part.hasGap) total++;
          });
        } else if (q.summaryText) {
          const gaps = (q.summaryText || '').match(/___(\d+)___/g) || [];
          total += gaps.length;
        }
      } else if (q.type === 'multiple-choice-multiple') {
        // Count required answers for MCQ multiple
        total += (q.numberOfAnswers || q.correctCount || 2);
      } else if (q.type === 'matching-sentence-endings') {
        // Count sentence beginnings
        total += (q.sentenceBeginnings || []).length;
      } else if (q.type === 'matching-headings') {
        // Count paragraphs
        total += (q.paragraphs || []).length;
      } else if (q.type === 'matching-features') {
        // Count categories
        total += (q.categories || []).length;
      } else if (q.type === 'matching-information') {
        // Count statements
        total += (q.statements || []).length;
      } else if (q.type === 'sentence-completion') {
        // Count sentences
        total += (q.sentences || []).length;
      } else if (q.type === 'short-answer') {
        // Count questions
        total += (q.questions || []).length;
      } else {
        // Default: count as 1 question (MCQ, T/F/NG, Y/N/NG, etc.)
        total++;
      }
    });
    return total;
  }

  // Generate navigation buttons
  const navButtons = testData.parts.map((part, index) => {
    const totalQuestions = countQuestionsInPassage(part.questions || []);
    return `
      <div class="footer__questionWrapper___1tZ46 ${index === 0 ? 'selected' : ''}">
        <button class="footer__questionNo___3WNct" onclick="switchToPart(${index + 1})">
          <span>
            <span class="section-prefix">Passage </span>
            <span class="sectionNr">${index + 1}</span>
            <span class="attemptedCount">0 of ${totalQuestions}</span>
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
            line-height: 1.6;
            font-size: 16px;
        }
        
        ${generateAuthStyles()}
        ${generateStartScreenStyles()}
        .paragraph-block {
    display: flex;
    flex-direction: column;
    margin-bottom: 20px;
}

.paragraph-content-row {
    display: flex;
    gap: 15px;
}
/* Table Completion */
.table-completion-question {
    background: #f9f9f9;
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 25px;
    margin-bottom: 30px;
}

.table-title {
    text-align: center;
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #e0e0e0;
}

.completion-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
}

.completion-table th,
.completion-table td {
    border: 2px solid #ddd;
    padding: 12px;
    text-align: left;
}

.completion-table th {
    background: #e8f4f8;
    font-weight: 600;
    color: #333;
}

.table-gap {
    display: inline-flex;
    align-items: center;
    gap: 5px;
}

.table-input {
    display: inline-block;
    max-width: 120px;
    min-width: 80px;
    margin: 0;
}
.paragraph-letter {
    font-weight: bold;
    color: var(--primary-color, #3B82F6);
    background: #1a1d29;
    padding: 4px 12px;
    border-radius: 4px;
    min-width: 35px;
    height: fit-content;
    text-align: center;
    flex-shrink: 0;
}

.paragraph-block p {
    flex: 1;
    margin: 0;
    text-align: justify;
}
        /* Matching Headings - Drag and Drop */
.matching-headings-dragdrop {
    background: #f9f9f9;
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 25px;
    margin-bottom: 30px;
}

.matching-headings-header {
    margin-bottom: 20px;
}

.matching-headings-title {
    font-size: 16px;
    font-weight: 600;
    color: #1a1d29;
    margin-bottom: 8px;
}

/* Keyboard Help Box */
.keyboard-help-box {
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 6px;
    padding: 12px 15px;
    margin-bottom: 20px;
    font-size: 13px;
    color: #856404;
}

.keyboard-help-box strong {
    color: #664d03;
}

.keyboard-help-box i {
    margin-right: 5px;
}

/* Headings Dragdrop Container */
.headings-dragdrop-container {
    background: #fffbf0;
    border: 2px solid var(--primary-color, #3B82F6);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
}

.headings-list-title {
    font-size: 15px;
    font-weight: 600;
    color: #1a1d29;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 2px solid var(--primary-color, #3B82F6);
}

.headings-dragdrop-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

/* Draggable Heading Item */
.heading-draggable {
    background: white;
    border: 2px solid var(--primary-color, #3B82F6);
    border-radius: 6px;
    padding: 12px 15px;
    cursor: move;
    transition: all 0.3s ease;
    display: flex;
    align-items: flex-start;
    gap: 12px;
}

.heading-draggable:hover {
    background: #fffbf0;
    transform: translateX(5px);
    box-shadow: 0 2px 8px rgba(254, 208, 1, 0.3);
}

.heading-draggable.dragging {
    opacity: 0.5;
    transform: rotate(2deg);
}

.heading-draggable.used {
    opacity: 0.3;
    cursor: not-allowed;
    border-color: #ccc;
    background: #f5f5f5;
}

.heading-draggable.used:hover {
    transform: none;
    background: #f5f5f5;
    box-shadow: none;
}

.heading-identifier {
    font-weight: 700;
    color: var(--primary-color, #3B82F6);
    background: #1a1d29;
    padding: 4px 10px;
    border-radius: 4px;
    min-width: 35px;
    text-align: center;
    flex-shrink: 0;
}

.heading-draggable.used .heading-identifier {
    background: #999;
}

.heading-content {
    font-weight: 600;
    color: #333;
    flex: 1;
    font-size: 14px;
    line-height: 1.4;
}

.heading-draggable.used .heading-content {
    color: #999;
}

/* Drop Zones in Passage */
.heading-drop-zone {
    min-height: 50px;
    border: 2px dashed var(--primary-color, #3B82F6);
    background: #fffbf0;
    border-radius: 6px;
    padding: 12px 15px;
    margin: 0 0 15px 0;
    display: flex;
    align-items: center;
    transition: all 0.3s ease;
    position: relative;
}

.heading-drop-zone.drag-over {
    border-color: #1a1d29;
    background: #fff8e1;
    box-shadow: 0 0 10px rgba(254, 208, 1, 0.5);
}

.heading-drop-zone.filled {
    border: 2px solid var(--primary-color, #3B82F6);
    background: #fff9e6;
    border-style: solid;
}

.heading-drop-zone .question-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    height: 30px;
    background: var(--primary-color, #3B82F6);
    border-radius: 4px;
    font-weight: 600;
    color: #1a1d29;
    padding: 0 12px;
    margin-right: 10px;
    flex-shrink: 0;
}

.heading-drop-zone.filled .question-number {
    background: #1a1d29;
    color: var(--primary-color, #3B82F6);
}

.heading-drop-zone .placeholder-text {
    color: #999;
    font-style: italic;
}

.dropped-heading {
    flex: 1;
    font-weight: 600;
    color: #1a1d29;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}

.dropped-heading .heading-text {
    flex: 1;
}

.dropped-heading .heading-text strong {
    color: var(--primary-color, #3B82F6);
    background: #1a1d29;
    padding: 2px 8px;
    border-radius: 3px;
    margin-right: 8px;
}

.remove-heading-btn {
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.3s;
    flex-shrink: 0;
}

.remove-heading-btn:hover {
    background: #c82333;
}

/* OLD STYLES - Keep for backwards compatibility but hidden */
.matching-headings-question {
    display: none;
}

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
/* Matching Sentence Endings */
/* Matching Sentence Endings - Drag & Drop */
.matching-sentence-endings-question {
    background: #f9f9f9;
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 25px;
    margin-bottom: 30px;
}

.drag-instruction {
    color: #666;
    font-size: 14px;
    margin: 10px 0 20px 0;
    font-style: italic;
}

.sentences-container-drag {
    background: #fff;
    padding: 25px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    margin-bottom: 20px;
}

.sentence-row-drag {
    margin-bottom: 20px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
}

.sentence-row-drag:last-child {
    margin-bottom: 0;
}

.q-number-drag {
    background: var(--primary-color, #3B82F6);
    color: #000;
    font-weight: bold;
    min-width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 3px;
    font-size: 14px;
}

.sentence-content-drag {
    flex: 1;
}

.sentence-text-drag {
    font-size: 15px;
    line-height: 1.6;
    color: #333;
    margin-bottom: 8px;
}

.drop-zone {
    border: 2px dashed #ccc;
    border-radius: 6px;
    padding: 12px;
    background: #fafafa;
    transition: all 0.3s ease;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.drop-zone.drag-over {
    border-color: var(--primary-color, #3B82F6);
    background: #fffbf0;
    border-style: solid;
    transform: scale(1.02);
}

.drop-zone.filled {
    background: #fff;
    border-color: var(--primary-color, #3B82F6);
    border-style: solid;
    padding: 0;
}

.drop-zone .placeholder-text {
    color: #999;
    font-style: italic;
    font-size: 13px;
    text-align: center;
}

.drop-zone.filled .placeholder-text {
    display: none;
}

.options-container-drag {
    background: #f9f9f9;
    padding: 20px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
}

.options-title-drag {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 15px;
    color: #333;
}

.options-grid-drag {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.draggable-option {
    background: white;
    border: 2px solid #ddd;
    padding: 12px 16px;
    border-radius: 6px;
    cursor: move;
    transition: all 0.2s ease;
    user-select: none;
    display: flex;
    align-items: center;
}

.draggable-option.dragging {
    opacity: 0.5;
    transform: rotate(2deg);
}

.draggable-option.in-use {
    opacity: 0.3;
    cursor: not-allowed;
    background: #f5f5f5;
}

.draggable-option:not(.in-use):not(.dragging):hover {
    background: #f0f0f0;
    border-color: var(--primary-color, #3B82F6);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.option-letter-drag {
    background: var(--primary-color, #3B82F6);
    color: #000;
    font-weight: bold;
    min-width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    font-size: 14px;
    flex-shrink: 0;
    margin-right: 10px;
}

.option-text-drag {
    flex: 1;
    font-size: 14px;
    color: #333;
    line-height: 1.4;
}

.dropped-option {
    background: white;
    border: 2px solid var(--primary-color, #3B82F6);
    padding: 12px 16px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: move;
    position: relative;
    width: 100%;
}

.dropped-option:hover {
    background: #f8f8f8;
}

.remove-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    background: #f44336;
    color: white;
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    cursor: pointer;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
    line-height: 1;
}

.dropped-option:hover .remove-btn {
    opacity: 1;
}

.remove-btn:hover {
    background: #d32f2f;
}

/* Summary Completion */
.summary-completion-question {
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

.summary-text-content {
    background: white;
    border-left: 4px solid var(--primary-color, #3B82F6);
    padding: 20px;
    margin: 20px 0;
    line-height: 2;
    font-size: 16px;
}

/* Summary Drop Zones */
.summary-drop-zone {
    display: inline-block;
    min-width: 100px;
    min-height: 32px;
    padding: 4px 12px;
    margin: 0 4px;
    border: 2px dashed #96ACDA;
    border-radius: 6px;
    background: white;
    vertical-align: middle;
    position: relative;
    transition: all 0.3s ease;
}

.summary-drop-zone.empty {
    background: #f0f8ff;
}

.summary-drop-zone.drag-over {
    background: var(--primary-color, #3B82F6);
    border-color: var(--primary-color, #3B82F6);
    border-style: solid;
    transform: scale(1.05);
}

.summary-drop-zone.filled {
    background: #fff9e6;
    border-color: var(--primary-color, #3B82F6);
    border-style: solid;
}

.gap-number {
    position: absolute;
    top: -10px;
    left: 4px;
    background: #1a1d29;
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: bold;
    z-index: 1;
}

.dropped-word {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #1a1d29;
    padding: 4px;
    position: relative;
}

.dropped-letter {
    background: var(--primary-color, #3B82F6);
    color: #1a1d29;
    padding: 4px 10px;
    border-radius: 4px;
    font-weight: bold;
    font-size: 14px;
}

.dropped-word .word-text {
    color: #1a1d29;
    font-weight: 600;
    font-size: 14px;
}

.dropped-word .remove-btn {
    position: relative !important;  /* Override absolute positioning */
    opacity: 1 !important;          /* Always visible - override opacity: 0 */
    background: #ff5252 !important;
    color: white !important;
    border: none !important;
    padding: 2px 8px !important;
    border-radius: 4px !important;
    cursor: pointer !important;
    font-size: 18px !important;
    font-weight: bold !important;
    transition: all 0.2s !important;
    margin-left: 8px !important;
    line-height: 1 !important;
    min-width: 28px !important;
    height: 28px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    flex-shrink: 0 !important;
    top: auto !important;           /* Override absolute positioning */
    right: auto !important;         /* Override absolute positioning */
}

.dropped-word .remove-btn:hover {
    opacity: 1 !important;          /* Stay visible on hover */
    background: #d32f2f !important;
    transform: scale(1.15) !important;
}

/* Summary Word Bank */
.word-bank-section {
    background: #f9f9f9;
    padding: 25px;
    border-radius: 8px;
    border: 2px solid #e0e0e0;
    margin-top: 25px;
}

.word-bank-title {
    font-size: 18px;
    font-weight: 600;
    color: #1a1d29;
    margin-bottom: 15px;
    text-align: center;
}

.summary-word-bank {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;
    min-height: 80px;
    padding: 20px;
    background: white;
    border-radius: 6px;
    border: 2px dashed #e0e0e0;
}

.summary-word-bank.empty-state {
    border-color: #4caf50;
    background: #e8f5e9;
}

.summary-draggable {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: linear-gradient(135deg, var(--primary-color, #3B82F6) 0%, var(--accent-color, #F59E0B) 100%);
    border: 2px solid var(--primary-color, #3B82F6);
    border-radius: 6px;
    cursor: grab;
    user-select: none;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.summary-draggable:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.summary-draggable:active {
    cursor: grabbing;
    transform: scale(0.95);
}

.summary-draggable.dragging {
    opacity: 0.5;
    cursor: grabbing;
}

.summary-draggable.hidden {
    display: none;
}

.word-letter {
    font-weight: bold;
    color: var(--primary-color, #3B82F6);
    background: #1a1d29;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 15px;
    min-width: 25px;
    text-align: center;
}

.word-text {
    font-weight: 600;
    color: #1a1d29;
    font-size: 16px;
}

/* For old word-bank-box (if still used elsewhere) */
.word-bank-box {
    background: #e8f4f8;
    border: 2px solid #b3d9e8;
    border-radius: 8px;
    padding: 20px;
    margin-top: 25px;
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
}

/* Note/Table Completion */
.note-completion-question {
    background: #f9f9f9;
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 25px;
    margin-bottom: 30px;
}

.note-title {
    text-align: center;
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #e0e0e0;
}

.note-items-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.note-item {
    background: white;
    padding: 15px;
    border-radius: 6px;
    border: 1px solid #e0e0e0;
}

.note-label {
    font-weight: 600;
    margin-bottom: 10px;
}

.note-fields-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-left: 15px;
}

.note-field-gap, .note-field-text {
    display: flex;
    align-items: center;
    gap: 8px;
}

.note-input {
    max-width: 200px;
}

/* Sentence Completion */
.sentence-completion-question {
    background: #f9f9f9;
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 25px;
    margin-bottom: 30px;
}

.word-limit-notice {
    background: #fff3cd;
    border: 1px solid #ffc107;
    padding: 10px 15px;
    border-radius: 5px;
    margin-bottom: 20px;
    text-align: center;
    color: #856404;
}

.sentence-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.sentence-item {
    display: flex;
    gap: 10px;
    padding: 12px;
    background: white;
    border-radius: 6px;
    border-left: 3px solid var(--primary-color, #3B82F6);
}

.sentence-content {
    flex: 1;
    line-height: 1.8;
}

.sentence-gap {
    display: inline-block;
    min-width: 150px;
    max-width: 250px;
    margin: 0 4px;
    vertical-align: middle;
}

/* Short Answer */
.short-answer-question {
    background: #f9f9f9;
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 25px;
    margin-bottom: 30px;
}

.short-answer-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.short-answer-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: white;
    border-radius: 6px;
    border: 1px solid #e0e0e0;
}

.short-answer-input {
    max-width: 100%;
}
        /* Matching Information */
.matching-information-question {
    background: #f9f9f9;
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 25px;
    margin-bottom: 30px;
}

.note-text {
    font-style: italic;
    color: #666;
    margin-bottom: 20px;
    font-size: 14px;
    background: #fff3cd;
    border-left: 4px solid #ffc107;
    padding: 10px 15px;
    border-radius: 4px;
}

.matching-info-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.matching-info-item {
    display: flex;
    gap: 12px;
    padding: 15px;
    background: white;
    border-radius: 6px;
    border: 1px solid #e0e0e0;
    align-items: flex-start;
}

.statement-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.statement-text {
    margin: 0;
    line-height: 1.6;
    color: #333;
}

.paragraph-input {
    max-width: 80px !important;
    text-align: center;
    text-transform: uppercase;
    font-weight: bold;
    font-size: 18px;
    padding: 10px;
}

.paragraph-input:focus {
    border-color: var(--primary-color, #3B82F6);
    outline: none;
    box-shadow: 0 0 0 3px rgba(254, 208, 1, 0.1);
}
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
        
        .header-logo {
            height: 50px;
        }
        
        .header-logo img {
            height: 100%;
            width: auto;
            object-fit: contain;
        }
        .mcq-multiple-checkbox {
    transform: scale(1.3);
    margin-right: 12px;
    accent-color: var(--primary-color, #3B82F6);
}

.mcq-multiple {
    background: #fff9e6;
    border-left: 4px solid var(--primary-color, #3B82F6);
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
            display: flex;
            height: calc(100vh - 150px);
        }
        
        .passage-panel {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
        }
        
        /* ========== DIVIDER ========== */
        .divider {
            width: 4px;
            background: #ddd;
            cursor: ew-resize;
            position: relative;
            flex-shrink: 0;
            transition: background 0.2s;
        }

        .divider:hover {
            background: #bbb;
        }

        .resize-handle {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 24px;
            height: 60px;
            background: #ccc;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .resize-handle::before {
            content: '⋮';
            color: white;
            font-size: 18px;
        }
        
        .questions-panel {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
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
        
        .passage-title {
            text-align: center;
            margin-bottom: 20px;
            color: #333;
            font-size: 22px;
        }
        
        .passage-content p {
            margin-bottom: 15px;
            text-align: justify;
        }
        
        /* Questions */
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
        
        .answer-input, .answer-select {
            border: 2px solid #ddd;
            border-radius: 4px;
            padding: 8px 12px;
            font-size: 16px;
            width: 100%;
            max-width: 400px;
            transition: border-color 0.3s;
        }
        
        .paragraph-input {
            max-width: 100px;
        }
        
        .answer-input:focus, .answer-select:focus {
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
        
        .matching-questions {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .matching-item {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 10px;
            background: #fff;
            border-radius: 6px;
        }
        
        .paragraph-label {
            font-weight: 600;
            min-width: 120px;
        }
        
        .statement-text {
            flex: 1;
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
        
        @media (max-width: 768px) {
            .main-container {
                flex-direction: column;
            }
            .passage-panel, .questions-panel {
                flex: none;
                width: 100%;
                border-right: none;
            }
        }
    </style>
</head>
<body>
    ${generateAuthComponent(safeBranding)}
    ${generateStartScreenComponent('reading', safeBranding)}
    
    <div class="header" style="background: ${primary_color};">
        <div class="timer-container">
            <span class="timer-display">${testData.duration || 60}:00</span>
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
        <div class="passage-panel">
            ${passagesHTML}
        </div>
        
        <!-- DIVIDER -->
        <div class="divider">
            <div class="resize-handle"></div>
        </div>
        
        <div class="questions-panel">
            ${questionsHTML}
        </div>
    </div>
    
    <nav class="nav-row">
        ${navButtons}
        <button class="footer__deliverButton___3FM07" onclick="submitTest()">Submit Answers</button>
    </nav>
    
    <div id="completion-screen" class="completion-screen">
        <div class="completion-message">Reading section ended</div>
        <a href="#" onclick="navigateToNextTest(); return false;" class="navigation-button">Move to Writing Section</a>
    </div>
    
    <script>
        ${generateAuthScript()}
        ${generateStartScreenScript()}
        
        let currentPart = 1;
        let timeInSeconds = ${testData.duration ? testData.duration * 60 : 3600}; // Custom duration
        let timerInterval;
        
        const answerKey = ${JSON.stringify(answerKey)};
        const projectName = '${projectName}'; 

        function initializeTest() {
            switchToPart(1);
            initializeMatchingHeadingsDragDrop();
        }
        
        // Initialize Matching Headings Drag and Drop
        function initializeMatchingHeadingsDragDrop() {
            // Process all matching headings data and inject drop zones
            if (window.matchingHeadingsData) {
                Object.keys(window.matchingHeadingsData).forEach(key => {
                    const data = window.matchingHeadingsData[key];
                    const startQ = key.replace('q', '');
                    
                    // Inject drop zones into the passage
                    data.forEach(dropInfo => {
                        const paragraphLetter = dropInfo.paragraph;
                        const questionId = dropInfo.questionId;
                        
                        // Find the paragraph block with this letter
                        const paragraphBlock = Array.from(document.querySelectorAll('.paragraph-block')).find(block => {
                            const letter = block.querySelector('.paragraph-letter');
                            return letter && letter.textContent.trim() === paragraphLetter;
                        });
                        
                        if (paragraphBlock) {
                            // Wrap existing content in a container if not already wrapped
                            const paragraphLetter = paragraphBlock.querySelector('.paragraph-letter');
                            const paragraphText = paragraphBlock.querySelector('p');
                            
                            // Check if already wrapped
                            if (paragraphLetter && paragraphText && !paragraphBlock.querySelector('.paragraph-content-row')) {
                                const contentRow = document.createElement('div');
                                contentRow.className = 'paragraph-content-row';
                                paragraphBlock.appendChild(contentRow);
                                contentRow.appendChild(paragraphLetter);
                                contentRow.appendChild(paragraphText);
                            }
                            
                            // Create drop zone
                            const dropZone = document.createElement('div');
                            dropZone.className = 'heading-drop-zone';
                            dropZone.dataset.questionId = questionId;
                            dropZone.dataset.paragraph = paragraphLetter;
                            dropZone.innerHTML = 
                                '<span class="question-number">' + questionId + '</span>' +
                                '<span class="placeholder-text">Drop heading here</span>';
                            
                            // Insert drop zone at the beginning of paragraph-block
                            paragraphBlock.insertBefore(dropZone, paragraphBlock.firstChild);
                            
                            // Add drag and drop event listeners
                            dropZone.addEventListener('dragover', handleDragOver);
                            dropZone.addEventListener('dragleave', handleDragLeave);
                            dropZone.addEventListener('drop', handleDrop);
                        }
                    });
                });
            }
            
            // Setup draggable headings
            document.querySelectorAll('.heading-draggable').forEach(heading => {
                heading.addEventListener('dragstart', handleDragStart);
                heading.addEventListener('dragend', handleDragEnd);
            });
        }
        
        let draggedHeading = null;
        
        function handleDragStart(e) {
            if (this.classList.contains('used')) {
                e.preventDefault();
                return;
            }
            draggedHeading = this;
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        }
        
        function handleDragEnd(e) {
            this.classList.remove('dragging');
        }
        
        function handleDragOver(e) {
            if (e.preventDefault) {
                e.preventDefault();
            }
            e.dataTransfer.dropEffect = 'move';
            this.classList.add('drag-over');
            return false;
        }
        
        function handleDragLeave(e) {
            this.classList.remove('drag-over');
        }
        
        function handleDrop(e) {
            if (e.stopPropagation) {
                e.stopPropagation();
            }
            e.preventDefault();
            
            this.classList.remove('drag-over');
            
            if (!draggedHeading || draggedHeading.classList.contains('used')) {
                return false;
            }
            
            const questionId = this.dataset.questionId;
            const headingId = draggedHeading.dataset.headingId;
            const headingText = draggedHeading.dataset.headingText;
            
            // Remove previous answer if exists
            const hiddenInput = document.getElementById('q' + questionId);
            if (hiddenInput && hiddenInput.value) {
                const previousHeadingId = hiddenInput.value;
                const previousHeading = document.querySelector('.heading-draggable[data-heading-id="' + previousHeadingId + '"]');
                if (previousHeading) {
                    previousHeading.classList.remove('used');
                }
            }
            
            // Update hidden input
            if (hiddenInput) {
                hiddenInput.value = headingId;
            }
            
            // Mark heading as used
            draggedHeading.classList.add('used');
            
            // Update drop zone
            this.classList.add('filled');
            this.innerHTML = 
                '<span class="question-number">' + questionId + '</span>' +
                '<div class="dropped-heading">' +
                    '<span class="heading-text"><strong>' + headingId + '</strong> ' + headingText + '</span>' +
                    '<button class="remove-heading-btn" onclick="removeHeading(&quot;' + questionId + '&quot;)">&times;</button>' +
                '</div>';
            
            updateAttemptedCount();
            return false;
        }
        
        function removeHeading(questionId) {
            const hiddenInput = document.getElementById('q' + questionId);
            if (!hiddenInput) return;
            
            const headingId = hiddenInput.value;
            if (!headingId) return;
            
            // Remove from user answers
            hiddenInput.value = '';
            
            // Mark heading as available again
            const heading = document.querySelector('.heading-draggable[data-heading-id="' + headingId + '"]');
            if (heading) {
                heading.classList.remove('used');
            }
            
            // Reset drop zone
            const dropZone = document.querySelector('.heading-drop-zone[data-question-id="' + questionId + '"]');
            if (dropZone) {
                dropZone.classList.remove('filled');
                dropZone.innerHTML = 
                    '<span class="question-number">' + questionId + '</span>' +
                    '<span class="placeholder-text">Drop heading here</span>';
            }
            
            updateAttemptedCount();
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
            document.querySelectorAll('.reading-passage, .questions-section').forEach(el => {
                el.classList.add('hidden');
            });
            document.getElementById('passage-' + partNumber).classList.remove('hidden');
            document.getElementById('questions-' + partNumber).classList.remove('hidden');
            
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
                
                // Extract the total from "0 of X" format
                const totalQuestions = parseInt(countSpan.textContent.split(' of ')[1]) || 0;
                
                // Get questions section
                const questionsSection = document.querySelector('#questions-' + partNum);
                
                // Count ONLY answered questions
                let answered = 0;
                
                if (questionsSection) {
                    // Count answered text inputs (short answer, gap fill, summary-completion-type, etc.)
                    const textInputs = questionsSection.querySelectorAll('input[type="text"]');
                    textInputs.forEach(input => {
                        if (input.value.trim()) answered++;
                    });
                    
                    // Count answered hidden inputs (summary-completion drag-drop, matching-headings, etc.)
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
    if (!confirm('Submit your Reading answers now?')) return;
    
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
            
            // Try to find the input element
            const element = document.getElementById('q' + q);
            
            if (element) {
              if (element.tagName === 'SELECT') {
                // Dropdown (matching-headings, matching-features, summary-completion)
                userAnswer = element.value;
                elementType = 'select';
              } else if (element.type === 'text') {
                // Text input
                userAnswer = element.value.trim();
                elementType = 'text';
              } else if (element.type === 'hidden') {
                // Hidden input (drag-and-drop questions)
                userAnswer = element.value.trim();
                elementType = 'hidden';
              } else {
                elementType = element.tagName + '/' + element.type;
              }
            } else {
              // Check for radio buttons
              const radioInput = document.querySelector('input[name="q' + q + '"]:checked');
              if (radioInput) {
                userAnswer = radioInput.value;
                elementType = 'radio';
              } else {
                // Check if radio exists but not checked
                const radioExists = document.querySelector('input[name="q' + q + '"]');
                if (radioExists) {
                  elementType = 'radio (not checked)';
                }
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
        
        function downloadResultsPDF(score, results) {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            doc.setFontSize(20);
            doc.setFont(undefined, 'bold');
            doc.text('IELTS Reading Test Results', 105, 20, { align: 'center' });
            
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
            
            doc.save('IELTS_Reading_Results_' + candidateName.replace(/\\s+/g, '_') + '_' + candidateId + '.pdf');
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
        });
        function navigateToNextTest() {
    const nextFile = projectName.replace(/\\s+/g, '_') + '_writing.html';
    window.location.href = nextFile;
}

        // Resize divider functionality
        let isResizing = false;
        const divider = document.querySelector('.divider');
        const passagePanel = document.querySelector('.passage-panel');
        const questionsPanel = document.querySelector('.questions-panel');

        if (divider) {
            divider.addEventListener('mousedown', (e) => {
                isResizing = true;
                document.body.style.cursor = 'ew-resize';
            });

            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                
                const containerWidth = document.querySelector('.main-container').offsetWidth;
                const newPassageWidth = e.clientX;
                
                if (newPassageWidth > 300 && (containerWidth - newPassageWidth) > 300) {
                    passagePanel.style.flex = '0 0 ' + newPassageWidth + 'px';
                    questionsPanel.style.flex = '1';
                }
            });

            document.addEventListener('mouseup', () => {
                isResizing = false;
                document.body.style.cursor = 'default';
            });
        }

        // Drag and Drop Functionality for Matching Sentence Endings
        function initializeDragAndDrop() {
            const draggables = document.querySelectorAll('.draggable-option');
            const dropZones = document.querySelectorAll('.drop-zone');

            let draggedElement = null;
            let draggedFrom = null;

            // Add drag event listeners to draggable options
            draggables.forEach(draggable => {
                draggable.addEventListener('dragstart', handleDragStart);
                draggable.addEventListener('dragend', handleDragEnd);
            });

            // Add drop event listeners to drop zones
            dropZones.forEach(zone => {
                zone.addEventListener('dragover', handleDragOver);
                zone.addEventListener('dragleave', handleDragLeave);
                zone.addEventListener('drop', handleDrop);
            });

            function handleDragStart(e) {
                // Don't allow dragging if option is already in use (unless dragging from a drop zone)
                if (this.classList.contains('in-use') && !this.classList.contains('dropped-option')) {
                    e.preventDefault();
                    return;
                }

                draggedElement = this;
                draggedFrom = this.parentElement;
                this.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', this.innerHTML);
            }

            function handleDragEnd(e) {
                this.classList.remove('dragging');
            }

            function handleDragOver(e) {
                if (e.preventDefault) {
                    e.preventDefault();
                }
                e.dataTransfer.dropEffect = 'move';
                
                // Only highlight if it's an empty drop zone
                if (this.classList.contains('drop-zone') && !this.classList.contains('filled')) {
                    this.classList.add('drag-over');
                }
                
                return false;
            }

            function handleDragLeave(e) {
                this.classList.remove('drag-over');
            }

            function handleDrop(e) {
                if (e.stopPropagation) {
                    e.stopPropagation();
                }

                this.classList.remove('drag-over');

                // Only allow drop in drop zones
                if (!this.classList.contains('drop-zone')) {
                    return false;
                }

                // Don't allow drop if zone is already filled
                if (this.classList.contains('filled')) {
                    return false;
                }

                const questionNumber = this.getAttribute('data-question');
                const answerId = this.getAttribute('data-answer-id');
                const optionLetter = draggedElement.getAttribute('data-option');

                // Clear the drop zone
                this.innerHTML = '';

                // Create the dropped option element
                const droppedOption = document.createElement('div');
                droppedOption.className = 'dropped-option';
                droppedOption.draggable = true;
                droppedOption.setAttribute('data-option', optionLetter);
                droppedOption.innerHTML = 
                    
                    '<div class="option-text-drag">' + draggedElement.querySelector('.option-text-drag').textContent + '</div>' +
                    '<button class="remove-btn" onclick="removeDroppedOption(' + questionNumber + ')">×</button>';

                // Add drag listeners to the dropped option
                droppedOption.addEventListener('dragstart', handleDragStart);
                droppedOption.addEventListener('dragend', handleDragEnd);

                this.appendChild(droppedOption);
                this.classList.add('filled');

                // Mark the original option as in-use
                const originalOption = document.querySelector('.options-grid-drag .draggable-option[data-option="' + optionLetter + '"]');
                if (originalOption) {
                    originalOption.classList.add('in-use');
                }

                // If dragged from another drop zone, clear that zone
                if (draggedFrom && draggedFrom.classList.contains('drop-zone')) {
                    const oldAnswerId = draggedFrom.getAttribute('data-answer-id');
                    draggedFrom.classList.remove('filled');
                    draggedFrom.innerHTML = '<span class="placeholder-text">Drop answer here</span>';
                    
                    // Clear old answer
                    const oldInput = document.getElementById(oldAnswerId);
                    if (oldInput) {
                        oldInput.value = '';
                    }
                }

                // Store the answer in the hidden input
                const input = document.getElementById(answerId);
                if (input) {
                    input.value = optionLetter;
                    // Trigger change event for answer tracking
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }

                return false;
            }
        }

        // Global function to remove dropped options
        window.removeDroppedOption = function(questionNumber) {
            const dropZone = document.querySelector('.drop-zone[data-question="' + questionNumber + '"]');
            const droppedOption = dropZone.querySelector('.dropped-option');
            
            if (droppedOption) {
                const optionLetter = droppedOption.getAttribute('data-option');
                
                // Remove the dropped option
                dropZone.classList.remove('filled');
                dropZone.innerHTML = '<span class="placeholder-text">Drop answer here</span>';
                
                // Mark original option as available again
                const originalOption = document.querySelector('.options-grid-drag .draggable-option[data-option="' + optionLetter + '"]');
                if (originalOption) {
                    originalOption.classList.remove('in-use');
                }
                
                // Clear the answer
                const answerId = dropZone.getAttribute('data-answer-id');
                const input = document.getElementById(answerId);
                if (input) {
                    input.value = '';
                    // Trigger change event for answer tracking
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        }

        // Summary Completion Drag and Drop
        function initializeSummaryCompletionDragDrop() {
            const summaryQuestions = document.querySelectorAll('.summary-completion-question');
            
            summaryQuestions.forEach(summaryQuestion => {
                const draggables = summaryQuestion.querySelectorAll('.summary-draggable');
                const dropZones = summaryQuestion.querySelectorAll('.summary-drop-zone');
                const wordBank = summaryQuestion.querySelector('.summary-word-bank');

                let draggedElement = null;

                draggables.forEach(word => {
                    word.addEventListener('dragstart', handleDragStart);
                    word.addEventListener('dragend', handleDragEnd);
                });

                dropZones.forEach(zone => {
                    zone.addEventListener('dragover', handleDragOver);
                    zone.addEventListener('dragleave', handleDragLeave);
                    zone.addEventListener('drop', handleDrop);
                });

                function handleDragStart(e) {
                    draggedElement = e.target.closest('.summary-draggable');
                    draggedElement.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/html', draggedElement.innerHTML);
                }

                function handleDragEnd(e) {
                    e.target.closest('.summary-draggable').classList.remove('dragging');
                }

                function handleDragOver(e) {
                    if (e.preventDefault) {
                        e.preventDefault();
                    }
                    e.dataTransfer.dropEffect = 'move';
                    
                    const dropZone = e.target.closest('.summary-drop-zone');
                    if (dropZone && !dropZone.classList.contains('filled')) {
                        dropZone.classList.add('drag-over');
                    }
                    
                    return false;
                }

                function handleDragLeave(e) {
                    const dropZone = e.target.closest('.summary-drop-zone');
                    if (dropZone) {
                        dropZone.classList.remove('drag-over');
                    }
                }

                function handleDrop(e) {
                    if (e.stopPropagation) {
                        e.stopPropagation();
                    }

                    const dropZone = e.target.closest('.summary-drop-zone');
                    if (!dropZone) return false;

                    dropZone.classList.remove('drag-over');

                    if (dropZone.classList.contains('filled')) {
                        return false;
                    }

                    const letter = draggedElement.dataset.letter;
                    const word = draggedElement.dataset.word;
                    const questionNum = dropZone.dataset.question;
                    const startQ = summaryQuestion.querySelector('.summary-word-bank').dataset.questionStart;

                    // Calculate gap number
                    const gapNum = parseInt(questionNum) - parseInt(startQ) + 1;

                    // Store answer in hidden input BEFORE updating innerHTML
                    const input = document.getElementById('q' + questionNum);
                    if (input) {
                        input.value = letter;
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                    }

                    // Update drop zone (include hidden input to preserve it)
                    dropZone.innerHTML = \`
                        <span class="gap-number">\${gapNum}</span>
                        <div class="dropped-word">
                            <span class="dropped-letter">\${letter}</span>
                            <span class="word-text">\${word}</span>
                            <button type="button" class="remove-btn" onclick="removeSummaryAnswer(\${questionNum}, '\${letter}')">×</button>
                        </div>
                        <input type="hidden" id="q\${questionNum}" value="\${letter}">
                    \`;
                    dropZone.classList.remove('empty');
                    dropZone.classList.add('filled');

                    // Hide dragged word
                    draggedElement.classList.add('hidden');

                    // Check if word bank is empty
                    checkSummaryWordBankEmpty(wordBank);

                    return false;
                }
            });
        }

        // Global function to remove summary completion answers
        window.removeSummaryAnswer = function(questionNum, letter) {
            const dropZone = document.querySelector('.summary-drop-zone[data-question="' + questionNum + '"]');
            if (!dropZone) return;

            const summaryQuestion = dropZone.closest('.summary-completion-question');
            const wordBank = summaryQuestion.querySelector('.summary-word-bank');
            const startQ = wordBank.dataset.questionStart;

            // Calculate gap number
            const gapNum = parseInt(questionNum) - parseInt(startQ) + 1;

            // Clear hidden input BEFORE updating innerHTML
            const input = document.getElementById('q' + questionNum);
            if (input) {
                input.value = '';
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }

            // Clear drop zone (include hidden input to preserve it)
            dropZone.innerHTML = '<span class="gap-number">' + gapNum + '</span>' +
                '<input type="hidden" id="q' + questionNum + '" value="">';
            dropZone.classList.remove('filled');
            dropZone.classList.add('empty');

            // Show word back in word bank
            const word = wordBank.querySelector('.summary-draggable[data-letter="' + letter + '"]');
            if (word) {
                word.classList.remove('hidden');
            }

            // Check if word bank is empty
            checkSummaryWordBankEmpty(wordBank);
        }

        function checkSummaryWordBankEmpty(wordBank) {
            const visibleWords = wordBank.querySelectorAll('.summary-draggable:not(.hidden)');
            if (visibleWords.length === 0) {
                wordBank.classList.add('empty-state');
            } else {
                wordBank.classList.remove('empty-state');
            }
        }

        // Initialize drag and drop after DOM is loaded
        if (document.querySelector('.drag-drop-question')) {
            initializeDragAndDrop();
        }

        // Initialize summary completion drag and drop
        if (document.querySelector('.summary-completion-question.drag-drop-question')) {
            initializeSummaryCompletionDragDrop();
        }

        // ==================== HIGHLIGHTING FUNCTIONALITY ====================
        let isHighlighting = false;
        let highlightColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#3B82F6';
        let highlights = [];

        function initializeHighlighting() {
          const passagePanel = document.querySelector('.passage-panel');
          
          if (!passagePanel) return;

          passagePanel.addEventListener('contextmenu', function(e) {
            if (e.target.closest('.student-highlight')) {
              return; // Allow right-click on highlights to remove them
            }
            e.preventDefault();
            return false;
          });

          passagePanel.addEventListener('mousedown', function(e) {
            if (e.button === 2 && !e.target.closest('.student-highlight, input, button, select, textarea')) {
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
          
          if (parentElement.closest('input, button, select, textarea, .question, .answer-input, .heading-drop-zone, .options')) {
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