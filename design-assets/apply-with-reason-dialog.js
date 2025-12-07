/**
 * Apply with Reason Dialog - JavaScript Functionality
 * Handles dialog interactions, validation, and state management
 * 
 * Author: Manus AI
 * Date: November 2025
 * Version: 1.0
 */

// ========================================
// GLOBAL STATE
// ========================================

let dialogState = {
  isOpen: false,
  reasonText: '',
  characterCount: 0,
  hasChanges: false
};

// ========================================
// DIALOG CONTROL FUNCTIONS
// ========================================

/**
 * Opens the Apply with Reason dialog
 */
function openDialog() {
  const overlay = document.getElementById('awrOverlay');
  const dialog = document.getElementById('awrDialog');
  const reasonInput = document.getElementById('awrReasonInput');
  
  // Show overlay and dialog
  overlay.classList.add('active');
  dialog.classList.add('active');
  
  // Update state
  dialogState.isOpen = true;
  
  // Focus on reason input
  setTimeout(() => {
    reasonInput.focus();
  }, 100);
  
  // Update timestamp to current time
  updateTimestamp();
  
  // Add keyboard event listener
  document.addEventListener('keydown', handleKeyPress);
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
}

/**
 * Closes the Apply with Reason dialog
 */
function closeDialog() {
  const overlay = document.getElementById('awrOverlay');
  const dialog = document.getElementById('awrDialog');
  
  // Check if there are unsaved changes
  if (dialogState.hasChanges && dialogState.reasonText.length > 0) {
    const confirmClose = confirm('You have unsaved changes. Are you sure you want to close?');
    if (!confirmClose) {
      return;
    }
  }
  
  // Hide overlay and dialog
  overlay.classList.remove('active');
  dialog.classList.remove('active');
  
  // Update state
  dialogState.isOpen = false;
  dialogState.hasChanges = false;
  
  // Remove keyboard event listener
  document.removeEventListener('keydown', handleKeyPress);
  
  // Restore body scroll
  document.body.style.overflow = '';
  
  // Reset form after animation completes
  setTimeout(() => {
    resetDialog();
  }, 200);
}

/**
 * Resets the dialog to initial state
 */
function resetDialog() {
  const reasonInput = document.getElementById('awrReasonInput');
  const charCount = document.getElementById('awrCharCount');
  const warning = document.getElementById('awrWarning');
  
  // Reset input
  reasonInput.value = '';
  dialogState.reasonText = '';
  dialogState.characterCount = 0;
  
  // Reset character count
  charCount.textContent = '0 / 500 characters';
  charCount.classList.remove('near-limit', 'at-limit');
  
  // Hide warning
  warning.style.display = 'none';
}

// ========================================
// INPUT HANDLING
// ========================================

/**
 * Updates character count and validation state
 */
function updateCharacterCount() {
  const reasonInput = document.getElementById('awrReasonInput');
  const charCount = document.getElementById('awrCharCount');
  const warning = document.getElementById('awrWarning');
  const confirmButton = document.getElementById('awrConfirmButton');
  
  // Update state
  dialogState.reasonText = reasonInput.value;
  dialogState.characterCount = reasonInput.value.length;
  dialogState.hasChanges = true;
  
  // Update character count display
  charCount.textContent = `${dialogState.characterCount} / 500 characters`;
  
  // Update character count styling
  charCount.classList.remove('near-limit', 'at-limit');
  if (dialogState.characterCount >= 500) {
    charCount.classList.add('at-limit');
  } else if (dialogState.characterCount >= 450) {
    charCount.classList.add('near-limit');
  }
  
  // Show/hide warning based on reason length
  if (dialogState.characterCount > 0 && dialogState.characterCount < 20) {
    warning.style.display = 'flex';
  } else {
    warning.style.display = 'none';
  }
  
  // Enable/disable confirm button based on reason presence
  // Note: Empty reasons are allowed but require secondary confirmation
  confirmButton.disabled = false;
}

/**
 * Handles keyboard shortcuts
 */
function handleKeyPress(event) {
  if (!dialogState.isOpen) return;
  
  // Escape key - close dialog
  if (event.key === 'Escape') {
    event.preventDefault();
    closeDialog();
  }
  
  // Enter key (Ctrl+Enter or Cmd+Enter) - confirm and apply
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    confirmAndApply();
  }
}

// ========================================
// ACTION HANDLERS
// ========================================

/**
 * Confirms and applies the parameter changes
 */
