import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { getShoppingListByCode } from '../api';
import { addShareCode } from '../../../shared/utils/shoppingListStorage';
import { toast } from 'react-toastify';

interface JoinListModalProps {
  darkMode: boolean;
  onClose: () => void;
  onJoined: (shareCode: string) => void;
}

const JoinListModal: React.FC<JoinListModalProps> = ({ darkMode, onClose, onJoined }) => {
  const [shareCode, setShareCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const code = shareCode.trim().toUpperCase();
    if (code === '') {
      toast.error('Please enter a share code');
      return;
    }

    setIsJoining(true);
    try {
      const list = await getShoppingListByCode(code);
      
      if (!list) {
        toast.error('List not found. Check the code and try again.');
        return;
      }

      // Save share code to local storage
      addShareCode(list.share_code);
      
      toast.success(`Joined "${list.name}"!`);
      onJoined(list.share_code);
      onClose();
    } catch (error) {
      toast.error('Failed to join list');
      console.error(error);
    } finally {
      setIsJoining(false);
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
            <UserPlus className="h-6 w-6 text-brand" />
            <h2 className="text-xl font-bold">Join Shopping List</h2>
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
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Share Code *</label>
              <input
                type="text"
                value={shareCode}
                onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                placeholder="e.g., SHOP-K7P2M9"
                className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-lg text-center ${
                  darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-300'
                }`}
                autoFocus
                disabled={isJoining}
                maxLength={11}
              />
              <p className="text-xs text-secondary mt-2">
                Enter the share code you received from someone
              </p>
            </div>

            <div className={`p-4 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-purple-50'}`}>
              <p className="text-sm text-primary">
                <strong>Tip:</strong> Share codes look like "SHOP-ABC123". 
                Get one from someone who created a list!
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isJoining}
                className="flex-1 px-4 py-3 rounded-lg border border-input hover-bg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isJoining || shareCode.trim() === ''}
                className="flex-1 px-4 py-3 rounded-lg bg-brand hover:bg-purple-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isJoining ? 'Joining...' : 'Join List'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinListModal;
