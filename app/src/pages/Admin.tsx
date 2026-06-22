import { useState, useEffect, useCallback } from 'react';
import {
  Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { adminApi, type AdminStats, type RiskDistribution, type UserListItem, type AssessmentListItem } from '../services/admin';
import {
  Users, ClipboardCheck, Activity, TrendingUp, BrainCircuit,
  ShieldCheck, Frown, Wind, Zap, Loader2,
} from 'lucide-react';

const PIE_COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#dc2626'];

export default function Admin() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [riskDist, setRiskDist] = useState<RiskDistribution | null>(null);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [assessments, setAssessments] = useState<AssessmentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, riskRes, usersRes, assessmentsRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getRiskDistribution(),
        adminApi.getUsers(0, 10),
        adminApi.getAssessments(0, 10),
      ]);
      setStats(statsRes.data);
      setRiskDist(riskRes.data);
      setUsers(usersRes.data.users);
      setAssessments(assessmentsRes.data.assessments);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load admin data');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-[#5a5a5a]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  // Prepare pie chart data
  const depressionPieData = riskDist
    ? Object.entries(riskDist.depression).map(([name, value]) => ({ name, value }))
    : [];

  const anxietyPieData = riskDist
    ? Object.entries(riskDist.anxiety).map(([name, value]) => ({ name, value }))
    : [];

  const stressPieData = riskDist
    ? Object.entries(riskDist.stress).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ShieldCheck size={24} style={{ color: '#6366f1' }} />
        <div>
          <h1 className="text-2xl font-light tracking-tight text-[#e2e2e2]">Admin Dashboard</h1>
          <p className="text-sm text-[#5a5a5a]">Platform overview and analytics</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 glass-card-hover">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} style={{ color: '#6366f1' }} />
            <span className="text-xs text-[#5a5a5a] uppercase tracking-wider">Total Users</span>
          </div>
          <p className="font-mono text-2xl font-bold text-[#e2e2e2]">{stats.total_users}</p>
          <p className="text-xs text-[#5a5a5a] mt-1">{stats.active_users_today} active today</p>
        </div>

        <div className="glass-card p-5 glass-card-hover">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardCheck size={16} style={{ color: '#10b981' }} />
            <span className="text-xs text-[#5a5a5a] uppercase tracking-wider">Total Assessments</span>
          </div>
          <p className="font-mono text-2xl font-bold text-[#e2e2e2]">{stats.total_assessments}</p>
          <p className="text-xs text-[#5a5a5a] mt-1">{stats.assessments_today} today</p>
        </div>

        <div className="glass-card p-5 glass-card-hover">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={16} style={{ color: '#ec4899' }} />
            <span className="text-xs text-[#5a5a5a] uppercase tracking-wider">Avg Depression</span>
          </div>
          <p className="font-mono text-2xl font-bold" style={{ color: '#ec4899' }}>{stats.average_depression_score}</p>
          <p className="text-xs text-[#5a5a5a] mt-1">out of 42</p>
        </div>

        <div className="glass-card p-5 glass-card-hover">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} style={{ color: '#06b6d4' }} />
            <span className="text-xs text-[#5a5a5a] uppercase tracking-wider">Avg Stress</span>
          </div>
          <p className="font-mono text-2xl font-bold" style={{ color: '#06b6d4' }}>{stats.average_stress_score}</p>
          <p className="text-xs text-[#5a5a5a] mt-1">out of 42</p>
        </div>
      </div>

      {/* Risk Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Depression Distribution */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Frown size={16} style={{ color: '#6366f1' }} />
            <h3 className="text-sm font-medium text-[#e2e2e2]">Depression Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={depressionPieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {depressionPieData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#141414',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {depressionPieData.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                <span className="text-[10px] text-[#5a5a5a]">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Anxiety Distribution */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wind size={16} style={{ color: '#ec4899' }} />
            <h3 className="text-sm font-medium text-[#e2e2e2]">Anxiety Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={anxietyPieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {anxietyPieData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#141414',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {anxietyPieData.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                <span className="text-[10px] text-[#5a5a5a]">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stress Distribution */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} style={{ color: '#06b6d4' }} />
            <h3 className="text-sm font-medium text-[#e2e2e2]">Stress Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={stressPieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {stressPieData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#141414',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {stressPieData.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                <span className="text-[10px] text-[#5a5a5a]">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} style={{ color: '#6366f1' }} />
          <h3 className="text-sm font-medium text-[#e2e2e2]">Recent Users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 px-4 text-[#5a5a5a] font-medium uppercase text-xs tracking-wider">Name</th>
                <th className="text-left py-3 px-4 text-[#5a5a5a] font-medium uppercase text-xs tracking-wider">Email</th>
                <th className="text-center py-3 px-4 text-[#5a5a5a] font-medium uppercase text-xs tracking-wider">Role</th>
                <th className="text-center py-3 px-4 text-[#5a5a5a] font-medium uppercase text-xs tracking-wider">Assessments</th>
                <th className="text-right py-3 px-4 text-[#5a5a5a] font-medium uppercase text-xs tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 text-[#e2e2e2]">{u.full_name}</td>
                  <td className="py-3 px-4 text-[#5a5a5a]">{u.email}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: u.role === 'admin' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                        color: u.role === 'admin' ? '#6366f1' : '#10b981',
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono">{u.assessment_count}</td>
                  <td className="py-3 px-4 text-right text-[#5a5a5a]">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Assessments */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <BrainCircuit size={16} style={{ color: '#10b981' }} />
          <h3 className="text-sm font-medium text-[#e2e2e2]">Recent Assessments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 px-4 text-[#5a5a5a] font-medium uppercase text-xs tracking-wider">User</th>
                <th className="text-center py-3 px-4 text-[#5a5a5a] font-medium uppercase text-xs tracking-wider">Depression</th>
                <th className="text-center py-3 px-4 text-[#5a5a5a] font-medium uppercase text-xs tracking-wider">Anxiety</th>
                <th className="text-center py-3 px-4 text-[#5a5a5a] font-medium uppercase text-xs tracking-wider">Stress</th>
                <th className="text-right py-3 px-4 text-[#5a5a5a] font-medium uppercase text-xs tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((a) => (
                <tr key={a.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <p className="text-[#e2e2e2]">{a.user_name}</p>
                    <p className="text-xs text-[#5a5a5a]">{a.user_email}</p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono" style={{ color: '#6366f1' }}>{a.depression_score}</span>
                    <span className="text-xs ml-1 text-[#5a5a5a]">({a.depression_severity})</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono" style={{ color: '#ec4899' }}>{a.anxiety_score}</span>
                    <span className="text-xs ml-1 text-[#5a5a5a]">({a.anxiety_severity})</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono" style={{ color: '#06b6d4' }}>{a.stress_score}</span>
                    <span className="text-xs ml-1 text-[#5a5a5a]">({a.stress_severity})</span>
                  </td>
                  <td className="py-3 px-4 text-right text-[#5a5a5a]">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
