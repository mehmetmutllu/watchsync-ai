import api from './api';
import type { TeamResponse, TeamInvitation, TeamMember } from '@/types';

export interface InviteParams {
  email: string;
  role: 'manager' | 'staff';
  permissions?: string[];
  expires_in_days?: number;
}

export interface InvitationResult {
  id: number;
  email: string;
  role: string;
  permissions: string[] | null;
  expires_at: string;
  accept_url?: string; // yalnızca local/testing
}

export const teamApi = {
  get: async (): Promise<TeamResponse> => {
    const { data } = await api.get('/team');
    return data;
  },

  invite: async (params: InviteParams): Promise<InvitationResult> => {
    const { data } = await api.post('/team/invitations', params);
    return data.invitation;
  },

  resendInvitation: async (id: number): Promise<{ accept_url?: string }> => {
    const { data } = await api.post(`/team/invitations/${id}/resend`);
    return data;
  },

  revokeInvitation: async (id: number): Promise<void> => {
    await api.delete(`/team/invitations/${id}`);
  },

  updateMemberPermissions: async (userId: number, permissions: string[]): Promise<TeamMember> => {
    const { data } = await api.put(`/team/members/${userId}/permissions`, { permissions });
    return data.member;
  },

  disableMember: async (userId: number): Promise<void> => {
    await api.post(`/team/members/${userId}/disable`);
  },

  enableMember: async (userId: number): Promise<void> => {
    await api.post(`/team/members/${userId}/enable`);
  },

  removeMember: async (userId: number): Promise<void> => {
    await api.delete(`/team/members/${userId}`);
  },

  getDefaults: async (): Promise<{ invitation_expiry_days: number }> => {
    const { data } = await api.get('/settings/team-defaults');
    return data;
  },
};

// Public — davet kabul akışı (auth gerektirmez)
export interface InvitationInfo {
  email: string;
  role: string;
  dealer_name: string;
  expires_at: string;
}

export const invitationApi = {
  show: async (token: string): Promise<InvitationInfo> => {
    const { data } = await api.get(`/invitations/${token}`);
    return data;
  },

  accept: async (
    token: string,
    payload: { name: string; password: string; password_confirmation: string },
  ): Promise<{ user: import('@/types').User }> => {
    const { data } = await api.post(`/invitations/${token}/accept`, payload);
    return data;
  },
};
