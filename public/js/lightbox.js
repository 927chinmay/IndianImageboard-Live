document.addEventListener('DOMContentLoaded', () => {
    let lightboxOverlay;
    let lightboxContent;
    let lightboxCloseBtn;

    function createLightbox() {
        lightboxOverlay = document.createElement('div');
        lightboxOverlay.className = 'lightbox-overlay';
        document.body.appendChild(lightboxOverlay);

        lightboxContent = document.createElement('div');
        lightboxContent.className = 'lightbox-content';
        lightboxOverlay.appendChild(lightboxContent);

        lightboxCloseBtn = document.createElement('button');
        lightboxCloseBtn.className = 'lightbox-close-btn';
        lightboxCloseBtn.innerHTML = '&times;'; // 'x' symbol
        lightboxOverlay.appendChild(lightboxCloseBtn);

        lightboxOverlay.addEventListener('click', (e) => {
            // Close if clicked on overlay, not the content
            if (e.target === lightboxOverlay || e.target === lightboxCloseBtn) {
                closeLightbox();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeLightbox();
            }
        });
    }

    function openLightbox(src, type) {
        if (!lightboxOverlay) {
            createLightbox();
        }

        lightboxContent.innerHTML = ''; // Clear previous content

        let mediaElement;
        if (type.startsWith('image')) {
            mediaElement = document.createElement('img');
            mediaElement.src = src;
            mediaElement.alt = "Enlarged Image";
        } else if (type.startsWith('video')) {
            mediaElement = document.createElement('video');
            mediaElement.src = src;
            mediaElement.controls = true;
            mediaElement.autoplay = true; // Autoplay video
        }

        if (mediaElement) {
            lightboxContent.appendChild(mediaElement);
            lightboxOverlay.classList.add('visible');
        }
    }

    function closeLightbox() {
        if (lightboxOverlay) {
            lightboxOverlay.classList.remove('visible');
            // Stop video if playing when closed
            const video = lightboxContent.querySelector('video');
            if (video) {
                video.pause();
                video.currentTime = 0;
            }
        }
    }

    // --- Event Delegation for all images/videos ---
    // We'll attach a single event listener to the document body
    // that checks if the clicked element is an image/video inside post-media or comment-media.
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        if ((target.tagName === 'IMG' || target.tagName === 'VIDEO') &&
            (target.closest('.post-media') || target.closest('.comment-media'))) {
            openLightbox(target.src, target.tagName.toLowerCase());
        }
    });
});