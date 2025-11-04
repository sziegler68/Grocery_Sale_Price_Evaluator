import React, { useState } from 'react';
import { X, Plus, Copy, Check } from 'lucide-react';
import { createShoppingList } from './shoppingListApi';
import { addShareCode } from './shoppingListStorage';
import { toast } from 'react-toastify';

interface CreateListModalProps {
  darkMode: boolean;
  onClose: () => void;
  onCreated: (shareCode: string) => void;
}

const CreateListModal: React.FC<CreateListModalProps> = ({ darkMode, onClose, onCreated }) => {
  const [listName, setListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdList, setCreatedList] = useState<{ name: string; shareCode: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (listName.trim() === '') {
      toast.error('Please enter a list name');
      return;
    }

    setIsCreating(true);
    try {
      const list = await createShoppingList({ name: listName.trim() });
      
      // Save share code to local storage
      addShareCode(list.share_code);
      
      setCreatedList({ name: list.name, shareCode: list.share_code });
      toast.success('Shopping list created!');
    } catch (error) {
      toast.error('Failed to create list');
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCode = () => {
    if (createdList) {
      navigator.clipboard.writeText(createdList.shareCode);
      setCopied(true);
      toast.success('Share code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDone = () => {
    if (createdList) {
      onCreated(createdList.shareCode);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        className={`w-full max-w-md rounded-xl shadow-xl ${
          darkMode ? 'bg-zinc-800' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center space-x-2">
            <Plus className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-bold">Create Shopping List</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!createdList ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">List Name *</label>
                <input
                  type="text"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="e.g., Smith Family Groceries"
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-300'
                  }`}
                  autoFocus
                  disabled={isCreating}
                />
              </div>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-purple-50'}`}>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  After creating the list, you'll get a share code that you can give to family and friends
                  so they can add items too!
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isCreating}
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || listName.trim() === ''}
                  className="flex-1 px-4 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Create List'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="text-4xl mb-4">??</div>
                <h3 className="text-lg font-semibold mb-2">List Created!</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Your list "{createdList.name}" is ready.
                </p>
              </div>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-purple-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Share Code:</span>
                  <button
                    onClick={handleCopyCode}
                    className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                      copied
                        ? 'bg-green-600 text-white'
                        : darkMode
                        ? 'bg-zinc-600 hover:bg-zinc-500 text-purple-400'
                        : 'bg-white hover:bg-gray-50 text-purple-600'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-2xl font-bold text-center text-purple-600 py-2">
                  {createdList.shareCode}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                  Share this code with others so they can view and edit this list
                </p>
              </div>

              <button
                onClick={handleDone}
                className="w-full px-4 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
              >
                Open List
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateListModal;
