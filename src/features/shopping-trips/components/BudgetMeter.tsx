import React from 'react';
import { AlertCircle, Edit2 } from 'lucide-react';
import type { BudgetStatus } from '../types';

interface BudgetMeterProps {
  totalSpent: number;
  budget: number;
  budgetStatus: BudgetStatus;
  onEditBudget?: () => void;
}

export const BudgetMeter: React.FC<BudgetMeterProps> = ({
  totalSpent,
  budget,
  budgetStatus,
  onEditBudget
}) => {
  const getBudgetColor = () => {
    if (budgetStatus.color === 'green') return 'bg-green-600';
    if (budgetStatus.color === 'yellow') return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const getTextColor = () => {
    if (budgetStatus.color === 'green') return 'text-green-600';
    if (budgetStatus.color === 'yellow') return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-4 rounded-lg bg-card border border-primary mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div>
            <p className="text-sm text-secondary">Budget</p>
            <p className="text-2xl font-bold">${budget.toFixed(2)}</p>
          </div>
          {onEditBudget && (
            <button
              onClick={onEditBudget}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              title="Edit Budget"
            >
              <Edit2 className="h-4 w-4 text-brand" />
            </button>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-secondary">Spent</p>
          <p className={`text-2xl font-bold ${getTextColor()}`}>
            ${totalSpent.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-3 mb-2">
        <div
          className={`${getBudgetColor()} h-3 rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(budgetStatus.percentage, 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className={getTextColor()}>
          {budgetStatus.percentage.toFixed(0)}% used
        </span>
        <span className={getTextColor()}>
          ${Math.abs(budgetStatus.remaining).toFixed(2)} {budgetStatus.remaining >= 0 ? 'remaining' : 'over'}
        </span>
      </div>

      {budgetStatus.status === 'over' && (
        <div className="mt-3 p-2 rounded bg-red-100 dark:bg-red-900/20 flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-600 dark:text-red-400">
            You are over budget!
          </span>
        </div>
      )}

      {budgetStatus.status === 'approaching' && (
        <div className="mt-3 p-2 rounded bg-yellow-100 dark:bg-yellow-900/20 flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-600 dark:text-yellow-400">
            Approaching budget limit
          </span>
        </div>
      )}
    </div>
  );
};
