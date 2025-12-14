/**
 * Moderation Dashboard Component
 * 
 * Admin dashboard showing moderation statistics and quick access to queue.
 */

import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, TrendingUp, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  getFlaggedItemsCount,
  getVerifiedItemsCount,
} from '@features/price-tracker/api/moderation';
import { ModerationQueue } from './ModerationQueue';

export function ModerationDashboard() {
  const [flaggedCount, setFlaggedCount] = useState<number>(0);
  const [verifiedCount, setVerifiedCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showQueue, setShowQueue] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const [flagged, verified] = await Promise.all([
        getFlaggedItemsCount(),
        getVerifiedItemsCount(),
      ]);
      setFlaggedCount(flagged);
      setVerifiedCount(verified);
    } catch (error) {
      console.error('[MODERATION] Failed to load stats:', error);
      toast.error('Failed to load moderation statistics');
    } finally {
      setIsLoading(false);
    }
  };

  if (showQueue) {
    return (
      <div>
        <button
          onClick={() => setShowQueue(false)}
          className="text-violet-400 hover:text-violet-300 mb-4 transition-colors"
        >
          ← Back to Dashboard
        </button>
        <ModerationQueue />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-violet-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Moderation Dashboard</h1>
          <p className="text-slate-400">Review and manage crowdsourced data</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Flagged Items */}
        <StatCard
          icon={<AlertTriangle className="w-6 h-6" />}
          label="Flagged Items"
          value={isLoading ? '...' : flaggedCount.toString()}
          color="amber"
          description="Items pending review"
        />

        {/* Verified Items */}
        <StatCard
          icon={<CheckCircle className="w-6 h-6" />}
          label="Verified Items"
          value={isLoading ? '...' : verifiedCount.toString()}
          color="green"
          description="Items approved"
        />

        {/* Verification Rate */}
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Verification Rate"
          value={
            isLoading
              ? '...'
              : flaggedCount + verifiedCount === 0
              ? '0%'
              : `${Math.round((verifiedCount / (flaggedCount + verifiedCount)) * 100)}%`
          }
          color="violet"
          description="Approval percentage"
        />
      </div>

      {/* Quick Actions */}
      {flaggedCount > 0 && (
        <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
              <div>
                <div className="text-amber-400 font-semibold text-lg mb-1">
                  {flaggedCount} {flaggedCount === 1 ? 'item' : 'items'} need review
                </div>
                <div className="text-amber-200 text-sm">
                  Flagged items are awaiting moderation approval
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowQueue(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              <Eye className="w-5 h-5" />
              <span>Review Queue</span>
            </button>
          </div>
        </div>
      )}

      {/* Moderation Guidelines */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Moderation Guidelines</h2>
        <div className="space-y-3 text-slate-300 text-sm">
          <div className="flex gap-3">
            <div className="text-violet-400 font-bold">1.</div>
            <div>
              <strong className="text-white">Verify item accuracy</strong> - Check that item name,
              price, and store match the receipt data.
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-violet-400 font-bold">2.</div>
            <div>
              <strong className="text-white">Check for duplicates</strong> - Look for similar items
              that may already exist in the database.
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-violet-400 font-bold">3.</div>
            <div>
              <strong className="text-white">Reject suspicious data</strong> - Flag items with
              clearly incorrect prices or impossible values.
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-violet-400 font-bold">4.</div>
            <div>
              <strong className="text-white">Trust OCR confidence</strong> - Items with low OCR
              confidence (&lt;70%) should be carefully reviewed.
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity (Placeholder) */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
        <div className="text-slate-400 text-center py-8">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No recent activity</p>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'amber' | 'green' | 'violet';
  description: string;
}

function StatCard({ icon, label, value, color, description }: StatCardProps) {
  const colorClasses = {
    amber: 'text-amber-400 bg-amber-900/30 border-amber-700',
    green: 'text-green-400 bg-green-900/30 border-green-700',
    violet: 'text-violet-400 bg-violet-900/30 border-violet-700',
  };

  return (
    <div className={`rounded-lg border p-6 ${colorClasses[color]}`}>
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <div className="text-sm font-medium text-slate-300">{label}</div>
      </div>
      <div className="text-4xl font-bold text-white mb-2">{value}</div>
      <div className="text-sm text-slate-400">{description}</div>
    </div>
  );
}