function confirmAndApply() {
  const reasonInput = document.getElementById('awrReasonInput');
  const loading = document.getElementById('awrLoading');
  
  // Check if reason is empty and require secondary confirmation
  if (dialogState.reasonText.trim().length === 0) {
    const confirmEmpty = confirm(
      'You have not provided a reason for this change. ' +
      'This is allowed but not recommended for audit purposes. ' +
      'Continue anyway?'
    );
    if (!confirmEmpty) {
      reasonInput.focus();
      return;
    }
  }
  
  // Show loading state
  loading.style.display = 'flex';
  
  // Simulate API call (replace with actual API call in production)
  setTimeout(() => {
    // Hide loading state
    loading.style.display = 'none';
    
    // Close dialog
    closeDialog();
    
    // Show success toast
    showToast('Changes applied successfully', 'success');
    
    // Log the change (in production, this would be sent to the backend)
    console.log('Change applied:', {
      timestamp: new Date().toISOString(),
      operator: 'operator-12345',
      parameters: {
        detectionThreshold: { old: 0.30, new: 0.50 },
        confidenceFloor: { old: 0.20, new: 0.40 }
      },
      reason: dialogState.reasonText || '(No reason provided)',
      changeId: generateChangeId()
    });
  }, 1500);
}

/**
 * Rolls back to the previous parameter values
 */
function rollbackToPrevious() {
  const confirmRollback = confirm(
    'This will revert to the previous parameter values. Continue?'
  );
  
  if (confirmRollback) {
    // Close dialog
    closeDialog();
    
    // Show info toast
    showToast('Rolled back to previous values', 'info');
    
    // Log the rollback (in production, this would be sent to the backend)
    console.log('Rollback performed:', {
      timestamp: new Date().toISOString(),
      operator: 'operator-12345',
      action: 'rollback_to_previous'
    });
  }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Updates the timestamp to current time
 */
function updateTimestamp() {
  const timestampElement = document.getElementById('awrTimestamp');
  const now = new Date();
  const formattedTime = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  timestampElement.textContent = formattedTime;
}

/**
 * Shows a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, warning, info)
 */
function showToast(message, type = 'success') {
  const toast = document.getElementById('toastNotification');
  const toastMessage = document.getElementById('toastMessage');
  
  // Update message
  toastMessage.textContent = message;
  
  // Update border color based on type
  const borderColors = {
    success: 'var(--dd-toast-success-accent)',
    error: 'var(--dd-toast-error-accent)',
    warning: 'var(--dd-toast-warning-accent)',
    info: 'var(--dd-toast-info-accent)'
  };
  toast.style.borderColor = borderColors[type] || borderColors.success;
  
  // Show toast
  toast.classList.add('active');
  
  // Hide toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('active');
  }, 3000);
}

/**
 * Generates a unique change ID
 * @returns {string} A unique change ID
 */
function generateChangeId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `CHG-${timestamp}-${random}`.toUpperCase();
}

// ========================================
// INITIALIZATION
// ========================================

/**
 * Initializes the dialog when the DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('Apply with Reason Dialog initialized');
  
  // Set initial timestamp
  updateTimestamp();
  
  // Update timestamp every second
  setInterval(updateTimestamp, 1000);
  
  // Enable rollback button (in production, check if there are previous changes)
  const rollbackButton = document.getElementById('awrRollbackButton');
  // For demo purposes, enable after 2 seconds
  setTimeout(() => {
    rollbackButton.disabled = false;
  }, 2000);
});

// ========================================
// ACCESSIBILITY ENHANCEMENTS
// ========================================

/**
 * Traps focus within the dialog when it's open
 */
function trapFocus(event) {
  if (!dialogState.isOpen) return;
  
  const dialog = document.getElementById('awrDialog');
  const focusableElements = dialog.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  if (event.key === 'Tab') {
    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }
}

// Add focus trap listener
document.addEventListener('keydown', trapFocus);

// ========================================
// DEMO HELPERS
// ========================================

/**
 * Simulates filling in a reason (for demo purposes)
 */
function fillDemoReason() {
  const reasonInput = document.getElementById('awrReasonInput');
  reasonInput.value = 'High noise environment in urban area causing excessive false positives. Increasing threshold to reduce operator workload while maintaining detection of legitimate signals.';
  updateCharacterCount();
}

// Expose demo helper to console
window.fillDemoReason = fillDemoReason;

console.log('Tip: Type fillDemoReason() in the console to auto-fill the reason field');
