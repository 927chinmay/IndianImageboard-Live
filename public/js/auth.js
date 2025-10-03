document.addEventListener('DOMContentLoaded', () => {
    const loginLink = document.getElementById('login-link');
    const registerLink = document.getElementById('register-link');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authMessageDiv = document.getElementById('auth-message');

    // Toggle between forms
    loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    });

    registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });

    // Handle registration submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            authMessageDiv.textContent = data.message;
            authMessageDiv.style.color = response.ok ? 'green' : 'red';
            if (response.ok) {
                registerForm.reset();
                loginForm.style.display = 'block';
                registerForm.style.display = 'none';
            }
        } catch (err) {
            authMessageDiv.textContent = 'An error occurred. Please try again.';
            authMessageDiv.style.color = 'red';
        }
    });

    // Handle login submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            authMessageDiv.textContent = data.message;
            authMessageDiv.style.color = response.ok ? 'green' : 'red';

           // In public/js/auth.js
if (response.ok) {
    // Store a placeholder token in local storage to simulate a logged-in state
   localStorage.setItem('userId', data.token); // <-- Store the user ID
    authMessageDiv.textContent = 'Login successful! Redirecting...';
    authMessageDiv.style.color = 'green';
    setTimeout(() => {
        window.location.href = '/'; // Redirect to homepage
    }, 1000);
}

        } catch (err) {
            authMessageDiv.textContent = 'An error occurred. Please try again.';
            authMessageDiv.style.color = 'red';
        }
    });
});