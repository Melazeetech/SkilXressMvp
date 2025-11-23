import { useEffect, useRef } from 'react';

/**
 * Custom hook to handle browser back button for modals and views.
 * 
 * @param isOpen - Boolean indicating if the modal/view is currently open
 * @param onClose - Callback function to close the modal/view
 * @param id - Unique identifier for the history state (e.g., 'auth-modal')
 */
export function useBackHandler(isOpen: boolean, onClose: () => void, id: string) {
    const onCloseRef = useRef(onClose);

    // Update the ref whenever onClose changes so the effect always has the latest version
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            // Push a new entry to history when opened
            window.history.pushState({ modal: id }, '', window.location.pathname);

            const handlePopState = () => {
                // If back button is pressed (popstate event), close the modal
                onCloseRef.current();
            };

            window.addEventListener('popstate', handlePopState);

            return () => {
                window.removeEventListener('popstate', handlePopState);

                // If we're closing programmatically (not via back button), 
                // we might need to clean up the history state we pushed.
                // However, checking history state accurately is tricky.
                // A simple approach is: if we are still in the state we pushed, go back.
                // But since popstate happens *after* the history change, 
                // we only need to go back if we are closing *without* a popstate event.

                // NOTE: This is a simplified implementation. Robust history management 
                // often requires more complex routing libraries. 
                // For this MVP, we rely on the user's flow.

                // If the current state is the one we pushed, go back to remove it.
                if (window.history.state?.modal === id) {
                    window.history.back();
                }
            };
        }
    }, [isOpen, id]); // onClose is intentionally removed from dependencies to prevent re-runs
}
