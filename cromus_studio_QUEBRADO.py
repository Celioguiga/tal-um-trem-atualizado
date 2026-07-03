// ===============================================
// JAVASCRIPT LOGIC FOR NEW LAYOUT FEATURES (Append this logic)
// ===============================================

/**
 * 1. Resizing Handle Logic
 * Attaches drag listeners to #resizer and updates the width of editor-left/editor-right.
 */
function setupResizing() {
    const resizer = document.getElementById('resizer');
    if (!resizer) return;

    let isResizing = false;

    // Start resizing on mouse down over the handle
    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize'; // Global cursor change during drag
        e.preventDefault();
    });

    // Handle movement while resizing is active
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        const container = document.getElementById('editor-container');
        if (!container) return;

        // Calculate new width based on mouse X position relative to the container start
        let newLeftWidth = e.clientX - container.getBoundingClientRect().left;

        // Clamp values (e.g., prevent left panel from being too small or too large)
        const minWidth = 200; // Matches CSS minimum width
        const maxWidth = 'calc(100% - 5px)'; // Max is total container minus resizer width
        newLeftWidth = Math.max(minWidth, Math.min(parseFloat(maxWidth), newLeftWidth));

        // Apply the calculated widths
        document.getElementById('editor-left').style.width = `${newLeftWidth}px`;
        document.getElementById('editor-right').style.flexBasis = `${newLeftWidth}px`; // Use flex basis for consistency
    });

    // Stop resizing on mouse up anywhere in the document
    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = 'default';
        }
    });
}


/**
 * 2. Panel Toggle Logic Update
 * Updates the old togglePanel() function to use the new #editor-left structure and manage visibility/resizing state.
 */
function togglePanel(forceState) {
    const panel = document.getElementById('editor-left');
    if (!panel) return;

    let isOpen;
    if (typeof forceState === 'boolean') {
        isOpen = forceState; // Use forced state if provided by the rail button click handler
    } else {
        // Default behavior: toggle current state
        const isCurrentlyOpen = panel.classList.contains('open');
        isOpen = !isCurrentlyOpen;
    }

    if (isOpen) {
        panel.style.display = 'flex'; // Use flex for side-by-side layout
        panel.classList.add('open');
        // Re-initialize resizing if the panel is opened, ensuring it has a width
        setupResizing();
    } else {
        panel.classList.remove('open');
        // Collapse the panel by setting its display to none or zero size
        panel.style.display = 'none';
    }

    // Re-run setup for safety, especially if we are toggling visibility/size
    setupResizing();
}


/**
 * Initialization function: Must be called when the page loads.
 */
function initializeEditor() {
    // Set up initial layout and event listeners
    setupResizing();

    // Attach panel toggle handler to the rail button (assuming it has ID 'railButton')
    const railBtn = document.getElementById('railButton');
    if (railBtn) {
        // Use a wrapper function that calls togglePanel() with explicit state management if needed,
        // but for now, we'll just call the core logic.
        railBtn.onclick = () => togglePanel();
    }

    console.log("Editor layout initialized: Resizing and panel toggling active.");
}


// Call initialization when DOM is ready (assuming this script runs after DOMContentLoaded)
document.addEventListener('DOMContentLoaded', initializeEditor);