import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState('');
  const timer = useRef();

  const toast = useCallback((text) => {
    setMsg(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(''), 4000);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div id="toast" className={msg ? 'show' : ''} role="status" aria-live="polite">
        {msg}
      </div>
    </ToastContext.Provider>
  );
}
