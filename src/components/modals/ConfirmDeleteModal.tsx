import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div id="confirm-delete-modal" className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden border border-zinc-200">
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-pink-200">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h3 className="text-base font-bold text-black mb-2">{title}</h3>
          <p className="text-xs text-zinc-600 mb-6 leading-relaxed">{description}</p>

          <div className="flex items-center justify-center gap-3">
            <button
              id="cancel-delete-btn"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:text-black bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer w-full border border-zinc-300"
            >
              Cancel
            </button>
            <button
              id="confirm-delete-btn"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 rounded-lg shadow-sm transition-all cursor-pointer w-full flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
