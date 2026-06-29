import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { Activity, Clock, AlertTriangle, Globe, BarChart3, Loader2 } from 'lucide-react';

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const host = window.location.hostname;
        const port = host === 'localhost' || host === '127.0.0.1' ? ':5000' : '';
        const protocol = window.location.protocol;
        const apiUrl = `${protocol}//${host}${port}/api/metrics`;

        const res = await fetch(apiUrl);
        if (!res.ok) {
          throw new Error('Failed to retrieve analytics metrics.');
        }
        const data = await res.json();
        setMetrics(data);
      } catch (err) {
        console.error('[Analytics Fetch Error]', err);
        setError(err.message || 'Could not fetch system metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#080b11] text-slate-200 select-none">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Compiling Chamber Analytics...
        </p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="w-screen min-h-screen bg-[#080b11] text-slate-100 flex flex-col items-center justify-center p-6 pt-24 select-none">
        <div className="glass-panel rounded-2xl p-8 border border-red-500/20 max-w-md w-full text-center flex flex-col items-center shadow-2xl">
          <AlertTriangle className="w-8 h-8 text-red-500 mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">Metrics Offline</h3>
          <p className="text-sm text-slate-400 mb-4">{error || 'Could not aggregate data.'}</p>
        </div>
      </div>
    );
  }

  // Format Win-Rate Split Data for PieChart
  const winData = [
    { name: 'Agent A (Optimist)', value: metrics.win_split.A || 0, color: '#ff5e57' },
    { name: 'Agent B (Risk Analyst)', value: metrics.win_split.B || 0, color: '#00d2d3' },
    { name: 'Draw / Tied', value: metrics.win_split.Draw || 0, color: '#7f8c8d' }
  ].filter(d => d.value > 0);

  // Format Languages Data for BarChart
  const langData = Object.entries(metrics.languages || {}).map(([lang, count]) => ({
    name: lang,
    count: count
  }));

  const avgSeconds = (metrics.avg_duration_ms / 1000).toFixed(1);

  return (
    <div className="w-screen min-h-screen bg-[#080b11] text-slate-100 flex flex-col font-sans select-none pt-24 pb-12 px-6 overflow-y-auto">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col">
        {/* Page Title */}
        <div className="mb-8 flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight font-display bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent uppercase">
              System Analytics
            </h1>
            <p className="text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-widest mt-1">
              Live statistics of the debate engine execution metrics
            </p>
          </div>
        </div>

        {/* 1. Metric Numeric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Card 1: Total debates */}
          <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 text-white/[0.02] font-black text-7xl select-none">
              #
            </div>
            <div className="flex items-center gap-3 text-slate-400 mb-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Total Debates Run</span>
            </div>
            <p className="text-3xl font-black text-white font-mono">
              {metrics.total_debates}
            </p>
          </div>

          {/* Card 2: Average Duration */}
          <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 text-white/[0.02] font-black text-7xl select-none">
              S
            </div>
            <div className="flex items-center gap-3 text-slate-400 mb-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Avg Completion Time</span>
            </div>
            <p className="text-3xl font-black text-white font-mono">
              {avgSeconds} <span className="text-sm font-semibold text-slate-400 uppercase">sec</span>
            </p>
          </div>

          {/* Card 3: Unhandled Errors */}
          <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 text-white/[0.02] font-black text-7xl select-none">
              !
            </div>
            <div className="flex items-center gap-3 text-slate-400 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest">API / System Errors</span>
            </div>
            <p className="text-3xl font-black text-red-400 font-mono">
              {metrics.error_count}
            </p>
          </div>
        </div>

        {/* 2. Recharts Diagrams */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Win Split Pie Chart */}
          <div className="glass-panel rounded-2xl p-6 md:p-8 border border-white/5 shadow-lg flex flex-col">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-6 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
              Agent Head-to-Head Win Rate
            </h3>

            {winData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-500 text-xs">
                No debate records available to plot win splits.
              </div>
            ) : (
              <div className="flex-1 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full h-48 sm:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={winData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {winData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#090d16', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }} 
                        labelStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3.5">
                  {winData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: d.color }} />
                      <div className="flex-1 flex justify-between">
                        <span className="text-slate-400 font-medium">{d.name}</span>
                        <span className="text-slate-200 font-bold font-mono">{d.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Languages Used Bar Chart */}
          <div className="glass-panel rounded-2xl p-6 md:p-8 border border-white/5 shadow-lg flex flex-col">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-6 flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              Debates Language Distribution
            </h3>

            {langData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-500 text-xs">
                No language records available to plot.
              </div>
            ) : (
              <div className="flex-1 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={langData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#090d16', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                      itemStyle={{ color: '#818cf8' }}
                    />
                    <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
