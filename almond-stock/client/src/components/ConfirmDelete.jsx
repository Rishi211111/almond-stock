import { useEffect, useState } from 'react';

// Two-step delete: first click arms the button, second click confirms.
export default function ConfirmDelete({ onConfirm, label = 'Delete' }) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return undefined;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <button
      type="button"
      className={`btn link${armed ? ' armed' : ''}`}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
        }
      }}
    >
      {armed ? 'Click again to delete' : label}
    </button>
  );
}
