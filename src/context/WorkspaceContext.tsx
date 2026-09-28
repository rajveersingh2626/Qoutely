'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AuditLog,
  Client,
  Profile,
  Quote,
  UploadedDocument,
  UserRole,
  Workspace,
  WorkspaceMember,
} from '@/types/database';
import {
  SEED_AUDIT_LOGS,
  SEED_CLIENTS,
  SEED_PROFILES,
  SEED_QUOTES,
  SEED_WORKSPACES,
  SEED_WORKSPACE_MEMBERS,
} from '@/lib/supabase';

interface WorkspaceContextType {
  currentUser: Profile;
  currentWorkspace: Workspace;
  workspaces: Workspace[];
  members: WorkspaceMember[];
  userRole: UserRole;
  clients: Client[];
  quotes: Quote[];
  auditLogs: AuditLog[];
  documents: UploadedDocument[];
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isAiDrawerOpen: boolean;
  setIsAiDrawerOpen: (open: boolean) => void;
  switchWorkspace: (workspaceId: string) => void;
  switchUser: (userId: string) => void;
  createWorkspace: (data: Partial<Workspace>) => Workspace;
  updateWorkspace: (data: Partial<Workspace>) => void;
  inviteMember: (email: string, role: UserRole) => void;
  updateMemberRole: (userId: string, role: UserRole) => void;
  removeMember: (userId: string) => void;
  addClient: (client: Omit<Client, 'id' | 'created_at' | 'workspace_id'>) => Client;
  updateClient: (id: string, data: Partial<Client>) => void;
  addQuote: (quote: Omit<Quote, 'id' | 'quote_number' | 'created_at' | 'updated_at' | 'version' | 'workspace_id'>) => Quote;
  updateQuote: (id: string, data: Partial<Quote>) => void;
  duplicateQuote: (id: string) => Quote | null;
  addDocument: (doc: Omit<UploadedDocument, 'id' | 'created_at' | 'workspace_id'>) => UploadedDocument;
  logAction: (
    action: AuditLog['action'],
    resource_type: AuditLog['resource_type'],
    resource_id: string,
    details?: Record<string, any>
  ) => void;
  canManageFirm: boolean;
  canGenerateQuotes: boolean;
  canManageClients: boolean;
  canViewOnly: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from localStorage or seeds
  const [currentUser, setCurrentUser] = useState<Profile>(SEED_PROFILES[3]); // Default: Arjun Kapoor (Underwriter)
  const [workspaces, setWorkspaces] = useState<Workspace[]>(SEED_WORKSPACES);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace>(SEED_WORKSPACES[0]);
  const [members, setMembers] = useState<WorkspaceMember[]>(SEED_WORKSPACE_MEMBERS);
  const [clients, setClients] = useState<Client[]>(SEED_CLIENTS);
  const [quotes, setQuotes] = useState<Quote[]>(SEED_QUOTES);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(SEED_AUDIT_LOGS);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  // Compute current user role in current workspace
  const memberRecord = members.find(
    (m) => m.workspace_id === currentWorkspace.id && m.user_id === currentUser.id
  );
  const userRole: UserRole = memberRecord ? memberRecord.role : 'underwriter';

  // Role permissions
  const canManageFirm = userRole === 'super_admin' || userRole === 'brokerage_owner';
  const canManageClients = userRole !== 'viewer';
  const canGenerateQuotes = userRole !== 'viewer';
  const canViewOnly = userRole === 'viewer';

