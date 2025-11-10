// Branding page - Simple version
class Branding {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.currentEntityId = window.__SELECTED_ENTITY_ID__ || localStorage.getItem('currentEntityId') || '';
    this.assets = {};
    this.categories = [];
    this.selectedFile = null;
    this.pendingUpload = null;
  }

  async init() {
    // Wait for container
    const container = document.getElementById('branding_assets_container');
    if (!container) {
      setTimeout(() => this.init(), 100);
      return;
    }

    // Check entity ID
    if (!this.currentEntityId) {
      container.innerHTML = '<div class="text-center text-gray-500 py-8">Please select an entity first.</div>';
      return;
    }

    // Setup everything
    this.setupEventListeners();
    this.initializeCategoryDropdown();
    
    // Load assets
    await this.loadAssets();
  }

  initializeCategoryDropdown() {
    const button = document.getElementById('branding_category_button');
    const dropdown = document.getElementById('branding_category_dropdown');
    const select = document.getElementById('branding_category');
    const icon = document.getElementById('branding_category_icon');
    const text = document.getElementById('branding_category_text');
    
    if (!button || !dropdown || !select || !icon || !text) {
      setTimeout(() => this.initializeCategoryDropdown(), 100);
      return;
    }

    // Toggle dropdown on button click
    button.onclick = (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
    };

    // Handle option selection
    dropdown.onclick = (e) => {
      const option = e.target.closest('.category-option');
      if (!option) return;
      
      e.stopPropagation();
      
      const category = option.dataset.category;
      const iconName = option.dataset.icon;
      
      if (!category || !iconName) return;
      
      // Get fresh references to elements
      const currentIcon = document.getElementById('branding_category_icon');
      const currentText = document.getElementById('branding_category_text');
      const currentSelect = document.getElementById('branding_category');
      
      if (!currentIcon || !currentText || !currentSelect) return;
      
      // Update select
      currentSelect.value = category;
      
      // Update display text
      const names = {
        logo: 'Logo',
        fonts: 'Fonts',
        photos: 'Photos',
        graphics: 'Graphics',
        videos: 'Videos',
        misc: 'Miscellaneous'
      };
      
      currentText.textContent = names[category] || category;
      
      // Update icon - lucide.createIcons() only processes elements without SVG children
      // So we need to completely remove the old SVG and data-lucide, then set new one
      const oldSvg = currentIcon.querySelector('svg');
      if (oldSvg) {
        oldSvg.remove();
      }
      
      // Remove data-lucide attribute completely so lucide treats it as new
      currentIcon.removeAttribute('data-lucide');
      currentIcon.innerHTML = '';
      currentIcon.className = 'w-4 h-4';
      
      // Now set the new data-lucide attribute
      // Use requestAnimationFrame to ensure DOM is clean before setting new attribute
      requestAnimationFrame(() => {
        currentIcon.setAttribute('data-lucide', iconName);
        
        // Now call createIcons - it will find this element as "new" and create the SVG
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      });
      
      dropdown.classList.add('hidden');
    };

    // Close when clicking outside
    document.onclick = (e) => {
      if (!button.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    };
  }

  setupEventListeners() {
    const fileInput = document.getElementById('branding_file');
    const uploadZone = document.getElementById('branding_upload_zone');
    const uploadDefault = document.getElementById('branding_upload_default');
    const uploadPreview = document.getElementById('branding_upload_preview');
    const uploadBtn = document.getElementById('branding_upload_btn');
    const cancelBtn = document.getElementById('branding_cancel_btn');

    if (!fileInput || !uploadZone || !uploadDefault || !uploadPreview) return;

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.handleFileSelect(e.target.files[0]);
      }
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      uploadZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    uploadZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files[0]) {
        fileInput.files = files;
        this.handleFileSelect(files[0]);
      }
    });

    uploadZone.addEventListener('click', () => {
      fileInput.click();
    });

    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => {
        if (this.selectedFile) {
          const category = document.getElementById('branding_category')?.value || 'misc';
          this.handleUpload(this.selectedFile, category);
        }
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.clearPreview();
      });
    }

    const replaceLogoModal = document.getElementById('replace_logo_modal');
    const replaceLogoYes = document.getElementById('replace_logo_yes');
    const replaceLogoNo = document.getElementById('replace_logo_no');
    const replaceLogoCancel = document.getElementById('replace_logo_cancel');

    if (replaceLogoYes) {
      replaceLogoYes.addEventListener('click', () => {
        if (this.pendingUpload) {
          this.uploadAsset(this.pendingUpload.file, this.pendingUpload.category, true);
          this.pendingUpload = null;
        }
        if (replaceLogoModal) replaceLogoModal.classList.add('hidden');
      });
    }

    if (replaceLogoNo || replaceLogoCancel) {
      const cancelHandler = () => {
        this.pendingUpload = null;
        if (replaceLogoModal) replaceLogoModal.classList.add('hidden');
      };
      if (replaceLogoNo) replaceLogoNo.addEventListener('click', cancelHandler);
      if (replaceLogoCancel) replaceLogoCancel.addEventListener('click', cancelHandler);
    }
  }

  handleFileSelect(file) {
    this.selectedFile = file;
    this.showPreview(file);
  }

  clearPreview() {
    this.selectedFile = null;
    const uploadDefault = document.getElementById('branding_upload_default');
    const uploadPreview = document.getElementById('branding_upload_preview');
    const fileInput = document.getElementById('branding_file');
    
    if (uploadDefault) uploadDefault.classList.remove('hidden');
    if (uploadPreview) uploadPreview.classList.add('hidden');
    if (fileInput) fileInput.value = '';
  }

  showPreview(file) {
    const uploadDefault = document.getElementById('branding_upload_default');
    const uploadPreview = document.getElementById('branding_upload_preview');
    const previewContent = document.getElementById('branding_preview_content');
    
    if (!uploadDefault || !uploadPreview || !previewContent) return;

    uploadDefault.classList.add('hidden');
    uploadPreview.classList.remove('hidden');

    const fileType = this.getFileType(file);
    let previewHTML = '';

    if (fileType.type === 'image') {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewHTML = `<img src="${e.target.result}" alt="${file.name}" class="max-w-full max-h-64 rounded-lg" />`;
        previewContent.innerHTML = previewHTML;
      };
      reader.readAsDataURL(file);
    } else if (fileType.type === 'video') {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewHTML = `<video src="${e.target.result}" controls class="max-w-full max-h-64 rounded-lg"></video>`;
        previewContent.innerHTML = previewHTML;
      };
      reader.readAsDataURL(file);
    } else {
      previewHTML = `
        <div class="text-center p-8">
          <i data-lucide="${fileType.type === 'pdf' ? 'file-text' : 'file'}" class="w-16 h-16 text-gray-400 mx-auto"></i>
          <p class="text-sm text-gray-600 mt-4">${file.name}</p>
          <p class="text-xs text-gray-500 mt-2">${fileType.label} • ${this.formatFileSize(file.size)}</p>
        </div>
      `;
      previewContent.innerHTML = previewHTML;
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }
  }

  getFileType(file) {
    const name = file.name.toLowerCase();
    const extension = name.split('.').pop();
    
    if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(name)) {
      return { type: 'image', label: 'Image', extension };
    }
    if (/\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i.test(name)) {
      return { type: 'video', label: 'Video', extension };
    }
    if (/\.pdf$/i.test(name)) {
      return { type: 'pdf', label: 'PDF Document', extension };
    }
    if (/\.(ttf|otf|woff|woff2|eot)$/i.test(name)) {
      return { type: 'font', label: 'Font File', extension };
    }
    return { type: 'other', label: 'File', extension: extension.toUpperCase() };
  }

  // LOAD ASSETS FROM WASABI - This is the critical function
  async loadAssets() {
    const container = document.getElementById('branding_assets_container');
    if (!container || !this.currentEntityId) {
      return;
    }

    try {
      // Fetch from API
      const response = await fetch(`/entities/${this.currentEntityId}/branding`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        container.innerHTML = '<div class="text-center text-red-500 py-8">Failed to load assets.</div>';
        return;
      }

      const data = await response.json();
      
      if (data.success !== false && data.assets) {
        // Store assets
        this.assets = data.assets || {};
        this.categories = data.categories || [];
        
        // Generate categories if missing
        if (Object.keys(this.assets).length > 0 && this.categories.length === 0) {
          this.categories = Object.keys(this.assets);
        }
        
        // RENDER ONLY AFTER ASSETS ARE LOADED
        this.renderAssets();
      } else {
        container.innerHTML = '<div class="text-center text-gray-500 py-8">No assets uploaded yet. Upload your first asset above.</div>';
      }
    } catch (error) {
      console.error('Load assets error:', error);
      const container = document.getElementById('branding_assets_container');
      if (container) {
        container.innerHTML = '<div class="text-center text-red-500 py-8">Error loading assets.</div>';
      }
    }
  }

  // Convert Wasabi URL to signed URL
  getSignedImageUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    
    // If it's already a full URL, check if it's Wasabi
    if (/^https?:\/\//i.test(trimmed)) {
      try {
        const urlObj = new URL(trimmed);
        if (/wasabisys\.com$/i.test(urlObj.host)) {
          // Convert Wasabi URL to signed URL via /files endpoint
          return `/files?url=${encodeURIComponent(trimmed)}`;
        }
      } catch (e) {
        // Invalid URL
      }
      return trimmed;
    }
    
    // If it's a key, convert to signed URL
    return `/files?key=${encodeURIComponent(trimmed.replace(/^\/+/, ''))}`;
  }

  // RENDER ASSETS - Only called after loadAssets completes
  renderAssets() {
    const container = document.getElementById('branding_assets_container');
    if (!container) return;

    // Count total assets
    const totalAssets = Object.values(this.assets).reduce((sum, arr) => {
      return sum + (Array.isArray(arr) ? arr.length : 0);
    }, 0);

    if (totalAssets === 0) {
      container.innerHTML = '<div class="text-center text-gray-500 py-8">No assets uploaded yet. Upload your first asset above.</div>';
      return;
    }

    // Generate categories if needed
    if (this.categories.length === 0 && Object.keys(this.assets).length > 0) {
      this.categories = Object.keys(this.assets);
    }

    let html = '';
    const categoriesToRender = this.categories.length > 0 ? this.categories : Object.keys(this.assets);
    
    categoriesToRender.forEach(category => {
      const categoryAssets = this.assets[category] || [];
      if (!Array.isArray(categoryAssets) || categoryAssets.length === 0) return;

      html += `
        <div class="mb-8">
          <h3 class="text-xl font-semibold text-gray-900 mb-4 capitalize">${category}</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      `;

      categoryAssets.forEach(asset => {
        const isImage = asset.url && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(asset.filename || asset.key);
        const isVideo = asset.url && /\.(mp4|webm|ogg)$/i.test(asset.filename || asset.key);
        const isPdf = asset.url && /\.pdf$/i.test(asset.filename || asset.key);
        
        // Get signed URL for Wasabi
        const imageUrl = isImage ? this.getSignedImageUrl(asset.url) : asset.url;
        const videoUrl = isVideo ? this.getSignedImageUrl(asset.url) : asset.url;

        html += `
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow">
            <div class="aspect-square bg-gray-100 flex items-center justify-center relative">
        `;

        if (isImage) {
          html += `<img src="${imageUrl}" alt="${(asset.filename || 'Image').replace(/"/g, '&quot;')}" class="w-full h-full object-cover" />`;
        } else if (isVideo) {
          html += `<video src="${videoUrl}" class="w-full h-full object-cover" controls></video>`;
        } else if (isPdf) {
          html += `<div class="text-center p-4"><i data-lucide="file-text" class="w-12 h-12 text-gray-400 mx-auto"></i><p class="text-xs text-gray-600 mt-2">PDF</p></div>`;
        } else {
          html += `<div class="text-center p-4"><i data-lucide="file" class="w-12 h-12 text-gray-400 mx-auto"></i><p class="text-xs text-gray-600 mt-2 truncate">${(asset.filename || 'File').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p></div>`;
        }

        html += `
              <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button onclick="branding.deleteAsset('${asset.key.replace(/'/g, "\\'")}')" class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
            <div class="p-2">
              <p class="text-xs text-gray-600 truncate" title="${(asset.filename || 'Untitled').replace(/"/g, '&quot;')}">${(asset.filename || 'Untitled').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
              <p class="text-xs text-gray-400">${this.formatFileSize(asset.size)}</p>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    // SET HTML ONLY AFTER ALL ASSETS ARE PROCESSED
    container.innerHTML = html;
    
    // Initialize icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  async handleUpload(file, category) {
    const hasExistingLogo = this.assets['logo'] && this.assets['logo'].length > 0;
    
    if (category === 'logo' && hasExistingLogo) {
      this.pendingUpload = { file, category };
      const modal = document.getElementById('replace_logo_modal');
      if (modal) modal.classList.remove('hidden');
      return;
    }

    await this.uploadAsset(file, category, false);
  }

  async uploadAsset(file, category, replaceLogo) {
    try {
      const dataUrl = await this.readFileAsDataURL(file);

      const response = await fetch(`/entities/${this.currentEntityId}/branding`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          assetData: dataUrl,
          assetFilename: file.name,
          category: category,
          replaceLogo: replaceLogo
        })
      });

      if (!response.ok) {
        const responseText = await response.text();
        let error;
        try {
          error = JSON.parse(responseText);
        } catch (e) {
          error = { error: responseText || 'Upload failed' };
        }
        throw new Error(error.error || error.message || 'Upload failed');
      }

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Invalid response from server');
      }

      if (data.success) {
        this.clearPreview();
        // RELOAD ASSETS FROM WASABI
        await this.loadAssets();
        alert('Asset uploaded successfully!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload asset: ' + error.message);
    }
  }

  async deleteAsset(key) {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      const response = await fetch(`/entities/${this.currentEntityId}/branding?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Delete failed');
      }

      const data = await response.json();
      if (data.success) {
        // RELOAD ASSETS FROM WASABI
        await this.loadAssets();
        alert('Asset deleted successfully!');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete asset: ' + error.message);
    }
  }

  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }
}

// SIMPLE INITIALIZATION - Wait for DOM, then load assets
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for window.__SELECTED_ENTITY_ID__ to be set
  setTimeout(() => {
    const branding = new Branding();
    
    // Update entity ID from window if available
    if (window.__SELECTED_ENTITY_ID__ && !branding.currentEntityId) {
      branding.currentEntityId = window.__SELECTED_ENTITY_ID__;
    }
    
    // Initialize - this will load assets from Wasabi
    branding.init();
    window.branding = branding;
  }, 200);
});
