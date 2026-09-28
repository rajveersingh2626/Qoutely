'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Bot,
  ExternalLink,
  Flame,
  Send,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  citation?: {
    doc: string;
    section: string;
    pageOrRule?: string;
  };
  time: string;
}

export const AIAssistantDrawer: React.FC = () => {
  const { isAiDrawerOpen, setIsAiDrawerOpen, currentWorkspace } = useWorkspace();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: `Hello! I am Quotely's Underwriting Copilot. I analyze commercial insurance risks strictly using official Indian Tariff documents: All India Fire Tariff (AIFT 2001), IIB Loss Cost Schedule 3, and TAC Earthquake Zoning.\n\nEvery answer I provide cites source sections. Ask me anything about risk codes, clauses, EQ zones, or proposal classifications.`,
      citation: {
        doc: 'Tariff Advisory Committee & IIB',
        section: 'Official Indian Insurance Tariffs',
      },
      time: 'Just now',
    },
  ]);

  const quickQuestions = [
    'Explain why occupancy 1023 was selected for Acme Industries.',
    'What feature discounts apply for fire hydrants and electrical maintenance?',
    'Which EQ zone applies to Delhi NCR and what is the loading?',
    'What is the Category I Storage warranty for godowns?',
  ];

  const [isThinking, setIsThinking] = useState(false);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isThinking) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      time: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsThinking(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      const reply = data.reply || 'Analysis completed.';
      const citation = data.citation || { doc: 'AIFT 2001', section: 'General Rules' };

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: reply,
          citation,
          time: 'Just now',
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: 'Unable to reach Underwriting AI copilot at this moment. Please verify network or API keys.',
          time: 'Just now',
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  if (!isAiDrawerOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              Tariff AI Assistant
              <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold px-1.5 py-0.5 rounded-full">
                Strict Rules
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Grounded in AIFT 2001 & IIB Schedule 3
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsAiDrawerOpen(false)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[90%] rounded-2xl p-3 text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-xs border border-slate-200/80 dark:border-slate-700/80'
              }`}
            >
              <div className="whitespace-pre-line">{m.text}</div>

              {m.citation && (
                <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/80 flex items-start gap-1.5 text-[10px] text-blue-700 dark:text-blue-300 font-medium">
                  <BookOpen className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-blue-500" />
                  <div>
                    <span className="font-semibold">{m.citation.doc}:</span>{' '}
                    <span>{m.citation.section}</span>
                    {m.citation.pageOrRule && (
                      <span className="text-slate-500 dark:text-slate-400">
                        {' '}
                        ({m.citation.pageOrRule})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 px-1">{m.time}</span>
          </div>
        ))}

        {isThinking && (
          <div className="flex flex-col items-start">
            <div className="rounded-2xl p-3 text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-bl-xs flex items-center gap-2 border border-slate-200/80 dark:border-slate-700/80">
              <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-spin" />
              <span>Consulting AIFT 2001 & IIB Schedule 3 via Gemini 2.5 Flash...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <p className="text-[10px] font-semibold text-slate-400 mb-1.5">
          SUGGESTED TARIFF QUERIES
        </p>
        <div className="flex flex-wrap gap-1.5">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-[10px] text-left px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-1"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask about codes, clauses, discounts, EQ zones..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