  // Keyboard shortcut for Command Palette (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const logAction = (
    action: AuditLog['action'],
    resource_type: AuditLog['resource_type'],
    resource_id: string,
    details?: Record<string, any>
  ) => {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      workspace_id: currentWorkspace.id,
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_email: currentUser.email,
      action,
      resource_type,
      resource_id,
      details,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const switchWorkspace = (workspaceId: string) => {
    const found = workspaces.find((w) => w.id === workspaceId);
    if (found) {
      setCurrentWorkspace(found);
      logAction('workspace.updated', 'workspace', found.id, {
        switched_to: found.name,
      });
    }
  };

  const switchUser = (userId: string) => {
    const found = SEED_PROFILES.find((p) => p.id === userId);
    if (found) {
      setCurrentUser(found);
    }
  };

  const createWorkspace = (data: Partial<Workspace>): Workspace => {
    const newWs: Workspace = {
      id: `ws-${Date.now()}`,
      name: data.name || 'New Brokerage Firm',
      slug: (data.name || 'new-firm').toLowerCase().replace(/\s+/g, '-'),
      logo_url: data.logo_url || '/logo-shield.svg',
      gst: data.gst || '07AAAAA0000A1Z5',
      address: data.address || 'New Delhi, India',
      phone: data.phone || '+91 11 0000 0000',
      email: data.email || 'info@firm.com',
      owner_id: currentUser.id,
      default_rules: {
        default_discretionary_discount: 10,
        default_brokerage_share: 15,
        auto_recommend_terrorism: false,
        default_eq_zone: 'Zone 2',
        irda_license_no: '999',
        cin_no: 'U66000DL2024PTC000001',
      },
      created_at: new Date().toISOString(),
    };

    setWorkspaces((prev) => [...prev, newWs]);
    setCurrentWorkspace(newWs);

    // Add creator as owner
    const newMember: WorkspaceMember = {
      workspace_id: newWs.id,
      user_id: currentUser.id,
      role: 'brokerage_owner',
      status: 'active',
      joined_at: new Date().toISOString(),
    };
    setMembers((prev) => [...prev, newMember]);

    logAction('workspace.updated', 'workspace', newWs.id, { created: newWs.name });
    return newWs;
  };

  const updateWorkspace = (data: Partial<Workspace>) => {
    const updated = { ...currentWorkspace, ...data };
    setCurrentWorkspace(updated);
    setWorkspaces((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
    logAction('workspace.updated', 'workspace', updated.id, data);
  };

  const inviteMember = (email: string, role: UserRole) => {
    const fakeId = `user-inv-${Date.now()}`;
    const newProfile: Profile = {
      id: fakeId,
      name: email.split('@')[0],
      email,
      created_at: new Date().toISOString(),
    };
    const newMember: WorkspaceMember = {
      workspace_id: currentWorkspace.id,
      user_id: fakeId,
      role,
      status: 'pending',
      joined_at: new Date().toISOString(),
      user: newProfile,
    };
    setMembers((prev) => [...prev, newMember]);
    logAction('member.invited', 'member', fakeId, { email, role });
  };

  const updateMemberRole = (userId: string, role: UserRole) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.workspace_id === currentWorkspace.id && m.user_id === userId
          ? { ...m, role }
          : m
      )
    );
    logAction('member.role_changed', 'member', userId, { new_role: role });
  };

  const removeMember = (userId: string) => {
    setMembers((prev) =>
      prev.filter(
        (m) => !(m.workspace_id === currentWorkspace.id && m.user_id === userId)
      )
    );
    logAction('member.removed', 'member', userId);
  };

  const addClient = (
    client: Omit<Client, 'id' | 'created_at' | 'workspace_id'>
  ): Client => {
    const newClient: Client = {
      ...client,
      id: `client-${Date.now()}`,
      workspace_id: currentWorkspace.id,
      created_at: new Date().toISOString(),
      total_quotes: 0,
      total_sum_insured: 0,
    };
    setClients((prev) => [newClient, ...prev]);
    logAction('client.created', 'client', newClient.id, { name: newClient.client_name });
    return newClient;
  };

  const updateClient = (id: string, data: Partial<Client>) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c))
    );
    logAction('client.updated', 'client', id, data);
  };

  const addQuote = (
    quoteData: Omit<Quote, 'id' | 'quote_number' | 'created_at' | 'updated_at' | 'version' | 'workspace_id'>
  ): Quote => {
    const count = quotes.length + 1;
    const pad = count.toString().padStart(4, '0');
    const quoteNum = `QTL-${currentWorkspace.slug.slice(0, 3).toUpperCase()}-2026-${pad}`;

    const newQuote: Quote = {
      ...quoteData,
      id: `quote-${Date.now()}`,
      quote_number: quoteNum,
      workspace_id: currentWorkspace.id,
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator_name: currentUser.name,
    };

    setQuotes((prev) => [newQuote, ...prev]);
    logAction('quote.created', 'quote', newQuote.id, {
      quote_number: quoteNum,
      client: newQuote.client_name,
      sum_insured: newQuote.sum_insured,
      premium: newQuote.total_premium,
    });
    return newQuote;
  };

  const updateQuote = (id: string, data: Partial<Quote>) => {
    setQuotes((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              ...data,
              version: q.version + 1,
              updated_at: new Date().toISOString(),
            }
          : q
      )
    );
    logAction('quote.updated', 'quote', id, data);
  };

  const duplicateQuote = (id: string): Quote | null => {
    const existing = quotes.find((q) => q.id === id);
    if (!existing) return null;

    const count = quotes.length + 1;
    const quoteNum = `QTL-${currentWorkspace.slug.slice(0, 3).toUpperCase()}-2026-${count.toString().padStart(4, '0')}`;

    const duplicated: Quote = {
      ...existing,
      id: `quote-${Date.now()}`,
      quote_number: quoteNum,
      status: 'draft',
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setQuotes((prev) => [duplicated, ...prev]);
    logAction('quote.created', 'quote', duplicated.id, {
      duplicated_from: existing.quote_number,
    });
    return duplicated;
  };

  const addDocument = (
    doc: Omit<UploadedDocument, 'id' | 'created_at' | 'workspace_id'>
  ): UploadedDocument => {
    const newDoc: UploadedDocument = {
      ...doc,
      id: `doc-${Date.now()}`,
      workspace_id: currentWorkspace.id,
      created_at: new Date().toISOString(),
    };
    setDocuments((prev) => [newDoc, ...prev]);
    logAction('proposal.uploaded', 'document', newDoc.id, {
      file_name: newDoc.file_name,
      type: newDoc.document_type,
    });
    return newDoc;
  };

  return (
    <WorkspaceContext.Provider
      value={{
        currentUser,
        currentWorkspace,
        workspaces,
        members,
        userRole,
        clients,
        quotes: quotes.filter((q) => q.workspace_id === currentWorkspace.id),
        auditLogs: auditLogs.filter((a) => a.workspace_id === currentWorkspace.id),
        documents: documents.filter((d) => d.workspace_id === currentWorkspace.id),
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isAiDrawerOpen,
        setIsAiDrawerOpen,
        switchWorkspace,
        switchUser,
        createWorkspace,
        updateWorkspace,
        inviteMember,
        updateMemberRole,
        removeMember,
        addClient,
        updateClient,
        addQuote,
        updateQuote,
        duplicateQuote,
        addDocument,
        logAction,
        canManageFirm,
        canGenerateQuotes,
        canManageClients,
        canViewOnly,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
