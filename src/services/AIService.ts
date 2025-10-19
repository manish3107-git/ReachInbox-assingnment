import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';

export interface EmailCategorization {
  category: 'Interested' | 'Meeting Booked' | 'Not Interested' | 'Spam' | 'Out of Office';
  confidence: number;
  reasoning: string;
}

export interface ReplySuggestion {
  suggestedReply: string;
  confidence: number;
  reasoning: string;
}

export class AIService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private provider: string;

  constructor() {
    this.provider = process.env.AI_PROVIDER || 'openai';
    
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }

    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    }
  }

  async categorizeEmail(subject: string, body: string, fromEmail: string): Promise<EmailCategorization> {
    try {
      const prompt = this.buildCategorizationPrompt(subject, body, fromEmail);
      
      if (this.provider === 'openai' && this.openai) {
        return await this.categorizeWithOpenAI(prompt);
      } else if (this.anthropic) {
        return await this.categorizeWithAnthropic(prompt);
      } else {
        throw new Error('No AI provider configured');
      }
    } catch (error) {
      logger.error('Failed to categorize email:', error);
      // Return default categorization
      return {
        category: 'Not Interested',
        confidence: 0.5,
        reasoning: 'AI categorization failed, defaulting to Not Interested'
      };
    }
  }

  private buildCategorizationPrompt(subject: string, body: string, fromEmail: string): string {
    return `
You are an AI assistant that categorizes emails for a business outreach platform. Analyze the following email and categorize it into one of these categories:

1. "Interested" - Shows genuine interest, positive engagement, or potential business opportunity
2. "Meeting Booked" - Confirms or schedules a meeting, appointment, or call
3. "Not Interested" - Shows disinterest, rejection, or negative response
4. "Spam" - Unsolicited promotional content, irrelevant emails, or automated messages
5. "Out of Office" - Automated out-of-office or vacation responses

Email Details:
Subject: ${subject}
From: ${fromEmail}
Body: ${body.substring(0, 1000)}...

Respond with a JSON object containing:
- category: one of the 5 categories above
- confidence: a number between 0 and 1
- reasoning: brief explanation of your categorization

Consider:
- Tone and sentiment
- Specific keywords indicating interest/disinterest
- Meeting-related language
- Automated response patterns
- Business context and relevance
`;
  }

  private async categorizeWithOpenAI(prompt: string): Promise<EmailCategorization> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert email categorization assistant. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    try {
      const parsed = JSON.parse(content);
      return {
        category: parsed.category,
        confidence: Math.min(Math.max(parsed.confidence, 0), 1),
        reasoning: parsed.reasoning
      };
    } catch (error) {
      logger.error('Failed to parse OpenAI response:', error);
      throw new Error('Invalid response format from AI');
    }
  }

  private async categorizeWithAnthropic(prompt: string): Promise<EmailCategorization> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized');
    }
    
    const response = await (this.anthropic as any).messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 500,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic');
    }

    try {
      const parsed = JSON.parse(content.text);
      return {
        category: parsed.category,
        confidence: Math.min(Math.max(parsed.confidence, 0), 1),
        reasoning: parsed.reasoning
      };
    } catch (error) {
      logger.error('Failed to parse Anthropic response:', error);
      throw new Error('Invalid response format from AI');
    }
  }

  async generateReplySuggestion(
    originalEmail: { subject: string; body: string; fromEmail: string },
    context: string,
    productInfo: string,
    agenda: string
  ): Promise<ReplySuggestion> {
    try {
      const prompt = this.buildReplySuggestionPrompt(originalEmail, context, productInfo, agenda);
      
      if (this.provider === 'openai' && this.openai) {
        return await this.generateReplyWithOpenAI(prompt);
      } else if (this.anthropic) {
        return await this.generateReplyWithAnthropic(prompt);
      } else {
        throw new Error('No AI provider configured');
      }
    } catch (error) {
      logger.error('Failed to generate reply suggestion:', error);
      return {
        suggestedReply: 'Thank you for your email. I will get back to you soon.',
        confidence: 0.3,
        reasoning: 'AI reply generation failed, using fallback response'
      };
    }
  }

  private buildReplySuggestionPrompt(
    originalEmail: { subject: string; body: string; fromEmail: string },
    context: string,
    productInfo: string,
    agenda: string
  ): string {
    return `
You are an AI assistant that generates professional email replies for business outreach. Generate a personalized reply based on the context provided.

Original Email:
Subject: ${originalEmail.subject}
From: ${originalEmail.fromEmail}
Body: ${originalEmail.body}

Context: ${context}

Product Information: ${productInfo}

Outreach Agenda: ${agenda}

Generate a professional, personalized reply that:
1. Acknowledges the original email appropriately
2. Incorporates relevant product information naturally
3. Follows the outreach agenda
4. Maintains a professional yet engaging tone
5. Includes a clear call-to-action if appropriate

Respond with a JSON object containing:
- suggestedReply: the complete email reply
- confidence: a number between 0 and 1 indicating how confident you are in this suggestion
- reasoning: brief explanation of your approach

Keep the reply concise (2-3 paragraphs max) and professional.
`;
  }

  private async generateReplyWithOpenAI(prompt: string): Promise<ReplySuggestion> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert email reply generator. Always respond with valid JSON and professional tone.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    try {
      const parsed = JSON.parse(content);
      return {
        suggestedReply: parsed.suggestedReply,
        confidence: Math.min(Math.max(parsed.confidence, 0), 1),
        reasoning: parsed.reasoning
      };
    } catch (error) {
      logger.error('Failed to parse OpenAI reply response:', error);
      throw new Error('Invalid response format from AI');
    }
  }

  private async generateReplyWithAnthropic(prompt: string): Promise<ReplySuggestion> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized');
    }
    
    const response = await (this.anthropic as any).messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 800,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic');
    }

    try {
      const parsed = JSON.parse(content.text);
      return {
        suggestedReply: parsed.suggestedReply,
        confidence: Math.min(Math.max(parsed.confidence, 0), 1),
        reasoning: parsed.reasoning
      };
    } catch (error) {
      logger.error('Failed to parse Anthropic reply response:', error);
      throw new Error('Invalid response format from AI');
    }
  }

  async extractKeyInformation(email: { subject: string; body: string }): Promise<{
    keyPoints: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
    urgency: 'low' | 'medium' | 'high';
    actionRequired: boolean;
  }> {
    try {
      const prompt = `
Analyze the following email and extract key information:

Subject: ${email.subject}
Body: ${email.body.substring(0, 1500)}...

Extract:
1. Key points (3-5 main points)
2. Overall sentiment (positive, neutral, negative)
3. Urgency level (low, medium, high)
4. Whether action is required (true/false)

Respond with JSON format.
`;

      if (this.provider === 'openai' && this.openai) {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert email analyzer. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 400
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('No response from OpenAI');
        }

        return JSON.parse(content);
      } else {
        // Fallback analysis
        return {
          keyPoints: ['Email received'],
          sentiment: 'neutral',
          urgency: 'low',
          actionRequired: false
        };
      }
    } catch (error) {
      logger.error('Failed to extract key information:', error);
      return {
        keyPoints: ['Email received'],
        sentiment: 'neutral',
        urgency: 'low',
        actionRequired: false
      };
    }
  }
}
