import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface DeleteBoardModalProps {
  isOpen: boolean;
  boardTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteBoardModal: React.FC<DeleteBoardModalProps> = ({
  isOpen,
  boardTitle,
  onConfirm,
  onCancel,
}) => {
  const [isChecked, setIsChecked] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (isChecked) {
      onConfirm();
      setIsChecked(false);
    }
  };

  const handleCancel = () => {
    setIsChecked(false);
    onCancel();
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mr-3">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Board löschen</h2>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-xl"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700">
            Möchten Sie das Board <span className="font-semibold">"{boardTitle}"</span> wirklich löschen?
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-800 font-medium">
              ⚠️ Diese Aktion ist endgültig und unumkehrbar!
            </p>
            <p className="text-sm text-red-700 mt-2">
              Alle Aufgaben, Spalten und Daten dieses Boards werden permanent gelöscht und können nicht wiederhergestellt werden.
            </p>
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start cursor-pointer group">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="mt-1 h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer"
            />
            <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">
              Ich verstehe, dass diese Aktion nicht rückgängig gemacht werden kann und alle Daten unwiderruflich gelöscht werden.
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 bg-gray-50 rounded-b-2xl">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            Abbrechen
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isChecked}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
              isChecked
                ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/30'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Board unwiderruflich löschen
          </button>
        </div>
      </div>
    </div>
  );
};
