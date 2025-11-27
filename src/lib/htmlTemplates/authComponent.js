export function generateAuthComponent(branding = {}) {
  const {
    primary_color = '#3B82F6',
    logo_base64 = null,
    academy_name = 'Your Academy'
  } = branding || {}

  const logoHtml = logo_base64 
    ? `<img src="${logo_base64}" alt="${academy_name}" style="max-width: 120px; max-height: 120px; object-fit: contain;">`
    : `<div style="width: 80px; height: 80px; background: ${primary_color}; border-radius: 16px; display: flex; align-items: center; justify-content: center;"><span style="color: white; font-weight: bold; font-size: 24px;">${academy_name.substring(0, 3).toUpperCase()}</span></div>`

  return `
    <!-- Login Screen -->
    <div id="login-screen" class="login-screen" style="background: ${primary_color};">
        <div class="login-content">
            <div class="login-logo">
                ${logoHtml}
            </div>
            <h1>IELTS Test</h1>
            <p>Please enter your credentials to access the test</p>
            <form id="login-form">
                <div class="form-group">
                    <label for="candidate-name">Full Name</label>
                    <input type="text" id="candidate-name" placeholder="Enter Your Full Name" required>
                </div>
                <div class="form-group">
                    <label for="candidate-id">Candidate ID</label>
                    <input type="text" id="candidate-id" placeholder="Enter Candidate ID" required>
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" placeholder="Enter Password (same as your ID)" required>
                </div>
                <button type="submit" class="login-button" id="login-btn">Start Test</button>
                <div class="error-message" id="login-error">Password must match your Candidate ID.</div>
            </form>
        </div>
    </div>
  `
}

export function generateAuthStyles() {
  return `
    .login-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--primary-color, #3B82F6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    }

    .login-content {
        background: white;
        padding: 40px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        max-width: 400px;
        width: 90%;
        text-align: center;
    }

    .login-logo {
        margin-bottom: 30px;
        display: flex;
        justify-content: center;
    }

    .login-content h1 {
        color: #333;
        font-size: 24px;
        margin-bottom: 10px;
        font-weight: 600;
    }

    .login-content p {
        color: #666;
        font-size: 16px;
        margin-bottom: 30px;
    }

    .form-group {
        margin-bottom: 20px;
        text-align: left;
    }

    .form-group label {
        display: block;
        margin-bottom: 8px;
        color: #333;
        font-weight: 500;
        font-size: 14px;
    }

    .form-group input {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid #e1e5e9;
        border-radius: 8px;
        font-size: 16px;
        transition: border-color 0.3s ease;
        box-sizing: border-box;
    }

    .form-group input:focus {
        outline: none;
        border-color: var(--primary-color, #3B82F6);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .login-button {
        width: 100%;
        background: var(--secondary-color, #1E40AF);
        color: #ffffff;
        border: none;
        padding: 14px 20px;
        font-size: 16px;
        font-weight: 600;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-top: 10px;
    }

    .login-button:hover {
        filter: brightness(1.1);
        transform: translateY(-1px);
    }

    .error-message {
        color: #e74c3c;
        font-size: 14px;
        margin-top: 10px;
        display: none;
    }

    .shake {
        animation: shake 0.5s ease-in-out;
    }

    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
  `
}

export function generateAuthScript() {
  return `
    let candidateId = '';
    let candidateName = '';
    let isAuthenticated = false;

    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const nameInput = document.getElementById('candidate-name').value.trim();
        const candidateInput = document.getElementById('candidate-id').value.trim();
        const passwordInput = document.getElementById('password').value.trim();
        const errorElement = document.getElementById('login-error');
        
        // Password must match Candidate ID
        if (nameInput.length >= 2 && candidateInput.length >= 3 && candidateInput === passwordInput) {
            candidateName = nameInput;
            candidateId = candidateInput;
            isAuthenticated = true;
            errorElement.style.display = 'none';
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('start-screen').style.display = 'flex';
            
            // Update start screen with candidate ID
            const candidateInfo = document.createElement('div');
            candidateInfo.style.cssText = 'background: rgba(var(--primary-color-rgb, 59, 130, 246), 0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid var(--primary-color, #3B82F6);';
            candidateInfo.innerHTML = '<strong>Candidate ID:</strong> ' + candidateId;
            document.querySelector('.start-content').insertBefore(candidateInfo, document.querySelector('.start-content').firstChild);
        } else {
            errorElement.style.display = 'block';
            if (nameInput.length < 2) {
                errorElement.textContent = 'Please enter your full name.';
            } else {
                errorElement.textContent = 'Password must match your Candidate ID.';
            }
            document.getElementById('password').value = '';
            document.querySelector('.login-content').classList.add('shake');
            setTimeout(() => {
                document.querySelector('.login-content').classList.remove('shake');
            }, 500);
        }
    });
  `
}