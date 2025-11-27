async function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
import { generateAuthComponent, generateAuthStyles, generateAuthScript } from './authComponent'
import { generateStartScreenComponent, generateStartScreenStyles, generateStartScreenScript } from './startScreenComponent'

export async function generateWritingHTML(testData, projectName, branding) {
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

  let task1ImageBase64 = null
  if (testData.task1?.image) {
    if (testData.task1.image instanceof File) {
      task1ImageBase64 = await imageToBase64(testData.task1.image)
    } else if (typeof testData.task1.image === 'string') {
      task1ImageBase64 = testData.task1.image
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${testData.title} - ${academy_name}</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
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
            display: flex;
            height: calc(100vh - 150px);
        }
        
        .task-panel {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            border-right: 2px solid #e0e0e0;
        }
        
        .writing-panel {
            flex: 1;
            padding: 20px;
            display: flex;
            flex-direction: column;
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
        
        .task-prompt {
            padding: 20px;
            background: #f9f9f9;
            border-left: 4px solid var(--primary-color, #3B82F6);
            border-radius: 4px;
            margin-bottom: 20px;
        }
        
        .task-prompt h4 {
            margin-bottom: 15px;
            color: #333;
        }
        
        .task-prompt p {
            margin-bottom: 10px;
            line-height: 1.6;
        }
        
        .task-image {
    width: 700px;
    height: auto;
    margin: 20px 0;
    border: 1px solid #ddd;
    border-radius: 4px;
}
        
        .writing-textarea {
            flex: 1;
            border: 2px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            font-size: 16px;
            font-family: Arial, sans-serif;
            line-height: 1.6;
            resize: none;
            transition: border-color 0.3s;
        }
        
        .writing-textarea:focus {
            border-color: var(--primary-color, #3B82F6);
            outline: none;
            box-shadow: 0 0 0 3px rgba(254, 208, 1, 0.1);
        }
        
        .word-count {
            margin-top: 10px;
            text-align: right;
            font-size: 14px;
            color: #666;
            font-weight: 500;
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
        }
        
        .footer__questionWrapper___1tZ46 {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .footer__questionNo___3WNct {
            background: none;
            border: none;
            padding: 20px 30px;
            font-size: 16px;
            font-weight: 600;
            color: #333;
            cursor: pointer;
            transition: background-color 0.2s;
            width: 100%;
            height: 100%;
        }
        
        .footer__questionNo___3WNct:hover {
            background-color: #fffbf0;
        }
        
        .footer__questionWrapper___1tZ46.selected .footer__questionNo___3WNct {
            background-color: #fff8e1;
            border-top: 3px solid var(--primary-color, #3B82F6);
        }
        
        .part-title {
            font-size: 18px;
            color: #333;
        }
        
        .footer__deliverButton___3FM07 {
            position: absolute;
            right: 20px;
            background-color: var(--primary-color, #3B82F6);
            color: #1a1d29;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .footer__deliverButton___3FM07:hover {
            background-color: var(--accent-color, #F59E0B);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(254, 208, 1, 0.3);
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
            margin-bottom: 20px;
        }
        
        .completion-submessage {
            font-size: 18px;
            color: #666;
            margin-bottom: 40px;
        }
        
        @media (max-width: 768px) {
            .main-container {
                flex-direction: column;
            }
            .task-panel, .writing-panel {
                flex: none;
                width: 100%;
                border-right: none;
            }
        }
    </style>
</head>
<body>
    ${generateAuthComponent(safeBranding)}
    ${generateStartScreenComponent('writing', safeBranding)}
    
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
        <div class="task-panel">
            <div id="task-1" class="task-content">
                <div class="part-header">
                    <p><strong>Task 1</strong></p>
                    <p>You should spend about 20 minutes on this task. Write at least 150 words.</p>
                </div>
                <div class="task-prompt">
                    <h4>${testData.task1?.title || 'Task 1'}</h4>
                    <p>${testData.task1?.prompt || ''}</p>
                   ${task1ImageBase64 ? `<img src="${task1ImageBase64}" class="task-image" alt="Task 1 visual">` : ''}
                </div>
            </div>
            
            <div id="task-2" class="task-content hidden">
                <div class="part-header">
                    <p><strong>Task 2</strong></p>
                    <p>You should spend about 40 minutes on this task. Write at least 250 words.</p>
                </div>
                <div class="task-prompt">
                    <h4>${testData.task2?.title || 'Task 2'}</h4>
                    <p>${testData.task2?.prompt || ''}</p>
                    <p><em>Give reasons for your answer and include any relevant examples from your own knowledge or experience.</em></p>
                </div>
            </div>
        </div>
        
        <div class="writing-panel">
            <textarea 
                class="writing-textarea" 
                id="writingTextarea"
                placeholder="Start writing your response here..."
            ></textarea>
            <div class="word-count">
                Words: <span id="wordCount">0</span>
            </div>
        </div>
    </div>
    
    <nav class="nav-row">
        <div class="footer__questionWrapper___1tZ46 selected">
            <button class="footer__questionNo___3WNct" onclick="switchTask(1)">
                <div class="part-title">Task 1</div>
            </button>
        </div>
        <div class="footer__questionWrapper___1tZ46">
            <button class="footer__questionNo___3WNct" onclick="switchTask(2)">
                <div class="part-title">Task 2</div>
            </button>
        </div>
        <button class="footer__deliverButton___3FM07" onclick="submitTest()">Submit Answers</button>
    </nav>
    
    <div id="completion-screen" class="completion-screen">
        <div class="completion-message">Writing test completed!</div>
        <div class="completion-submessage">Your responses have been downloaded as a PDF.</div>
    </div>
    
    <script>
        ${generateAuthScript()}
        ${generateStartScreenScript()}
        
        let currentTask = 1;
        let timeInSeconds = ${testData.duration ? testData.duration * 60 : 3600}; // Custom duration
        let timerInterval;
        let task1Content = '';
        let task2Content = '';
        
        function initializeTest() {
            switchTask(1);
            document.getElementById('writingTextarea').addEventListener('input', updateWordCount);
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
        
        function switchTask(taskNumber) {
            if (currentTask === 1) {
                task1Content = document.getElementById('writingTextarea').value;
            } else {
                task2Content = document.getElementById('writingTextarea').value;
            }
            
            currentTask = taskNumber;
            
            document.querySelectorAll('.task-content').forEach(task => {
                task.classList.add('hidden');
            });
            
            document.getElementById('task-' + taskNumber).classList.remove('hidden');
            
            document.querySelectorAll('.footer__questionWrapper___1tZ46').forEach((wrapper, index) => {
                wrapper.classList.toggle('selected', (index + 1) === taskNumber);
            });
            
            document.getElementById('writingTextarea').value = taskNumber === 1 ? task1Content : task2Content;
            updateWordCount();
        }
        
        function updateWordCount() {
            const text = document.getElementById('writingTextarea').value.trim();
            const wordCount = text === '' ? 0 : text.split(/\\s+/).length;
            document.getElementById('wordCount').textContent = wordCount;
            
            if (currentTask === 1) {
                task1Content = document.getElementById('writingTextarea').value;
            } else {
                task2Content = document.getElementById('writingTextarea').value;
            }
        }
        
        function submitTest() {
            if (currentTask === 1) {
                task1Content = document.getElementById('writingTextarea').value;
            } else {
                task2Content = document.getElementById('writingTextarea').value;
            }
            
            const task1Words = task1Content.trim() === '' ? 0 : task1Content.trim().split(/\\s+/).length;
            const task2Words = task2Content.trim() === '' ? 0 : task2Content.trim().split(/\\s+/).length;
            
            if (!confirm('Submit your Writing test?\\n\\nTask 1: ' + task1Words + ' words\\nTask 2: ' + task2Words + ' words')) {
                return;
            }
            
            clearInterval(timerInterval);
            downloadResultsPDF();
            
            setTimeout(() => {
                document.getElementById('completion-screen').style.display = 'flex';
            }, 1000);
        }
        
        function downloadResultsPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('IELTS Writing Test', 105, 20, { align: 'center' });
    
    // Info
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text('Name: ' + candidateName, 20, 35);
    doc.text('Candidate ID: ' + candidateId, 20, 42);
    doc.text('Date: ' + new Date().toLocaleDateString(), 20, 49);
    
    // Task 1
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Task 1', 20, 62);
    
    const task1Words = task1Content.trim() ? task1Content.trim().split(/\\s+/).length : 0;
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text('Word Count: ' + task1Words, 20, 70);
    
    // Task 1 content - readable size
    doc.setFontSize(10);
    const task1Text = task1Content || '[No response provided]';
    const task1Lines = doc.splitTextToSize(task1Text, 170);
    let yPos = 79;
    
    task1Lines.forEach(line => {
        if (yPos > 275) {
            doc.addPage();
            yPos = 20;
        }
        doc.text(line, 20, yPos);
        yPos += 5.5;
    });
    
    // Task 2 - new page
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Task 2', 20, 20);
    
    const task2Words = task2Content.trim() ? task2Content.trim().split(/\\s+/).length : 0;
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text('Word Count: ' + task2Words, 20, 28);
    
    // Task 2 content
    doc.setFontSize(10);
    const task2Text = task2Content || '[No response provided]';
    const task2Lines = doc.splitTextToSize(task2Text, 170);
    yPos = 37;
    
    task2Lines.forEach(line => {
        if (yPos > 275) {
            doc.addPage();
            yPos = 20;
        }
        doc.text(line, 20, yPos);
        yPos += 5.5;
    });
    
    doc.save('IELTS_Writing_Test_' + candidateId + '.pdf');
}
    </script>
</body>
</html>`
}