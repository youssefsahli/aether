/**
 * Marked Configuration Module
 * Configures markdown renderer for custom link handling
 */

const MarkedConfig = {
    init() {
        try {
            const renderer = new marked.Renderer();
            
            // Custom link renderer for internal files and anchors
            renderer.link = (token) => {
                const href = token.href;
                const isInternal = href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('www.') && !href.startsWith('#');
                const dataAttr = isInternal ? ' data-aether-file="true"' : '';
                return `<a href="${href}"${dataAttr}>${token.text}</a>`;
            };
            
            // Custom heading renderer to add IDs for anchor navigation
            renderer.heading = (token) => {
                const text = token.text;
                // Generate ID from heading text: lowercase, replace spaces with hyphens, remove special chars
                const headingId = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                return `<h${token.depth} id="${headingId}">${text}</h${token.depth}>`;
            };
            
            marked.use({ renderer });
        } catch (e) {
            console.warn('Could not configure marked:', e);
        }
    }
};
