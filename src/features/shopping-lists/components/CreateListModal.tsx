import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus } from 'lucide-react';
import { createShoppingList } from '../api';
import { addShareCode } from '../../../shared/utils/shoppingListStorage';
import { toast } from 'react-toastify';

interface CreateListModalProps {
  darkMode: boolean;
  onClose: () => void;
  onCreated: (shareCode: string) => void;
}

const CreateListModal: React.FC<CreateListModalProps> = ({ darkMode, onClose, onCreated }) => {
  const navigate = useNavigate();
  const [listName, setListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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
      
      toast.success('Shopping list created!');
      
      // Navigate immediately to the new list
      onCreated(list.share_code);
      onClose();
      navigate(`/shopping-lists/${list.share_code}`);
    } catch (error) {
      toast.error('Failed to create list');
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        className={`w-full max-w-md rounded-xl shadow-xl ${
          darkMode ? 'bg-zinc-800' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary">
          <div className="flex items-center space-x-2">
            <Plus className="h-6 w-6 text-brand" />
            <h2 className="text-xl font-bold">Create Shopping List</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover-bg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
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
              <p className="text-sm text-primary">
                After creating the list, you'll get a share code that you can give to family and friends
                so they can add items too!
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isCreating}
                className="flex-1 px-4 py-3 rounded-lg border border-input hover-bg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating || listName.trim() === ''}
                className="flex-1 px-4 py-3 rounded-lg bg-brand hover:bg-purple-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Creating...' : 'Create List'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateListModal;
