// Main app JavaScript functionality
class App {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.disableEntityHandlers = window.__APP_DISABLE_ENTITY_HANDLERS__ === true;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupSidebar();
    this.loadCurrentEntity();
    // Always enable the global create-entity modal (needed on pages like Overview)
    this.setupGlobalEntityModal();
    // Page-specific helpers
    this.setupDemographicsInterestsTags();
    this.setupTeamInlineAdd();
    if (!this.disableEntityHandlers) {
      this.setupConnectAccountModal();
    }
  }

  // Utility: always build JSON headers with latest token
  buildJsonHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const latestToken = this.token || localStorage.getItem('authToken');
    if (latestToken) headers['Authorization'] = `Bearer ${latestToken}`;
    return headers;
  }

  // Utility: JSON request wrapper
  async jsonRequest(url, method, payload) {
    const res = await fetch(url, {
      method,
      headers: this.buildJsonHeaders(),
      credentials: 'same-origin',
      body: payload !== undefined ? JSON.stringify(payload) : undefined
    });
    let json = null;
    try { json = await res.json(); } catch (_) {}
    return { ok: res.ok, json };
  }

  // Utility: file -> data URL
  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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
    }

    // Entity dropdown functionality
    const entityDropdownBtn = document.getElementById('entityDropdownBtn');
    const entityDropdown = document.getElementById('entityDropdown');
    if (entityDropdownBtn && entityDropdown) {
      entityDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleEntityDropdown();
      });
    }

    // One-time global listeners for closing dropdowns on outside click / escape
    document.addEventListener('click', (e) => {
      const clickedInsideUser = userDropdownBtn && (userDropdownBtn.contains(e.target) || (userDropdown && userDropdown.contains(e.target)));
      const clickedInsideEntity = entityDropdownBtn && (entityDropdownBtn.contains(e.target) || (entityDropdown && entityDropdown.contains(e.target)));
      if (!clickedInsideUser) this.closeUserDropdown();
      if (!clickedInsideEntity) this.closeEntityDropdown();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeUserDropdown();
        this.closeEntityDropdown();
      }
    });

    // Entity item selection
    const entityItems = document.querySelectorAll('.entity-item');
    entityItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const entityId = e.currentTarget.getAttribute('data-entity-id');
        const entityName = e.currentTarget.getAttribute('data-entity-name');
        this.selectEntity(entityId, entityName);
      });
    });

    // Entity photo change
    const photoBtn = document.getElementById('entityPhotoChangeBtn');
    const photoInput = document.getElementById('entityPhotoInput');
    if (photoBtn && photoInput) {
      photoBtn.addEventListener('click', () => {
        photoInput.click();
      });
      photoInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const entityId = localStorage.getItem('currentEntityId');
        if (!entityId) {
          alert('Select an entity first.');
          return;
        }
        try {
          const dataUrl = await this.readFileAsDataURL(file);
          const { ok, json } = await this.jsonRequest(`/entities/${encodeURIComponent(entityId)}/photo`, 'PUT', {
            photoData: dataUrl,
            photoFilename: file.name
          });
          if (ok && json && json.success) {
            window.location.reload();
          } else {
            alert((json && (json.error || json.message)) || 'Failed to update photo');
          }
        } catch (err) {
          console.error('Photo upload error', err);
          alert('Failed to upload photo');
        } finally {
          try { photoInput.value = ''; } catch(_) {}
        }
      });
    }

    // Add entity button
    const addEntityBtn = document.getElementById('addEntityBtn');
    if (addEntityBtn) {
      addEntityBtn.addEventListener('click', () => {
        this.addEntity();
      });
    }

    // Entity modal platform buttons -> prompt and connect
    if (!this.disableEntityHandlers) {
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
              const { ok, json } = await this.jsonRequest('/entities/accounts', 'POST', {
                platform: p,
                account_name,
                account_id,
                entity_id: entityId
              });
              if (ok && json && json.success) {
                alert('Account connected');
              } else {
                alert((json && (json.error || json.message)) || 'Failed to connect account');
              }
            } catch (err) {
              console.error('Connect account error', err);
              alert('Failed to connect account');
            }
          });
        });
      }
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

  async selectEntity(entityId, entityName) {
    // Switch to the selected entity
    if (!entityId) return;

    const currentEntityName = document.getElementById('currentEntityName');
    if (currentEntityName) currentEntityName.textContent = entityName;

    try {
      const { ok, json } = await this.jsonRequest('/entities/switch', 'POST', { entityId });
      if (!ok || !json || !json.success) throw new Error((json && (json.error || json.message)) || 'Failed to switch entity');
      try { localStorage.setItem('currentEntityId', entityId); } catch (_) {}
      this.closeEntityDropdown();
      window.location.reload();
    } catch (err) {
      console.error('Switch entity error', err);
      alert('Failed to switch entity. Please try again.');
    }
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
    const photoInput = document.getElementById('ge_photo');
    const photoBox = document.getElementById('ge_photo_box');
    const photoPreview = document.getElementById('ge_photo_preview');
    const photoIconWrap = document.getElementById('ge_photo_icon_wrap');

    const hide = () => modal.classList.add('hidden');
    if (closeBtn) closeBtn.addEventListener('click', hide);
    if (cancelBtn) cancelBtn.addEventListener('click', hide);
    modal.addEventListener('click', (e) => { if (e.target.id === 'globalCreateEntityModal') hide(); });

    // Click square opens file selector
    if (photoBox && photoInput) {
      photoBox.addEventListener('click', () => photoInput.click());
      photoInput.addEventListener('change', () => {
        const file = photoInput.files && photoInput.files[0];
        if (!file) {
          if (photoPreview) photoPreview.classList.add('hidden');
          if (photoIconWrap) photoIconWrap.classList.remove('hidden');
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          if (photoPreview) {
            photoPreview.src = reader.result;
            photoPreview.classList.remove('hidden');
          }
          if (photoIconWrap) photoIconWrap.classList.add('hidden');
        };
        reader.readAsDataURL(file);
      });
    }

    if (form) {
      const useAjax = form.dataset.ajax === 'true';
      if (useAjax) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(form);
          const payload = Object.fromEntries(fd.entries());
          // Attach base64 photo if selected
          if (photoInput && photoInput.files && photoInput.files[0]) {
            const file = photoInput.files[0];
            const dataUrl = await this.readFileAsDataURL(file);
            // Strip data URL prefix to send raw base64 as expected by API
            const base64 = String(dataUrl).includes(',') ? String(dataUrl).split(',')[1] : String(dataUrl);
            payload.photo = base64;
            payload.photoFilename = file.name || 'entity-photo.png';
          }
          try {
            const { ok, json } = await this.jsonRequest('/entities', 'POST', payload);
            if (ok && json && json.success) {
              // Switch to new entity for session/state
              await this.jsonRequest('/entities/switch', 'POST', { entityId: json.entity.id });
              localStorage.setItem('currentEntityId', json.entity.id);
              hide();
              window.location.reload();
            } else {
              const msg = (json && (json.error?.error || json.error?.message || json.error || json.message)) || 'Failed to create entity';
              alert(msg);
            }
          } catch (err) {
            console.error('Create entity error', err);
            alert('Failed to create entity');
          }
        });
      }
    }
  }

  setupConnectAccountModal() {}

  // Demographics: simple tag editor bound to hidden input
  setupDemographicsInterestsTags() {
    const tagBox = document.getElementById('dg_interests_tagbox');
    const editor = document.getElementById('dg_interests_editor');
    const hidden = document.getElementById('dg_interests');
    if (!tagBox || !editor || !hidden) return;

    /** @type {string[]} */
    const tags = [];

    const updateHidden = () => {
      hidden.value = tags.join(',');
    };

    const createTagEl = (label) => {
      const wrap = document.createElement('span');
      wrap.className = 'inline-flex items-center bg-purple-100 text-purple-800 rounded-full px-2 py-1 text-xs';
      const txt = document.createElement('span');
      txt.textContent = label;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ml-1 text-purple-600 hover:text-purple-800 focus:outline-none';
      btn.setAttribute('aria-label', `Remove ${label}`);
      btn.textContent = '×';
      btn.addEventListener('click', () => {
        const idx = tags.indexOf(label);
        if (idx >= 0) tags.splice(idx, 1);
        updateHidden();
        wrap.remove();
        editor.focus();
      });
      wrap.appendChild(txt);
      wrap.appendChild(btn);
      return wrap;
    };

    const addTag = (raw) => {
      if (!raw) return;
      const candidate = String(raw).trim();
      if (!candidate) return;
      if (tags.includes(candidate)) return;
      tags.push(candidate);
      const tagEl = createTagEl(candidate);
      tagBox.insertBefore(tagEl, editor);
      updateHidden();
    };

    // Seed from prefilled hidden value if present
    if (hidden.value && typeof hidden.value === 'string') {
      hidden.value.split(',').map(s => s.trim()).filter(Boolean).forEach(addTag);
      editor.value = '';
    }

    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const value = editor.value.replace(/,$/, '').trim();
        addTag(value);
        editor.value = '';
      } else if (e.key === 'Backspace' && editor.value === '' && tags.length) {
        // Remove last tag quickly
        const last = tags.pop();
        updateHidden();
        // Remove last tag element (before editor)
        const children = Array.from(tagBox.children);
        const editorIndex = children.indexOf(editor);
        if (editorIndex > 0) {
          tagBox.removeChild(children[editorIndex - 1]);
        }
      }
    });

    editor.addEventListener('paste', (e) => {
      const text = (e.clipboardData && e.clipboardData.getData('text')) || '';
      if (text && text.includes(',')) {
        e.preventDefault();
        text.split(',').map(s => s.trim()).filter(Boolean).forEach(addTag);
        editor.value = '';
      }
    });

    editor.addEventListener('blur', () => {
      const value = editor.value.replace(/,$/, '').trim();
      addTag(value);
      editor.value = '';
    });

    // Ensure pending text is captured on submit
    const form = tagBox.closest('form');
    if (form) {
      form.addEventListener('submit', () => {
        const value = editor.value.replace(/,$/, '').trim();
        addTag(value);
        editor.value = '';
        updateHidden();
      });
    }
  }

  // Team page: inline add member row
  setupTeamInlineAdd() {
    const addBtn = document.getElementById('tm_add_inline_btn');
    const tbody = document.getElementById('tm_members_tbody');
    if (!addBtn || !tbody) return;

    let inlineRow = null;

    const removeInlineRow = () => {
      if (inlineRow) {
        inlineRow.remove();
        inlineRow = null;
      }
    };

    const createInlineRow = () => {
      if (inlineRow) return;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">New member</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
          <input type="email" id="tm_new_email" class="w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="user@example.com" required />
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
          <select id="tm_new_role" class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
            <option value="manager">Manager</option>
            <option value="editor" selected>Editor</option>
          </select>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 flex items-center gap-3">
          <button type="button" id="tm_save_new" class="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-teal-400 text-white hover:bg-purple-900 focus:ring-purple-500">Save</button>
          <button type="button" id="tm_cancel_new" class="text-gray-600 hover:text-gray-900">Cancel</button>
        </td>
      `;
      tbody.prepend(tr);
      inlineRow = tr;

      const emailInput = tr.querySelector('#tm_new_email');
      const roleSelect = tr.querySelector('#tm_new_role');
      const saveBtn = tr.querySelector('#tm_save_new');
      const cancelBtn = tr.querySelector('#tm_cancel_new');

      if (emailInput) emailInput.focus();

      const savingState = (isSaving) => {
        if (saveBtn) saveBtn.disabled = isSaving;
        if (cancelBtn) cancelBtn.disabled = isSaving;
        if (emailInput) emailInput.disabled = isSaving;
        if (roleSelect) roleSelect.disabled = isSaving;
      };

      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => removeInlineRow());
      }

      const submit = async () => {
        const email = (emailInput && emailInput.value || '').trim().toLowerCase();
        const role = (roleSelect && roleSelect.value) || 'editor';
        if (!email) {
          alert('Please enter an email.');
          if (emailInput) emailInput.focus();
          return;
        }
        savingState(true);
        try {
          const { ok, json } = await this.jsonRequest('/team/add', 'POST', { email, role });
          if (ok && json && json.success) {
            if (json.invited) {
              alert(`Invitation sent to ${email}.`);
            }
            window.location.reload();
            return;
          }
          const msg = (json && (json.error || json.message)) || 'Failed to add member';
          alert(msg);
        } catch (err) {
          console.error('Add member error', err);
          alert('Failed to add member');
        } finally {
          savingState(false);
        }
      };

      if (saveBtn) saveBtn.addEventListener('click', submit);
      if (emailInput) emailInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submit();
        }
      });
    };

    addBtn.addEventListener('click', () => {
      if (inlineRow) return;
      createInlineRow();
    });
  }

  async logout() {
    try {
      // Call logout endpoint to clear session
      await this.jsonRequest('/auth/logout', 'POST');
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
