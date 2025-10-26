// Main app JavaScript functionality
class App {
  constructor() {
    this.token = localStorage.getItem('authToken');
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupSidebar();
  }

  setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.logout();
      });
    }

    // Mobile menu button
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', () => {
        this.toggleSidebar();
      });
    }

    // User dropdown functionality
    const userDropdownBtn = document.getElementById('userDropdownBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userDropdownBtn && userDropdown) {
      userDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleUserDropdown();
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!userDropdownBtn.contains(e.target) && !userDropdown.contains(e.target)) {
          this.closeUserDropdown();
        }
      });

      // Close dropdown on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.closeUserDropdown();
        }
      });
    }
  }

  setupSidebar() {
    // Add active state to current page
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
      if (link.getAttribute('href') === currentPath) {
        link.classList.add('bg-purple-900');
      }
    });
  }

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('hidden');
  }

  toggleUserDropdown() {
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
      userDropdown.classList.toggle('hidden');
    }
  }

  closeUserDropdown() {
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
      userDropdown.classList.add('hidden');
    }
  }

  async logout() {
    try {
      // Call logout endpoint to clear session
      await fetch('/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and redirect
      localStorage.removeItem('authToken');
      window.location.href = '/';
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
