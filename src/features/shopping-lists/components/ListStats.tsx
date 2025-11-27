import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface ListStatsProps {
  totalItems: number;
  checkedItems: number;
  completionPercentage: number;
}

export const ListStats: React.FC<ListStatsProps> = ({
  totalItems,
  checkedItems,
  completionPercentage,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
      <div className="p-3 rounded-lg bg-card border border-primary">
        <div className="flex items-center space-x-2 mb-1">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-xs font-medium">Completed</span>
        </div>
        <p className="text-lg font-bold">{checkedItems}</p>
        <p className="text-xs text-secondary">items checked off</p>
      </div>

      <div className="p-3 rounded-lg bg-card border border-primary">
        <div className="flex items-center space-x-2 mb-1">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <span className="text-xs font-medium">Remaining</span>
        </div>
        <p className="text-lg font-bold">{totalItems - checkedItems}</p>
        <p className="text-xs text-secondary">items left</p>
      </div>

      <div className="p-3 rounded-lg bg-card border border-primary">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-xs font-medium">Progress</span>
        </div>
        <p className="text-lg font-bold">{completionPercentage}%</p>
        <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-1.5 mt-1.5">
          <div
            className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
