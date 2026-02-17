/**
 * Commands Module
 * Command palette and command handling
 */

const Commands = {
    list: typeof AETHER_COMMANDS !== 'undefined' ? AETHER_COMMANDS : [],
    trigger(id) { const c = this.list.find(c => c.id === id); if (c) c.fn(); },
    showPalette() {
        const mask = document.getElementById('palette-mask');
        const list = document.getElementById('cmd-list');
        const input = document.getElementById('cmd-input');

        const render = (filter = '') => {
            list.innerHTML = '';
            const terms = filter.toLowerCase();
            this.list.filter(c => c.name.toLowerCase().includes(terms)).forEach((cmd, idx) => {
                const el = document.createElement('div'); el.className = 'cmd-item';
                if (idx === 0) el.classList.add('selected');
                el.innerHTML = `<span>${cmd.name}</span><span class="cmd-shortcut">${cmd.hint}</span>`;
                el.onclick = () => { cmd.fn(); this.hidePalette(); };
                list.appendChild(el);
            });
        };

        mask.style.display = 'flex';
        input.value = '';
        input.focus();
        render();

        input.oninput = (e) => render(e.target.value);
        input.onkeydown = (e) => {
            if (e.key === 'Escape') this.hidePalette();
            if (e.key === 'Enter') {
                const first = list.querySelector('.cmd-item');
                if (first) first.click();
            }
        };
    },
    hidePalette() { document.getElementById('palette-mask').style.display = 'none'; Editor.instance.focus(); }
};
