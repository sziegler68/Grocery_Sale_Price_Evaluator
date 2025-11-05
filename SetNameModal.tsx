import React, { useState } from 'react';
import { User } from 'lucide-react';

interface SetNameModalProps {
  darkMode: boolean;
  listName: string;
  onSave: (name: string) => void;
}

const SetNameModal: React.FC<SetNameModalProps> = ({ darkMode, listName, onSave }) => {
  const [userName, setUserName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (userName.trim() === '') {
      return;
    }

    onSave(userName.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        className={`w-full max-w-md rounded-xl shadow-xl ${
          darkMode ? 'bg-zinc-800' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center space-x-2 mb-2">
            <User className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-bold">Welcome!</h2>
          </div>
          <p className="text-primary text-sm">
            You're joining <strong>{listName}</strong>
          </p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">What's your name? *</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g., Mom, John, Sarah"
              className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-300'
              }`}
              autoFocus
            />
            <p className="text-xs text-gray-900 dark:text-gray-400 mt-2">
              This helps others know who added or purchased items
            </p>
          </div>

          <div className={`p-4 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-purple-50'}`}>
            <p className="text-sm text-primary">
              Your name will be saved for this list only. If you join other lists, 
              you can use a different name.
            </p>
          </div>

          <button
            type="submit"
            disabled={userName.trim() === ''}
            className="w-full px-4 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save & Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetNameModal;
