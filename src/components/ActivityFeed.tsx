'use client';

import { CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';

interface Activity {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  icon: 'approved' | 'rejected' | 'pending' | 'document';
}

interface ActivityFeedProps {
  activities: Activity[];
}

const iconMap = {
  approved: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-950/50' },
  rejected: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-950/50' },
  pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-950/50' },
  document: { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-950/50' },
};

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours < 24) return `${hours} hours ago`;
  return `${days} days ago`;
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="bg-[#1a1a24] border border-[#2a2a35] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Workspace Activity</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            The latest, without the noise.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
            <p>No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => {
            const config = iconMap[activity.icon];
            const Icon = config.icon;
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">
                    <span className="font-medium">{activity.action}</span>
                    {' '}{activity.description}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                    {timeAgo(activity.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}