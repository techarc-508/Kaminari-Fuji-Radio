import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext.tsx';
import {
  History,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  Search,
  ExternalLink,
} from 'lucide-react';

export const DownloadHistorySection: React.FC = () => {
  const { jobs, retryJob } = useAdmin();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeLogJobId, setActiveLogJobId] = useState<string | null>(null);

  const filteredJobs = jobs.filter((job) => {
    const matchSearch =
      search === '' ||
      job.sourceUrl.toLowerCase().includes(search.toLowerCase()) ||
      (job.playlistTitle && job.playlistTitle.toLowerCase().includes(search.toLowerCase())) ||
      job.id.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === 'all' || job.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const activeJob = jobs.find((j) => j.id === activeLogJobId);

  return (
    <div className="bg-[#ece6d8] border border-[#3e3831] p-5 shadow-[2px_2px_0px_#3e3831] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#3e3831] pb-3 gap-2">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#2d2722]">
            Download Job History & Audit Records
          </h2>
          <p className="text-xs font-mono text-[#746b60]">
            Review all completed, failed, and historical media ingestion tasks
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <input
            type="text"
            placeholder="Search URL, playlist, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#e4dfd1] border border-[#3e3831] px-2.5 py-1 text-[#2d2722] focus:outline-none"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#e4dfd1] border border-[#3e3831] px-2 py-1 text-[#2d2722]"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
            <option value="downloading">In Progress</option>
          </select>
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="p-8 border border-dashed border-[#3e3831] text-center bg-[#e4dfd1]/40">
          <History className="w-6 h-6 text-[#746b60] mx-auto mb-2" />
          <p className="text-sm font-serif font-bold text-[#2d2722]">No download records match</p>
          <p className="text-xs font-mono text-[#746b60] mt-1">
            Historical download tasks will appear here after jobs run.
          </p>
        </div>
      ) : (
        <div className="border border-[#3e3831] bg-[#e4dfd1]/30 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#e4dfd1] border-b border-[#3e3831] text-[#746b60] text-[11px] uppercase">
              <tr>
                <th className="py-2.5 px-3">Job ID</th>
                <th className="py-2.5 px-3">Target Title / URL</th>
                <th className="py-2.5 px-3">Format</th>
                <th className="py-2.5 px-3 text-center">Items</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Started / Finished</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3e3831]/20">
              {filteredJobs.map((j) => (
                <tr key={j.id} className="hover:bg-[#e4dfd1]/70 transition-colors">
                  <td className="py-2.5 px-3 text-[#746b60] font-semibold">{j.id}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-serif font-bold text-[#2d2722] truncate max-w-xs">
                      {j.playlistTitle || j.sourceUrl}
                    </div>
                    <div className="text-[10px] text-[#746b60] truncate max-w-xs">
                      {j.sourceUrl}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-[#544d44]">
                    {j.outputFormat.toUpperCase()} ({j.quality})
                  </td>
                  <td className="py-2.5 px-3 text-center tabular-nums">
                    {j.completedItems} / {j.totalItems}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] uppercase px-1.5 py-0.5 border border-[#3e3831] font-semibold ${
                        j.status === 'completed'
                          ? 'bg-[#e0edd8] text-[#2d4b1f]'
                          : j.status === 'failed'
                          ? 'bg-[#fae2e4] text-[#931523]'
                          : j.status === 'downloading'
                          ? 'bg-[#c52838] text-white'
                          : 'bg-[#ece6d8] text-[#544d44]'
                      }`}
                    >
                      {j.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-[#746b60]">
                    {j.startedAt ? new Date(j.startedAt).toLocaleTimeString() : '-'}
                    {j.completedAt ? ` → ${new Date(j.completedAt).toLocaleTimeString()}` : ''}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setActiveLogJobId(j.id)}
                        className="p-1 border border-[#3e3831] bg-[#ece6d8] hover:bg-[#dcd6c7]"
                        title="View job logs"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                      </button>
                      {j.status === 'failed' && (
                        <button
                          onClick={() => retryJob(j.id)}
                          className="p-1 border border-[#3e3831] bg-[#ece6d8] hover:bg-[#c52838] hover:text-white"
                          title="Retry job"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Terminal Output Log Dialog */}
      {activeJob && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#221d19] border border-[#3e3831] p-5 w-full max-w-2xl text-[#ece6d8] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#3e3831] pb-2 mb-3">
              <h4 className="font-mono font-bold text-xs">
                Log Output: {activeJob.id}
              </h4>
              <button
                onClick={() => setActiveLogJobId(null)}
                className="text-[#ece6d8] hover:text-[#c52838]"
              >
                ✕
              </button>
            </div>
            <div className="bg-black/70 p-3 h-64 overflow-y-auto font-mono text-[11px] space-y-1 text-[#b5a999]">
              {activeJob.logs.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))}
            </div>
            <div className="flex justify-end pt-3">
              <button
                onClick={() => setActiveLogJobId(null)}
                className="px-3 py-1 bg-[#c52838] text-white text-xs font-mono"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
