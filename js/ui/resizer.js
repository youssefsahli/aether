/**
 * Resizer Module
 * Handles split pane and floating preview resizing
 */

const Resizer = {
    init() {
        // Split Resizer
        const r = document.getElementById('resizer'); const p = document.getElementById('preview-pane'); let isResizing = false;
        r.onmousedown = (e) => {
            if (document.getElementById('editor-split').classList.contains('mode-float')) return;
            isResizing = true; r.classList.add('active'); document.body.classList.add('resizing'); e.preventDefault();
        };

        // Float Resizer
        const fr = document.getElementById('float-resizer');
        let isFloatResizing = false;
        let startX, startY, startW, startH;

        fr.onmousedown = (e) => {
            isFloatResizing = true;
            startX = e.clientX; startY = e.clientY;
            startW = p.offsetWidth; startH = p.offsetHeight;
            e.stopPropagation(); e.preventDefault();
        };

        document.addEventListener('mousemove', (e) => {
            if (isResizing) {
                const w = document.getElementById('editor-split').offsetWidth;
                const pW = 100 - ((e.clientX - document.getElementById('sidebar-left').offsetWidth) / w * 100);
                if (pW > 10 && pW < 90) { p.style.width = pW + '%'; Editor.instance.resize(); }
            }
            if (isFloatResizing) {
                p.style.width = (startW + (e.clientX - startX)) + 'px';
                p.style.height = (startH + (e.clientY - startY)) + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) { isResizing = false; r.classList.remove('active'); document.body.classList.remove('resizing'); Editor.instance.resize(); }
            if (isFloatResizing) { isFloatResizing = false; }
        });
    }
};
