export function generateStartScreenComponent(testType, branding = {}) {
  const {
    primary_color = '#3B82F6',
    accent_color = '#F59E0B',
    logo_base64 = null,
    academy_name = 'Your Academy'
  } = branding || {}

  const logoHtml = logo_base64 
    ? `<img src="${logo_base64}" alt="${academy_name}" style="width: 100px; height: 100px; object-fit: contain;">`
    : `<div style="width: 80px; height: 80px; background: ${primary_color}; border-radius: 16px; display: flex; align-items: center; justify-content: center;"><span style="color: white; font-weight: bold; font-size: 24px;">${academy_name.substring(0, 3).toUpperCase()}</span></div>`

  const instructions = {
    listening: {
      title: 'IELTS Listening Mock Test',
      description: 'This is a timed listening test. Once you start, the audio will play automatically.',
      points: [
        'The test contains 40 questions divided into 4 parts',
        'You will hear the audio only once',
        'Answer all questions as you listen',
        'The audio cannot be paused or rewound'
      ]
    },
    reading: {
      title: 'IELTS Reading Mock Test',
      description: 'This is a timed reading test. You have 60 minutes to complete all 40 questions.',
      points: [
        'The test contains 40 questions divided into 3 parts',
        'You have 60 minutes to complete the test',
        'Read all passages carefully and answer all questions',
        'You can navigate between questions and parts freely'
      ]
    },
    writing: {
      title: 'IELTS Writing Mock Test',
      description: 'This is a timed writing test. You have 60 minutes to complete both Task 1 and Task 2.',
      points: [
        'Task 1: Spend about 20 minutes, write at least 150 words',
        'Task 2: Spend about 40 minutes, write at least 250 words',
        'You can switch between tasks at any time',
        'Word count is displayed below each writing area'
      ]
    }
  }

  const info = instructions[testType]

  return `
    <div id="start-screen" class="start-screen" style="display: none; background: ${primary_color};">
        <div class="start-content">
            <div class="start-icon">
                ${logoHtml}
            </div>
            <h1>${info.title}</h1>
            <p class="main-description">${info.description}</p>
            <div class="instructions-section" style="border-left-color: ${primary_color};">
                <h3>Instructions:</h3>
                <ul>
                    ${info.points.map(point => `<li>${point}</li>`).join('')}
                </ul>
            </div>
            <button id="start-test-btn" class="start-test-button" style="background: ${accent_color};">Start Test</button>
        </div>
    </div>
  `
}

export function generateStartScreenStyles() {
  return `
    .start-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--primary-color, #3B82F6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    }

    .start-content {
        background: white;
        padding: 50px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        max-width: 650px;
        text-align: center;
        border: 1px solid #e9ecef;
    }

    .start-icon {
        margin-bottom: 25px;
        display: flex;
        justify-content: center;
    }

    .start-content h1 {
        color: #212529;
        font-size: 32px;
        margin-bottom: 20px;
        font-weight: 600;
        letter-spacing: -0.5px;
    }

    .main-description {
        color: #6c757d;
        font-size: 18px;
        line-height: 1.6;
        margin-bottom: 30px;
        font-weight: 400;
    }

    .instructions-section {
        background: #f8f9fa;
        padding: 25px;
        border-radius: 8px;
        margin-bottom: 35px;
        border-left: 4px solid var(--primary-color, #3B82F6);
    }

    .instructions-section h3 {
        color: #495057;
        font-size: 18px;
        margin-bottom: 15px;
        font-weight: 600;
    }

    .instructions-section ul {
        text-align: left;
        color: #6c757d;
        font-size: 16px;
        line-height: 1.7;
        margin: 0;
        padding-left: 20px;
    }

    .instructions-section ul li {
        margin-bottom: 10px;
    }

    .start-test-button {
        background: var(--accent-color, #F59E0B);
        color: #1a1a1a;
        border: none;
        padding: 16px 45px;
        font-size: 18px;
        font-weight: 600;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        letter-spacing: 0.5px;
    }

    .start-test-button:hover {
        filter: brightness(1.1);
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    }

    .header, .main-container, .nav-row {
        display: none;
    }
  `
}

export function generateStartScreenScript() {
  return `
    document.getElementById('start-test-btn').addEventListener('click', function() {
        if (!isAuthenticated || !candidateId) {
            alert('Authentication required.');
            return;
        }
        
        document.getElementById('start-screen').style.display = 'none';
        document.querySelector('.header').style.display = 'flex';
        document.querySelector('.main-container').style.display = 'flex';
        document.querySelector('.nav-row').style.display = 'flex';
        document.getElementById('header-candidate-id').textContent = candidateId;
        
        startTimer();
        initializeTest();
        playAllAudiosInSequence();
    });
  `
}