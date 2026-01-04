/**
 * AI Service - Frontend
 * Handles AI-powered performance analytics API calls
 */

import { apiClient } from '@/lib/apiClient';

export interface PerformanceAnalysis {
  playerName: string;
  playerType: string;
  matchesAnalyzed: number;
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
  summary: string;
  suggestions: string[];
}

export interface AnalysisResponse {
  success: boolean;
  data?: PerformanceAnalysis;
  error?: string;
  matchesPlayed?: number;
  required?: number;
}

class AIService {
  /**
   * Get AI performance analysis for a player
   * @param playerId Player ID to analyze
   * @returns Analysis response with data or error info
   */
  async getPlayerAnalysis(playerId: string): Promise<AnalysisResponse> {
    try {
      console.log('📊 Loading AI insights for player:', playerId);
      
      // Add cache-busting timestamp to prevent browser caching
      const cacheBuster = `?_=${Date.now()}`;
      
      // Use apiClient to ensure proper authentication (it automatically adds token)
      const { data, error } = await apiClient.get<{ 
        success: boolean; 
        data?: PerformanceAnalysis; 
        message?: string; 
        matchesPlayed?: number; 
        required?: number;
        generatedAt?: string;
      }>(`/ai/player-analysis/${playerId}${cacheBuster}`);
      
      console.log('📥 AI API Response:', { data, error });
      
      if (error) {
        console.error('❌ AI API Error:', error);
        // Check if it's a "not enough matches" error
        if (error.includes('Not enough matches') || error.includes('matches')) {
          return {
            success: false,
            error: error,
            matchesPlayed: 0,
            required: 3,
          };
        }
        
        return {
          success: false,
          error: error,
        };
      }
      
      // Handle response data - apiClient returns { success: true, data: {...}, message: "..." }
      if (data) {
        console.log('📦 Raw response data:', JSON.stringify(data, null, 2));
        
        // Check if data has success and data properties (wrapped response)
        if ((data as any).success && (data as any).data) {
          console.log('✅ AI insights loaded successfully:', (data as any).data);
          return {
            success: true,
            data: (data as any).data,
          };
        }
        
        // Check if data is already the PerformanceAnalysis object (unwrapped)
        if ((data as any).playerName && (data as any).trend) {
          console.log('✅ AI insights loaded (direct format):', data);
          return {
            success: true,
            data: data as PerformanceAnalysis,
          };
        }
        
        // Check if response has matchesPlayed (not enough matches case)
        if ((data as any).matchesPlayed !== undefined) {
          console.log('⚠️ Not enough matches:', (data as any).matchesPlayed);
          return {
            success: false,
            error: (data as any).message || 'Not enough matches',
            matchesPlayed: (data as any).matchesPlayed,
            required: (data as any).required || 3,
          };
        }
      }
      
      console.error('❌ Unexpected response format:', data);
      return {
        success: false,
        error: 'No data received from server or unexpected format',
      };
    } catch (error: any) {
      console.error('❌ Failed to get player analysis:', error);
      return {
        success: false,
        error: error.message || 'Failed to load AI insights',
      };
    }
  }
}

export const aiService = new AIService();
export default aiService;
