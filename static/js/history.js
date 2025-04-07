/**
 * History Manager for the File Converter
 * Manages the display and interaction with conversion history
 */
class HistoryManager {
    constructor() {
        this.historyContainer = document.getElementById('history-container');
        this.historyList = document.getElementById('history-list');
        this.historyEmpty = document.getElementById('history-empty');
        this.batchActions = document.getElementById('batch-actions');
        this.selectedCount = document.getElementById('selected-count');
        
        // Buttons
        this.refreshBtn = document.getElementById('refresh-history-btn');
        this.selectAllBtn = document.getElementById('select-all-btn');
        this.deselectAllBtn = document.getElementById('deselect-all-btn');
        this.downloadSelectedBtn = document.getElementById('download-selected-btn');
        this.deleteSelectedBtn = document.getElementById('delete-selected-btn');
        this.startConvertingBtn = document.getElementById('start-converting-btn');
        
        // State
        this.history = [];
        this.selectedFiles = [];
        this.selectedSessions = [];
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Main actions
        this.refreshBtn.addEventListener('click', () => this.loadHistory());
        
        // Batch selection actions
        this.selectAllBtn.addEventListener('click', () => this.selectAll());
        this.deselectAllBtn.addEventListener('click', () => this.deselectAll());
        this.downloadSelectedBtn.addEventListener('click', () => this.downloadSelected());
        this.deleteSelectedBtn.addEventListener('click', () => this.confirmDeleteSelected());
        
        // Empty state action
        this.startConvertingBtn.addEventListener('click', () => this.switchToConverter());
        
        // Check for selections when checkbox changes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('history-checkbox')) {
                this.updateSelections();
            }
        });
    }
    
    async loadHistory() {
        // Clear current content and show loading
        this.historyList.innerHTML = `
            <div class="history-loading text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2 text-muted">Loading history...</p>
            </div>
        `;
        
        try {
            const response = await fetch('/api/history');
            const data = await response.json();
            
            if (data.success) {
                this.history = data.history;
                this.renderHistory();
            } else {
                throw new Error(data.error || "Could not load history");
            }
        } catch (error) {
            console.error('Error loading history:', error);
            this.historyList.innerHTML = `
                <div class="alert alert-danger my-3">
                    <i class="fas fa-exclamation-circle me-2"></i> 
                    Error loading history: ${error.message || "Unknown error"}
                </div>
            `;
        }
    }
    
    renderHistory() {
        // Clear selections
        this.selectedFiles = [];
        this.selectedSessions = [];
        this.updateBatchActions();
        
        // Clear current content
        this.historyList.innerHTML = '';
        
        // Show empty state if no history
        if (!this.history || this.history.length === 0) {
            this.historyEmpty.classList.remove('d-none');
            return;
        }
        
        // Hide empty state and show history
        this.historyEmpty.classList.add('d-none');
        
        // Group sessions by date
        const groupedSessions = this.groupSessionsByDate(this.history);
        
        // Render each date group
        Object.keys(groupedSessions).forEach(date => {
            const dateHeader = document.createElement('div');
            dateHeader.className = 'date-header mb-3';
            dateHeader.innerHTML = `
                <h5 class="text-muted mb-3">${date}</h5>
            `;
            this.historyList.appendChild(dateHeader);
            
            // Render sessions for this date
            groupedSessions[date].forEach(session => this.renderSession(session));
        });
        
        // Apply hover effects
        this.setupHoverEffects();
    }
    
    groupSessionsByDate(sessions) {
        const grouped = {};
        
        sessions.forEach(session => {
            // Extract date part only (remove time)
            const date = new Date(session.timestamp * 1000).toLocaleDateString();
            
            if (!grouped[date]) {
                grouped[date] = [];
            }
            
            grouped[date].push(session);
        });
        
        return grouped;
    }
    
    renderSession(session) {
        // Create session element
        const sessionEl = document.createElement('div');
        sessionEl.className = 'history-session';
        sessionEl.dataset.sessionId = session.session_id;
        
        // Format date
        const sessionDate = new Date(session.timestamp * 1000);
        const formattedDate = sessionDate.toLocaleString();
        
        // Count file categories
        const categories = session.categories || {};
        const categoryBadges = Object.keys(categories).map(category => {
            return `<span class="category-badge ${category.toLowerCase()}">${category} (${categories[category]})</span>`;
        }).join('');
        
        // Create session header
        const header = document.createElement('div');
        header.className = 'session-header d-flex justify-content-between align-items-center';
        header.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="form-check me-3">
                    <input class="form-check-input history-checkbox session-checkbox" type="checkbox" value="${session.session_id}">
                </div>
                <div class="session-date">
                    <i class="fas fa-calendar-alt"></i>
                    ${formattedDate}
                </div>
            </div>
            <div class="session-stats">
                <span class="stat-item">
                    <i class="fas fa-file"></i>
                    ${session.file_count} file${session.file_count !== 1 ? 's' : ''}
                </span>
                <div class="categories">
                    ${categoryBadges}
                </div>
                <i class="fas fa-chevron-down chevron-icon"></i>
            </div>
        `;
        
        // Create session body with file list
        const body = document.createElement('div');
        body.className = 'session-body';
        
        const filesList = document.createElement('div');
        filesList.className = 'session-files';
        
        // Add files to the list
        if (session.files && session.files.length > 0) {
            session.files.forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.dataset.sessionId = session.session_id;
                fileItem.dataset.filename = file.filename;
                
                // Format file size
                const size = this.formatFileSize(file.size);
                
                const category = file.category || this.getCategoryFromExtension(file.extension);
                
                fileItem.innerHTML = `
                    <div class="file-checkbox">
                        <input type="checkbox" class="form-check-input history-checkbox file-checkbox" 
                               data-session-id="${session.session_id}" 
                               data-filename="${file.filename}">
                    </div>
                    <div class="file-icon">
                        <i class="${this.getFileTypeIcon(file.extension)}"></i>
                    </div>
                    <div class="file-info">
                        <div class="file-name">${file.filename}</div>
                        <div class="file-meta">
                            <span class="file-size">${size}</span> • 
                            <span class="file-type">${file.extension.toUpperCase()}</span>
                        </div>
                    </div>
                    <div class="file-actions">
                        <button class="btn btn-file-action download" data-session-id="${session.session_id}" data-filename="${file.filename}" title="Download">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-file-action delete" data-session-id="${session.session_id}" data-filename="${file.filename}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                filesList.appendChild(fileItem);
            });
        } else {
            filesList.innerHTML = `<p class="text-muted text-center">No files in this session</p>`;
        }
        
        body.appendChild(filesList);
        
        // Add a delete button for the entire session
        const sessionActions = document.createElement('div');
        sessionActions.className = 'session-actions d-flex justify-content-end p-3 border-top';
        sessionActions.innerHTML = `
            <button class="btn btn-danger btn-sm delete-session" data-session-id="${session.session_id}">
                <i class="fas fa-trash me-2"></i> Delete Session
            </button>
        `;
        body.appendChild(sessionActions);
        
        // Add header and body to session element
        sessionEl.appendChild(header);
        sessionEl.appendChild(body);
        this.historyList.appendChild(sessionEl);
        
        // Add event listeners
        header.addEventListener('click', (e) => {
            // Don't toggle if clicking on checkbox
            if (e.target.type === 'checkbox') return;
            
            // Toggle expanded class
            const body = sessionEl.querySelector('.session-body');
            const chevron = header.querySelector('.chevron-icon');
            
            if (body.classList.contains('expanded')) {
                body.classList.remove('expanded');
                chevron.classList.remove('rotated');
                header.classList.remove('active');
            } else {
                body.classList.add('expanded');
                chevron.classList.add('rotated');
                header.classList.add('active');
            }
        });
        
        // Add file action event listeners
        const downloadBtns = filesList.querySelectorAll('.file-actions .download');
        downloadBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const sessionId = btn.dataset.sessionId;
                const filename = btn.dataset.filename;
                this.downloadFile(sessionId, filename);
            });
        });
        
        const deleteBtns = filesList.querySelectorAll('.file-actions .delete');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const sessionId = btn.dataset.sessionId;
                const filename = btn.dataset.filename;
                this.confirmDeleteFile(sessionId, filename);
            });
        });
        
        // Add session deletion event listener
        const deleteSessionBtn = sessionActions.querySelector('.delete-session');
        deleteSessionBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.confirmDeleteSession(session.session_id);
        });
    }
    
    setupHoverEffects() {
        const items = document.querySelectorAll('.file-item');
        
        items.forEach(item => {
            this.applyHoverEffect(item);
        });
    }
    
    applyHoverEffect(element) {
        element.addEventListener('mousemove', (e) => {
            // Skip if reduced motion is preferred
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            
            // Subtle effect
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const angleX = (y - centerY) / 25;
            const angleY = (centerX - x) / 25;
            
            element.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) translateZ(5px)`;
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = 'rotateX(0) rotateY(0) translateZ(0)';
        });
    }
    
    downloadFile(sessionId, filename) {
        window.location.href = `/download/${sessionId}/${filename}`;
    }
    
    async deleteFile(sessionId, filename) {
        try {
            const response = await fetch(`/api/history/delete/file/${sessionId}/${filename}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Remove file from UI and update state
                const fileElement = document.querySelector(`.file-item[data-session-id="${sessionId}"][data-filename="${filename}"]`);
                
                if (fileElement) {
                    // Animate removal
                    gsap.to(fileElement, {
                        x: 50,
                        opacity: 0,
                        height: 0,
                        marginBottom: 0,
                        padding: 0,
                        duration: 0.3,
                        onComplete: () => {
                            fileElement.remove();
                            
                            // Update session file count
                            const session = this.history.find(s => s.session_id === sessionId);
                            if (session) {
                                session.file_count--;
                                
                                // Update the session header
                                const sessionHeader = document.querySelector(`.history-session[data-session-id="${sessionId}"] .session-stats .stat-item`);
                                if (sessionHeader) {
                                    sessionHeader.innerHTML = `
                                        <i class="fas fa-file"></i>
                                        ${session.file_count} file${session.file_count !== 1 ? 's' : ''}
                                    `;
                                }
                                
                                // If no files left, reload history to update UI
                                if (session.file_count <= 0) {
                                    this.loadHistory();
                                }
                            }
                        }
                    });
                    
                    // Show success notification
                    this.showToast('File deleted successfully', 'success');
                }
            } else {
                throw new Error(data.error || "Could not delete file");
            }
        } catch (error) {
            console.error('Error deleting file:', error);
            this.showToast('Error deleting file: ' + error.message, 'error');
        }
    }
    
    async deleteSession(sessionId) {
        try {
            const response = await fetch(`/api/history/delete/${sessionId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Remove session from UI
                const sessionElement = document.querySelector(`.history-session[data-session-id="${sessionId}"]`);
                
                if (sessionElement) {
                    // Animate removal
                    gsap.to(sessionElement, {
                        scale: 0.95,
                        opacity: 0,
                        y: -20,
                        duration: 0.3,
                        onComplete: () => {
                            // Remove related date header if this is the last session for that date
                            const dateHeader = sessionElement.previousElementSibling;
                            const nextElement = sessionElement.nextElementSibling;
                            
                            sessionElement.remove();
                            
                            if (dateHeader && dateHeader.classList.contains('date-header') &&
                                (!nextElement || nextElement.classList.contains('date-header'))) {
                                dateHeader.remove();
                            }
                            
                            // Remove from history array
                            this.history = this.history.filter(s => s.session_id !== sessionId);
                            
                            // Show empty state if no sessions left
                            if (this.history.length === 0) {
                                this.historyEmpty.classList.remove('d-none');
                            }
                        }
                    });
                    
                    // Show success notification
                    this.showToast('Session deleted successfully', 'success');
                }
            } else {
                throw new Error(data.error || "Could not delete session");
            }
        } catch (error) {
            console.error('Error deleting session:', error);
            this.showToast('Error deleting session: ' + error.message, 'error');
        }
    }
    
    async deleteBatch() {
        try {
            const payload = {
                files: this.selectedFiles.map(id => {
                    const [sessionId, filename] = id.split('|');
                    return { session_id: sessionId, filename };
                }),
                sessions: this.selectedSessions
            };
            
            const response = await fetch('/api/history/delete/batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Reload history after batch deletion
                this.loadHistory();
                this.showToast('Selected items deleted successfully', 'success');
            } else {
                throw new Error(data.error || "Could not delete selected items");
            }
        } catch (error) {
            console.error('Error deleting batch:', error);
            this.showToast('Error deleting items: ' + error.message, 'error');
        }
    }
    
    downloadSelected() {
        if (this.selectedFiles.length === 0 && this.selectedSessions.length === 0) {
            this.showToast('No items selected', 'warning');
            return;
        }
        
        // Currently we can only download individual files or sessions as ZIP
        // For simplicity, we'll prompt to download as a ZIP
        const totalItems = this.selectedFiles.length + 
            this.selectedSessions.reduce((count, sessionId) => {
                const session = this.history.find(s => s.session_id === sessionId);
                return count + (session ? session.file_count : 0);
            }, 0);
        
        // If only one file selected, download it directly
        if (this.selectedFiles.length === 1 && this.selectedSessions.length === 0) {
            const [sessionId, filename] = this.selectedFiles[0].split('|');
            this.downloadFile(sessionId, filename);
            return;
        }
        
        // For multiple items, show a confirmation dialog
        if (confirm(`Download ${totalItems} selected items as a ZIP file?`)) {
            // Create an array of session IDs to download
            const sessionsToDownload = [...this.selectedSessions];
            
            // Add sessions from selected files
            this.selectedFiles.forEach(id => {
                const [sessionId] = id.split('|');
                if (!sessionsToDownload.includes(sessionId)) {
                    sessionsToDownload.push(sessionId);
                }
            });
            
            // Download each session
            sessionsToDownload.forEach(sessionId => {
                window.open(`/download_all/${sessionId}`, '_blank');
            });
        }
    }
    
    confirmDeleteFile(sessionId, filename) {
        if (confirm('Are you sure you want to delete this file?')) {
            this.deleteFile(sessionId, filename);
        }
    }
    
    confirmDeleteSession(sessionId) {
        if (confirm('Are you sure you want to delete this entire session?')) {
            this.deleteSession(sessionId);
        }
    }
    
    confirmDeleteSelected() {
        if (this.selectedFiles.length === 0 && this.selectedSessions.length === 0) {
            this.showToast('No items selected', 'warning');
            return;
        }
        
        // Count total items being deleted
        const totalFiles = this.selectedFiles.length;
        const totalSessions = this.selectedSessions.length;
        
        let message = '';
        if (totalFiles > 0 && totalSessions > 0) {
            message = `Are you sure you want to delete ${totalFiles} files and ${totalSessions} sessions?`;
        } else if (totalFiles > 0) {
            message = `Are you sure you want to delete ${totalFiles} files?`;
        } else {
            message = `Are you sure you want to delete ${totalSessions} sessions?`;
        }
        
        if (confirm(message)) {
            this.deleteBatch();
        }
    }
    
    updateSelections() {
        // Clear previous selections
        this.selectedFiles = [];
        this.selectedSessions = [];
        
        // Get all checked file checkboxes
        const fileCheckboxes = document.querySelectorAll('.file-checkbox:checked');
        fileCheckboxes.forEach(checkbox => {
            const sessionId = checkbox.dataset.sessionId;
            const filename = checkbox.dataset.filename;
            this.selectedFiles.push(`${sessionId}|${filename}`);
        });
        
        // Get all checked session checkboxes
        const sessionCheckboxes = document.querySelectorAll('.session-checkbox:checked');
        sessionCheckboxes.forEach(checkbox => {
            this.selectedSessions.push(checkbox.value);
        });
        
        this.updateBatchActions();
    }
    
    updateBatchActions() {
        const total = this.selectedFiles.length + this.selectedSessions.length;
        
        if (total > 0) {
            this.batchActions.classList.remove('d-none');
            this.selectedCount.textContent = total;
        } else {
            this.batchActions.classList.add('d-none');
        }
    }
    
    selectAll() {
        const allCheckboxes = document.querySelectorAll('.history-checkbox:not(:checked)');
        allCheckboxes.forEach(checkbox => checkbox.checked = true);
        this.updateSelections();
    }
    
    deselectAll() {
        const checkedBoxes = document.querySelectorAll('.history-checkbox:checked');
        checkedBoxes.forEach(checkbox => checkbox.checked = false);
        this.updateSelections();
    }
    
    switchToConverter() {
        // Hide history view
        this.historyContainer.classList.add('d-none');
        
        // Show converter UI
        document.getElementById('upload-container').classList.remove('d-none');
        
        // Toggle active tab if using tabs
        const historyTab = document.querySelector('.nav-link[data-view="history"]');
        const converterTab = document.querySelector('.nav-link[data-view="converter"]');
        
        if (historyTab && converterTab) {
            historyTab.classList.remove('active');
            converterTab.classList.add('active');
        }
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    getCategoryFromExtension(extension) {
        const ext = extension.toLowerCase();
        
        // Image formats
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif', 'svg', 'heic'].includes(ext)) {
            return 'Image';
        }
        
        // Audio formats
        if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus'].includes(ext)) {
            return 'Audio';
        }
        
        // Video formats
        if (['mp4', 'avi', 'mov', 'wmv', 'mkv', 'webm', 'flv', 'm4v'].includes(ext)) {
            return 'Video';
        }
        
        // Document formats
        if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt', 'csv', 'html', 'md'].includes(ext)) {
            return 'Document';
        }
        
        // Default
        return 'Other';
    }
    
    getFileTypeIcon(extension) {
        const ext = extension.toLowerCase();
        
        // Image formats
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif', 'svg', 'heic'].includes(ext)) {
            return 'fas fa-file-image';
        }
        
        // Audio formats
        if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus'].includes(ext)) {
            return 'fas fa-file-audio';
        }
        
        // Video formats
        if (['mp4', 'avi', 'mov', 'wmv', 'mkv', 'webm', 'flv', 'm4v'].includes(ext)) {
            return 'fas fa-file-video';
        }
        
        // Document formats - specific icons
        if (['pdf'].includes(ext)) {
            return 'fas fa-file-pdf';
        }
        if (['doc', 'docx'].includes(ext)) {
            return 'fas fa-file-word';
        }
        if (['xls', 'xlsx', 'csv'].includes(ext)) {
            return 'fas fa-file-excel';
        }
        if (['ppt', 'pptx'].includes(ext)) {
            return 'fas fa-file-powerpoint';
        }
        if (['txt', 'rtf', 'md'].includes(ext)) {
            return 'fas fa-file-alt';
        }
        
        // Default
        return 'fas fa-file';
    }
    
    showToast(message, type = 'info') {
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
            toastContainer.style.zIndex = '5000';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast element
        const toastId = 'toast-' + Date.now();
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast show`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        // Set toast style based on type
        let bgClass, icon;
        switch (type) {
            case 'success':
                bgClass = 'bg-success';
                icon = 'fa-check-circle';
                break;
            case 'error':
                bgClass = 'bg-danger';
                icon = 'fa-exclamation-circle';
                break;
            case 'warning':
                bgClass = 'bg-warning';
                icon = 'fa-exclamation-triangle';
                break;
            default:
                bgClass = 'bg-info';
                icon = 'fa-info-circle';
        }
        
        toast.innerHTML = `
            <div class="toast-header ${bgClass} text-white">
                <i class="fas ${icon} me-2"></i>
                <strong class="me-auto">File Converter</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto-remove after 5s
        setTimeout(() => {
            const toastElem = document.getElementById(toastId);
            if (toastElem) {
                gsap.to(toastElem, {
                    opacity: 0,
                    x: 100,
                    duration: 0.3,
                    onComplete: () => {
                        toastElem.remove();
                    }
                });
            }
        }, 5000);
        
        // Close button functionality
        const closeBtn = toast.querySelector('.btn-close');
        closeBtn.addEventListener('click', () => {
            gsap.to(toast, {
                opacity: 0,
                x: 100,
                duration: 0.3,
                onComplete: () => {
                    toast.remove();
                }
            });
        });
        
        // Animate entrance
        gsap.from(toast, {
            opacity: 0,
            x: 100,
            duration: 0.3
        });
    }
}

// Initialize history manager
let historyManager;

document.addEventListener('DOMContentLoaded', function() {
    historyManager = new HistoryManager();
});