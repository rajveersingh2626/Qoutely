'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building,
  CheckCircle2,
  FileText,
  MapPin,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Header } from '@/components/layout/Header';

export default function NewWorkspacePage() {
  const router = useRouter();
  const { createWorkspace } = useWorkspace();

  const [formData, setFormData] = useState({
    name: '',
    gst: '',
    address: '',
    phone: '',
    email: '',
    irda_license_no: '',
    cin_no: '',
    default_discretionary_discount: 10,
    default_eq_zone: 'Zone 2',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      const created = createWorkspace({
        name: formData.name,
        gst: formData.gst,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        default_rules: {
          default_discretionary_discount: Number(formData.default_discretionary_discount),
          default_brokerage_share: 15,
          auto_recommend_terrorism: false,
          default_eq_zone: formData.default_eq_zone,
          irda_license_no: formData.irda_license_no || 'IRDA/DB/999/2026',
          cin_no: formData.cin_no || 'U66010DL2024PTC998877',
        },
      });
      router.push('/dashboard');
    }, 500);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <Header
        title="Onboard Brokerage Firm"
        subtitle="Set up a new isolated multi-tenant workspace with custom regulatory rules"
        breadcrumbs={[
          { label: 'Workspaces', href: '/workspaces' },
          { label: 'New Firm' },
        ]}
      />

      <div className="p-6 md:p-8 max-w-3xl mx-auto w-full">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Brokerage Firm Profile
              </h2>
              <p className="text-xs text-slate-500">
                All quotes generated inside this workspace will be watermarked with these details.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Brokerage Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Royal Shield Insurance Brokers Pvt Ltd"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  GST Identification Number (GSTIN) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.gst}
                  onChange={(e) => setFormData({ ...formData, gst: e.target.value.toUpperCase() })}
                  placeholder="e.g. 07AABC1234F1Z5"
                  maxLength={15}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Registered Office Address *
              </label>
              <textarea
                rows={2}
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Suite No., Tower, Commercial Complex, City, State, PIN"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  IRDAI Broker License Number
                </label>
                <input
                  type="text"
                  value={formData.irda_license_no}
                  onChange={(e) => setFormData({ ...formData, irda_license_no: e.target.value })}
                  placeholder="e.g. 236 or IRDA/DB/780"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Corporate CIN Number
                </label>
                <input
                  type="text"
                  value={formData.cin_no}
                  onChange={(e) => setFormData({ ...formData, cin_no: e.target.value.toUpperCase() })}
                  placeholder="e.g. U74999DL2003PTC119576"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Official Brokerage Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="underwriting@brokerage.com"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Official Phone / Landline
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="011-45631850"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Default Calculation Rules */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-3">
                Default Calculation Rules
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Default Discretionary Broker Discount (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    value={formData.default_discretionary_discount}
                    onChange={(e) =>
                      setFormData({ ...formData, default_discretionary_discount: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Default Earthquake Risk Zone
                  </label>
                  <select
                    value={formData.default_eq_zone}
                    onChange={(e) => setFormData({ ...formData, default_eq_zone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Zone 1">Zone 1 / Zone V (Highest Seismic Hazard)</option>
                    <option value="Zone 2">Zone 2 / Zone IV (Delhi NCR, Ahmedabad, Punjab)</option>
                    <option value="Zone 3">Zone 3 / Zone III (Mumbai, Pune, Chennai)</option>
                    <option value="Zone 4">Zone 4 / Zone II (Bengaluru, Hyderabad, Low Risk)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-emerald shadow-sm transition-all"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Create Workspace</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
