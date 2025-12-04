document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements - Base
    const fileTypeSelect = document.getElementById('file-type-select');
    const targetFormatSelect = document.getElementById('target-format-select');
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const selectFilesBtn = document.getElementById('select-files-btn');
    const fileList = document.getElementById('file-list');
    const selectedFilesContainer = document.getElementById('selected-files-container');
    const convertBtn = document.getElementById('convert-btn');
    const clearBtn = document.getElementById('clear-btn');
    const uploadContainer = document.getElementById('upload-container');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.querySelector('.progress-bar');
    const progressText = document.getElementById('progress-text');
    const resultsContainer = document.getElementById('results-container');
    const resultsList = document.getElementById('results-list');
    const successCount = document.getElementById('success-count');
    const downloadAllBtn = document.getElementById('download-all-btn');
    const convertMoreBtn = document.getElementById('convert-more-btn');

    // Advanced options elements
    const advancedOptionsBtn = document.getElementById('advanced-options-btn');
    const optionsPanels = {
        image: document.getElementById('image-options'),
        audio: document.getElementById('audio-options'),
        video: document.getElementById('video-options'),
        document: document.getElementById('document-options')
    };

    // Image option controls (existing)
    const qualitySlider = document.getElementById('quality-slider');
    const qualityValue = document.getElementById('quality-value');
    const resizeSwitch = document.getElementById('resize-switch');
    const resizeOptions = document.getElementById('resize-options');
    const resizePercentage = document.getElementById('resize-percentage');
    const resizeDimensions = document.getElementById('resize-dimensions');
    const resizePercentageInput = document.getElementById('resize-percentage-input');
    const resizeWidth = document.getElementById('resize-width');
    const resizeHeight = document.getElementById('resize-height');
    const rotateSwitch = document.getElementById('rotate-switch');
    const rotateOptions = document.getElementById('rotate-options');
    const rotateSlider = document.getElementById('rotate-slider');
    const rotateAngle = document.getElementById('rotate-angle');
    const rotate90Left = document.getElementById('rotate-90-left');
    const rotate90Right = document.getElementById('rotate-90-right');
    const rotate180 = document.getElementById('rotate-180');
    const flipSwitch = document.getElementById('flip-switch');
    const flipOptions = document.getElementById('flip-options');
    const filterSwitch = document.getElementById('filter-switch');
    const filterOptions = document.getElementById('filter-options');

    // Audio option controls
    const audioBitrateSelect = document.getElementById('audio-bitrate');
    const sampleRateSwitch = document.getElementById('sample-rate-switch');
    const sampleRateOptions = document.getElementById('sample-rate-options');
    const sampleRateSelect = document.getElementById('sample-rate-select');
    const channelsSwitch = document.getElementById('channels-switch');
    const channelsOptions = document.getElementById('channels-options');
    const volumeSwitch = document.getElementById('volume-switch');
    const volumeOptions = document.getElementById('volume-options');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeValue = document.getElementById('volume-value');
    const normalizeSwitch = document.getElementById('normalize-switch');
    const audioTrimSwitch = document.getElementById('audio-trim-switch');
    const audioTrimOptions = document.getElementById('audio-trim-options');
    const audioTrimStart = document.getElementById('audio-trim-start');
    const audioTrimEnd = document.getElementById('audio-trim-end');

    // Video option controls
    const videoBitrateSelect = document.getElementById('video-bitrate');
    const videoAudioBitrateSelect = document.getElementById('video-audio-bitrate');
    const resolutionSwitch = document.getElementById('resolution-switch');
    const resolutionOptions = document.getElementById('resolution-options');
    const resolutionSelect = document.getElementById('resolution-select');
    const customResolution = document.getElementById('custom-resolution');
    const customWidth = document.getElementById('custom-width');
    const customHeight = document.getElementById('custom-height');
    const fpsSwitch = document.getElementById('fps-switch');
    const fpsOptions = document.getElementById('fps-options');
    const fpsSelect = document.getElementById('fps-select');
    const videoRotateSwitch = document.getElementById('video-rotate-switch');
    const videoRotateOptions = document.getElementById('video-rotate-options');
    const codecSwitch = document.getElementById('codec-switch');
    const codecOptions = document.getElementById('codec-options');
    const codecSelect = document.getElementById('codec-select');
    const presetSelect = document.getElementById('preset-select');
    const noAudioSwitch = document.getElementById('no-audio-switch');
    const extractAudioSwitch = document.getElementById('extract-audio-switch');
    const videoTrimSwitch = document.getElementById('video-trim-switch');
    const videoTrimOptions = document.getElementById('video-trim-options');
    const videoTrimStart = document.getElementById('video-trim-start');
    const videoTrimEnd = document.getElementById('video-trim-end');

    // Document option controls
    const preserveMetadataSwitch = document.getElementById('preserve-metadata-switch');
    const paperSizeSwitch = document.getElementById('paper-size-switch');
    const paperSizeOptions = document.getElementById('paper-size-options');
    const paperSizeSelect = document.getElementById('paper-size-select');
    const marginsSwitch = document.getElementById('margins-switch');
    const marginsOptions = document.getElementById('margins-options');
    const marginTop = document.getElementById('margin-top');
    const marginRight = document.getElementById('margin-right');
    const marginBottom = document.getElementById('margin-bottom');
    const marginLeft = document.getElementById('margin-left');
    const fontSwitch = document.getElementById('font-switch');
    const fontOptions = document.getElementById('font-options');
    const fontSelect = document.getElementById('font-select');
    const fontSize = document.getElementById('font-size');
    const tocSwitch = document.getElementById('toc-switch');
    const encryptedPdfSwitch = document.getElementById('encrypted-pdf-switch');
    const pdfPasswordOptions = document.getElementById('pdf-password-options');
    const pdfPassword = document.getElementById('pdf-password');
    const showPasswordBtn = document.getElementById('show-password-btn');

    // App state
    let selectedFiles = [];
    let currentSessionId = null;
    let supportedFormats = {};

    // Carica i formati supportati
    loadSupportedFormats();

    // Event Listeners - Base
    fileTypeSelect.addEventListener('change', handleFileTypeChange);
    targetFormatSelect.addEventListener('change', updateFileInputAccept);
    selectFilesBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    clearBtn.addEventListener('click', clearSelectedFiles);
    convertBtn.addEventListener('click', convertFiles);
    convertMoreBtn.addEventListener('click', resetApp);
    downloadAllBtn.addEventListener('click', downloadAllFiles);

    // Advanced options event listeners
    fileTypeSelect.addEventListener('change', updateOptionsPanel);
    qualitySlider.addEventListener('input', updateQualityValue);
    resizeSwitch.addEventListener('change', toggleResizeOptions);
    resizePercentage.addEventListener('change', updateResizeInputs);
    resizeDimensions.addEventListener('change', updateResizeInputs);
    rotateSwitch.addEventListener('change', toggleRotateOptions);
    rotateSlider.addEventListener('input', updateRotateValue);
    rotateAngle.addEventListener('input', updateRotateSlider);
    rotate90Left.addEventListener('click', () => setRotateAngle(-90));
    rotate90Right.addEventListener('click', () => setRotateAngle(90));
    rotate180.addEventListener('click', () => setRotateAngle(180));
    flipSwitch.addEventListener('change', toggleFlipOptions);
    filterSwitch.addEventListener('change', toggleFilterOptions);

    // Event Listeners - Audio Options
    sampleRateSwitch.addEventListener('change', () => toggleElement(sampleRateOptions, sampleRateSwitch.checked));
    channelsSwitch.addEventListener('change', () => toggleElement(channelsOptions, channelsSwitch.checked));
    volumeSwitch.addEventListener('change', () => toggleElement(volumeOptions, volumeSwitch.checked));
    volumeSlider.addEventListener('input', () => volumeValue.value = volumeSlider.value);
    volumeValue.addEventListener('input', () => volumeSlider.value = volumeValue.value);
    audioTrimSwitch.addEventListener('change', () => toggleElement(audioTrimOptions, audioTrimSwitch.checked));

    // Event Listeners - Video Options
    resolutionSwitch.addEventListener('change', () => toggleElement(resolutionOptions, resolutionSwitch.checked));
    resolutionSelect.addEventListener('change', () => {
        toggleElement(customResolution, resolutionSelect.value === 'custom');
    });
    fpsSwitch.addEventListener('change', () => toggleElement(fpsOptions, fpsSwitch.checked));
    videoRotateSwitch.addEventListener('change', () => toggleElement(videoRotateOptions, videoRotateSwitch.checked));
    codecSwitch.addEventListener('change', () => toggleElement(codecOptions, codecSwitch.checked));
    videoTrimSwitch.addEventListener('change', () => toggleElement(videoTrimOptions, videoTrimSwitch.checked));
    extractAudioSwitch.addEventListener('change', function () {
        if (this.checked) {
            noAudioSwitch.checked = false;
        }
    });
    noAudioSwitch.addEventListener('change', function () {
        if (this.checked) {
            extractAudioSwitch.checked = false;
        }
    });

    // Event Listeners - Document Options
    paperSizeSwitch.addEventListener('change', () => toggleElement(paperSizeOptions, paperSizeSwitch.checked));
    marginsSwitch.addEventListener('change', () => toggleElement(marginsOptions, marginsSwitch.checked));
    fontSwitch.addEventListener('change', () => toggleElement(fontOptions, fontSwitch.checked));
    encryptedPdfSwitch.addEventListener('change', () => toggleElement(pdfPasswordOptions, encryptedPdfSwitch.checked));

    showPasswordBtn.addEventListener('mousedown', () => {
        pdfPassword.type = 'text';
    });
    showPasswordBtn.addEventListener('mouseup', () => {
        pdfPassword.type = 'password';
    });
    showPasswordBtn.addEventListener('mouseleave', () => {
        pdfPassword.type = 'password';
    });

    // Funzione generica per mostrare/nascondere elementi
    function toggleElement(element, show) {
        if (show) {
            element.classList.remove('d-none');
        } else {
            element.classList.add('d-none');
        }
    }

    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    dropArea.addEventListener('drop', handleDrop, false);

    function highlight() {
        dropArea.classList.add('drag-over');
    }

    function unhighlight() {
        dropArea.classList.remove('drag-over');
    }

    // Format loading
    async function loadSupportedFormats() {
        try {
            const response = await fetch('/api/formats');
            supportedFormats = await response.json();
            updateTargetFormats();
            updateFileInputAccept();
        } catch (error) {
            console.error('Error loading formats:', error);
        }
    }

    function updateTargetFormats() {
        const fileType = fileTypeSelect.value;
        const formats = supportedFormats[fileType]?.output || [];

        targetFormatSelect.innerHTML = '';
        formats.forEach(format => {
            const option = document.createElement('option');
            option.value = format;
            option.textContent = format.toUpperCase();
            targetFormatSelect.appendChild(option);
        });

        updateFileInputAccept();
    }

    function updateFileInputAccept() {
        const fileType = fileTypeSelect.value;
        const formats = supportedFormats[fileType]?.input || [];

        // Costruisci la stringa di formato accept
        if (formats.length > 0) {
            const acceptString = formats.map(format => `.${format}`).join(',');
            fileInput.setAttribute('accept', acceptString);
        } else {
            fileInput.removeAttribute('accept');
        }
    }

    // Aggiorna l'interfaccia in base al tipo di file selezionato
    function handleFileTypeChange() {
        updateTargetFormats();
        updateOptionsPanel();
        updateFileInputAccept();
    }

    // Mostra il pannello di opzioni appropriato
    function updateOptionsPanel() {
        const fileType = fileTypeSelect.value;

        // Nascondi tutti i pannelli di opzioni
        Object.keys(optionsPanels).forEach(type => {
            toggleElement(optionsPanels[type], type === fileType);
        });
    }

    // Advanced options functions
    function updateQualityValue() {
        qualityValue.textContent = qualitySlider.value;
    }

    function toggleResizeOptions() {
        resizeOptions.classList.toggle('d-none', !resizeSwitch.checked);
    }

    function updateResizeInputs() {
        resizePercentageInput.disabled = !resizePercentage.checked;
        resizeWidth.disabled = !resizeDimensions.checked;
        resizeHeight.disabled = !resizeDimensions.checked;
    }

    function toggleRotateOptions() {
        rotateOptions.classList.toggle('d-none', !rotateSwitch.checked);
    }

    function updateRotateValue() {
        rotateAngle.value = rotateSlider.value;
    }

    function updateRotateSlider() {
        // Ensure value is within 0-359
        let val = parseInt(rotateAngle.value) || 0;
        val = ((val % 360) + 360) % 360; // Handle negative values
        rotateAngle.value = val;
        rotateSlider.value = val;
    }

    function setRotateAngle(angle) {
        // Add to current angle or set directly
        if (angle < 0) {
            // For left rotation, we need to calculate the opposite direction
            angle = 360 + angle;
        }
        rotateAngle.value = angle;
        updateRotateSlider();
    }

    function toggleFlipOptions() {
        flipOptions.classList.toggle('d-none', !flipSwitch.checked);
    }

    function toggleFilterOptions() {
        filterOptions.classList.toggle('d-none', !filterSwitch.checked);
    }

    // Raccoglie le opzioni audio
    function getAudioOptions() {
        if (fileTypeSelect.value !== 'audio') return {};

        return {
            bitrate: audioBitrateSelect.value,
            sample_rate: {
                enabled: sampleRateSwitch.checked,
                value: parseInt(sampleRateSelect.value)
            },
            channels: {
                enabled: channelsSwitch.checked,
                value: parseInt(document.querySelector('input[name="channels"]:checked')?.value || 2)
            },
            volume: {
                enabled: volumeSwitch.checked,
                value: parseFloat(volumeValue.value)
            },
            normalize: normalizeSwitch.checked,
            trim: {
                enabled: audioTrimSwitch.checked,
                start: parseInt(audioTrimStart.value),
                end: parseInt(audioTrimEnd.value)
            }
        };
    }

    // Raccoglie le opzioni video
    function getVideoOptions() {
        if (fileTypeSelect.value !== 'video') return {};

        let resolution = null;
        if (resolutionSwitch.checked) {
            resolution = resolutionSelect.value;
            if (resolution === 'custom') {
                resolution = `${customWidth.value}x${customHeight.value}`;
            }
        }

        return {
            video_bitrate: videoBitrateSelect.value,
            audio_bitrate: videoAudioBitrateSelect.value,
            resolution: {
                enabled: resolutionSwitch.checked,
                value: resolution
            },
            fps: {
                enabled: fpsSwitch.checked,
                value: parseInt(fpsSelect.value)
            },
            rotate: {
                enabled: videoRotateSwitch.checked,
                value: parseInt(document.querySelector('input[name="video-rotate"]:checked')?.value || 0)
            },
            codec: {
                enabled: codecSwitch.checked,
                value: codecSelect.value
            },
            preset: presetSelect.value,
            no_audio: noAudioSwitch.checked,
            extract_audio: extractAudioSwitch.checked,
            trim: {
                enabled: videoTrimSwitch.checked,
                start: parseFloat(videoTrimStart.value),
                end: parseFloat(videoTrimEnd.value)
            }
        };
    }

    // Raccoglie le opzioni dei documenti
    function getDocumentOptions() {
        if (fileTypeSelect.value !== 'document') return {};

        let margins = null;
        if (marginsSwitch.checked) {
            margins = {
                top: parseInt(marginTop.value) || 20,
                right: parseInt(marginRight.value) || 20,
                bottom: parseInt(marginBottom.value) || 20,
                left: parseInt(marginLeft.value) || 20
            };
        }

        return {
            preserve_metadata: preserveMetadataSwitch.checked,
            paper_size: paperSizeSwitch.checked ? paperSizeSelect.value : null,
            margins: margins,
            font: fontSwitch.checked ? fontSelect.value : null,
            font_size: fontSwitch.checked ? parseInt(fontSize.value) || 11 : null,
            toc: tocSwitch.checked,
            encrypted_pdf: encryptedPdfSwitch.checked,
            password: encryptedPdfSwitch.checked ? pdfPassword.value : ''
        };
    }

    // Collect advanced options for conversion
    function getAdvancedOptions() {
        const fileType = fileTypeSelect.value;
        let options = {};

        if (fileType === 'image') {
            options.image_options = {
                quality: parseInt(qualitySlider.value),
                resize: {
                    enabled: resizeSwitch.checked,
                    type: resizePercentage.checked ? 'percentage' : 'dimensions',
                    percentage: parseInt(resizePercentageInput.value),
                    width: parseInt(resizeWidth.value) || 0,
                    height: parseInt(resizeHeight.value) || 0
                },
                rotate: {
                    enabled: rotateSwitch.checked,
                    angle: parseInt(rotateAngle.value) || 0
                },
                flip: {
                    enabled: flipSwitch.checked,
                    type: document.querySelector('input[name="flip-type"]:checked')?.value || 'horizontal'
                },
                filter: {
                    enabled: filterSwitch.checked,
                    type: document.getElementById('filter-type').value
                }
            };
        } else if (fileType === 'audio') {
            options.audio_options = getAudioOptions();
        } else if (fileType === 'video') {
            options.video_options = getVideoOptions();
        } else if (fileType === 'document') {
            options.document_options = getDocumentOptions();
        }

        return options;
    }

    // File handling functions
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFileSelect(e) {
        const files = e.target.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        if (files.length === 0) return;

        // Per ora accettiamo tutti i file, in futuro potremmo filtrare in base al tipo selezionato
        selectedFiles = [...selectedFiles, ...Array.from(files)];
        updateFileList();
        showSelectedFilesContainer();
    }

    function updateFileList() {
        fileList.innerHTML = '';

        selectedFiles.forEach((file, index) => {
            const row = document.createElement('tr');
            row.className = 'file-item';

            // Determina il tipo di file dall'estensione
            const extension = file.name.split('.').pop().toLowerCase();
            const fileTypeIcon = getFileTypeIcon(extension);

            row.innerHTML = `
                <td class="file-cell" style="width: 40%">
                    <div class="d-flex align-items-center">
                        <div class="file-type-icon me-2">
                            <i class="${fileTypeIcon}"></i>
                        </div>
                        <span class="fw-bold text-truncate">${file.name}</span>
                    </div>
                </td>
                <td style="width: 15%" class="text-center">${extension.toUpperCase()}</td>
                <td style="width: 15%" class="text-center">${formatFileSize(file.size)}</td>
                <td style="width: 30%">
                    <div class="d-flex align-items-center justify-content-end">
                        <span class="badge bg-secondary">Pending</span>
                        <button class="btn btn-sm btn-outline-danger ms-2 remove-btn" data-index="${index}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </td>
            `;

            const removeBtn = row.querySelector('.remove-btn');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeFile(index);
            });

            fileList.appendChild(row);
        });
    }

    function getFileTypeIcon(extension) {
        // Mappa delle estensioni ai tipi di icone
        const iconMap = {
            // Immagini
            'jpg': 'fas fa-file-image',
            'jpeg': 'fas fa-file-image',
            'png': 'fas fa-file-image',
            'gif': 'fas fa-file-image',
            'webp': 'fas fa-file-image',
            'heic': 'fas fa-file-image',
            'heif': 'fas fa-file-image',
            'bmp': 'fas fa-file-image',
            'tiff': 'fas fa-file-image',
            'tif': 'fas fa-file-image',
            'svg': 'fas fa-file-image',
            'avif': 'fas fa-file-image',

            // Audio
            'mp3': 'fas fa-file-audio',
            'wav': 'fas fa-file-audio',
            'ogg': 'fas fa-file-audio',
            'flac': 'fas fa-file-audio',
            'aac': 'fas fa-file-audio',

            // Video
            'mp4': 'fas fa-file-video',
            'avi': 'fas fa-file-video',
            'mov': 'fas fa-file-video',
            'wmv': 'fas fa-file-video',
            'mkv': 'fas fa-file-video',
            'webm': 'fas fa-file-video',

            // Documenti
            'pdf': 'fas fa-file-pdf',
            'doc': 'fas fa-file-word',
            'docx': 'fas fa-file-word',
            'xls': 'fas fa-file-excel',
            'xlsx': 'fas fa-file-excel',
            'ppt': 'fas fa-file-powerpoint',
            'pptx': 'fas fa-file-powerpoint',
            'txt': 'fas fa-file-alt',
        };

        return iconMap[extension] || 'fas fa-file';
    }

    function removeFile(index) {
        selectedFiles.splice(index, 1);
        updateFileList();

        if (selectedFiles.length === 0) {
            hideSelectedFilesContainer();
        }
    }

    function clearSelectedFiles() {
        selectedFiles = [];
        fileList.innerHTML = '';
        hideSelectedFilesContainer();
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function showSelectedFilesContainer() {
        selectedFilesContainer.classList.remove('d-none');
    }

    function hideSelectedFilesContainer() {
        selectedFilesContainer.classList.add('d-none');
    }

    // Conversion and API functions
    async function convertFiles() {
        if (selectedFiles.length === 0) return;

        // Show progress bar
        uploadContainer.classList.add('d-none');
        selectedFilesContainer.classList.add('d-none');
        progressContainer.classList.remove('d-none');

        // Create FormData
        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('files[]', file);
        });

        // Add target format
        formData.append('target_format', targetFormatSelect.value);

        // Add advanced options
        const advancedOptions = getAdvancedOptions();
        for (const [key, value] of Object.entries(advancedOptions)) {
            formData.append(key, JSON.stringify(value));
        }

        try {
            progressBar.style.width = '50%';
            progressText.textContent = 'Uploading and converting files...';

            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Server error');
            }

            progressBar.style.width = '100%';
            progressText.textContent = 'Conversion complete!';

            const data = await response.json();
            currentSessionId = data.session_id;

            // After a short delay, show results
            setTimeout(() => {
                displayResults(data);
            }, 500);

        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during conversion: ' + error.message);
            resetApp();
        }
    }

    function displayResults(data) {
        progressContainer.classList.add('d-none');
        resultsContainer.classList.remove('d-none');

        const successfulFiles = data.files.filter(file => file.success);
        successCount.textContent = successfulFiles.length;

        resultsList.innerHTML = '';
        data.files.forEach(file => {
            const row = document.createElement('tr');
            row.className = 'file-item';

            const statusClass = file.success ? 'success' : 'danger';
            const statusIcon = file.success ? 'check-circle' : 'exclamation-circle';
            const statusText = file.success ? 'Success' : 'Failed';

            // Get original filename by removing the output extension
            const originalName = file.filename.split('.')[0];
            const originalExtension = file.mime_type.split('/')[1] || 'unknown';
            const convertedExtension = file.filename.split('.').pop();

            row.innerHTML = `
                <td style="width: 35%">
                    <i class="${getFileTypeIcon(originalExtension)} text-muted me-2"></i>
                    ${originalName}.${originalExtension}
                </td>
                <td style="width: 15%">${file.category || 'unknown'}</td>
                <td style="width: 35%">
                    <i class="${getFileTypeIcon(convertedExtension)} text-muted me-2"></i>
                    ${file.filename}
                </td>
                <td style="width: 15%">
                    <div class="d-flex align-items-center">
                        <span class="badge bg-${statusClass} me-2">
                            <i class="fas fa-${statusIcon}"></i> ${statusText}
                        </span>
                        ${file.success ? `
                        <a href="/download/${currentSessionId}/${file.filename}" class="btn btn-sm btn-outline-primary download-item" download>
                            <i class="fas fa-download"></i>
                        </a>
                        ` : ''}
                    </div>
                </td>
            `;

            resultsList.appendChild(row);
        });
    }

    function downloadAllFiles() {
        if (!currentSessionId) return;

        window.location.href = `/download_all/${currentSessionId}`;

        // Clear session data after download
        setTimeout(() => {
            fetch(`/clear/${currentSessionId}`);
        }, 3000);
    }

    function resetApp() {
        // Reset variables
        selectedFiles = [];
        currentSessionId = null;
        fileInput.value = '';

        // Reset UI visibility
        resultsContainer.classList.add('d-none');
        selectedFilesContainer.classList.add('d-none');
        progressContainer.classList.add('d-none');
        uploadContainer.classList.remove('d-none');

        // Switch to converter view if in history
        const historyContainer = document.getElementById('history-container');
        const converterContainer = document.getElementById('converter-container');

        if (historyContainer && converterContainer && !historyContainer.classList.contains('d-none')) {
            historyContainer.classList.add('d-none');
            converterContainer.classList.remove('d-none');

            // Update tabs
            document.querySelectorAll('.nav-link').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.view === 'converter');
            });
        }

        // Reinitialize format selectors and options
        updateTargetFormats();
        updateOptionsPanel();
        updateFileInputAccept();

        // Reinitialize advanced options
        if (fileTypeSelect.value === 'image') {
            qualitySlider.value = 95;
            updateQualityValue();
            resizeSwitch.checked = false;
            toggleResizeOptions();
            rotateSwitch.checked = false;
            toggleRotateOptions();
            flipSwitch.checked = false;
            toggleFlipOptions();
            filterSwitch.checked = false;
            toggleFilterOptions();
        }

        // Reset animations
        if (window.uiAnimations) {
            window.uiAnimations.resetAnimations();
        }

        // Animate entrance
        if (window.uiAnimations) {
            setTimeout(() => {
                window.uiAnimations.animateEntrance();
            }, 100);
        }

        // Reset format cards highlight
        setTimeout(() => {
            const formatCards = document.querySelectorAll('.format-card');
            if (formatCards.length > 0) {
                formatCards.forEach(card => {
                    if (card.dataset.value === fileTypeSelect.value) {
                        card.classList.add('active');
                    } else {
                        card.classList.remove('active');
                    }
                });
            } else {
                // If format cards haven't been created yet, attempt to reinitialize
                if (window.formatSelector) {
                    window.formatSelector.init();
                }
            }

            // Reset format carousel if it exists
            const targetFormatContainer = document.getElementById('target-format-container');
            if (targetFormatContainer && window.formatSelector) {
                window.formatSelector.updateTargetFormats(fileTypeSelect.value);
            }
        }, 200);
    }

    // Initialize UI state
    updateOptionsPanel();
    updateQualityValue();
});

// Navigation between converter and history
document.addEventListener('DOMContentLoaded', function () {
    // Tab navigation
    const navLinks = document.querySelectorAll('.nav-link[data-view]');
    const converterView = document.getElementById('converter-container');
    const historyView = document.getElementById('history-container');

    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            const view = this.dataset.view;

            // Set active tab
            navLinks.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            // Show appropriate view
            if (view === 'converter') {
                converterView.classList.remove('d-none');
                historyView.classList.add('d-none');
            } else if (view === 'history') {
                converterView.classList.add('d-none');
                historyView.classList.remove('d-none');

                // Load history data if needed
                if (window.historyManager) {
                    window.historyManager.loadHistory();
                }
            }

            // Animate indicator (if using tab indicator)
            const indicator = document.querySelector('.tab-indicator');
            if (indicator) {
                const activeLink = document.querySelector('.nav-link.active');
                indicator.style.left = `${activeLink.offsetLeft}px`;
                indicator.style.width = `${activeLink.offsetWidth}px`;
            }
        });
    });
});