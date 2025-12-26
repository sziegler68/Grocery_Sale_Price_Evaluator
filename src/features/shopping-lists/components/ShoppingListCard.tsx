import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Users, Copy, Pencil, Trash2, X, Check } from 'lucide-react';
import type { ShoppingList } from '../types';
import { toast } from 'react-toastify';

interface ShoppingListCardProps {
  list: ShoppingList;
  itemCount: number;
  darkMode: boolean;
  onRename?: (listId: string, newName: string) => Promise<void>;
  onDelete?: (listId: string, shareCode: string) => Promise<void>;
}

const ShoppingListCard: React.FC<ShoppingListCardProps> = ({
  list,
  itemCount,
  darkMode,
  onRename,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(list.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    navigator.clipboard.writeText(list.share_code);
    toast.success('Share code copied!');
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditName(list.name);
    setIsEditing(true);
  };

  const handleSaveEdit = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRename && editName.trim() && editName !== list.name) {
      await onRename(list.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditName(list.name);
    setIsEditing(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      await onDelete(list.id, list.share_code);
    }
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  return (
    <div className="relative">
      <Link to={`/shopping-lists/${list.share_code}`}>
        <div
          className={`p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 ${darkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-white hover:bg-gray-50'
            } border-l-4 border-brand`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <ShoppingCart className="h-6 w-6 text-brand flex-shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="flex items-center space-x-2" onClick={e => e.preventDefault()}>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={`w-full px-2 py-1 rounded border text-sm ${darkMode
                          ? 'bg-zinc-700 border-zinc-600 text-white'
                          : 'bg-white border-gray-300'
                        }`}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="p-1 text-green-500 hover:bg-green-500/20 rounded"
                      title="Save"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 text-red-500 hover:bg-red-500/20 rounded"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <h3 className="font-semibold text-lg truncate">{list.name}</h3>
                )}
                <div className="flex items-center space-x-2 text-sm text-secondary mt-1">
                  <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {/* Edit/Delete buttons */}
            {!isEditing && onRename && onDelete && (
              <div className="flex items-center space-x-1 ml-2">
                <button
                  onClick={handleEditClick}
                  className={`p-1.5 rounded-lg transition-colors ${darkMode
                      ? 'hover:bg-zinc-600 text-gray-400 hover:text-white'
                      : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                    }`}
                  title="Rename list"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDeleteClick}
                  className={`p-1.5 rounded-lg transition-colors ${darkMode
                      ? 'hover:bg-red-900/50 text-gray-400 hover:text-red-400'
                      : 'hover:bg-red-100 text-gray-500 hover:text-red-600'
                    }`}
                  title="Delete list"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-primary">
            <div className="flex items-center space-x-2 text-sm">
              <Users className="h-4 w-4 text-secondary" />
              <span className="text-secondary">Shared List</span>
            </div>

            <button
              onClick={handleCopyCode}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${darkMode
                  ? 'bg-zinc-700 hover:bg-zinc-600 text-purple-400'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-700'
                }`}
              title="Copy share code"
            >
              <Copy className="h-3 w-3" />
              <span>{list.share_code}</span>
            </button>
          </div>
        </div>
      </Link>

      {/* Delete Confirmation Overlay */}
      {showDeleteConfirm && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl z-10"
          onClick={handleCancelDelete}
        >
          <div
            className={`p-4 rounded-lg text-center ${darkMode ? 'bg-zinc-800' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm mb-3">Delete "{list.name}"?</p>
            <p className="text-xs text-secondary mb-4">You can restore it within 24 hours</p>
            <div className="flex space-x-2 justify-center">
              <button
                onClick={handleCancelDelete}
                className={`px-3 py-1.5 rounded text-sm ${darkMode ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingListCard;
