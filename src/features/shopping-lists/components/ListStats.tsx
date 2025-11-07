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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="p-4 rounded-lg bg-card border border-primary">
        <div className="flex items-center space-x-2 mb-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium">Completed</span>
        </div>
        <p className="text-2xl font-bold">{checkedItems}</p>
        <p className="text-xs text-secondary">items checked off</p>
      </div>

      <div className="p-4 rounded-lg bg-card border border-primary">
        <div className="flex items-center space-x-2 mb-2">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <span className="text-sm font-medium">Remaining</span>
        </div>
        <p className="text-2xl font-bold">{totalItems - checkedItems}</p>
        <p className="text-xs text-secondary">items left</p>
      </div>

      <div className="p-4 rounded-lg bg-card border border-primary">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-sm font-medium">Progress</span>
        </div>
        <p className="text-2xl font-bold">{completionPercentage}%</p>
        <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2 mt-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
