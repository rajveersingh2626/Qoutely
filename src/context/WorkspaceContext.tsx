'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  supabase,
  isSupabaseConfigured,
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
  deleteClient: (id: string) => Promise<void>;
  addQuote: (quote: Omit<Quote, 'id' | 'quote_number' | 'created_at' | 'updated_at' | 'version' | 'workspace_id'>) => Quote;
  updateQuote: (id: string, data: Partial<Quote>) => void;
  deleteQuote: (id: string) => Promise<void>;
  duplicateQuote: (id: string) => Quote | null;
  addDocument: (doc: Omit<UploadedDocument, 'id' | 'created_at' | 'workspace_id'>) => UploadedDocument;
  logAction: (
    action: AuditLog['action'],
    resource_type: AuditLog['resource_type'],
    resource_id: string,
    details?: Record<string, any>
  ) => void;
  refreshData: () => Promise<void>;
  canManageFirm: boolean;
  canGenerateQuotes: boolean;
  canManageClients: boolean;
  canViewOnly: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state from SEED constants for instantaneous render
  const [currentUser, setCurrentUser] = useState<Profile>(SEED_PROFILES[0]); // Default: Test Administrator (Super Admin)
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
  const userRole: UserRole = memberRecord ? memberRecord.role : 'super_admin';

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

  // Live Supabase Fetch
  const refreshData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      return;
    }
    try {
      // 1. Workspaces
      const { data: wsData, error: wsErr } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: false });

      if (!wsErr && wsData && wsData.length > 0) {
        setWorkspaces(wsData);
        const match = wsData.find((w: Workspace) => w.id === currentWorkspace.id);
        if (match) setCurrentWorkspace(match);
      }

      // 2. Members
      const { data: memData, error: memErr } = await supabase
        .from('workspace_members')
        .select('*, user:profiles(*)');

      if (!memErr && memData && memData.length > 0) {
        setMembers(memData);
      }

      // 3. Clients
      const { data: clientData, error: clientErr } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (!clientErr && clientData && clientData.length > 0) {
        setClients(clientData);
      }

      // 4. Quotes
      const { data: quoteData, error: quoteErr } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!quoteErr && quoteData && quoteData.length > 0) {
        setQuotes(quoteData);
      }

      // 5. Audit Logs
      const { data: auditData, error: auditErr } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (!auditErr && auditData && auditData.length > 0) {
        setAuditLogs(auditData);
      }

      // 6. Uploaded Documents
      const { data: docData, error: docErr } = await supabase
        .from('uploaded_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (!docErr && docData && docData.length > 0) {
        setDocuments(docData);
      }
    } catch (err) {
      console.warn('Supabase synchronization error:', err);
    }
  }, [currentWorkspace.id]);

  useEffect(() => {
    refreshData();
    // Hydrate current user from server session cookie
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          if (data.workspace) setCurrentWorkspace(data.workspace);
        }
      })
      .catch(() => {});
  }, [refreshData]);

  const logAction = (
    action: AuditLog['action'],
    resource_type: AuditLog['resource_type'],
    resource_id: string,
    details?: Record<string, any>
  ) => {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const newLog: AuditLog = {
      id,
      workspace_id: currentWorkspace.id,
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_email: currentUser.email,
      action,
      resource_type,
      resource_id,
      details,
      timestamp,
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    // Async write to Supabase
    supabase.from('audit_logs').insert({
      id: newLog.id,
      workspace_id: newLog.workspace_id,
      user_id: newLog.user_id,
      user_name: newLog.user_name,
      user_email: newLog.user_email,
      action: newLog.action,
      resource_type: newLog.resource_type,
      resource_id: newLog.resource_id,
      details: newLog.details,
      timestamp: newLog.timestamp,
    }).then(({ error }) => {
      if (error) console.error('Failed to persist audit log to Supabase:', error);
    });
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
    const found = SEED_PROFILES.find((p) => p.id === userId) || SEED_PROFILES[0];
    if (found) {
      setCurrentUser(found);
    }
  };

  const createWorkspace = (data: Partial<Workspace>): Workspace => {
    const newWsId = crypto.randomUUID();
    const newWs: Workspace = {
      id: newWsId,
      name: data.name || 'New Brokerage Firm',
      slug: (data.name || 'new-firm').toLowerCase().replace(/[^a-z0-9]/g, '-'),
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

    const newMember: WorkspaceMember = {
      workspace_id: newWs.id,
      user_id: currentUser.id,
      role: 'brokerage_owner',
      status: 'active',
      joined_at: new Date().toISOString(),
      user: currentUser,
    };
    setMembers((prev) => [...prev, newMember]);

    // Persist to Supabase
    supabase.from('workspaces').insert({
      id: newWs.id,
      name: newWs.name,
      slug: newWs.slug,
      logo_url: newWs.logo_url,
      gst: newWs.gst,
      address: newWs.address,
      phone: newWs.phone,
      email: newWs.email,
      owner_id: newWs.owner_id,
      default_rules: newWs.default_rules,
      created_at: newWs.created_at,
    }).then(({ error }) => {
      if (error) console.error('Failed to create workspace in Supabase:', error);
      else {
        supabase.from('workspace_members').insert({
          workspace_id: newWs.id,
          user_id: currentUser.id,
          role: 'brokerage_owner',
          status: 'active',
        }).then(({ error: mErr }) => {
          if (mErr) console.error('Failed to insert workspace member:', mErr);
        });
      }
    });

    logAction('workspace.updated', 'workspace', newWs.id, { created: newWs.name });
    return newWs;
  };

  const updateWorkspace = (data: Partial<Workspace>) => {
    const updated = { ...currentWorkspace, ...data };
    setCurrentWorkspace(updated);
    setWorkspaces((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));

    supabase.from('workspaces').update(data).eq('id', updated.id).then(({ error }) => {
      if (error) console.error('Failed to update workspace in Supabase:', error);
    });

    logAction('workspace.updated', 'workspace', updated.id, data);
  };

  const inviteMember = (email: string, role: UserRole) => {
    const fakeId = crypto.randomUUID();
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

    // Persist to Supabase profiles & workspace_members
    supabase.from('profiles').insert({
      id: newProfile.id,
      name: newProfile.name,
      email: newProfile.email,
      created_at: newProfile.created_at,
    }).then(() => {
      supabase.from('workspace_members').insert({
        workspace_id: currentWorkspace.id,
        user_id: fakeId,
        role,
        status: 'pending',
      }).then(({ error: mErr }) => {
        if (mErr) console.error('Failed to insert invited workspace member:', mErr);
      });
    });

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

    supabase
      .from('workspace_members')
      .update({ role })
      .eq('workspace_id', currentWorkspace.id)
      .eq('user_id', userId)
      .then(({ error }) => {
        if (error) console.error('Failed to update member role in Supabase:', error);
      });

    logAction('member.role_changed', 'member', userId, { new_role: role });
  };

  const removeMember = (userId: string) => {
    setMembers((prev) =>
      prev.filter(
        (m) => !(m.workspace_id === currentWorkspace.id && m.user_id === userId)
      )
    );

    supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', currentWorkspace.id)
      .eq('user_id', userId)
      .then(({ error }) => {
        if (error) console.error('Failed to remove member in Supabase:', error);
      });

    logAction('member.removed', 'member', userId);
  };

  const addClient = (
    client: Omit<Client, 'id' | 'created_at' | 'workspace_id'>
  ): Client => {
    const id = crypto.randomUUID();
    const newClient: Client = {
      ...client,
      id,
      workspace_id: currentWorkspace.id,
      created_at: new Date().toISOString(),
      total_quotes: 0,
      total_sum_insured: 0,
    };
    setClients((prev) => [newClient, ...prev]);

    supabase.from('clients').insert({
      id: newClient.id,
      workspace_id: newClient.workspace_id,
      client_name: newClient.client_name,
      gst: newClient.gst,
      address: newClient.address,
      district: newClient.district,
      state: newClient.state,
      industry: newClient.industry,
      notes: newClient.notes || '',
      assigned_to: newClient.assigned_to || currentUser.id,
      total_quotes: 0,
      total_sum_insured: 0,
      created_at: newClient.created_at,
    }).then(({ error }) => {
      if (error) console.error('Failed to insert client into Supabase:', error);
    });

    logAction('client.created', 'client', newClient.id, { name: newClient.client_name });
    return newClient;
  };

  const updateClient = (id: string, data: Partial<Client>) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c))
    );

    supabase.from('clients').update(data).eq('id', id).then(({ error }) => {
      if (error) console.error('Failed to update client in Supabase:', error);
    });

    logAction('client.updated', 'client', id, data);
  };

  const deleteClient = async (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) console.error('Failed to delete client from Supabase:', error);
    logAction('client.updated', 'client', id, { action: 'deleted' });
  };

  const addQuote = (
    quoteData: Omit<Quote, 'id' | 'quote_number' | 'created_at' | 'updated_at' | 'version' | 'workspace_id'>
  ): Quote => {
    const id = crypto.randomUUID();
    const count = quotes.length + 1;
    const pad = count.toString().padStart(4, '0');
    const slugPrefix = (currentWorkspace.slug || 'QTL').slice(0, 3).toUpperCase();
    const quoteNum = `QTL-${slugPrefix}-2026-${pad}`;

    // Ensure client_id is valid UUID
    let validClientId = quoteData.client_id;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(validClientId);
    if (!isUuid) {
      const match = clients.find(
        (c) => c.client_name.toLowerCase() === quoteData.client_name.toLowerCase() ||
               (quoteData.client_gst && c.gst === quoteData.client_gst)
      );
      if (match) {
        validClientId = match.id;
      } else {
        const fallbackClient = addClient({
          client_name: quoteData.client_name,
          gst: quoteData.client_gst || '27AAACA1234A1Z5',
          address: 'Plot 101, Industrial Corridor Phase II, MIDC, Mumbai, Maharashtra 400093',
          district: 'Mumbai Suburban',
          state: 'Maharashtra',
          industry: quoteData.occupation_description || 'General Commercial',
          notes: 'Auto-created via proposal generation'
        });
        validClientId = fallbackClient.id;
      }
    }

    const newQuote: Quote = {
      ...quoteData,
      id,
      client_id: validClientId,
      quote_number: quoteNum,
      workspace_id: currentWorkspace.id,
      version: 1,
      created_by: currentUser.id,
      creator_name: currentUser.name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setQuotes((prev) => [newQuote, ...prev]);

    // Persist to Supabase
    supabase.from('quotes').insert({
      id: newQuote.id,
      workspace_id: newQuote.workspace_id,
      quote_number: newQuote.quote_number,
      client_id: newQuote.client_id,
      client_name: newQuote.client_name,
      client_gst: newQuote.client_gst,
      created_by: newQuote.created_by,
      creator_name: newQuote.creator_name,
      occupation_code: newQuote.occupation_code,
      occupation_description: newQuote.occupation_description,
      eq_zone: newQuote.eq_zone,
      sum_insured: newQuote.sum_insured,
      sum_insured_breakdown: newQuote.sum_insured_breakdown,
      premium: newQuote.premium,
      gst_amount: newQuote.gst_amount,
      total_premium: newQuote.total_premium,
      policy_rate: newQuote.policy_rate,
      status: newQuote.status,
      ai_confidence: newQuote.ai_confidence,
      insurer_name: newQuote.insurer_name,
      version: newQuote.version,
      calculation_breakdown: newQuote.calculation_breakdown,
      ai_analysis: newQuote.ai_analysis,
      created_at: newQuote.created_at,
      updated_at: newQuote.updated_at,
    }).then(({ error }) => {
      if (error) console.error('Failed to insert quote into Supabase:', error);
    });

    logAction('quote.created', 'quote', newQuote.id, {
      quote_number: quoteNum,
      client: newQuote.client_name,
      sum_insured: newQuote.sum_insured,
      premium: newQuote.total_premium,
    });

    return newQuote;
  };

  const updateQuote = (id: string, data: Partial<Quote>) => {
    const updatedDate = new Date().toISOString();
    setQuotes((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              ...data,
              version: (q.version || 1) + 1,
              updated_at: updatedDate,
            }
          : q
      )
    );

    supabase.from('quotes').update({
      ...data,
      updated_at: updatedDate,
    }).eq('id', id).then(({ error }) => {
      if (error) console.error('Failed to update quote in Supabase:', error);
    });

    logAction('quote.updated', 'quote', id, data);
  };

  const deleteQuote = async (id: string) => {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
    const { error } = await supabase.from('quotes').delete().eq('id', id);
    if (error) console.error('Failed to delete quote from Supabase:', error);
    logAction('quote.updated', 'quote', id, { action: 'deleted' });
  };

  const duplicateQuote = (id: string): Quote | null => {
    const existing = quotes.find((q) => q.id === id);
    if (!existing) return null;

    const count = quotes.length + 1;
    const slugPrefix = (currentWorkspace.slug || 'QTL').slice(0, 3).toUpperCase();
    const quoteNum = `QTL-${slugPrefix}-2026-${count.toString().padStart(4, '0')}`;
    const newId = crypto.randomUUID();

    const duplicated: Quote = {
      ...existing,
      id: newId,
      quote_number: quoteNum,
      status: 'draft',
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setQuotes((prev) => [duplicated, ...prev]);

    supabase.from('quotes').insert({
      id: duplicated.id,
      workspace_id: duplicated.workspace_id,
      quote_number: duplicated.quote_number,
      client_id: duplicated.client_id,
      client_name: duplicated.client_name,
      client_gst: duplicated.client_gst,
      created_by: duplicated.created_by,
      creator_name: duplicated.creator_name,
      occupation_code: duplicated.occupation_code,
      occupation_description: duplicated.occupation_description,
      eq_zone: duplicated.eq_zone,
      sum_insured: duplicated.sum_insured,
      sum_insured_breakdown: duplicated.sum_insured_breakdown,
      premium: duplicated.premium,
      gst_amount: duplicated.gst_amount,
      total_premium: duplicated.total_premium,
      policy_rate: duplicated.policy_rate,
      status: duplicated.status,
      ai_confidence: duplicated.ai_confidence,
      insurer_name: duplicated.insurer_name,
      version: duplicated.version,
      calculation_breakdown: duplicated.calculation_breakdown,
      ai_analysis: duplicated.ai_analysis,
      created_at: duplicated.created_at,
      updated_at: duplicated.updated_at,
    }).then(({ error }) => {
      if (error) console.error('Failed to insert duplicated quote into Supabase:', error);
    });

    logAction('quote.created', 'quote', duplicated.id, {
      duplicated_from: existing.quote_number,
    });
    return duplicated;
  };

  const addDocument = (
    doc: Omit<UploadedDocument, 'id' | 'created_at' | 'workspace_id'>
  ): UploadedDocument => {
    const id = crypto.randomUUID();
    const newDoc: UploadedDocument = {
      ...doc,
      id,
      workspace_id: currentWorkspace.id,
      created_at: new Date().toISOString(),
    };
    setDocuments((prev) => [newDoc, ...prev]);

    supabase.from('uploaded_documents').insert({
      id: newDoc.id,
      workspace_id: newDoc.workspace_id,
      quote_id: newDoc.quote_id,
      file_name: newDoc.file_name,
      file_url: newDoc.file_url,
      document_type: newDoc.document_type,
      file_size: newDoc.file_size,
      ocr_status: newDoc.ocr_status,
      extracted_data: newDoc.extracted_data,
      created_at: newDoc.created_at,
    }).then(({ error }) => {
      if (error) console.error('Failed to insert document in Supabase:', error);
    });

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
        clients: clients.filter((c) => c.workspace_id === currentWorkspace.id),
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
        deleteClient,
        addQuote,
        updateQuote,
        deleteQuote,
        duplicateQuote,
        addDocument,
        logAction,
        refreshData,
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
