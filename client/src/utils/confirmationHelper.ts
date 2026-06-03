/**
 * Confirmation Dialog Helper
 * Provides standardized confirmation dialogs for common admin operations
 */

import { ConfirmationOptions } from '../hooks/useConfirmationDialog';
import { AlertTriangle, Trash2, LogOut, Ban, CheckCircle, Eye } from 'lucide-react';

export const confirmationMessages = {
  // Delete operations
  deleteStudent: (name?: string): ConfirmationOptions => ({
    title: 'Delete Student',
    message: `Are you sure you want to permanently delete ${name || 'this student'}? This action cannot be undone.`,
    confirmText: 'Delete Student',
    cancelText: 'Cancel',
    type: 'danger',
  }),

  deleteTeacher: (name?: string): ConfirmationOptions => ({
    title: 'Delete Teacher',
    message: `Are you sure you want to permanently delete ${name || 'this teacher'}? All their assignments will be unlinked.`,
    confirmText: 'Delete Teacher',
    cancelText: 'Cancel',
    type: 'danger',
  }),

  deleteParent: (name?: string): ConfirmationOptions => ({
    title: 'Delete Parent',
    message: `Are you sure you want to permanently delete ${name || 'this parent'}? Their access to student records will be removed.`,
    confirmText: 'Delete Parent',
    cancelText: 'Cancel',
    type: 'danger',
  }),

  deleteClass: (name?: string): ConfirmationOptions => ({
    title: 'Delete Class',
    message: `Are you sure you want to permanently delete ${name || 'this class'}? All students in this class will need to be reassigned.`,
    confirmText: 'Delete Class',
    cancelText: 'Cancel',
    type: 'danger',
  }),

  deleteSubject: (name?: string): ConfirmationOptions => ({
    title: 'Delete Subject',
    message: `Are you sure you want to permanently delete ${name || 'this subject'}? All related grades and assignments will be removed.`,
    confirmText: 'Delete Subject',
    cancelText: 'Cancel',
    type: 'danger',
  }),

  deleteInventoryItem: (name?: string): ConfirmationOptions => ({
    title: 'Delete Inventory Item',
    message: `Are you sure you want to permanently delete ${name || 'this item'}? The stock history will be preserved.`,
    confirmText: 'Delete Item',
    cancelText: 'Cancel',
    type: 'danger',
  }),

  deleteBook: (name?: string): ConfirmationOptions => ({
    title: 'Delete Book',
    message: `Are you sure you want to permanently delete "${name || 'this book'}" from the library? The borrowing history will be preserved.`,
    confirmText: 'Delete Book',
    cancelText: 'Cancel',
    type: 'danger',
  }),

  deleteEvent: (name?: string): ConfirmationOptions => ({
    title: 'Delete Event',
    message: `Are you sure you want to permanently delete "${name || 'this event'}"? This action cannot be undone.`,
    confirmText: 'Delete Event',
    cancelText: 'Cancel',
    type: 'danger',
  }),

  // Session operations
  revokeSession: (userName?: string): ConfirmationOptions => ({
    title: 'Revoke Session',
    message: `Are you sure you want to revoke this session${userName ? ` for ${userName}` : ''}? They will be logged out immediately.`,
    confirmText: 'Revoke',
    cancelText: 'Cancel',
    type: 'warning',
  }),

  revokeMultipleSessions: (count: number): ConfirmationOptions => ({
    title: 'Revoke Multiple Sessions',
    message: `Are you sure you want to revoke ${count} session${count > 1 ? 's' : ''}? All selected users will be logged out immediately.`,
    confirmText: 'Revoke All',
    cancelText: 'Cancel',
    type: 'danger',
  }),

  clearAllSessions: (): ConfirmationOptions => ({
    title: 'Clear All Sessions',
    message: '⚠️ This will log out ALL users including yourself! Are you absolutely sure you want to continue? This action cannot be undone.',
    confirmText: 'Clear All Sessions',
    cancelText: 'Cancel',
    type: 'danger',
  }),

  // Device operations
  blockDevice: (location?: string, browser?: string): ConfirmationOptions => ({
    title: 'Block Device',
    message: `Block device from ${location || 'Unknown location'} using ${browser || 'Unknown browser'}? This IP address will be blocked from accessing the system.`,
    confirmText: 'Block Device',
    cancelText: 'Cancel',
    type: 'danger',
  }),

  unblockDevice: (ip?: string): ConfirmationOptions => ({
    title: 'Unblock Device',
    message: `Remove the block from IP address ${ip || 'this device'}? This device will be allowed to access the system again.`,
    confirmText: 'Unblock',
    cancelText: 'Cancel',
    type: 'success',
  }),

  // Status changes
  activateUser: (name?: string): ConfirmationOptions => ({
    title: 'Activate User',
    message: `Activate user ${name || 'account'}? They will regain access to the system.`,
    confirmText: 'Activate',
    cancelText: 'Cancel',
    type: 'success',
  }),

  deactivateUser: (name?: string): ConfirmationOptions => ({
    title: 'Deactivate User',
    message: `Are you sure you want to deactivate ${name || 'this user'}? They will lose access to the system.`,
    confirmText: 'Deactivate',
    cancelText: 'Cancel',
    type: 'warning',
  }),

  blockUser: (name?: string): ConfirmationOptions => ({
    title: 'Block User',
    message: `Are you sure you want to block ${name || 'this user'}? They will not be able to login.`,
    confirmText: 'Block User',
    cancelText: 'Cancel',
    type: 'danger',
  }),

  unblockUser: (name?: string): ConfirmationOptions => ({
    title: 'Unblock User',
    message: `Unblock ${name || 'this user'}? They will be able to login again.`,
    confirmText: 'Unblock',
    cancelText: 'Cancel',
    type: 'success',
  }),

  // Fee operations
  deleteFeeStructure: (name?: string): ConfirmationOptions => ({
    title: 'Delete Fee Structure',
    message: `Are you sure you want to delete ${name || 'this fee structure'}? Associated fee balances will be affected.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger',
  }),

  markFeeAsPaid: (amount?: number, student?: string): ConfirmationOptions => ({
    title: 'Mark Fee as Paid',
    message: `Mark ${amount ? `KES ${amount} fee` : 'this fee'} as paid${student ? ` for ${student}` : ''}? This will update the fee balance.`,
    confirmText: 'Mark as Paid',
    cancelText: 'Cancel',
    type: 'success',
  }),

  reverseFeePayment: (amount?: number, student?: string): ConfirmationOptions => ({
    title: 'Reverse Fee Payment',
    message: `Are you sure you want to reverse ${amount ? `KES ${amount} payment` : 'this payment'}${student ? ` from ${student}` : ''}?`,
    confirmText: 'Reverse Payment',
    cancelText: 'Cancel',
    type: 'warning',
  }),

  // Attendance operations
  markAttendance: (date?: string, count?: number): ConfirmationOptions => ({
    title: 'Mark Attendance',
    message: `Confirm attendance marking${date ? ` for ${date}` : ''}? ${count ? `${count} records will be updated.` : ''}`,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'default',
  }),

  // Grade operations
  publishResults: (class_?: string, count?: number): ConfirmationOptions => ({
    title: 'Publish Results',
    message: `Publish results${class_ ? ` for ${class_}` : ''}? ${count ? `${count} students` : 'All students'} will be notified.`,
    confirmText: 'Publish',
    cancelText: 'Cancel',
    type: 'success',
  }),

  // Bulk operations
  bulkImportStudents: (count?: number): ConfirmationOptions => ({
    title: 'Bulk Import Students',
    message: `Import ${count || 'multiple'} students? Please ensure all data is correct as this action will create new student records.`,
    confirmText: 'Import',
    cancelText: 'Cancel',
    type: 'warning',
  }),

  bulkDeleteStudents: (count: number): ConfirmationOptions => ({
    title: 'Bulk Delete Students',
    message: `Are you absolutely sure you want to permanently delete ${count} student${count > 1 ? 's' : ''}? This action cannot be undone.`,
    confirmText: 'Delete All',
    cancelText: 'Cancel',
    type: 'danger',
  }),

  // Settings
  resetSystemSettings: (): ConfirmationOptions => ({
    title: 'Reset System Settings',
    message: 'Are you sure you want to reset all system settings to defaults? Custom configurations will be lost.',
    confirmText: 'Reset',
    cancelText: 'Cancel',
    type: 'danger',
  }),

  clearSystemCache: (): ConfirmationOptions => ({
    title: 'Clear System Cache',
    message: 'Clear all system cache? This will improve performance but may take a moment to rebuild.',
    confirmText: 'Clear Cache',
    cancelText: 'Cancel',
    type: 'warning',
  }),

  backupDatabase: (): ConfirmationOptions => ({
    title: 'Create Backup',
    message: 'Create a backup of the entire database? This process may take a few minutes.',
    confirmText: 'Create Backup',
    cancelText: 'Cancel',
    type: 'success',
  }),

  restoreDatabase: (backupName?: string): ConfirmationOptions => ({
    title: 'Restore Database',
    message: `Are you sure you want to restore from ${backupName || 'this backup'}? All current data will be replaced.`,
    confirmText: 'Restore',
    cancelText: 'Cancel',
    type: 'danger',
  }),
};

/**
 * Helper to get confirmation with custom callback
 */
export function createConfirmationWithCallback(
  baseConfirmation: ConfirmationOptions,
  onConfirm: () => void | Promise<void>,
): ConfirmationOptions {
  return {
    ...baseConfirmation,
    onConfirm,
  };
}
