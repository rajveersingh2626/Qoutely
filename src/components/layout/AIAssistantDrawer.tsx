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
    'Explain why occupancy 4002 was selected for Krishna & Co.',
    'What feature discounts apply for fire hydrants and electrical maintenance?',
    'Which EQ zone applies to Delhi NCR and what is the loading?',
    'What is the Category I Storage warranty for godowns?',
  ];

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      time: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');

    // Generate grounded response citing documents
    setTimeout(() => {
      let reply = '';
      let citation: ChatMessage['citation'] = { doc: 'AIFT 2001', section: 'General Rules' };

      const qLower = query.toLowerCase();

      if (qLower.includes('4002') || qLower.includes('krishna')) {
        reply = `Occupancy Code 4002 ("Storage of Category I hazardous Goods (Godowns & Silos)") was assigned because Krishna & Company stores packaged food products (Nestle) and edible cosmetics (Bajaj Almond Oil). Under AIFT 2001 Section VI, non-combustible packaged goods in sealed containers qualify for Category I storage subject to the mandatory warranty prohibiting goods from Categories II & III, coir waste, or caddies.`;
        citation = {
          doc: 'IIB Loss Cost Schedule 3 & AIFT 2001',
          section: 'Section VI - Storage Risks',
          pageOrRule: 'Code 4002 / Category 1 Rating',
        };
      } else if (qLower.includes('hydrant') || qLower.includes('discount') || qLower.includes('feature')) {
        reply = `Under the broker calculation rules:\n1. Operational Fire Hydrant / Sprinkler / Smoke Detector system: -10% discount on base flexa rate.\n2. Electrical Installations maintained to Indian Electricity Rules 1956: -10% discount.\n3. Plinth level >= 1.5 ft with storm drainage: -10% discount.\n4. 24x7 Security & CCTV: -10% discount.\n5. Past 3-year claim ratio <= 70%: -20% discount.\nNote: For Category 1 & 2 risks, total cumulative discount is capped at -50%.`;
        citation = {
          doc: 'Updated Calculator 07.02.2024',
          section: 'Feature Discount Matrix (Rows 20-29)',
          pageOrRule: 'Section III & IV Rating Schedule',
        };
      } else if (qLower.includes('eq') || qLower.includes('delhi') || qLower.includes('earthquake')) {
        reply = `Delhi NCR (including New Delhi, Gurugram, Noida, Faridabad, Ghaziabad) falls into Zone IV (Zone 2 under TAC tariff nomenclature). Under Section III (Commercial occupancies), the standard earthquake base rate is 0.15 per mille. For Section IV/VI risks, the base EQ rate is 0.25 per mille. For Category 1 occupancies, a 25% discount applies, bringing the adjusted EQ rate to 0.1875 per mille.`;
        citation = {
          doc: 'eq_zoning.pdf & IS 1893',
          section: 'Indian Seismic Zoning Map (Zone IV)',
          pageOrRule: 'Table of Seismic Loadings',
        };
      } else if (qLower.includes('warranty') || qLower.includes('category i')) {
        reply = `The Category I Warranty requires:\n"Warranted that during the currency of this policy, no hazardous goods listed under Category II, Category III, Coir waste, Coir fibre, and Caddies shall be stored or brought into the premises."\nBreach of this warranty alters the risk category from Category 1 (-25% discount) to Category 3 (+25% loading) or Category 4 (+160% loading).`;
        citation = {
          doc: 'AIFT 2001 Section VI',
          section: 'Special Storage Warranties',
          pageOrRule: 'Warranty WARR-CAT1',
        };
      } else {
        reply = `Based on the Indian Fire Tariff and IIB Schedule 3, risk evaluation requires verifying the occupancy code from the 289 scheduled classifications, applying category loading (-25% to +160%), adding EQ and STFI perils, and calculating premium per thousand (per mille) of total Sum Insured.`;
        citation = {
          doc: 'AIFT 2001 & IIB Schedule 3',
          section: 'General Rules & Rating Scale',
        };
      }

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
    }, 600);
  };

  if (!isAiDrawerOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              Tariff AI Assistant
              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold px-1.5 py-0.5 rounded-full">
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
                <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/80 flex items-start gap-1.5 text-[10px] text-indigo-700 dark:text-indigo-300 font-medium">
                  <BookOpen className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-indigo-500" />
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
            className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
