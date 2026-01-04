/**
 * AI Service - Google Gemini Integration
 * Provides AI-powered performance analytics for players
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { BadRequestError } from '@/utils/errors';
import logger from '@/utils/logger';

export interface PlayerStatInput {
  matchDate: string;
  runsScored: number;
  wicketsTaken: number;
  ballsFaced: number;
  oversBowled: number;
  runsConceded: number;
  catches?: number;
  stumpings?: number;
}

export interface PerformanceAnalysis {
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
  summary: string;
  suggestions: string[];
}

class AIService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private geminiEnabled: boolean = false;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      logger.warn('⚠️ GEMINI_API_KEY not configured - using intelligent fallback analysis only');
      this.geminiEnabled = false;
      return;
    }

    // Initialize genAI
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // ✅ Try models in order until one works
    const modelsToTry = [
      'gemini-2.0-flash-exp',      // Latest free model (Jan 2025)
      'gemini-1.5-flash-8b',       // Alternative free model
      'gemini-pro',                 // Stable free tier model
      'gemini-1.5-flash',          // Flash model
    ];

    for (const modelName of modelsToTry) {
      try {
        this.model = this.genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: 1.0,  // Maximum creativity and variety
            topK: 64,          // More diverse token sampling
            topP: 0.98,        // Broader probability distribution
            maxOutputTokens: 2000,
          }
        });
        this.geminiEnabled = true;
        logger.info(`✅ AI Service initialized with ${modelName}`);
        return; // Success - exit constructor
      } catch (error: any) {
        logger.warn(`⚠️ Model ${modelName} failed: ${error.message}`);
        // Continue to next model
      }
    }

    // If all models failed, disable Gemini and use fallback only
    logger.warn('⚠️ All Gemini models failed - using intelligent fallback analysis only');
    this.geminiEnabled = false;
    this.model = null;
  }

  /**
   * Analyze player performance using AI
   * @param playerStats Array of player statistics from recent matches
   * @param playerType Player type (BATSMAN, BOWLER, ALL_ROUNDER, WICKET_KEEPER)
   * @returns Performance analysis with trend, summary, and suggestions
   */
  async analyzePlayerPerformance(
    playerStats: PlayerStatInput[],
    playerType: string
  ): Promise<PerformanceAnalysis> {
    // ✅ Skip Gemini if disabled, go straight to intelligent fallback
    if (!this.geminiEnabled || !this.model) {
      logger.info('📊 Using intelligent analysis (Gemini disabled or unavailable)');
      return this.generateFallbackAnalysis(playerStats, playerType);
    }

    const startTime = Date.now();
    const maxRetries = 2;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Generate unique request ID to prevent caching
        const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        const timestamp = new Date().toISOString();
        const randomSeed = Math.floor(Math.random() * 1000000);  // ✅ Add random seed for variety
        
        logger.info(`🤖 AI Analysis Attempt ${attempt}/${maxRetries} for ${playerStats.length} matches (${playerType})`, {
          requestId,
          timestamp,
          randomSeed
        });

        // Build the AI prompt with unique request ID and random seed
        const prompt = this.buildPrompt(playerStats, playerType, requestId, timestamp, randomSeed);

        // Call Gemini API with timeout and per-request generation config for variety
        logger.info(`📝 Generating content for request ${requestId} (${prompt.length} chars)`);
        
        const result = await Promise.race([
          this.model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 1.0,  // Maximum creativity and variety
              topK: 64,          // More diverse token sampling
              topP: 0.98,        // Broader probability distribution
              maxOutputTokens: 2000,
            }
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('AI request timeout')), 15000)
          ),
        ]) as any;

      const response = await result.response;
      let text = response.text();

      logger.info('📝 Raw AI response received:', { 
        requestId,
        length: text.length,
        preview: text.substring(0, 200) 
      });

      // Strip markdown code blocks if present
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Remove any leading/trailing whitespace or newlines
      text = text.replace(/^\s+|\s+$/g, '');
      
      // Try to extract JSON if wrapped in other text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }

      // Parse JSON response
      let analysis: PerformanceAnalysis;
      try {
        analysis = JSON.parse(text);
        logger.info('✅ Successfully parsed AI response:', {
          trend: analysis.trend,
          summaryLength: analysis.summary?.length,
          suggestionsCount: analysis.suggestions?.length
        });
      } catch (parseError: any) {
        logger.error('❌ Failed to parse AI response as JSON:', {
          error: parseError.message,
          text: text.substring(0, 500),
          fullText: text
        });
        // Try to extract partial data before returning fallback
        try {
          // Look for trend in text
          const trendMatch = text.match(/"(?:trend|TREND)":\s*"(IMPROVING|DECLINING|STABLE)"/i);
          const summaryMatch = text.match(/"(?:summary|SUMMARY)":\s*"([^"]+)"/i);
          const suggestionsMatch = text.match(/"(?:suggestions|SUGGESTIONS)":\s*\[(.*?)\]/is);
          
          if (trendMatch && summaryMatch) {
            logger.warn('⚠️ Partial parsing successful, using extracted data');
            analysis = {
              trend: trendMatch[1] as any,
              summary: summaryMatch[1] || 'Performance analysis generated',
              suggestions: suggestionsMatch 
                ? suggestionsMatch[1].match(/"([^"]+)"/g)?.map((s: string) => s.replace(/"/g, '')) || []
                : []
            };
          } else {
            throw new Error('Could not extract partial data');
          }
        } catch {
          logger.error('❌ Could not recover from parse error, retrying...');
          throw new Error('JSON parse failed, retrying...');
        }
      }

      // Validate response structure
      if (!analysis.trend || !analysis.summary) {
        logger.warn('⚠️ AI returned missing required fields:', {
          hasTrend: !!analysis.trend,
          hasSummary: !!analysis.summary,
          hasSuggestions: Array.isArray(analysis.suggestions)
        });
        throw new Error('AI returned incomplete response, retrying...');
      }

      // Validate trend value
      if (!['IMPROVING', 'DECLINING', 'STABLE'].includes(analysis.trend)) {
        logger.warn(`⚠️ Invalid trend value: ${analysis.trend}, defaulting to STABLE`);
        analysis.trend = 'STABLE';
      }

      // Ensure suggestions array exists and has at least 1 item
      if (!Array.isArray(analysis.suggestions)) {
        logger.warn('⚠️ Suggestions is not an array, creating default');
        analysis.suggestions = [];
      }

      // Pad or trim suggestions to exactly 3
      if (analysis.suggestions.length < 3) {
        logger.warn(`⚠️ Only ${analysis.suggestions.length} suggestions provided, padding to 3`);
        while (analysis.suggestions.length < 3) {
          analysis.suggestions.push('Continue focusing on consistent performance and regular practice');
        }
      } else if (analysis.suggestions.length > 3) {
        logger.warn(`⚠️ ${analysis.suggestions.length} suggestions provided, using first 3`);
        analysis.suggestions = analysis.suggestions.slice(0, 3);
      }

      // Clean and validate suggestions
      analysis.suggestions = analysis.suggestions
        .map((s: any) => String(s).trim())
        .filter((s: string) => s.length > 0)
        .slice(0, 3);
      
      // Ensure we have exactly 3 suggestions
      while (analysis.suggestions.length < 3) {
        analysis.suggestions.push('Review match footage and work on identified weaknesses');
      }

        // Validate response quality - check for generic responses
        if (this.isGenericResponse(analysis)) {
          throw new Error('AI returned generic response, retrying...');
        }

        const duration = Date.now() - startTime;
        logger.info(`✅ AI analysis completed in ${duration}ms (Attempt ${attempt})`, {
          trend: analysis.trend,
          summaryLength: analysis.summary.length,
          suggestionsCount: analysis.suggestions.length,
        });

        return analysis;
      } catch (error: any) {
        logger.error(`❌ AI Analysis Attempt ${attempt} failed:`, {
          message: error.message,
          name: error.name,
          status: error.status,
          code: error.code
        });
        
        lastError = error;

        // Handle specific error types that shouldn't retry
        if (error.message?.includes('429') || error.status === 429 || error.code === 429) {
          logger.error('🚫 Rate limit exceeded');
          throw new BadRequestError(
            'AI service temporarily unavailable due to rate limits. Please try again in a few minutes.'
          );
        }

        if (error.message?.includes('API_KEY') || error.message?.includes('authentication')) {
          logger.error('🔑 API key authentication failed');
          throw new BadRequestError('AI service authentication failed. Please contact support.');
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const waitTime = 1000 * attempt;
          logger.info(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // If all retries failed, return intelligent fallback
    logger.warn('⚠️ All AI analysis attempts failed, using intelligent fallback');
    return this.generateFallbackAnalysis(playerStats, playerType);
  }

  /**
   * Build the prompt for Gemini API - Enhanced version with variety
   */
  private buildPrompt(stats: PlayerStatInput[], playerType: string, requestId: string, timestamp: string, randomSeed: number): string {
    const trendHint = this.calculateTrendHint(stats);
    
    // Rotate through different analysis angles for variety
    const analysisAngles = [
      'peak performance analysis',
      'consistency metrics',
      'recent form trajectory',
      'strike rate progression',
      'comparison to player type averages',
      'match-by-match variance',
      'momentum indicators',
      'technical skill assessment'
    ];
    const selectedAngle = analysisAngles[Math.floor(Math.random() * analysisAngles.length)];
    
    return `[Analysis Request ID: ${requestId}]
[Random Seed: ${randomSeed}]
[Timestamp: ${timestamp}]

You are an expert cricket coach providing FRESH, UNIQUE analysis each time.

CRITICAL INSTRUCTION: Generate COMPLETELY DIFFERENT suggestions than any previous analysis.
This is request #${randomSeed} - provide fresh, unique insights. Vary your recommendations to cover different aspects of performance.

PLAYER INFORMATION:
- Player Type: ${playerType}
- Matches Analyzed: ${stats.length}
- Analysis Request: ${requestId}
- Random Seed: ${randomSeed}
- Latest Performance Trend: ${trendHint}
- Focus Angle: ${selectedAngle}

UNIQUENESS REQUIREMENTS:
- This is analysis #${randomSeed} - must be DIFFERENT from previous analyses
- Rotate between these focus areas each time:
  * Technical skills (shot selection, footwork, timing)
  * Mental game (confidence, pressure handling, decision making)  
  * Physical fitness (stamina, agility, strength)
  * Match awareness (situation reading, partnerships, adaptability)
  * Specific scenarios (powerplay, middle overs, death overs)
  
- Use different statistical angles:
  * Peak performance analysis
  * Consistency metrics
  * Recent trend analysis
  * Strike rate progression
  * Comparison to averages

VARY YOUR RESPONSE - Pick 3 DIFFERENT suggestion types each refresh!

DETAILED MATCH DATA:
${stats.map((match, i) => {
  const strikeRate = match.ballsFaced > 0 ? ((match.runsScored / match.ballsFaced) * 100).toFixed(1) : '0.0';
  return `
Match ${i + 1} (${match.matchDate}):
- Runs: ${match.runsScored || 0} (${match.ballsFaced || 0} balls)
- Strike Rate: ${strikeRate}%
- Wickets: ${match.wicketsTaken || 0}
- Catches: ${match.catches || 0}`;
}).join('\n')}

ANALYSIS REQUIREMENTS:

1. TREND DETECTION (be data-driven):
   Calculate: (Average of last 2 matches) vs (Average of first 2 matches)
   - IMPROVING: If recent avg is 20%+ higher
   - DECLINING: If recent avg is 20%+ lower  
   - STABLE: Otherwise

2. SUMMARY (must be unique each time - rotate through different angles):
   Pick a DIFFERENT statistical angle for this analysis:
   - Peak performance analysis (focus on best match)
   - Consistency metrics (variance in scores)
   - Recent form trajectory (last 2-3 matches trend)
   - Strike rate progression (batting efficiency)
   - Comparison to player type averages
   - Match-by-match variance analysis
   - Momentum indicators (improving/declining)
   - Technical skill assessment
   
   - Use specific numbers from matches
   - Make it conversational and motivating
   - Vary phrasing from previous analyses

3. SUGGESTIONS (CRITICAL - MUST BE DIFFERENT EACH TIME):
   
   ROTATE THROUGH THESE FOCUS AREAS (choose 3 from DIFFERENT sets):
   
   Set A - Technical Skills:
   - Shot selection improvement (specific shots to work on)
   - Footwork against pace/spin (technical adjustments)
   - Strike rotation techniques (converting dots to runs)
   
   Set B - Mental Game:
   - Building innings patiently (temperament)
   - Pressure situation management (clutch performance)
   - Confidence building strategies (from peak performances)
   
   Set C - Physical Fitness:
   - Stamina for long innings (endurance)
   - Reaction time improvement (reflexes)
   - Flexibility for shot range (mobility)
   
   Set D - Match Awareness:
   - Reading match situations (game sense)
   - Partnership building (team play)
   - Adapting to conditions (pitch/weather)
   
   Set E - Specific Skills:
   - Powerplay strategies (first 6 overs)
   - Death overs approach (last 4 overs)
   - Spin vs pace handling (technique variation)
   
   IMPORTANT: 
   - Choose 3 suggestions from DIFFERENT sets each time
   - Reference actual match data in each suggestion
   - Be specific with numbers and examples
   - Never repeat exact phrasing from previous analyses
   - Vary the focus areas to provide comprehensive coverage

CRITICAL RULES:
- NO generic advice - every suggestion must reference actual match data
- Use specific numbers and percentages from the matches
- Identify actual patterns (improving, declining, inconsistent)
- VARY your response - don't repeat previous analyses!
- If player is a BOWLER, focus on economy rate and wickets
- If player is a BATSMAN, focus on runs and strike rate
- If player is ALL_ROUNDER, balance both aspects

RESPONSE FORMAT (JSON only, no markdown):
{
  "trend": "IMPROVING" | "DECLINING" | "STABLE",
  "summary": "Unique 2-sentence analysis with specific data - vary from previous analyses",
  "suggestions": [
    "Specific technical suggestion with match reference (from Set A, B, C, D, or E)",
    "Specific mental/strategic suggestion with data (from different set)",
    "Specific physical/situational suggestion with numbers (from different set)"
  ]
}

VARY YOUR RESPONSE - Don't repeat previous analyses! Make this request #${randomSeed} unique!`;
  }

  /**
   * Calculate trend hint for prompt
   */
  private calculateTrendHint(stats: PlayerStatInput[]): string {
    if (stats.length < 3) return 'Insufficient data';
    
    // Reverse to get chronological order (oldest first)
    const reversed = [...stats].reverse();
    const first3 = reversed.slice(0, Math.min(3, reversed.length));
    const last3 = reversed.slice(-3);
    
    const first3Avg = first3.reduce((sum, s) => sum + (s.runsScored || 0), 0) / first3.length;
    const last3Avg = last3.reduce((sum, s) => sum + (s.runsScored || 0), 0) / last3.length;
    
    if (first3Avg === 0) return 'Starting performance';
    
    const change = ((last3Avg - first3Avg) / first3Avg) * 100;
    
    if (change > 15) return `Improving (recent scores ${change.toFixed(0)}% higher)`;
    if (change < -15) return `Declining (recent scores ${Math.abs(change).toFixed(0)}% lower)`;
    return 'Stable (consistent performance)';
  }

  /**
   * Check if response is generic/unhelpful
   */
  private isGenericResponse(analysis: any): boolean {
    const genericPhrases = [
      'keep practicing',
      'review your stats',
      'consult with',
      'unable to generate',
      'at this time',
      'continue focusing',
      'regular practice'
    ];
    
    const summaryLower = (analysis.summary || '').toLowerCase();
    const suggestionsText = (analysis.suggestions || []).join(' ').toLowerCase();
    
    const hasGenericPhrase = genericPhrases.some(phrase => 
      summaryLower.includes(phrase) || suggestionsText.includes(phrase)
    );
    
    // Also check if suggestions are too short or vague
    const hasVagueSuggestions = analysis.suggestions?.some((s: string) => 
      s.length < 30 || s.toLowerCase().includes('practice') || s.toLowerCase().includes('review')
    );
    
    return hasGenericPhrase || hasVagueSuggestions || false;
  }

  /**
   * Generate intelligent fallback analysis based on actual data
   */
  private generateFallbackAnalysis(stats: PlayerStatInput[], playerType: string): PerformanceAnalysis {
    // Calculate real statistics
    const totalRuns = stats.reduce((sum, s) => sum + (s.runsScored || 0), 0);
    const avgRuns = totalRuns / stats.length;
    const maxRuns = Math.max(...stats.map(s => s.runsScored || 0));
    const minRuns = Math.min(...stats.map(s => s.runsScored || 0));
    
    // Reverse to get chronological order
    const reversed = [...stats].reverse();
    const first3Avg = reversed.slice(0, 3).reduce((sum, s) => sum + (s.runsScored || 0), 0) / 3;
    const last3Avg = reversed.slice(-3).reduce((sum, s) => sum + (s.runsScored || 0), 0) / 3;
    
    const percentChange = first3Avg > 0 ? ((last3Avg - first3Avg) / first3Avg) * 100 : 0;
    
    let trend: 'IMPROVING' | 'DECLINING' | 'STABLE' = 'STABLE';
    if (percentChange > 15) trend = 'IMPROVING';
    if (percentChange < -15) trend = 'DECLINING';
    
    const variance = stats.map(s => s.runsScored || 0).reduce((sum, runs) => {
      return sum + Math.pow(runs - avgRuns, 2);
    }, 0) / stats.length;
    const isInconsistent = variance > 400; // High variance = inconsistent
    
    // ✅ ADD RANDOMIZATION - Different suggestions each time
    const allSuggestions = [
      `Your best performance was ${maxRuns} runs. Analyze what worked that day - shot selection, timing, and approach - and replicate those conditions in future matches.`,
      `Focus on consistency: Your scores range from ${minRuns} to ${maxRuns} runs. Work on reducing this variance through better shot selection and match awareness.`,
      `Strike rate management: Build partnerships while maintaining scoring momentum throughout your innings. Focus on rotating strike effectively.`,
      `Mental game: Convert starts into big scores. Practice building confidence through match simulations and pressure situation drills.`,
      `Technical improvement: Work on footwork against spin bowling to increase scoring options and reduce dot ball percentage.`,
      `Physical conditioning: Build stamina for longer innings beyond 40 balls to capitalize on set positions and maximize scoring opportunities.`,
      `Match awareness: Adapt your approach based on required run rate and match situation. Read the game better to make smarter decisions.`,
      `Partnership building: Focus on rotating strike and communicating with batting partners to build substantial partnerships.`,
      `Shot selection: Analyze dismissal patterns and eliminate risky shots in pressure situations. Focus on percentage cricket.`,
      `Powerplay strategies: Optimize your approach in the first 6 overs - balance aggression with wicket preservation.`,
      `Death overs approach: Develop specific skills for the final 4 overs - practice finishing games and handling pressure.`,
      `Spin vs pace handling: Develop technique variation to handle different bowling types effectively throughout your innings.`,
    ];
    
    // ✅ Randomly pick 3 different suggestions each time
    const shuffled = [...allSuggestions].sort(() => Math.random() - 0.5);
    const selectedSuggestions = shuffled.slice(0, 3);
    
    // ✅ Vary summary phrasing
    const summaries = [
      `Over ${stats.length} matches, you averaged ${avgRuns.toFixed(1)} runs with a highest score of ${maxRuns} runs. ${isInconsistent ? `Your scores show significant variation (${minRuns} to ${maxRuns} runs), indicating inconsistency.` : `Your performance is ${trend === 'IMPROVING' ? 'showing improvement' : trend === 'DECLINING' ? 'declining slightly' : 'relatively consistent'}.`} Recent performance shows ${percentChange > 0 ? 'a ' + percentChange.toFixed(0) + '% improvement' : percentChange < 0 ? 'a ' + Math.abs(percentChange).toFixed(0) + '% decline' : 'stable consistency'}.`,
      `Your batting average stands at ${avgRuns.toFixed(1)} across ${stats.length} matches, peaking at ${maxRuns} runs. ${trend === 'IMPROVING' ? 'Your recent form is trending upward with improved consistency.' : trend === 'DECLINING' ? 'Focus on regaining earlier form through targeted practice.' : 'Consistent performance maintained across matches.'} ${isInconsistent ? `Score variance (${minRuns}-${maxRuns}) suggests focus on consistency.` : ''}`,
      `Performance analysis: ${avgRuns.toFixed(1)} runs per match average, with ${maxRuns} as your best score. ${Math.abs(percentChange).toFixed(0)}% ${percentChange > 0 ? 'improvement' : percentChange < 0 ? 'decline' : 'variance'} in recent matches. ${isInconsistent ? `Work on reducing the ${minRuns}-${maxRuns} run range for more predictable outcomes.` : 'Maintain current consistency levels.'}`,
    ];
    
    const randomSummary = summaries[Math.floor(Math.random() * summaries.length)];
    
    return {
      trend,
      summary: randomSummary,
      suggestions: selectedSuggestions
    };
  }

}

// Export singleton instance
export const aiService = new AIService();
export default aiService;

