/**
 * Resizer Module
 * Handles split pane and floating preview resizing
 */

const Resizer = {
    // Constraints for float window
    MIN_WIDTH: 200,
    MIN_HEIGHT: 150,
    MAX_WIDTH_RATIO: 0.9,  // 90% of editor-split width
    MAX_HEIGHT_RATIO: 0.9, // 90% of editor-split height

    init() {
        // Split Resizer
        const r = document.getElementById('resizer');
        const p = document.getElementById('preview-pane');
        const split = document.getElementById('editor-split');
        let isResizing = false;

        r.onmousedown = (e) => {
            if (split.classList.contains('mode-float')) return;
            isResizing = true;
            r.classList.add('active');
            document.body.classList.add('resizing');
            e.preventDefault();
        };

        // Float Resizer
        const fr = document.getElementById('float-resizer');
        let isFloatResizing = false;
        let startX, startY, startW, startH, startLeft, startRight;

        fr.onmousedown = (e) => {
            // Only allow float resizing in float mode
            if (!split.classList.contains('mode-float')) return;
            
            isFloatResizing = true;
            document.body.classList.add('resizing-float');
            
            startX = e.clientX;
            startY = e.clientY;
            startW = p.offsetWidth;
            startH = p.offsetHeight;
            
            // Capture current positioning mode
            const computedStyle = getComputedStyle(p);
            startLeft = p.style.left || computedStyle.left;
            startRight = p.style.right || computedStyle.right;
            
            e.stopPropagation();
            e.preventDefault();
        };

        document.addEventListener('mousemove', (e) => {
            if (isResizing) {
                const w = split.offsetWidth;
                const pW = 100 - ((e.clientX - document.getElementById('sidebar-left').offsetWidth) / w * 100);
                if (pW > 10 && pW < 90) {
                    p.style.width = pW + '%';
                    Editor.instance.resize();
                }
            }
            if (isFloatResizing) {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                
                // Calculate new dimensions with constraints
                const maxW = split.offsetWidth * Resizer.MAX_WIDTH_RATIO;
                const maxH = split.offsetHeight * Resizer.MAX_HEIGHT_RATIO;
                
                let newW = Math.max(Resizer.MIN_WIDTH, Math.min(maxW, startW + dx));
                let newH = Math.max(Resizer.MIN_HEIGHT, Math.min(maxH, startH + dy));
                
                p.style.width = newW + 'px';
                p.style.height = newH + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                r.classList.remove('active');
                document.body.classList.remove('resizing');
                Editor.instance.resize();
            }
            if (isFloatResizing) {
                isFloatResizing = false;
                document.body.classList.remove('resizing-float');
            }
        });
    }
};
