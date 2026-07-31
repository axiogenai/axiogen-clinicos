import { Clock, Stethoscope, CheckCircle2, TrendingUp } from 'lucide-react';
import type { QueueItem } from '../data/patients';

interface Props {
  queue: QueueItem[];
}

export default function QueueStatistics({ queue }: Props) {
  const total = queue.length;
  const waiting = queue.filter(q => q.status === 'waiting').length;
  const inConsultation = queue.filter(q => q.status === 'in-consultation').length;
  const completed = queue.filter(q => q.status === 'completed').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const stats = [
    {
      label: 'Total Today',
      value: total,
      subLabel: 'OPD patients',
      icon: TrendingUp,
      iconColor: 'text-[#8b5cf6]',
      accent: 'stat-card-purple',
      valueBg: 'bg-[#f5f3ff]',
      valueColor: 'text-[#6d28d9]',
    },
    {
      label: 'Waiting',
      value: waiting,
      subLabel: 'in waiting room',
      icon: Clock,
      iconColor: 'text-[#3b82f6]',
      accent: 'stat-card-blue',
      valueBg: 'bg-[#eff6ff]',
      valueColor: 'text-[#1d4ed8]',
    },
    {
      label: 'In Consultation',
      value: inConsultation,
      subLabel: 'with doctor now',
      icon: Stethoscope,
      iconColor: 'text-[#f59e0b]',
      accent: 'stat-card-amber',
      valueBg: 'bg-[#fffbeb]',
      valueColor: 'text-[#b45309]',
    },
    {
      label: 'Completed',
      value: completed,
      subLabel: `${completionRate}% completion rate`,
      icon: CheckCircle2,
      iconColor: 'text-[#059669]',
      accent: 'stat-card-green',
      valueBg: 'bg-[#f0fdf4]',
      valueColor: 'text-[#166534]',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className={`stat-card ${stat.accent} p-3 sm:p-4 overflow-hidden`}>
            <div className="flex items-start justify-between gap-1 mb-1.5 min-w-0">
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7c766d] truncate">{stat.label}</p>
              <div className={`p-1 sm:p-1.5 rounded-lg ${stat.valueBg} shrink-0`}>
                <Icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${stat.iconColor}`} />
              </div>
            </div>
            <p className={`text-2xl sm:text-3xl font-black tracking-tight ${stat.valueColor} leading-none mb-1`}>
              {stat.value}
            </p>
            <p className="text-[10px] sm:text-[11px] text-[#7c766d] font-medium truncate">{stat.subLabel}</p>
            {/* Progress bar */}
            {stat.label === 'Completed' && total > 0 && (
              <div className="mt-2 h-1 bg-[#e8e2d2] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#059669] rounded-full transition-all duration-700"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
