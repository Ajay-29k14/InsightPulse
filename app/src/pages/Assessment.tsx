import { useState } from 'react';
import { useNavigate } from 'react-router';
import { assessmentApi, type AssessmentResult } from '../services/assessment';
import {
  ChevronLeft, ChevronRight, RotateCcw, CheckCircle2,
  Frown, Wind, Zap, Loader2, ArrowRight, BrainCircuit,
} from 'lucide-react';

const DASS21_QUESTIONS = [
  "I found it hard to wind down",
  "I was aware of dryness of my mouth",
  "I couldn't seem to experience any positive feeling at all",
  "I experienced breathing difficulty (eg, excessively rapid breathing, breathlessness in the absence of physical exertion)",
  "I found it difficult to work up the initiative to do things",
  "I tended to over-react to situations",
  "I experienced trembling (eg, in the hands)",
  "I felt that I was using a lot of nervous energy",
  "I was worried about situations in which I might panic and make a fool of myself",
  "I felt that I had nothing to look forward to",
  "I found myself getting agitated",
  "I found it difficult to relax",
  "I felt down-hearted and blue",
  "I was intolerant of anything that kept me from getting on with what I was doing",
  "I felt I was close to panic",
  "I was unable to become enthusiastic about anything",
  "I felt I wasn't worth much as a person",
  "I felt that I was rather touchy",
  "I was aware of the action of my heart in the absence of physical exertion (eg, sense of heart rate increase, heart missing a beat)",
  "I felt scared without any good reason",
  "I felt that life was meaningless",
];

const ANSWER_OPTIONS = [
  { value: 0, label: 'Did not apply to me at all' },
  { value: 1, label: 'Applied to me to some degree, or some of the time' },
  { value: 2, label: 'Applied to me to a considerable degree, or a good part of the time' },
  { value: 3, label: 'Applied to me very much, or most of the time' },
];

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

