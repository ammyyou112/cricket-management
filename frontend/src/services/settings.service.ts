import { apiClient } from '../lib/apiClient';

export interface CaptainSettings {
  id: string;
  userId: string;
  autoApproveEnabled: boolean;
  timeoutMinutes: number;
  notifyOnAutoApprove: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsInput {
  autoApproveEnabled?: boolean;
  timeoutMinutes?: number;
  notifyOnAutoApprove?: boolean;
}

class SettingsService {
  /**
   * Get captain settings
   */
  async getSettings(): Promise<CaptainSettings | null> {
    const { data, error } = await apiClient.get<CaptainSettings>('/settings');
    if (error) throw new Error(error);
    return data || null;
  }

  /**
   * Update captain settings
   */
  async updateSettings(settings: UpdateSettingsInput): Promise<CaptainSettings> {
    const { data, error } = await apiClient.patch<CaptainSettings>('/settings', settings);
    if (error) throw new Error(error);
    if (!data) throw new Error('Failed to update settings');
    return data;
  }
}

export const settingsService = new SettingsService();

