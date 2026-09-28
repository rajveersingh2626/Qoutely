'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  UserPlus,
  Mail,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Building2,
  ChevronRight,
  MoreVertical,
  Check,
  X,
  Users,
  KeyRound,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Header } from '@/components/layout/Header';
import { UserRole } from '@/types/database';

export default function WorkspaceTeamSettingsPage() {
  const {
    currentWorkspace,
    members,
    currentUser,
    userRole,
    canManageFirm,
    inviteMember,
    updateMemberRole,
    removeMember
  } = useWorkspace();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('underwriter');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filter members strictly for the current workspace (Software 1.0 Multi-Tenant Guard)
  const workspaceMembers = members.filter(
    (m) => m.workspace_id === currentWorkspace.id
  );

  const filteredMembers = workspaceMembers.filter((m) => {
    const matchesSearch =
      (m.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.user?.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const availableRoles: { role: UserRole; title: string; description: string; badgeColor: string }[] = [
    {
      role: 'brokerage_owner',
      title: 'Brokerage Owner',
      description: 'Full workspace authority: billing, team member provisioning, tariff customization, and quote deletion.',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    },
    {
      role: 'admin',
      title: 'Admin',
      description: 'Operations management: invite colleagues, approve proposal drafts, manage client accounts, and configure rules.',
      badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
    },
    {
      role: 'underwriter',
      title: 'Underwriter',
      description: 'Risk assessment: execute proposal OCR, run IIB tariff calculations, and generate statutory PDF quote slips.',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
    },
    {
      role: 'viewer',
      title: 'Viewer (Read-Only)',
      description: 'Auditing and compliance review: view issued quotes and client dossiers without editing privileges.',
      badgeColor: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
    }
  ];

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes('@')) {
      setNotification({ message: 'Please provide a valid corporate email address.', type: 'error' });
      return;
    }

    try {
      inviteMember(inviteEmail, selectedRole);
      setNotification({
        message: `Invitation successfully dispatched to ${inviteEmail} with role: ${selectedRole.replace('_', ' ').toUpperCase()}`,
        type: 'success'
      });
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({ message: err.message || 'Failed to dispatch invitation.', type: 'error' });
    }
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    if (!canManageFirm) {
      setNotification({ message: 'Only Brokerage Owners or Admins can modify permissions.', type: 'error' });
      return;
    }
    updateMemberRole(userId, newRole);
    setNotification({ message: 'User role updated successfully.', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRemoveMember = (userId: string, memberName?: string) => {
    if (!canManageFirm) {
      setNotification({ message: 'Only Brokerage Owners or Admins can remove members.', type: 'error' });
      return;
    }
    if (userId === currentUser.id) {
      setNotification({ message: 'You cannot remove your own active seat.', type: 'error' });
      return;
    }
    if (confirm(`Revoke workspace access for ${memberName || 'this user'}?`)) {
      removeMember(userId);
      setNotification({ message: 'Member seat revoked successfully.', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 font-sans">
      <Header
        title="Workspace Team & Access Control"
        subtitle={`Role-Based Access Control (RBAC) for ${currentWorkspace.name}`}
        breadcrumbs={[
          { label: 'Settings', href: '/app/settings' },
          { label: 'Team Governance' }
        ]}
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Notification Toast */}
        {notification && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold border ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tenant Summary & Seat Governance Banner */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {currentWorkspace.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  ID: {currentWorkspace.id}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-slate-500 dark:text-slate-400">
                <span>IRDAI Lic: <strong className="text-slate-700 dark:text-slate-200">{currentWorkspace.default_rules.irda_license_no}</strong></span>
                <span>•</span>
                <span>GST: <strong className="text-slate-700 dark:text-slate-200">{currentWorkspace.gst}</strong></span>
                <span>•</span>
                <span>Data Isolation: <strong className="text-emerald-600 dark:text-emerald-400">PostgreSQL RLS Active</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                {workspaceMembers.length} of 10 Seats Active
              </p>
              <p className="text-[10px] text-slate-500">Commercial Brokerage Tier</p>
            </div>
            {canManageFirm && (
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer w-full sm:w-auto"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite Team Member</span>
              </button>
            )}
          </div>
        </div>

        {/* Roles & Permissions Legend Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {availableRoles.map((r) => (
            <div
              key={r.role}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
            >
              <div>
                <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold border mb-2 ${r.badgeColor}`}>
                  {r.title}
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {r.description}
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span>Active in firm:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {workspaceMembers.filter((m) => m.role === r.role).length}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search active team members by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Roles ({workspaceMembers.length})</option>
              <option value="brokerage_owner">Brokerage Owners</option>
              <option value="admin">Admins</option>
              <option value="underwriter">Underwriters</option>
              <option value="viewer">Viewers</option>
            </select>
          </div>
        </div>

        {/* Active Members Table */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-6">Member Profile</th>
                  <th className="py-3.5 px-6">Assigned Role</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Joined Date</th>
                  <th className="py-3.5 px-6 text-right">Seat Governance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMembers.map((member) => {
                  const isCurrent = member.user_id === currentUser.id;
                  const roleConfig = availableRoles.find((r) => r.role === member.role) || {
                    badgeColor: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
                    title: member.role
                  };

                  return (
                    <tr
                      key={member.user_id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={member.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${member.user?.name || 'User'}`}
                            alt={member.user?.name || 'User Avatar'}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                              <span>{member.user?.name}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-slate-500 dark:text-slate-400 text-[11px] block">
                              {member.user?.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {canManageFirm && !isCurrent ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.user_id, e.target.value as UserRole)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="brokerage_owner">Brokerage Owner</option>
                            <option value="admin">Admin</option>
                            <option value="underwriter">Underwriter</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        ) : (
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold border ${roleConfig.badgeColor}`}>
                            {roleConfig.title}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      </td>

                      <td className="py-4 px-6 text-slate-500 font-mono text-xs">
                        {new Date(member.joined_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      <td className="py-4 px-6 text-right">
                        {canManageFirm && !isCurrent ? (
                          <button
                            onClick={() => handleRemoveMember(member.user_id, member.user?.name)}
                            title="Revoke Seat"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Protected</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Invite Colleague to {currentWorkspace.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Provision an underwriter or administrator seat with isolated tenancy.
                </p>
              </div>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Corporate Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="underwriter@brokeragefirm.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Designated Underwriting Role
                </label>
                <div className="space-y-2">
                  {availableRoles.map((r) => (
                    <label
                      key={r.role}
                      onClick={() => setSelectedRole(r.role)}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedRole === r.role
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500 text-slate-900 dark:text-white'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="inviteRole"
                        checked={selectedRole === r.role}
                        onChange={() => setSelectedRole(r.role)}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">{r.title}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${r.badgeColor}`}>
                            {r.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{r.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
                >
                  Dispatch Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
