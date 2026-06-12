import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { assessmentApi, type AssessmentResult, type AssessmentHistoryItem } from '../services/assessment';
import {
  TrendingUp, AlertTriangle, Download, ClipboardList, Brain,
  Frown, Zap, Wind, Calendar, ChevronRight,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'Normal': return '#10b981';
    case 'Mild': return '#f59e0b';
    case 'Moderate': return '#f97316';
    case 'Severe': return '#ef4444';
    case 'Extremely Severe': return '#dc2626';
    default: return '#5a5a5a';
  }
}

function getSeverityBg(severity: string): string {
  switch (severity) {
    case 'Normal': return 'rgba(16, 185, 129, 0.1)';
    case 'Mild': return 'rgba(245, 158, 11, 0.1)';
    case 'Moderate': return 'rgba(249, 115, 22, 0.1)';
    case 'Severe': return 'rgba(239, 68, 68, 0.1)';
    case 'Extremely Severe': return 'rgba(220, 38, 38, 0.1)';
    default: return 'rgba(90, 90, 90, 0.1)';
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  const [latestResult, setLatestResult] = useState<AssessmentResult | null>(null);
  const [history, setHistory] = useState<AssessmentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [latestRes, historyRes] = await Promise.all([
        assessmentApi.getLatest(),
        assessmentApi.getHistory(),
      ]);
      setLatestResult(latestRes.data);
      setHistory(historyRes.data.assessments);
    } catch {
      // No assessments yet
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Prepare chart data - reverse for chronological order
  const chartData = [...history].reverse().map((h, i) => ({
    name: `Assessment ${i + 1}`,
    date: new Date(h.created_at).toLocaleDateString(),
    Depression: h.depression_score,
    Anxiety: h.anxiety_score,
    Stress: h.stress_score,
  }));

  // Radar chart data from latest result
  const radarData = latestResult ? [
    { subject: 'Depression', A: latestResult.depression_score, fullMark: 42 },
    { subject: 'Anxiety', A: latestResult.anxiety_score, fullMark: 42 },
    { subject: 'Stress', A: latestResult.stress_score, fullMark: 42 },
  ] : [];

  const generatePDF = async () => {
    if (!reportRef.current || !latestResult) return;
    setIsGeneratingPDF(true);

    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`InsightPulse_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (!latestResult) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="glass-card p-12 text-center">
          <Brain size={48} style={{ color: '#6366f1' }} className="mx-auto mb-4" />
          <h2 className="text-xl font-medium text-[#e2e2e2] mb-2">Welcome to InsightPulse</h2>
          <p className="text-sm text-[#5a5a5a] mb-6">
            You haven't taken an assessment yet. Start your first DASS-21 assessment to see your mental health insights.
          </p>
          <button onClick={() => navigate('/assessment')} className="ip-btn inline-flex items-center gap-2">
            <ClipboardList size={16} />
            Start Assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-[#e2e2e2]">Dashboard</h1>
          <p className="text-sm text-[#5a5a5a] mt-1">
            Your mental health overview and assessment history
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={generatePDF}
            disabled={isGeneratingPDF}
            className="ip-btn-secondary flex items-center gap-2 text-sm"
          >
            {isGeneratingPDF ? (
              <>
                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download size={14} />
                Download Report
              </>
            )}
          </button>
          <button
            onClick={() => navigate('/assessment')}
            className="ip-btn flex items-center gap-2 text-sm"
          >
            <ClipboardList size={14} />
            New Assessment
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Depression Card */}
        <div className="glass-card p-6 glass-card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Frown size={18} style={{ color: '#6366f1' }} />
              <span className="text-sm text-[#5a5a5a]">Depression</span>
            </div>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                color: getSeverityColor(latestResult.depression_severity),
                background: getSeverityBg(latestResult.depression_severity),
              }}
            >
              {latestResult.depression_severity}
            </span>
          </div>
          <p className="font-mono text-3xl font-bold" style={{ color: '#6366f1' }}>
            {latestResult.depression_score}
          </p>
          <p className="text-xs text-[#5a5a5a] mt-1">out of 42</p>
          {latestResult.ml_depression_severity && (
            <p className="text-xs text-[#5a5a5a] mt-2">
              ML Prediction: <span className="text-[#e2e2e2]">{latestResult.ml_depression_severity}</span>
            </p>
          )}
        </div>

        {/* Anxiety Card */}
        <div className="glass-card p-6 glass-card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wind size={18} style={{ color: '#ec4899' }} />
              <span className="text-sm text-[#5a5a5a]">Anxiety</span>
            </div>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                color: getSeverityColor(latestResult.anxiety_severity),
                background: getSeverityBg(latestResult.anxiety_severity),
              }}
            >
              {latestResult.anxiety_severity}
            </span>
          </div>
          <p className="font-mono text-3xl font-bold" style={{ color: '#ec4899' }}>
            {latestResult.anxiety_score}
          </p>
          <p className="text-xs text-[#5a5a5a] mt-1">out of 42</p>
          {latestResult.ml_anxiety_severity && (
            <p className="text-xs text-[#5a5a5a] mt-2">
              ML Prediction: <span className="text-[#e2e2e2]">{latestResult.ml_anxiety_severity}</span>
            </p>
          )}
        </div>

        {/* Stress Card */}
        <div className="glass-card p-6 glass-card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap size={18} style={{ color: '#06b6d4' }} />
              <span className="text-sm text-[#5a5a5a]">Stress</span>
            </div>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                color: getSeverityColor(latestResult.stress_severity),
                background: getSeverityBg(latestResult.stress_severity),
              }}
            >
              {latestResult.stress_severity}
            </span>
          </div>
          <p className="font-mono text-3xl font-bold" style={{ color: '#06b6d4' }}>
            {latestResult.stress_score}
          </p>
          <p className="text-xs text-[#5a5a5a] mt-1">out of 42</p>
          {latestResult.ml_stress_severity && (
            <p className="text-xs text-[#5a5a5a] mt-2">
              ML Prediction: <span className="text-[#e2e2e2]">{latestResult.ml_stress_severity}</span>
            </p>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend Chart */}
        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} style={{ color: '#6366f1' }} />
            <h3 className="text-sm font-medium text-[#e2e2e2]">Assessment Trends</h3>
          </div>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="depGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="anxGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="strGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#404040" fontSize={11} />
                <YAxis stroke="#404040" fontSize={11} domain={[0, 42]} />
                <Tooltip
                  contentStyle={{
                    background: '#141414',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#5a5a5a' }}
                />
                <Area type="monotone" dataKey="Depression" stroke="#6366f1" fill="url(#depGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="Anxiety" stroke="#ec4899" fill="url(#anxGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="Stress" stroke="#06b6d4" fill="url(#strGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-sm text-[#5a5a5a]">
              Take more assessments to see trends
            </div>
          )}
        </div>

        {/* Radar Chart */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
            <h3 className="text-sm font-medium text-[#e2e2e2]">Current Profile</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.05)" />
              <PolarAngleAxis dataKey="subject" stroke="#5a5a5a" fontSize={11} />
              <PolarRadiusAxis angle={90} domain={[0, 42]} stroke="#404040" fontSize={10} />
              <Radar
                name="Score"
                dataKey="A"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Assessment History */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} style={{ color: '#10b981' }} />
          <h3 className="text-sm font-medium text-[#e2e2e2]">Assessment History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 px-4 text-[#5a5a5a] font-medium uppercase text-xs tracking-wider">Date</th>
                <th className="text-center py-3 px-4 text-[#5a5a5a] font-medium uppercase text-xs tracking-wider">Depression</th>
                <th className="text-center py-3 px-4 text-[#5a5a5a] font-medium uppercase text-xs tracking-wider">Anxiety</th>
                <th className="text-center py-3 px-4 text-[#5a5a5a] font-medium uppercase text-xs tracking-wider">Stress</th>
                <th className="text-right py-3 px-4 text-[#5a5a5a] font-medium uppercase text-xs tracking-wider"></th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 text-[#e2e2e2]">
                    {new Date(h.created_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono" style={{ color: '#6366f1' }}>{h.depression_score}</span>
                    <span className="text-xs ml-2 px-1.5 py-0.5 rounded" style={{ color: getSeverityColor(h.depression_severity), background: getSeverityBg(h.depression_severity) }}>
                      {h.depression_severity}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono" style={{ color: '#ec4899' }}>{h.anxiety_score}</span>
                    <span className="text-xs ml-2 px-1.5 py-0.5 rounded" style={{ color: getSeverityColor(h.anxiety_severity), background: getSeverityBg(h.anxiety_severity) }}>
                      {h.anxiety_severity}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono" style={{ color: '#06b6d4' }}>{h.stress_score}</span>
                    <span className="text-xs ml-2 px-1.5 py-0.5 rounded" style={{ color: getSeverityColor(h.stress_severity), background: getSeverityBg(h.stress_severity) }}>
                      {h.stress_severity}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <ChevronRight size={14} className="inline text-[#404040]" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden PDF Report Template */}
      <div ref={reportRef} style={{ position: 'absolute', left: '-9999px', width: '800px' }}>
        <div style={{ padding: '40px', background: '#ffffff', color: '#1a1a1a', fontFamily: 'Inter, sans-serif' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #6366f1', paddingBottom: '20px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 300, color: '#6366f1', marginBottom: '8px' }}>InsightPulse</h1>
            <p style={{ fontSize: '14px', color: '#5a5a5a' }}>Mental Health Assessment Report</p>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <p style={{ fontSize: '12px', color: '#5a5a5a' }}>
              Generated on: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '20px', color: '#1a1a1a' }}>DASS-21 Assessment Results</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
            {[
              { label: 'Depression', score: latestResult?.depression_score, severity: latestResult?.depression_severity, color: '#6366f1' },
              { label: 'Anxiety', score: latestResult?.anxiety_score, severity: latestResult?.anxiety_severity, color: '#ec4899' },
              { label: 'Stress', score: latestResult?.stress_score, severity: latestResult?.stress_severity, color: '#06b6d4' },
            ].map((item) => (
              <div key={item.label} style={{ border: `2px solid ${item.color}`, borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#5a5a5a', marginBottom: '8px' }}>{item.label}</p>
                <p style={{ fontSize: '36px', fontWeight: 'bold', color: item.color, marginBottom: '8px' }}>{item.score}</p>
                <p style={{ fontSize: '12px', color: item.color, fontWeight: 500 }}>{item.severity}</p>
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px', color: '#1a1a1a' }}>Severity Reference</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '30px' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Scale</th>
                <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>Normal</th>
                <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>Mild</th>
                <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>Moderate</th>
                <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>Severe</th>
                <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>Extremely Severe</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>Depression</td>
                <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>0-9</td>
                <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>10-13</td>
                <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>14-20</td>
                <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>21-27</td>
                <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>28+</td>
              </tr>
              <tr>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>Anxiety</td>
                <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>0-7</td>
                <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>8-9</td>
                <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>10-14</td>
                <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>15-19</td>
                <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>20+</td>
              </tr>
              <tr>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>Stress</td>
                <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>0-14</td>
                <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>15-18</td>
                <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>19-25</td>
                <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>26-33</td>
                <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>34+</td>
              </tr>
            </tbody>
          </table>

          <div style={{ borderTop: '1px solid #ddd', paddingTop: '20px', fontSize: '11px', color: '#5a5a5a' }}>
            <p><strong>Disclaimer:</strong> This report is generated from the DASS-21 self-report questionnaire and is for informational purposes only. It is not a clinical diagnosis. If you are experiencing severe symptoms, please consult a qualified mental health professional.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
