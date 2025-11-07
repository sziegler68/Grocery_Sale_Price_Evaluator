import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Users, Copy } from 'lucide-react';
import type { ShoppingList } from '../types';
import { toast } from 'react-toastify';

interface ShoppingListCardProps {
  list: ShoppingList;
  itemCount: number;
  darkMode: boolean;
}

const ShoppingListCard: React.FC<ShoppingListCardProps> = ({ list, itemCount, darkMode }) => {
  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    navigator.clipboard.writeText(list.share_code);
    toast.success('Share code copied!');
  };

  return (
    <Link to={`/shopping-list/${list.share_code}`}>
      <div
        className={`p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 ${
          darkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-white hover:bg-gray-50'
        } border-l-4 border-brand`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3">
            <ShoppingCart className="h-6 w-6 text-brand flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-lg">{list.name}</h3>
              <div className="flex items-center space-x-2 text-sm text-secondary mt-1">
                <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-primary">
          <div className="flex items-center space-x-2 text-sm">
            <Users className="h-4 w-4 text-secondary" />
            <span className="text-secondary">Shared List</span>
          </div>
          
          <button
            onClick={handleCopyCode}
            className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              darkMode
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
  );
};

export default ShoppingListCard;
