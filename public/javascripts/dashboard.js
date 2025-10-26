// Dashboard JavaScript functionality
class Dashboard {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.currentEntity = null;
    this.entities = [];
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadEntities();
    this.loadCurrentEntity();
  }

  setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', () => {
      this.logout();
    });

    // Create entity modal
    document.getElementById('createEntityBtn').addEventListener('click', () => {
      this.showCreateEntityModal();
    });

    document.getElementById('closeModalBtn').addEventListener('click', () => {
      this.hideCreateEntityModal();
    });

    document.getElementById('cancelEntityBtn').addEventListener('click', () => {
      this.hideCreateEntityModal();
    });

    // Create entity form
    document.getElementById('createEntityForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.createEntity();
    });

    // Close modal on outside click
    document.getElementById('createEntityModal').addEventListener('click', (e) => {
      if (e.target.id === 'createEntityModal') {
        this.hideCreateEntityModal();
      }
    });
  }

  async loadEntities() {
    try {
      const response = await fetch('/entities', {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.entities = data.entities;
        this.renderEntities();
      } else {
        console.error('Failed to load entities');
      }
    } catch (error) {
      console.error('Error loading entities:', error);
    }
  }

  async loadCurrentEntity() {
    try {
      const response = await fetch('/entities/current', {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.currentEntity = data.entity;
        this.renderCurrentEntity();
      } else {
        console.log('No current entity selected');
      }
    } catch (error) {
      console.error('Error loading current entity:', error);
    }
  }

  renderEntities() {
    const entitiesList = document.getElementById('entitiesList');
    
    if (this.entities.length === 0) {
      entitiesList.innerHTML = `
        <div class="text-center py-8">
          <i data-lucide="building" class="w-12 h-12 text-gray-400 mx-auto mb-4"></i>
          <p class="text-gray-500">No entities found</p>
          <p class="text-sm text-gray-400">Create your first entity to get started</p>
        </div>
      `;
    } else {
      entitiesList.innerHTML = this.entities.map(entity => `
        <div class="border border-purple-800 rounded-lg p-4 hover:bg-purple-700 transition-colors cursor-pointer" data-entity-id="${entity.id}">
          <div class="flex justify-between items-start">
            <div>
              <h4 class="font-medium text-gray-900">${entity.name}</h4>
              <p class="text-sm text-gray-600">${entity.industry}</p>
              ${entity.description ? `<p class="text-sm text-gray-500 mt-1">${entity.description}</p>` : ''}
            </div>
            <div class="flex space-x-2">
              <button class="text-primary-600 hover:text-primary-700" onclick="dashboard.selectEntity('${entity.id}')">
                <i data-lucide="check-circle" class="w-5 h-5"></i>
              </button>
              <button class="text-gray-400 hover:text-gray-600" onclick="dashboard.editEntity('${entity.id}')">
                <i data-lucide="edit" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        </div>
      `).join('');
    }

    // Re-initialize Lucide icons
    lucide.createIcons();
  }

  renderCurrentEntity() {
    const currentEntityInfo = document.getElementById('currentEntityInfo');
    
    if (this.currentEntity) {
      currentEntityInfo.innerHTML = `
        <div class="text-left">
          <h4 class="font-medium text-gray-900">${this.currentEntity.name}</h4>
          <p class="text-sm text-gray-600">${this.currentEntity.industry}</p>
          ${this.currentEntity.description ? `<p class="text-sm text-gray-500 mt-2">${this.currentEntity.description}</p>` : ''}
          ${this.currentEntity.website ? `<a href="${this.currentEntity.website}" target="_blank" class="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block">Visit Website</a>` : ''}
        </div>
      `;
    } else {
      currentEntityInfo.innerHTML = `
        <div class="text-center py-8">
          <i data-lucide="building" class="w-12 h-12 text-gray-400 mx-auto mb-4"></i>
          <p class="text-gray-500">No entity selected</p>
        </div>
      `;
    }

    // Re-initialize Lucide icons
    lucide.createIcons();
  }

  async selectEntity(entityId) {
    try {
      const response = await fetch('/entities/switch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ entityId })
      });

      if (response.ok) {
        const data = await response.json();
        this.currentEntity = data.entity;
        this.renderCurrentEntity();
        this.loadEntities(); // Refresh the list to show selection
      } else {
        console.error('Failed to switch entity');
      }
    } catch (error) {
      console.error('Error switching entity:', error);
    }
  }

  showCreateEntityModal() {
    document.getElementById('createEntityModal').classList.remove('hidden');
  }

  hideCreateEntityModal() {
    document.getElementById('createEntityModal').classList.add('hidden');
    document.getElementById('createEntityForm').reset();
  }

  async createEntity() {
    const formData = new FormData(document.getElementById('createEntityForm'));
    const entityData = {
      name: formData.get('name'),
      industry: formData.get('industry'),
      description: formData.get('description') || null,
      website: formData.get('website') || null
    };

    try {
      const response = await fetch('/entities', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entityData)
      });

      if (response.ok) {
        const data = await response.json();
        this.hideCreateEntityModal();
        this.loadEntities();
        this.selectEntity(data.entity.id);
      } else {
        const error = await response.json();
        console.error('Failed to create entity:', error);
        alert('Failed to create entity. Please try again.');
      }
    } catch (error) {
      console.error('Error creating entity:', error);
      alert('Error creating entity. Please try again.');
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

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new Dashboard();
});