export default function Assessment() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(21).fill(-1));
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);

    if (currentQuestion < 20) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    }
  };

  const handleSubmit = async () => {
    if (answers.some(a => a === -1)) {
      setError('Please answer all questions before submitting.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await assessmentApi.submit({ answers });
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setAnswers(new Array(21).fill(-1));
    setResult(null);
    setError('');
  };

  const answeredCount = answers.filter(a => a !== -1).length;
  const progress = ((answeredCount) / 21) * 100;

  // Results view
  if (result) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <CheckCircle2 size={48} style={{ color: '#10b981' }} className="mx-auto mb-4" />
            <h2 className="text-2xl font-light tracking-tight text-[#e2e2e2] mb-2">Assessment Complete</h2>
            <p className="text-sm text-[#5a5a5a]">Here are your DASS-21 results</p>
          </div>

          {/* Score Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-xl" style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Frown size={16} style={{ color: '#6366f1' }} />
                <span className="text-xs text-[#5a5a5a]">Depression</span>
              </div>
              <p className="font-mono text-2xl font-bold" style={{ color: '#6366f1' }}>{result.depression_score}</p>
              <p className="text-xs mt-1 font-medium" style={{ color: getSeverityColor(result.depression_severity) }}>
                {result.depression_severity}
              </p>
            </div>

            <div className="p-4 rounded-xl" style={{ background: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Wind size={16} style={{ color: '#ec4899' }} />
                <span className="text-xs text-[#5a5a5a]">Anxiety</span>
              </div>
              <p className="font-mono text-2xl font-bold" style={{ color: '#ec4899' }}>{result.anxiety_score}</p>
              <p className="text-xs mt-1 font-medium" style={{ color: getSeverityColor(result.anxiety_severity) }}>
                {result.anxiety_severity}
              </p>
            </div>

            <div className="p-4 rounded-xl" style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Zap size={16} style={{ color: '#06b6d4' }} />
                <span className="text-xs text-[#5a5a5a]">Stress</span>
              </div>
              <p className="font-mono text-2xl font-bold" style={{ color: '#06b6d4' }}>{result.stress_score}</p>
              <p className="text-xs mt-1 font-medium" style={{ color: getSeverityColor(result.stress_severity) }}>
                {result.stress_severity}
              </p>
            </div>
          </div>

          {/* ML Predictions */}
          {(result.ml_depression_severity || result.ml_anxiety_severity || result.ml_stress_severity) && (
            <div className="p-4 rounded-xl mb-8" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
              <div className="flex items-center gap-2 mb-3">
                <BrainCircuit size={14} style={{ color: '#6366f1' }} />
                <span className="text-xs font-medium text-[#e2e2e2]">ML Model Predictions</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center text-xs">
                <div>
                  <p className="text-[#5a5a5a]">Depression</p>
                  <p style={{ color: getSeverityColor(result.ml_depression_severity || '') }}>{result.ml_depression_severity}</p>
                </div>
                <div>
                  <p className="text-[#5a5a5a]">Anxiety</p>
                  <p style={{ color: getSeverityColor(result.ml_anxiety_severity || '') }}>{result.ml_anxiety_severity}</p>
                </div>
                <div>
                  <p className="text-[#5a5a5a]">Stress</p>
                  <p style={{ color: getSeverityColor(result.ml_stress_severity || '') }}>{result.ml_stress_severity}</p>
                </div>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="p-4 rounded-lg mb-6 text-xs text-[#5a5a5a]" style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
            <strong className="text-[#f59e0b]">Important:</strong> This assessment is for informational purposes only and is not a clinical diagnosis. If you are experiencing severe symptoms, please consult a qualified mental health professional.
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={handleRestart} className="ip-btn-secondary flex-1 flex items-center justify-center gap-2 text-sm">
              <RotateCcw size={14} />
              Retake Assessment
            </button>
            <button onClick={() => navigate('/dashboard')} className="ip-btn flex-1 flex items-center justify-center gap-2 text-sm">
              View Dashboard
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Assessment wizard view
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-light tracking-tight text-[#e2e2e2]">DASS-21 Assessment</h1>
        <p className="text-sm text-[#5a5a5a] mt-1">
          Please read each statement and select the option that indicates how much the statement applied to you over the past week.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#5a5a5a]">Question {currentQuestion + 1} of 21</span>
          <span className="text-xs text-[#5a5a5a]">{answeredCount} answered</span>
        </div>
        <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, background: '#6366f1' }}
          />
        </div>
        {/* Segment indicators */}
        <div className="flex gap-1 mt-2">
          {Array.from({ length: 21 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQuestion(i)}
              className="flex-1 h-1 rounded-full transition-all duration-150"
              style={{
                background: answers[i] !== -1 ? '#6366f1' : i === currentQuestion ? 'rgba(99, 102, 241, 0.5)' : 'rgba(255,255,255,0.05)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Question Card */}
      <div className="glass-card p-8 mb-6">
        <p className="text-xs text-[#5a5a5a] mb-4 uppercase tracking-wider">Question {currentQuestion + 1}</p>
        <h2 className="text-xl font-medium text-[#e2e2e2] mb-8 leading-relaxed">
          {DASS21_QUESTIONS[currentQuestion]}
        </h2>

        {/* Answer Options */}
        <div className="space-y-3">
          {ANSWER_OPTIONS.map((option) => {
            const isSelected = answers[currentQuestion] === option.value;
            return (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                className={`
                  w-full text-left p-4 rounded-lg border transition-all duration-200
                  ${isSelected
                    ? 'border-[#6366f1]'
                    : 'border-[#404040] hover:border-[#5a5a5a] hover:bg-white/[0.02]'
                  }
                `}
                style={isSelected ? { background: 'rgba(99, 102, 241, 0.08)' } : {}}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{
                      borderColor: isSelected ? '#6366f1' : '#404040',
                    }}
                  >
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#6366f1' }} />}
                  </div>
                  <span className={`text-sm ${isSelected ? 'text-[#e2e2e2]' : 'text-[#5a5a5a]'}`}>
                    {option.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
          className="ip-btn-ghost flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        {currentQuestion < 20 ? (
          <button
            onClick={() => setCurrentQuestion(currentQuestion + 1)}
            className="ip-btn-ghost flex items-center gap-2"
          >
            Next
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || answers.some(a => a === -1)}
            className="ip-btn flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Assessment
                <CheckCircle2 size={16} />
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div
          className="mt-4 p-3 rounded-lg text-sm"
          style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
