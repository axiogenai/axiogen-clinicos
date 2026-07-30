import { Users, Clock, Stethoscope, CheckCircle2 } from 'lucide-react';
import type { QueueItem } from '../data/patients';

interface Props {
  queue: QueueItem[];
}

export default function QueueStatistics({ queue }: Props) {
  const total = queue.length;
  const waiting = queue.filter(q => q.status === 'waiting').length;
  const inConsultation = queue.filter(q => q.status === 'in-consultation').length;
  const completed = queue.filter(q => q.status === 'completed').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-1">
          <p className="text-sm text-gray-500 font-medium">Total Today</p>
          <Users className="w-4 h-4 text-indigo-600" />
        </div>
        <p className="text-2xl font-bold text-gray-900">{total}</p>
      </div>

      <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-1">
          <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
            <span>Waiting</span>
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">Active</span>
          </p>
          <Clock className="w-4 h-4 text-blue-600" />
        </div>
        <p className="text-2xl font-bold text-gray-900">{waiting}</p>
      </div>

      <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-1">
          <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
            <span>In Room</span>
            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">Now</span>
          </p>
          <Stethoscope className="w-4 h-4 text-amber-600" />
        </div>
        <p className="text-2xl font-bold text-gray-900">{inConsultation}</p>
      </div>

      <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-1">
          <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
            <span>Completed</span>
            <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium">Done</span>
          </p>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </div>
        <p className="text-2xl font-bold text-gray-900">{completed}</p>
      </div>
    </div>
  );
}
