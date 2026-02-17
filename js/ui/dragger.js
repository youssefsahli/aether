/**
 * Dragger Module
 * Handles floating preview window dragging
 */

const Dragger = {
    init() {
        const header = document.getElementById('preview-header');
        const pane = document.getElementById('preview-pane');
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        header.onmousedown = (e) => {
            if (!document.getElementById('editor-split').classList.contains('mode-float')) return;
            isDragging = true;
            document.body.classList.add('dragging-preview');
            startX = e.clientX;
            startY = e.clientY;

            const rect = pane.getBoundingClientRect();
            const parentRect = document.getElementById('editor-split').getBoundingClientRect();

            initialLeft = rect.left - parentRect.left;
            initialTop = rect.top - parentRect.top;

            pane.style.right = 'auto';
            pane.style.left = initialLeft + 'px';
            pane.style.top = initialTop + 'px';
        };

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            pane.style.left = (initialLeft + dx) + 'px';
            pane.style.top = (initialTop + dy) + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                document.body.classList.remove('dragging-preview');
            }
        });
    }
};
