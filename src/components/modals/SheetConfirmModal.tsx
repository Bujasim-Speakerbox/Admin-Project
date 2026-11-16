import React from 'react';
import { FileSpreadsheet, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export interface SheetConfirmConfig {
  isOpen: boolean;
  title: string;
  description: string;
  spreadsheetTitle: string;
  sheetTabTitle: string;
  rowCount: number;
  isOverwrite: boolean;
  onConfirm: () => void | Promise<void>;
}

interface SheetConfirmModalProps {
  config: SheetConfirmConfig;
  onClose: () => void;
  isProcessing?: boolean;
}

export const SheetConfirmModal: React.FC<SheetConfirmModalProps> = ({
  config,
  onClose,
  isProcessing = false,
}) => {
  if (!config.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div
        id="sheet-confirm-modal"
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-zinc-200"
      >
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-black">{config.title}</h3>
              <p className="text-[11px] text-zinc-500">Confirm Google Sheets Update</p>
            </div>
          </div>
          <button
            id="close-sheet-confirm-modal-btn"
            onClick={onClose}
            disabled={isProcessing}
            className="text-zinc-500 hover:text-black p-1 rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-zinc-700 leading-relaxed font-medium">
            {config.description}
          </p>

          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 font-semibold">Spreadsheet:</span>
              <span className="font-bold text-black truncate max-w-[220px]">
                {config.spreadsheetTitle}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 font-semibold">Target Tab:</span>
              <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 font-bold">
                {config.sheetTabTitle}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 font-semibold">Rows Affected:</span>
              <span className="font-black text-black">{config.rowCount} row(s)</span>
            </div>
          </div>

          {config.isOverwrite && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                This will replace existing contents in the{' '}
                <strong className="font-bold">"{config.sheetTabTitle}"</strong> tab with the latest data from this dashboard.
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-200">
            <button
              id="cancel-sheet-confirm-btn"
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:text-black bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer border border-zinc-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              id="confirm-sheet-sync-btn"
              type="button"
              disabled={isProcessing}
              onClick={async () => {
                await config.onConfirm();
              }}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isProcessing ? 'Updating Sheet...' : 'Confirm & Update'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
