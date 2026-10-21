import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Bot,
  User,
  ArrowRight,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../services/api';
import { JourneyPlanResponse } from '../types';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPlan: (plan: JourneyPlanResponse) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  planData?: JourneyPlanResponse;
  engine?: string;
}

const SAMPLE_PROMPTS = [
  'I have an interview in Sarjapur at 10 AM. Starting from Majestic. Budget is limited. Need affordable breakfast.',
  'Exam in Cyber City Gurugram at 9:30 AM from New Delhi Station. Shortest travel time.',
  'Meeting in BKC Mumbai at 11 AM from CSMT. Which route has less walking?',
];

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose, onApplyPlan }) => {
  const { language, t } = useTranslation();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Namaste! I am your ThenStep Travel Companion. Tell me where you are starting from, where you need to reach, and your target arrival time. I will calculate your departure time with a safety buffer, find affordable tiffin spots, and recommend verified routes across India.',
      engine: 'rule_based',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const historyPayload = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await api.chatWithAssistant(text, historyPayload, language);

      const botMsg: Message = {
        role: 'assistant',
        content: res.reply,
        planData: res.plan_data,
        engine: res.engine,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an issue connecting to the travel planner service. Please verify backend connection.',
          engine: 'rule_based',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-gradient-to-r from-step-700 via-step-600 to-tealbrand-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base tracking-tight">{t('assistant.title')}</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Honest Data
                </span>
              </div>
              <p className="text-[11px] text-step-100">Natural language multi-modal journey planning across India</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-step-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm ${
                  msg.role === 'user'
                    ? 'bg-step-600 text-white rounded-tr-xs shadow-xs'
                    : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs shadow-xs'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                {/* Plan Preview Action Card */}
                {msg.planData && (
                  <div className="mt-3 p-3 bg-step-50 border border-step-200 rounded-xl text-slate-800">
                    <div className="font-bold text-xs text-step-800 mb-1 flex items-center justify-between">
                      <span>Verified Route Generated: {msg.planData.selected_route.title}</span>
                      <span className="font-black text-step-700">{msg.planData.selected_route.fare_label}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mb-2">
                      Departure: <span className="font-bold text-emerald-700">{msg.planData.arrival_calculator.suggested_departure_time}</span> •
                      Safety Buffer: <span className="font-bold">{msg.planData.arrival_calculator.safety_buffer_min} mins</span>
                    </div>
                    <button
                      onClick={() => {
                        onApplyPlan(msg.planData!);
                        onClose();
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-step-600 hover:bg-step-700 text-white text-xs font-bold flex items-center justify-center space-x-1 transition-all"
                    >
                      <span>Load Plan to Interactive Map & Guide</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {msg.engine && (
                  <div className="mt-2 text-[10px] text-slate-400 flex items-center space-x-1">
                    <Cpu className="w-3 h-3 text-slate-400" />
                    <span>Engine: {msg.engine === 'ollama_llm' ? 'Local Ollama LLM' : 'Rule-Based NLP'}</span>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-2 text-slate-400 text-xs pl-9">
              <Loader2 className="w-4 h-4 animate-spin text-step-500" />
              <span>Analyzing journey slots & querying Indian route network...</span>
            </div>
          )}
        </div>

        {/* Sample Prompt Chips */}
        <div className="px-4 py-2 border-t border-slate-200 bg-white">
          <div className="text-[10px] font-semibold text-slate-400 mb-1">Try asking:</div>
          <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {SAMPLE_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(prompt)}
                className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-step-50 hover:text-step-700 border border-slate-200 transition-colors text-slate-600"
              >
                "{prompt.slice(0, 42)}..."
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 bg-white flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('assistant.placeholder')}
            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 focus:border-step-500 focus:ring-2 focus:ring-step-200 text-xs sm:text-sm font-medium"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="p-2.5 rounded-xl bg-step-600 text-white font-bold hover:bg-step-700 disabled:opacity-50 transition-colors shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
