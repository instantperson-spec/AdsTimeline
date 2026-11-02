'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
};

type AlertOptions = {
  title?: string;
  message: string;
  okLabel?: string;
};

type PromptOptions = {
  title?: string;
  message: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  placeholder?: string;
};

type DialogApi = {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
  alert: (options: AlertOptions | string) => Promise<void>;
  prompt: (options: PromptOptions) => Promise<string | null>;
};

const AppDialogContext = createContext<DialogApi | null>(null);

type ActiveDialog =
  | {
      kind: 'confirm';
      title: string;
      message: string;
      confirmLabel: string;
      cancelLabel: string;
      tone: 'default' | 'danger';
      resolve: (value: boolean) => void;
    }
  | {
      kind: 'alert';
      title: string;
      message: string;
      okLabel: string;
      resolve: () => void;
    }
  | {
      kind: 'prompt';
      title: string;
      message: string;
      defaultValue: string;
      confirmLabel: string;
      cancelLabel: string;
      placeholder?: string;
      resolve: (value: string | null) => void;
    };

function normalizeConfirm(options: ConfirmOptions | string): ConfirmOptions {
  return typeof options === 'string' ? { message: options } : options;
}

function normalizeAlert(options: AlertOptions | string): AlertOptions {
  return typeof options === 'string' ? { message: options } : options;
}

export function AppDialogProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<ActiveDialog | null>(null);
  const [promptValue, setPromptValue] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const titleId = useId();

  const close = useCallback(() => setActive(null), []);

  const confirm = useCallback((options: ConfirmOptions | string) => {
    const opts = normalizeConfirm(options);
    return new Promise<boolean>((resolve) => {
      setActive({
        kind: 'confirm',
        title: opts.title ?? 'Confirm',
        message: opts.message,
        confirmLabel: opts.confirmLabel ?? 'OK',
        cancelLabel: opts.cancelLabel ?? 'Cancel',
        tone: opts.tone ?? 'default',
        resolve: (value) => {
          resolve(value);
          close();
        },
      });
    });
  }, [close]);

  const alert = useCallback((options: AlertOptions | string) => {
    const opts = normalizeAlert(options);
    return new Promise<void>((resolve) => {
      setActive({
        kind: 'alert',
        title: opts.title ?? 'Notice',
        message: opts.message,
        okLabel: opts.okLabel ?? 'OK',
        resolve: () => {
          resolve();
          close();
        },
      });
    });
  }, [close]);

  const prompt = useCallback((options: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      setPromptValue(options.defaultValue ?? '');
      setActive({
        kind: 'prompt',
        title: options.title ?? 'Input',
        message: options.message,
        defaultValue: options.defaultValue ?? '',
        confirmLabel: options.confirmLabel ?? 'OK',
        cancelLabel: options.cancelLabel ?? 'Cancel',
        placeholder: options.placeholder,
        resolve: (value) => {
          resolve(value);
          close();
        },
      });
    });
  }, [close]);

  useEffect(() => {
    if (active?.kind === 'prompt') {
      const t = window.setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
      return () => window.clearTimeout(t);
    }
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (active.kind === 'confirm') active.resolve(false);
        else if (active.kind === 'alert') active.resolve();
        else active.resolve(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  const api: DialogApi = { confirm, alert, prompt };

  const confirmBtnClass =
    active?.kind === 'confirm' && active.tone === 'danger'
      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
      : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30';

  return (
    <AppDialogContext.Provider value={api}>
      {children}

      {active && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              if (active.kind === 'confirm') active.resolve(false);
              else if (active.kind === 'alert') active.resolve();
              else active.resolve(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl p-5 text-zinc-100"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2 id={titleId} className="text-base font-bold text-white mb-2">
              {active.title}
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {active.message}
            </p>

            {active.kind === 'prompt' && (
              <input
                ref={inputRef}
                type="text"
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                placeholder={active.placeholder}
                className="mt-4 w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    active.resolve(promptValue);
                  }
                }}
              />
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              {active.kind !== 'alert' && (
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
                  onClick={() => {
                    if (active.kind === 'confirm') active.resolve(false);
                    else active.resolve(null);
                  }}
                >
                  {active.kind === 'confirm' ? active.cancelLabel : active.cancelLabel}
                </button>
              )}
              <button
                type="button"
                className={`px-4 py-2 rounded-xl text-sm font-bold text-white shadow-lg transition-colors ${confirmBtnClass}`}
                onClick={() => {
                  if (active.kind === 'confirm') active.resolve(true);
                  else if (active.kind === 'alert') active.resolve();
                  else active.resolve(promptValue);
                }}
              >
                {active.kind === 'alert'
                  ? active.okLabel
                  : active.kind === 'confirm'
                    ? active.confirmLabel
                    : active.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppDialogContext.Provider>
  );
}

export function useAppDialog(): DialogApi {
  const ctx = useContext(AppDialogContext);
  if (!ctx) {
    throw new Error('useAppDialog must be used within AppDialogProvider');
  }
  return ctx;
}
