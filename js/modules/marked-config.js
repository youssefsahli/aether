/**
 * Marked Configuration Module
 * Configures markdown renderer for custom link handling
 */

const MarkedConfig = {
    init() {
        try {
            const renderer = new marked.Renderer();
            renderer.link = (token) => {
                const href = token.href;
                // Check if this is an internal file link (no protocol or relative path)
                const isInternal = !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('www.');
                const dataAttr = isInternal ? ' data-aether-file="true"' : '';
                return `<a href="${href}"${dataAttr}>${token.text}</a>`;
            };
            marked.use({ renderer });
        } catch (e) {
            console.warn('Could not configure marked:', e);
        }
    }
};
