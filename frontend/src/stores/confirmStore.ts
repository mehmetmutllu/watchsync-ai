import { create } from "zustand";

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Yıkıcı işlemler için onay butonunu kırmızı yapar. */
  danger?: boolean;
}

interface ConfirmState {
  open: boolean;
  options: ConfirmOptions | null;
  resolve: ((value: boolean) => void) | null;
  show: (options: ConfirmOptions) => Promise<boolean>;
  respond: (result: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  open: false,
  options: null,
  resolve: null,
  show: (options) =>
    new Promise<boolean>((resolve) => {
      // Önceki açık diyalog varsa iptal olarak çöz.
      get().resolve?.(false);
      set({ open: true, options, resolve });
    }),
  respond: (result) => {
    get().resolve?.(result);
    set({ open: false, options: null, resolve: null });
  },
}));

/**
 * Yıkıcı işlemlerden önce onay iste. `window.confirm` yerine kullanılır.
 *   if (!(await confirmDialog({ title, message, danger: true }))) return;
 */
export const confirmDialog = (options: ConfirmOptions): Promise<boolean> =>
  useConfirmStore.getState().show(options);
