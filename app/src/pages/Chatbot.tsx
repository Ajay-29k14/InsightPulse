import { useState, useEffect, useRef, useCallback } from 'react';
import { chatApi, type ChatHistoryItem } from '../services/chat';
import {
  Send, Trash2, Loader2, User, Bot, Sparkles,
} from 'lucide-react';

export default function Chatbot() {
  const [messages, setMessages] = useState<ChatHistoryItem[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await chatApi.getHistory();
      setMessages(response.data.messages);
    } catch {
      // Ignore errors
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Optimistically add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage, created_at: new Date().toISOString() }]);

    try {
      const response = await chatApi.sendMessage({ message: userMessage });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.response,
        created_at: response.data.timestamp,
      }]);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to get response. Please try again.';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${errorMsg}. Please try again or contact support if the issue persists.`,
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear your chat history?')) return;
    try {
      await chatApi.clearHistory();
      setMessages([]);
    } catch {
      // Ignore errors
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Suggested prompts
  const suggestions = [
    "What does my depression score mean?",
    "How can I manage anxiety daily?",
    "Tips for reducing stress at work",
    "When should I seek professional help?",
  ];

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-[#e2e2e2]">Mental Health Companion</h1>
          <p className="text-sm text-[#5a5a5a] mt-1">
            AI-powered support for your mental wellbeing
          </p>
        </div>
        <button
          onClick={handleClear}
          className="ip-btn-ghost flex items-center gap-2 text-xs text-[#5a5a5a] hover:text-red-400"
        >
          <Trash2 size={14} />
          Clear History
        </button>
      </div>

      {/* Chat Container */}
      <div
        className="flex-1 glass-card flex flex-col overflow-hidden"
        style={{ minHeight: 0 }}
      >
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {isHistoryLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={20} className="animate-spin text-[#5a5a5a]" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'rgba(16, 185, 129, 0.1)' }}
              >
                <Sparkles size={28} style={{ color: '#10b981' }} />
              </div>
              <h3 className="text-lg font-medium text-[#e2e2e2] mb-2">How can I help you today?</h3>
              <p className="text-sm text-[#5a5a5a] mb-6 max-w-md">
                I'm here to provide support, answer questions about mental health, and help you understand your assessment results.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(s);
                      inputRef.current?.focus();
                    }}
                    className="text-left p-3 rounded-lg text-sm text-[#5a5a5a] hover:text-[#e2e2e2] hover:bg-white/5 transition-all duration-150 border border-[#404040] hover:border-[#5a5a5a]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                    style={{ background: 'rgba(16, 185, 129, 0.15)' }}
                  >
                    <Bot size={16} style={{ color: '#10b981' }} />
                  </div>
                )}
                <div
                  className={`max-w-[75%] p-3 rounded-xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'text-[#e2e2e2]'
                      : 'text-[#e2e2e2]'
                  }`}
                  style={
                    msg.role === 'user'
                      ? { background: 'rgba(20, 20, 20, 0.9)', border: '1px solid rgba(255,255,255,0.08)' }
                      : { background: 'transparent' }
                  }
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-[10px] text-[#404040] mt-2">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {msg.role === 'user' && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                    style={{ background: 'rgba(99, 102, 241, 0.15)' }}
                  >
                    <User size={16} style={{ color: '#6366f1' }} />
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(16, 185, 129, 0.15)' }}
              >
                <Bot size={16} style={{ color: '#10b981' }} />
              </div>
              <div className="flex items-center gap-2 p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#5a5a5a] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-[#5a5a5a] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-[#5a5a5a] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div
          className="p-4 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="ip-input flex-1"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="p-3 rounded-lg transition-all duration-150 disabled:opacity-30"
              style={{
                background: input.trim() ? '#10b981' : 'rgba(255,255,255,0.05)',
                color: input.trim() ? '#050505' : '#5a5a5a',
              }}
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-[10px] text-[#404040] mt-2 text-center">
            This AI companion provides general support and is not a substitute for professional mental health care.
          </p>
        </div>
      </div>
    </div>
  );
}
