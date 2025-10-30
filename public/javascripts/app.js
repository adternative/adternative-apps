// Main app JavaScript functionality
class App {
  constructor() {
    this.token = localStorage.getItem('authToken');
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupSidebar();
    this.loadCurrentEntity();
    this.setupGlobalEntityModal();
    this.setupConnectAccountModal();
  }

  loadCurrentEntity() {
    // Load saved current entity from localStorage
    let currentEntityId = localStorage.getItem('currentEntityId');
    const serverSelectedId = typeof window !== 'undefined' ? window.__SELECTED_ENTITY_ID__ || null : null;

    if (serverSelectedId && currentEntityId !== serverSelectedId) {
      currentEntityId = serverSelectedId;
      try { localStorage.setItem('currentEntityId', serverSelectedId); } catch (_) {}
    }

    if (!currentEntityId && serverSelectedId) {
      currentEntityId = serverSelectedId;
      try { localStorage.setItem('currentEntityId', serverSelectedId); } catch (_) {}
    }

    if (!currentEntityId) return;

    const entityItems = document.querySelectorAll('.entity-item');
    const currentEntityName = document.getElementById('currentEntityName');
    entityItems.forEach(item => {
      const entityId = item.getAttribute('data-entity-id');
      if (entityId === currentEntityId) {
        const entityName = item.getAttribute('data-entity-name');
        if (currentEntityName && entityName) {
          currentEntityName.textContent = entityName;
        }
        item.classList.add('bg-purple-900', 'text-white');
      } else {
        item.classList.remove('bg-purple-900', 'text-white');
      }
    });
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

    // Close sidebar button
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    if (closeSidebarBtn) {
      closeSidebarBtn.addEventListener('click', () => {
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

    // Entity dropdown functionality
    const entityDropdownBtn = document.getElementById('entityDropdownBtn');
    const entityDropdown = document.getElementById('entityDropdown');
    
    if (entityDropdownBtn && entityDropdown) {
      entityDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleEntityDropdown();
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!entityDropdownBtn.contains(e.target) && !entityDropdown.contains(e.target)) {
          this.closeEntityDropdown();
        }
      });

      // Close dropdown on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.closeEntityDropdown();
        }
      });
    }

    // Entity item selection
    const entityItems = document.querySelectorAll('.entity-item');
    entityItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const entityId = e.currentTarget.getAttribute('data-entity-id');
        const entityName = e.currentTarget.getAttribute('data-entity-name');
        this.selectEntity(entityId, entityName);
      });
    });

    // Add entity button
    const addEntityBtn = document.getElementById('addEntityBtn');
    if (addEntityBtn) {
      addEntityBtn.addEventListener('click', () => {
        this.addEntity();
      });
    }

    // Entity modal platform buttons -> prompt and connect
    const entityPlatformBtns = document.querySelectorAll('.entity-platform-btn');
    if (entityPlatformBtns && entityPlatformBtns.length) {
      entityPlatformBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
          const p = btn.getAttribute('data-platform');
          const entityId = localStorage.getItem('currentEntityId');
          if (!entityId) {
            alert('Select or create an entity first.');
            return;
          }
          const account_name = prompt(`Enter ${p} account name`);
          if (!account_name) return;
          const account_id = prompt(`Enter ${p} account id/handle`);
          if (!account_id) return;
          try {
            const res = await fetch('/entities/accounts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
              body: JSON.stringify({ platform: p, account_name, account_id, entity_id: entityId })
            });
            const json = await res.json();
            if (res.ok && json.success) {
              alert('Account connected');
            } else {
              alert(json.error || 'Failed to connect account');
            }
          } catch (err) {
            console.error('Connect account error', err);
            alert('Failed to connect account');
          }
        });
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

  toggleEntityDropdown() {
    const entityDropdown = document.getElementById('entityDropdown');
    if (entityDropdown) {
      entityDropdown.classList.toggle('hidden');
    }
    // Close user dropdown if open
    this.closeUserDropdown();
  }

  closeEntityDropdown() {
    const entityDropdown = document.getElementById('entityDropdown');
    if (entityDropdown) {
      entityDropdown.classList.add('hidden');
    }
  }

  selectEntity(entityId, entityName) {
    // Switch to the selected entity
    console.log('Selecting entity:', entityId, entityName);
    
    if (!entityId) return;

    const currentEntityName = document.getElementById('currentEntityName');
    if (currentEntityName) {
      currentEntityName.textContent = entityName;
    }

    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    fetch('/entities/switch', {
      method: 'POST',
      headers,
      credentials: 'same-origin',
      body: JSON.stringify({ entityId })
    })
      .then(res => res.json().then(json => ({ ok: res.ok, json })))
      .then(({ ok, json }) => {
        if (!ok || !json.success) {
          throw new Error(json.error || 'Failed to switch entity');
        }
        try { localStorage.setItem('currentEntityId', entityId); } catch (_) {}
        this.closeEntityDropdown();
        window.location.reload();
      })
      .catch(err => {
        console.error('Switch entity error', err);
        alert('Failed to switch entity. Please try again.');
      });
  }

  addEntity() {
    // Prefer global modal if available
    this.closeEntityDropdown();
    const modal = document.getElementById('globalCreateEntityModal');
    if (modal) {
      modal.classList.remove('hidden');
      return;
    }
    // Fallback: redirect to home with flag to open modal
    const url = new URL('/', window.location.origin);
    url.searchParams.set('openEntityModal', '1');
    window.location.href = url.toString();
  }

  setupGlobalEntityModal() {
    const modal = document.getElementById('globalCreateEntityModal');
    if (!modal) return;

    const closeBtn = document.getElementById('globalCloseEntityModalBtn');
    const cancelBtn = document.getElementById('globalCancelEntityBtn');
    const form = document.getElementById('globalCreateEntityForm');

    const hide = () => modal.classList.add('hidden');
    if (closeBtn) closeBtn.addEventListener('click', hide);
    if (cancelBtn) cancelBtn.addEventListener('click', hide);
    modal.addEventListener('click', (e) => { if (e.target.id === 'globalCreateEntityModal') hide(); });

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const payload = Object.fromEntries(fd.entries());
        try {
          const res = await fetch('/entities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
            body: JSON.stringify(payload)
          });
          const json = await res.json();
          if (res.ok && json.success) {
            // Switch to new entity for session/state
            await fetch('/entities/switch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
              body: JSON.stringify({ entityId: json.entity.id })
            });
            localStorage.setItem('currentEntityId', json.entity.id);
            hide();
            window.location.reload();
          } else {
            alert(json.error?.error || json.error?.message || 'Failed to create entity');
          }
        } catch (err) {
          console.error('Create entity error', err);
          alert('Failed to create entity');
        }
      });
    }
  }

  setupConnectAccountModal() {}

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
