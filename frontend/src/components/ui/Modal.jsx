import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, onClose, children, maxWidth = 'max-w-lg' }) {
  // Close on Escape key
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">

      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/25 backdrop-blur-md" onClick={onClose} />

      {/* Modal card */}
      <div className={`relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-white/70 bg-white/70 shadow-[0_8px_30px_rgb(0_0_0_/_0.10)] backdrop-blur-md ${maxWidth}`}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100/80 px-6 py-4">
          <h3 className="text-sm font-bold tracking-tight text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition duration-300 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={15} strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {children}
        </div>

      </div>
    </div>
  );
}
