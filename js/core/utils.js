/**
 * Utilities Module
 * Fuzzy search and tree filtering utility
 */

const TreeSearch = {
    _filterTimers: {}, // Debounce timers for each tree
    // Fuzzy match algorithm - returns score (higher is better match)
    fuzzyScore(searchStr, targetStr) {
        if (!searchStr) return 100; // No search = perfect match
        searchStr = searchStr.toLowerCase();
        targetStr = targetStr.toLowerCase();
        
        if (targetStr.includes(searchStr)) return 90; // Substring match is great
        
        let score = 0;
        let searchIdx = 0;
        let lastMatchIdx = -1;
        
        for (let i = 0; i < targetStr.length && searchIdx < searchStr.length; i++) {
            if (targetStr[i] === searchStr[searchIdx]) {
                // Consecutive matches get bonus
                const consecutiveBonus = (i === lastMatchIdx + 1) ? 10 : 0;
                score += 10 + consecutiveBonus;
                lastMatchIdx = i;
                searchIdx++;
            }
        }
        
        return searchIdx === searchStr.length ? score : 0; // Only return score if all chars matched
    },
    
    // Collapse all directories in a tree (recursive - hides all descendants)
    collapseAll(treeId) {
        const container = document.getElementById(treeId);
        if (!container) return;
        
        const directories = container.querySelectorAll('[data-tree-type="directory"]');
        directories.forEach(dir => {
            dir.classList.add('collapsed');
            // Hide all descendants recursively
            const dirLevel = parseInt(dir.getAttribute('data-tree-level') || 0);
            let next = dir.nextElementSibling;
            while (next && parseInt(next.getAttribute('data-tree-level') || 0) > dirLevel) {
                next.classList.add('hidden-by-parent');
                next = next.nextElementSibling;
            }
        });
    },
    
    // Filter tree items based on search string with debouncing
    filterTree(treeId, searchStr) {
        // Debounce filter operations to avoid excessive DOM thrashing
        clearTimeout(this._filterTimers[treeId]);
        this._filterTimers[treeId] = setTimeout(() => {
            this._performFilter(treeId, searchStr);
        }, 150);
    },
    
    _performFilter(treeId, searchStr) {
        const container = document.getElementById(treeId);
        if (!container) return;
        
        const items = container.querySelectorAll('[data-tree-name]');
        let hasVisibleItem = false;
        
        // First pass: score and filter items
        items.forEach(item => {
            const name = item.getAttribute('data-tree-name');
            const score = this.fuzzyScore(searchStr, name);
            
            if (score > 0) {
                item.classList.remove('hidden');
                hasVisibleItem = true;
                
                // Show all parent directories
                let parent = item.previousElementSibling;
                while (parent) {
                    const parentLevel = parseInt(parent.getAttribute('data-tree-level') || 0);
                    const itemLevel = parseInt(item.getAttribute('data-tree-level') || 0);
                    
                    if (parentLevel < itemLevel && parent.classList.contains('is-directory')) {
                        parent.classList.remove('hidden', 'collapsed', 'hidden-by-parent');
                    }
                    if (parentLevel === 0) break;
                    parent = parent.previousElementSibling;
                }
            } else {
                item.classList.add('hidden');
            }
        });
        
        // Auto-expand relevant directories when searching
        if (searchStr.length > 0) {
            items.forEach(item => {
                if (!item.classList.contains('hidden')) {
                    let prev = item.previousElementSibling;
                    while (prev) {
                        const prevLevel = parseInt(prev.getAttribute('data-tree-level') || 0);
                        const itemLevel = parseInt(item.getAttribute('data-tree-level') || 0);
                        
                        if (prevLevel < itemLevel && prev.classList.contains('is-directory')) {
                            prev.classList.remove('collapsed', 'hidden-by-parent');
                        }
                        if (prevLevel === 0) break;
                        prev = prev.previousElementSibling;
                    }
                }
            });
        }
    }
};
