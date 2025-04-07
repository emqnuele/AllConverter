/**
 * Visual Format Selector Component
 * Provides an intuitive card-based format selection experience
 */
class FormatSelector {
  constructor() {
    this.fileTypeContainer = document.getElementById('file-type-container');
    this.targetFormatContainer = document.getElementById('target-format-container');
    this.fileTypeSelect = document.getElementById('file-type-select');
    this.targetFormatSelect = document.getElementById('target-format-select');
    this.supportedFormats = {};
    
    this.fileTypes = [
      { value: 'image', label: 'Images', icon: 'fa-image', color: '#3B82F6' },
      { value: 'audio', label: 'Audio', icon: 'fa-music', color: '#EC4899' },
      { value: 'video', label: 'Video', icon: 'fa-film', color: '#8B5CF6' },
      { value: 'document', label: 'Documents', icon: 'fa-file-alt', color: '#10B981' }
    ];
    
    this.init();
  }
  
  init() {
    this.createFileTypeCards();
    this.loadSupportedFormats();
    
    // Connect with original dropdowns for form submission
    this.fileTypeContainer.addEventListener('click', (e) => {
      const card = e.target.closest('.format-card');
      if (card) {
        const value = card.dataset.value;
        this.selectFileType(value);
      }
    });
  }
  
  async loadSupportedFormats() {
    try {
      const response = await fetch('/api/formats');
      this.supportedFormats = await response.json();
      this.updateTargetFormats(this.fileTypeSelect.value);
    } catch (error) {
      console.error('Error loading formats:', error);
    }
  }
  
  createFileTypeCards() {
    this.fileTypeContainer.innerHTML = '';
    
    this.fileTypes.forEach(type => {
      const card = document.createElement('div');
      card.className = 'format-card';
      card.dataset.value = type.value;
      
      if (type.value === this.fileTypeSelect.value) {
        card.classList.add('active');
      }
      
      card.innerHTML = `
        <div class="format-icon" style="background: ${type.color}20; color: ${type.color}">
          <i class="fas ${type.icon}"></i>
        </div>
        <div class="format-label">${type.label}</div>
      `;
      
      this.fileTypeContainer.appendChild(card);
    });
  }
  
  selectFileType(value) {
    // Update original select element
    this.fileTypeSelect.value = value;
    
    // Trigger change event
    this.fileTypeSelect.dispatchEvent(new Event('change'));
    
    // Update UI
    document.querySelectorAll('.format-card').forEach(card => {
      card.classList.toggle('active', card.dataset.value === value);
    });
    
    // Update target formats
    this.updateTargetFormats(value);
  }
  
  updateTargetFormats(fileType) {
    if (!this.supportedFormats || !this.supportedFormats[fileType]) return;
    
    const formats = this.supportedFormats[fileType].output || [];
    this.createFormatCarousel(formats);
    
    // Select first format by default
    if (formats.length > 0) {
      this.targetFormatSelect.value = formats[0];
      this.targetFormatSelect.dispatchEvent(new Event('change'));
    }
  }
  
  createFormatCarousel(formats) {
    this.targetFormatContainer.innerHTML = '';
    
    const carousel = document.createElement('div');
    carousel.className = 'format-carousel';
    
    formats.forEach(format => {
      const formatCard = document.createElement('div');
      formatCard.className = 'format-item';
      formatCard.dataset.value = format;
      
      if (format === this.targetFormatSelect.value) {
        formatCard.classList.add('active');
      }
      
      formatCard.innerHTML = `
        <div class="format-badge">.${format.toUpperCase()}</div>
      `;
      
      formatCard.addEventListener('click', () => {
        // Update original select element
        this.targetFormatSelect.value = format;
        
        // Trigger change event
        this.targetFormatSelect.dispatchEvent(new Event('change'));
        
        // Update UI
        document.querySelectorAll('.format-item').forEach(item => {
          item.classList.toggle('active', item.dataset.value === format);
        });
      });
      
      carousel.appendChild(formatCard);
    });
    
    this.targetFormatContainer.appendChild(carousel);
    
    // Initialize carousel scrolling
    this.initCarouselScroll(carousel);
  }
  
  initCarouselScroll(carousel) {
    let isDown = false;
    let startX;
    let scrollLeft;
    
    carousel.addEventListener('mousedown', (e) => {
      isDown = true;
      carousel.classList.add('active');
      startX = e.pageX - carousel.offsetLeft;
      scrollLeft = carousel.scrollLeft;
    });
    
    carousel.addEventListener('mouseleave', () => {
      isDown = false;
      carousel.classList.remove('active');
    });
    
    carousel.addEventListener('mouseup', () => {
      isDown = false;
      carousel.classList.remove('active');
    });
    
    carousel.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - carousel.offsetLeft;
      const walk = (x - startX) * 2;
      carousel.scrollLeft = scrollLeft - walk;
    });
  }
}

// Initialize format selector
document.addEventListener('DOMContentLoaded', () => {
  window.formatSelector = new FormatSelector();
});