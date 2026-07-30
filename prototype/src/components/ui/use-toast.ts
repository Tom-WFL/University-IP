// Trimmed version of the shadcn useToast hook the live app uses in 70 files.
import * as React from 'react';

type ToastVariant = 'default' | 'destructive';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

type Listener = (toasts: Toast[]) => void;

let memory: Toast[] = [];
const listeners = new Set<Listener>();
let counter = 0;

const TOAST_MS = 4200;

function emit() {
  listeners.forEach((l) => l(memory));
}

export function dismiss(id: string) {
  memory = memory.filter((t) => t.id !== id);
  emit();
}

export function toast(input: Omit<Toast, 'id'>) {
  const id = String(++counter);
  memory = [...memory, { id, ...input }].slice(-4);
  emit();
  setTimeout(() => dismiss(id), TOAST_MS);
  return id;
}

export function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>(memory);
  React.useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);
  return { toasts, toast, dismiss };
}
