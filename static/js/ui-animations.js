/**
 * UI Animations for All-in-One File Converter
 * Controls modern animations and visual effects
 */

class UIAnimations {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.fileParticles = [];
    }

    initializeElements() {
        this.mainCard = document.querySelector('.main-card');
        this.uploadArea = document.getElementById('drop-area');
        this.fileList = document.getElementById('file-list');
        this.convertBtn = document.getElementById('convert-btn');
        this.resultsList = document.getElementById('results-list');
        this.uploadContainer = document.getElementById('upload-container');
        this.progressContainer = document.getElementById('progress-container');
        this.progressBar = document.querySelector('.progress-bar');
    }

    setupEventListeners() {
        if (this.convertBtn) {
            this.convertBtn.addEventListener('click', () => this.animateConversionStart());
        }
    }

    // Animate interface elements entrance
    animateEntrance() {
        const staggerElements = document.querySelectorAll('.stagger-entrance');

        gsap.fromTo(staggerElements,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: "power2.out" }
        );
    }

    // Animate file upload
    animateFileAdded(fileElement) {
        gsap.from(fileElement, {
            scale: 0.95,
            opacity: 0,
            y: 15,
            duration: 0.5,
            ease: "back.out(1.7)"
        });
    }

    // Create floating file particle
    createFileParticle(file) {
        const particle = document.createElement('div');
        particle.className = 'file-particle';
        particle.innerHTML = `<i class="${this.getFileTypeIcon(file.name.split('.').pop())}"></i>`;
        document.body.appendChild(particle);

        // Store particle reference for later use
        this.fileParticles.push(particle);
        return particle;
    }

    // Get icon for file type
    getFileTypeIcon(extension) {
        const iconMap = {
            // Images
            'jpg': 'fas fa-file-image',
            'jpeg': 'fas fa-file-image',
            'png': 'fas fa-file-image',
            'gif': 'fas fa-file-image',
            'webp': 'fas fa-file-image',

            // Audio
            'mp3': 'fas fa-file-audio',
            'wav': 'fas fa-file-audio',
            'ogg': 'fas fa-file-audio',

            // Video
            'mp4': 'fas fa-file-video',
            'avi': 'fas fa-file-video',
            'mov': 'fas fa-file-video',

            // Documents
            'pdf': 'fas fa-file-pdf',
            'doc': 'fas fa-file-word',
            'docx': 'fas fa-file-word',
            'txt': 'fas fa-file-alt',
        };

        return iconMap[extension.toLowerCase()] || 'fas fa-file';
    }

    // Animate conversion start
    animateConversionStart() {
        // Get file elements
        const fileRows = document.querySelectorAll('.file-item');

        // Create a timeline for the animation
        const tl = gsap.timeline({
            onComplete: () => {
                // Clean up particles when complete
                this.fileParticles.forEach(p => p.remove());
                this.fileParticles = [];
            }
        });

        // Animate rows
        tl.to(fileRows, {
            scale: 0.98,
            stagger: 0.1,
            duration: 0.4
        });

        // For each file row, create a particle that floats to the progress bar
        fileRows.forEach((row, index) => {
            const rowBounds = row.getBoundingClientRect();
            const particle = this.createFileParticle({
                name: row.querySelector('.fw-bold').textContent
            });

            // Position particle at row
            particle.style.position = 'fixed';
            particle.style.top = `${rowBounds.top + rowBounds.height / 2}px`;
            particle.style.left = `${rowBounds.left + 30}px`;

            // Add to animation timeline
            tl.to(particle, {
                top: this.progressContainer.getBoundingClientRect().top + 10,
                duration: 0.8,
                ease: "power2.inOut",
                delay: index * 0.1
            }, "-=0.6");
        });

        // Hide upload container
        tl.to(this.uploadContainer, {
            opacity: 0,
            y: -20,
            duration: 0.5
        }, "-=1");

        // Hide file list
        tl.to(document.getElementById('selected-files-container'), {
            opacity: 0,
            y: -20,
            duration: 0.5
        }, "-=0.5");

        return tl;
    }

    // Animate progress 
    animateProgressBar(progress) {
        const progressBar = document.querySelector('.progress-bar');

        gsap.to(progressBar, {
            width: `${progress}%`,
            duration: 0.5,
            ease: "power1.out"
        });

        // Add particle effects for milestones
        if (progress % 25 === 0) {
            this.createProgressParticles();
        }
    }

    // Create particles burst effect for progress
    createProgressParticles() {
        const progressBar = document.querySelector('.progress-bar');
        const bounds = progressBar.getBoundingClientRect();
        const end = bounds.width;

        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'progress-particle';
            document.body.appendChild(particle);

            particle.style.position = 'fixed';
            particle.style.top = `${bounds.top + bounds.height / 2}px`;
            particle.style.left = `${bounds.left + end}px`;
            particle.style.width = `${Math.random() * 8 + 4}px`;
            particle.style.height = `${Math.random() * 8 + 4}px`;
            particle.style.background = `rgba(${Math.round(Math.random() * 100 + 100)}, ${Math.round(Math.random() * 100 + 100)}, 255, 0.7)`;
            particle.style.borderRadius = '50%';

            gsap.to(particle, {
                x: Math.random() * 60 - 30,
                y: Math.random() * 60 - 30,
                opacity: 0,
                duration: Math.random() + 0.5,
                ease: "power2.out",
                onComplete: () => particle.remove()
            });
        }
    }

    // Animate results appearance
    animateResultsAppear() {
        const results = document.querySelectorAll('#results-list tr');
        const successAlert = document.querySelector('.alert-success');

        const tl = gsap.timeline();

        // Animate the success alert
        tl.from(successAlert, {
            scale: 0.9,
            opacity: 0,
            duration: 0.5,
            ease: "back.out(1.7)"
        });

        // Animate each result row
        tl.fromTo(results,
            { opacity: 0, y: 15 },
            {
                opacity: 1,
                y: 0,
                stagger: 0.1,
                duration: 0.5,
                ease: "power2.out"
            }
        );

        return tl;
    }

    // Create card hover effect
    applyCardHoverEffect(elements) {
        elements.forEach(element => {
            element.addEventListener('mousemove', (e) => {
                if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

                const bounds = element.getBoundingClientRect();
                const centerX = bounds.left + bounds.width / 2;
                const centerY = bounds.top + bounds.height / 2;
                const mouseX = e.clientX;
                const mouseY = e.clientY;

                const angleX = (centerY - mouseY) / 20;
                const angleY = (mouseX - centerX) / 20;

                element.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale3d(1.02, 1.02, 1.02)`;
            });

            element.addEventListener('mouseleave', () => {
                element.style.transform = 'rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            });
        });
    }

    // Animate file preview
    animateFilePreview(previewElement) {
        gsap.fromTo(previewElement,
            { opacity: 0, scale: 0.8 },
            {
                opacity: 1,
                scale: 1,
                duration: 0.4,
                ease: "back.out(1.7)"
            }
        );
    }

    // Reset animations
    resetAnimations() {
        // Reset any ongoing animations
        gsap.killTweensOf('.file-item');
        gsap.killTweensOf('.file-particle');
        gsap.killTweensOf('.progress-particle');

        // Animate the upload container back in
        gsap.fromTo('#upload-container',
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, ease: "power2.inOut" }
        );

        // Animate the file type selector
        gsap.fromTo('#file-type-container',
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.4, delay: 0.2, ease: "power2.out" }
        );

        // Animate the target format container
        gsap.fromTo('#target-format-container',
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.4, delay: 0.3, ease: "power2.out" }
        );

        // Animate the advanced options button
        gsap.fromTo('#advanced-options-btn',
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.4, delay: 0.4, ease: "power2.out" }
        );
    }
}

// Initialize animations
document.addEventListener('DOMContentLoaded', () => {
    window.uiAnimations = new UIAnimations();

    // Initial animations
    window.uiAnimations.animateEntrance();

    // Apply 3D hover effects to cards
    // REMOVED: The 3D effect on table rows (.file-item) breaks the table layout.
    // const cards = document.querySelectorAll('.file-item');
    // window.uiAnimations.applyCardHoverEffect(cards);

    // Apply hover effects to format cards
    setTimeout(() => {
        const formatCards = document.querySelectorAll('.format-card');
        window.uiAnimations.applyCardHoverEffect(formatCards);
    }, 1000);
});