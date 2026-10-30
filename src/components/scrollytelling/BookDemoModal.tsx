'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

interface BookDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookDemoModal: React.FC<BookDemoModalProps> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    firm: '',
    volume: '10-50',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
      setFormData({ name: '', email: '', firm: '', volume: '10-50' });
    }, 2800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-lg bg-[#FBF9F5] border border-[#121316]/10 rounded-3xl p-8 shadow-2xl z-10 overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 text-[#5A6065] hover:text-[#121316] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {!submitted ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00C853] animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0F5132]">
                    Priority Broker Access
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-[#121316] mb-3">
                  Experience Qoutely in Action.
                </h3>
                <p className="text-sm text-[#5A6065] leading-relaxed mb-6">
                  Schedule a 15-minute personalized walkthrough for your commercial brokerage team.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#121316] mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Rohit Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#121316]/10 text-sm text-[#121316] focus:outline-none focus:ring-2 focus:ring-[#0F5132]/20 focus:border-[#0F5132]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#121316] mb-1.5">
                      Work Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="rohit@capitalbrokers.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#121316]/10 text-sm text-[#121316] focus:outline-none focus:ring-2 focus:ring-[#0F5132]/20 focus:border-[#0F5132]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#121316] mb-1.5">
                        Brokerage Firm
                      </label>
                      <input
                        type="text"
                        placeholder="Capital Brokers"
                        value={formData.firm}
                        onChange={(e) => setFormData({ ...formData, firm: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#121316]/10 text-sm text-[#121316] focus:outline-none focus:ring-2 focus:ring-[#0F5132]/20 focus:border-[#0F5132]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#121316] mb-1.5">
                        Monthly Policies
                      </label>
                      <select
                        value={formData.volume}
                        onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#121316]/10 text-sm text-[#121316] focus:outline-none focus:ring-2 focus:ring-[#0F5132]/20 focus:border-[#0F5132]"
                      >
                        <option value="1-10">1 - 10 policies</option>
                        <option value="10-50">10 - 50 policies</option>
                        <option value="50-200">50 - 200 policies</option>
                        <option value="200+">200+ policies</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-3.5 px-6 rounded-full bg-[#0F5132] hover:bg-[#146c43] active:scale-[0.99] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <span>Request Demo & Access</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-[#5A6065]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#00C853]" />
                    <span>No credit card required. Dedicated onboarding specialist.</span>
                  </div>
                </form>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-full bg-[#00C853]/15 flex items-center justify-center text-[#0F5132] mb-5">
                  <CheckCircle2 className="w-8 h-8 text-[#00C853]" />
                </div>
                <h3 className="text-2xl font-black text-[#121316] mb-2">
                  Demo Request Received
                </h3>
                <p className="text-sm text-[#5A6065] max-w-sm mb-4">
                  We have allocated your brokerage slot. Our enterprise specialist will reach out within 2 hours.
                </p>
                <span className="text-xs font-mono text-[#0F5132] font-semibold bg-[#00C853]/10 px-3 py-1 rounded-full">
                  Confirmation sent to {formData.email}
                </span>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
