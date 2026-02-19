/**
 * Dragger Module
 * Handles floating preview window dragging
 */

const Dragger = {
    // Minimum visible pixels inside container
    EDGE_THRESHOLD: 50,

    init() {
        const header = document.getElementById('preview-header');
        const pane = document.getElementById('preview-pane');
        const split = document.getElementById('editor-split');
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        header.onmousedown = (e) => {
            if (!split.classList.contains('mode-float')) return;
            isDragging = true;
            document.body.classList.add('dragging-preview');
            startX = e.clientX;
            startY = e.clientY;

            const rect = pane.getBoundingClientRect();
            const parentRect = split.getBoundingClientRect();

            initialLeft = rect.left - parentRect.left;
            initialTop = rect.top - parentRect.top;

            pane.style.right = 'auto';
            pane.style.left = initialLeft + 'px';
            pane.style.top = initialTop + 'px';
            
            e.preventDefault();
        };

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            // Calculate new position with bounds
            const containerW = split.offsetWidth;
            const containerH = split.offsetHeight;
            const paneW = pane.offsetWidth;
            const paneH = pane.offsetHeight;
            
            // Constrain position - keep at least EDGE_THRESHOLD pixels visible
            let newLeft = initialLeft + dx;
            let newTop = initialTop + dy;
            
            newLeft = Math.max(-paneW + Dragger.EDGE_THRESHOLD, Math.min(containerW - Dragger.EDGE_THRESHOLD, newLeft));
            newTop = Math.max(0, Math.min(containerH - Dragger.EDGE_THRESHOLD, newTop));
            
            pane.style.left = newLeft + 'px';
            pane.style.top = newTop + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                document.body.classList.remove('dragging-preview');
            }
        });
    }
};
