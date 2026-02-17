/**
 * Dialogs Module
 * Prompt and Confirm dialog handling
 */

const Prompt = {
    open(msg, def, cb) {
        document.getElementById('prompt-mask').style.display = 'flex'; document.getElementById('prompt-msg').innerText = msg;
        const inp = document.getElementById('prompt-input'); inp.value = def; inp.focus(); inp.select();
        const sub = () => { if (inp.value) cb(inp.value); this.close(); };
        document.getElementById('prompt-ok').onclick = sub; inp.onkeydown = (e) => { if (e.key === 'Enter') sub(); if (e.key === 'Escape') this.close(); };
    },
    close() { document.getElementById('prompt-mask').style.display = 'none'; Editor.instance.focus(); }
};

const Confirm = {
    open(title, msg, onYes) {
        document.getElementById('confirm-mask').style.display = 'flex'; document.getElementById('confirm-title').innerText = title;
        document.getElementById('confirm-msg').innerText = msg; document.getElementById('confirm-ok').onclick = () => { onYes(); this.close(); };
        document.querySelector('#confirm-mask .btn').focus();
    },
    close() { document.getElementById('confirm-mask').style.display = 'none'; Editor.instance.focus(); }
};
