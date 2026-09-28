'use client';

import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Mail,
  Plus,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Header } from '@/components/layout/Header';
import { SEED_PROFILES } from '@/lib/supabase';
import { UserRole } from '@/types/database';

export default function TeamManagementPage() {
  const {
    members,
    currentWorkspace,
    canManageFirm,
    inviteMember,
    updateMemberRole,
    removeMember,
  } = useWorkspace();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('underwriter');

  const roleOptions: { role: UserRole; label: string; desc: string }[] = [
    {
      role: 'brokerage_owner',
      label: 'Brokerage Owner',
      desc: 'Can manage firm, invite users, delete quotes, modify settings.',
    },
    {
      role: 'admin',
      label: 'Admin',
      desc: 'Can manage clients, generate quotes, invite members.',
    },
    {
      role: 'underwriter',
      label: 'Underwriter',
      desc: 'Generate quotes, upload proposals, review tariff calculations.',
    },
    {
      role: 'sales_executive',
      label: 'Sales Executive',
      desc: 'Create proposal drafts and view assigned client accounts.',
    },
    {
      role: 'viewer',
      label: 'Viewer (Read-only)',
      desc: 'Audit view access only; cannot create quotes or edit parameters.',
    },
  ];

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    inviteMember(inviteEmail, inviteRole);
    setIsInviteModalOpen(false);
    setInviteEmail('');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <Header
        title="Team & Access Permissions"
        subtitle={`User governance and multi-tenant access control for ${currentWorkspace.name}`}
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Team Management' }]}
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Active Firm Members ({members.length})
            </h2>
            <p className="text-xs text-slate-500">
              Only invited broker personnel can access this isolated workspace.
            </p>
          </div>

          {canManageFirm && (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-emerald shadow-sm transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Team Member</span>
            </button>
          )}
        </div>

        {/* Team Members Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role & Access Tier</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {members.map((m) => {
                  const profile =
                    m.user || SEED_PROFILES.find((p) => p.id === m.user_id) || {
                      name: m.user_id,
                      email: m.user_id,
                      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                    };

                  return (
                    <tr
                      key={m.user_id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                            <img
                              src={
                                profile.avatar ||
                                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
                              }
                              alt={profile.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {profile.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {m.role === 'brokerage_owner' ? 'Workspace Owner' : 'Team Member'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-mono text-slate-600 dark:text-slate-400">
                        {profile.email}
                      </td>

                      <td className="p-4">
                        {canManageFirm && m.role !== 'brokerage_owner' ? (
                          <select
                            value={m.role}
                            onChange={(e) =>
                              updateMemberRole(m.user_id, e.target.value as UserRole)
                            }
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                          >
                            <option value="brokerage_owner">Brokerage Owner</option>
                            <option value="admin">Admin</option>
                            <option value="underwriter">Underwriter</option>
                            <option value="sales_executive">Sales Executive</option>
                            <option value="viewer">Viewer (Read-only)</option>
                          </select>
                        ) : (
                          <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                            {m.role.replace('_', ' ')}
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            m.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {m.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="p-4 text-slate-500 font-mono text-[11px]">
                        {new Date(m.joined_at).toLocaleDateString()}
                      </td>

                      <td className="p-4 text-right">
                        {canManageFirm && m.role !== 'brokerage_owner' && (
                          <button
                            onClick={() => removeMember(m.user_id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            title="Remove Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Roles & Permissions Reference Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Multi-Tenant Role Permissions Hierarchy
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            {roleOptions.map((ro) => (
              <div
                key={ro.role}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60"
              >
                <span className="font-bold text-slate-900 dark:text-white block mb-1">
                  {ro.label}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {ro.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Invite Member to Workspace
                </h3>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="broker.colleague@capitalinsurance.co.in"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assign User Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="admin">Admin (Manage Clients & Quotes)</option>
                  <option value="underwriter">Underwriter (Generate Quotes & Upload)</option>
                  <option value="sales_executive">Sales Executive (Create Proposals)</option>
                  <option value="viewer">Viewer (Read-only)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-emerald shadow-sm"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
