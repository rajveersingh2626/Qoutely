'use client';

import React, { useState, useEffect } from 'react';
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

  // WAI-ARIA: Escape key listener and body scroll locking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

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
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-modal-title"
            aria-describedby="demo-modal-desc"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-lg bg-[#FBF9F5] border border-[#121316]/10 rounded-3xl p-8 shadow-2xl z-10 overflow-hidden"
          >
            {/* Close button with aria-label */}
            <button
              onClick={onClose}
              aria-label="Close demo booking modal"
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 text-[#4B5563] hover:text-[#121316] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132]"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            {!submitted ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#15803d] animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0F5132]">
                    Exclusive Founder&apos;s Beta • Limited to 15 Brokerages
                  </span>
                </div>

                <h3 id="demo-modal-title" className="text-2xl sm:text-3xl font-black tracking-tight text-[#121316] mb-2">
                  Get 30 Days Free Founder Access
                </h3>
                <p id="demo-modal-desc" className="text-xs sm:text-sm text-[#4B5563] leading-relaxed mb-4">
                  We are offering 10–15 commercial brokerages 30 days of full unrestricted access to run live Fire, Fleet, Marine, and Health quote slips.
                </p>

                {/* Direct WhatsApp & Call Ribbon */}
                <div className="mb-5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="text-left">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                      Direct Founder Hotline
                    </div>
                    <div className="text-xs font-extrabold text-[#121316]">
                      +91 9315218284
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <a
                      href="https://wa.me/919315218284?text=Hi%20Qoutely%20Team%2C%20I%20am%20interested%20in%20the%20Exclusive%20Founder's%20Beta%20access%20for%20my%20brokerage."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F5132] hover:bg-[#146c43] text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      <span>WhatsApp Us</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href="tel:+919315218284"
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-emerald-300 text-emerald-800 text-xs font-bold transition-colors"
                    >
                      Call
                    </a>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="demo-name" className="block text-xs font-semibold text-[#121316] mb-1.5">
                      Full Name
                    </label>
                    <input
                      id="demo-name"
                      name="name"
                      type="text"
                      required
                      aria-required="true"
                      placeholder="Rohit Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#121316]/10 text-sm text-[#121316] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132]"
                    />
                  </div>

                  <div>
                    <label htmlFor="demo-email" className="block text-xs font-semibold text-[#121316] mb-1.5">
                      Work Email
                    </label>
                    <input
                      id="demo-email"
                      name="email"
                      type="email"
                      required
                      aria-required="true"
                      placeholder="rohit@capitalbrokers.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#121316]/10 text-sm text-[#121316] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="demo-firm" className="block text-xs font-semibold text-[#121316] mb-1.5">
                        Brokerage Firm
                      </label>
                      <input
                        id="demo-firm"
                        name="firm"
                        type="text"
                        placeholder="Capital Brokers"
                        value={formData.firm}
                        onChange={(e) => setFormData({ ...formData, firm: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#121316]/10 text-sm text-[#121316] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132]"
                      />
                    </div>
                    <div>
                      <label htmlFor="demo-volume" className="block text-xs font-semibold text-[#121316] mb-1.5">
                        Monthly Policies
                      </label>
                      <select
                        id="demo-volume"
                        name="volume"
                        value={formData.volume}
                        onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#121316]/10 text-sm text-[#121316] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132]"
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
                    className="w-full mt-2 py-3.5 px-6 rounded-full bg-[#0F5132] hover:bg-[#146c43] active:scale-[0.99] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132]"
                  >
                    <span>Request Demo &amp; Access</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>

                  <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-[#4B5563]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#15803d]" aria-hidden="true" />
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
                <div className="w-16 h-16 rounded-full bg-[#15803d]/15 flex items-center justify-center text-[#0F5132] mb-5">
                  <CheckCircle2 className="w-8 h-8 text-[#15803d]" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-black text-[#121316] mb-2">
                  Demo Request Received
                </h3>
                <p className="text-sm text-[#4B5563] max-w-sm mb-4">
                  We have allocated your brokerage slot. Our enterprise specialist will reach out within 2 hours.
                </p>
                <span className="text-xs font-mono text-[#0F5132] font-semibold bg-[#0F5132]/10 px-3 py-1 rounded-full border border-[#0F5132]/20 mb-4 inline-block">
                  Confirmation sent to {formData.email}
                </span>

                <div className="pt-2">
                  <a
                    href="https://wa.me/919315218284?text=Hi%20Qoutely%20Team%2C%20I%20just%20submitted%20the%20Founder's%20Beta%20form%20for%20my%20brokerage."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F5132] text-white text-xs font-bold hover:bg-[#146c43] transition-colors"
                  >
                    <span>Connect with Founder on WhatsApp (+91 9315218284)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
