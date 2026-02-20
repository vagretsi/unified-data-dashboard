'use client';
import { useQuery } from '@tanstack/react-query';
import { Database, RefreshCw, Activity, Zap } from 'lucide-react';

export default function Dashboard() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['stats'],
    queryFn: () => fetch('/api/stats').then(res => res.json())
  });

  return (
    <main className="min-h-screen text-white p-8 md:p-12 selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-end mb-20 border-l-2 border-indigo-500 pl-6">
          <div>
            <h1 className="text-4xl font-light tracking-tighter italic uppercase">Systems Intelligence</h1>
            <p className="text-[10px] text-gray-500 tracking-[0.5em] uppercase mt-2">Node: SRV001 • PostgreSQL Active</p>
          </div>
          <button onClick={() => refetch()} className="text-[10px] uppercase text-gray-400 hover:text-white flex items-center gap-2">
            <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} /> Sync
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {isLoading ? (
            <p className="animate-pulse text-indigo-500 text-[10px] uppercase">Connecting...</p>
          ) : (
            data?.stats?.map((m: any) => (
              <div key={m.id} className="p-8 rounded-[32px] border border-white/5 bg-white/[0.02] hover:border-indigo-500/30 transition-all shadow-2xl">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[9px] text-gray-600 uppercase tracking-widest">{m.source}</span>
                  <div className={`w-2 h-2 rounded-full ${m.status === 'up' ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
                </div>
                <h3 className="text-gray-400 text-[11px] font-bold uppercase mb-1">{m.label}</h3>
                <span className="text-4xl font-light italic">{m.value}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
