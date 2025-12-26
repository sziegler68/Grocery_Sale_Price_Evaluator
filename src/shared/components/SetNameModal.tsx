import React, { useState, useEffect } from 'react';
import { User, Check } from 'lucide-react';
import { getUserName } from '../utils/settings';

interface SetNameModalProps {
  darkMode: boolean;
  listName: string;
  onSave: (name: string) => void;
}

const SetNameModal: React.FC<SetNameModalProps> = ({ darkMode, listName, onSave }) => {
  const [defaultName, setDefaultName] = useState('');
  const [useCustomName, setUseCustomName] = useState(false);
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    // Load default name from Settings
    const profileName = getUserName();
    if (profileName) {
      setDefaultName(profileName);
    } else {
      // No default name set - force custom name entry
      setUseCustomName(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nameToSave = useCustomName ? customName.trim() : defaultName;

    if (nameToSave === '') {
      return;
    }

    onSave(nameToSave);
  };

  const canSubmit = useCustomName ? customName.trim() !== '' : defaultName !== '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        className={`w-full max-w-md rounded-xl shadow-xl ${darkMode ? 'bg-zinc-800' : 'bg-white'
          }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-primary">
          <div className="flex items-center space-x-2 mb-2">
            <User className="h-6 w-6 text-brand" />
            <h2 className="text-xl font-bold">Welcome!</h2>
          </div>
          <p className="text-primary text-sm">
            You're joining <strong>{listName}</strong>
          </p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {defaultName ? (
            <>
              {/* Default name option */}
              <div
                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${!useCustomName
                    ? 'border-brand bg-purple-50 dark:bg-purple-900/20'
                    : darkMode ? 'border-zinc-600' : 'border-gray-200'
                  }`}
                onClick={() => setUseCustomName(false)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Use my default name</p>
                    <p className="text-lg text-brand font-semibold">{defaultName}</p>
                  </div>
                  {!useCustomName && (
                    <div className="w-6 h-6 bg-brand rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Custom name option */}
              <div
                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${useCustomName
                    ? 'border-brand bg-purple-50 dark:bg-purple-900/20'
                    : darkMode ? 'border-zinc-600' : 'border-gray-200'
                  }`}
                onClick={() => setUseCustomName(true)}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">Use a different name for this list</p>
                  {useCustomName && (
                    <div className="w-6 h-6 bg-brand rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                {useCustomName && (
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Enter your name for this list"
                    className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent ${darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-300'
                      }`}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>
            </>
          ) : (
            // No default name set - show simple input
            <div>
              <label className="block text-sm font-medium mb-2">What's your name? *</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g., Mom, John, Sarah"
                className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent ${darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-300'
                  }`}
                autoFocus
              />
              <p className="text-xs text-secondary mt-2">
                Tip: Set a default name in Settings to skip this step next time!
              </p>
            </div>
          )}

          <div className={`p-4 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-purple-50'}`}>
            <p className="text-sm text-primary">
              This name will be shown when you add or check off items on this list.
            </p>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full px-4 py-3 rounded-lg bg-brand hover:bg-purple-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetNameModal;
