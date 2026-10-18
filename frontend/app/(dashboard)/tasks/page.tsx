"use client";

import { useState } from "react";
import { CheckSquare, Clock, Eye, Play, CheckCircle2, Plus } from "lucide-react";

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  priority: string;
  due_date: string;
  status: string;
  assigned_at: string;
  seen_at: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  return (
    <div className="space-y-3.5">
      {/* Top Action Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Staff Task Tracking & Timestamp Audit Logs</span>
        </div>
        <button className="w-full sm:w-auto justify-center inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all whitespace-nowrap shrink-0">
          <Plus className="w-4 h-4" />
          Create New Task
        </button>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 font-bold text-slate-900 text-base">
          Assigned Tasks Log
        </div>
        <div className="divide-y divide-slate-100">
          {tasks.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckSquare className="w-10 h-10 mx-auto mb-2 text-slate-300 opacity-60" />
              <p className="text-sm font-semibold text-slate-600">No tasks assigned yet</p>
              <p className="text-xs text-slate-400 mt-1">Click 'Create New Task' to assign tasks to staff.</p>
            </div>
          ) : (
            tasks.map((t) => (
              <div key={t.id} className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-400">{t.id}</span>
                    <h3 className="font-bold text-slate-900 text-sm mt-0.5">{t.title}</h3>
                    <p className="text-xs text-slate-600 mt-1">{t.description}</p>
                  </div>
                  <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold">
                    {t.status.replace("_", " ")}
                  </span>
                </div>

                {/* Timestamp Audit Trail */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] font-medium">
                  <div>
                    <span className="text-slate-400 block font-semibold">Assigned At</span>
                    <span className="text-slate-800 font-bold">{t.assigned_at}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Seen At</span>
                    <span className="text-slate-800 font-bold">{t.seen_at || "Not Viewed Yet"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Started At</span>
                    <span className="text-slate-800 font-bold">{t.started_at || "Not Started"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Completed At</span>
                    <span className="text-slate-800 font-bold">{t.completed_at || "Pending"}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
