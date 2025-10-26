// Authentication JavaScript functionality
class Auth {
  constructor() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleRegister();
      });
    }
  }

  async handleLogin() {
    const formData = new FormData(document.getElementById('loginForm'));
    const loginData = {
      email: formData.get('email'),
      password: formData.get('password')
    };

    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and redirect to dashboard
        localStorage.setItem('authToken', data.token);
        window.location.href = '/dashboard';
      } else {
        this.showError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showError('Network error. Please try again.');
    }
  }

  async handleRegister() {
    const formData = new FormData(document.getElementById('registerForm'));
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    // Validate password confirmation
    if (password !== confirmPassword) {
      this.showError('Passwords do not match');
      return;
    }

    const registerData = {
      email: formData.get('email'),
      password: password,
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName')
    };

    try {
      const response = await fetch('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerData)
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and redirect to dashboard
        localStorage.setItem('authToken', data.token);
        window.location.href = '/dashboard';
      } else {
        this.showError(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      this.showError('Network error. Please try again.');
    }
  }

  showError(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.remove('hidden');
      
      // Hide error after 5 seconds
      setTimeout(() => {
        errorElement.classList.add('hidden');
      }, 5000);
    }
  }
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new Auth();
});
