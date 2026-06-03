import { useState, useCallback } from 'react';

export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'default' | 'danger' | 'warning' | 'success';
  icon?: React.ReactNode;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

interface ConfirmationState {
  isOpen: boolean;
  options: ConfirmationOptions | null;
  resolve: ((value: boolean) => void) | null;
  isLoading: boolean;
}

export function useConfirmationDialog() {
  const [state, setState] = useState<ConfirmationState>({
    isOpen: false,
    options: null,
    resolve: null,
    isLoading: false,
  });

  const confirm = useCallback((options: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        options,
        resolve,
        isLoading: false,
      });
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      if (state.options?.onConfirm) {
        await state.options.onConfirm();
      }
      state.resolve?.(true);
      setState({ isOpen: false, options: null, resolve: null, isLoading: false });
    } catch (error) {
      console.error('Confirmation error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.resolve, state.options]);

  const handleCancel = useCallback(() => {
    state.options?.onCancel?.();
    state.resolve?.(false);
    setState({ isOpen: false, options: null, resolve: null, isLoading: false });
  }, [state.resolve, state.options]);

  return {
    isOpen: state.isOpen,
    options: state.options,
    confirm,
    handleConfirm,
    handleCancel,
    isLoading: state.isLoading,
    // Alias for cancel - handleCancel is the function, cancel is the action
    cancel: handleCancel,
    // Config property for backwards compatibility (non-null with defaults)
    config: state.options || { title: '', message: '' },
    props: {
      isOpen: state.isOpen,
      options: state.options,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
      isLoading: state.isLoading,
    },
  };
}