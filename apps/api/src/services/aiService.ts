import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import type { ChatResponse } from '@tracemind/shared';
import logger from '../utils/logger.js';
import { InternalServerError } from '../utils/errors.js';

export class AiService {
  private genAI: GoogleGenerativeAI | null = null;
  private isMockMode = false;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.warn(
        'GEMINI_API_KEY environment variable is not defined. Running AiService in MOCK MODE.',
      );
      this.isMockMode = true;
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  public async ask(context: string, question: string): Promise<ChatResponse> {
    if (this.isMockMode) {
      return this.generateMockResponse(question);
    }

    try {
      const model = this.genAI!.getGenerativeModel({
        model: 'gemini-3.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
      });

      const systemPrompt = `You are TraceMind, an AI agent for Git repository analysis.
Answer using ONLY the provided context. Respond with a single valid JSON object:
{
  "answer": "**Summary**: ...\n\n**Reasoning**: ...\n\n**Suggested Fix**: ...",
  "confidence": 0.0-1.0,
  "evidence": [
    { "type": "commit|file|diff", "title": "...", "description": "...", "hash": "(if commit/diff)", "filePath": "(if file/diff)", "snippet": "(optional)" }
  ]
}`;

      const userMessage = `Repository Context:\n${context}\n\nQuestion: ${question}`;

      const result = await model.generateContent([systemPrompt, userMessage]);
      const text = result.response.text();

      if (!text) {
        throw new Error('Gemini returned an empty response content.');
      }

      return this.cleanAndParseJson(text);
    } catch (err: any) {
      logger.error('AI Request failed', err);

      // Surface rate-limit errors with a user-friendly message instead of a generic 500
      const status = err?.status ?? err?.response?.status;
      if (status === 429) {
        const retryMatch = err?.message?.match(/retry in ([\d.]+)s/i);
        const retrySeconds = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 60;
        throw new InternalServerError(
          `AI is currently rate-limited. The free-tier quota is exhausted. Please try again in ${retrySeconds} seconds, or upgrade your Google AI Studio API key.`,
        );
      }

      throw new InternalServerError(`AI Analysis failed: ${err.message}`);
    }
  }

  private cleanAndParseJson(text: string): ChatResponse {
    let cleaned = text.trim();
    // Strip markdown code block wrappers if model adds them
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '');
    }
    try {
      const parsed = JSON.parse(cleaned.trim());
      return {
        answer: parsed.answer || 'No answer generated.',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
        evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
      };
    } catch (err: any) {
      throw new Error(`Failed to parse AI response as JSON: ${err.message}. Raw: "${text}"`);
    }
  }

  private generateMockResponse(question: string): ChatResponse {
    logger.info(`Generating mock AI response for question: "${question}"`);
    const questionLower = question.toLowerCase();

    if (
      questionLower.includes('leak') ||
      questionLower.includes('memory') ||
      questionLower.includes('socket')
    ) {
      return {
        answer: `**Summary**:\nA potential memory leak was identified in buffer allocation blocks.\n\n**Reasoning**:\nCommit 02dd778 cleaned up heavy cache indexes that were holding transient module allocations in node_modules directories.\n\n**Suggested Fix**:\nEnsure all socket connections are explicitly closed in the finally block and run a heap snapshot analysis before and after connection teardown.`,
        confidence: 0.85,
        evidence: [
          {
            type: 'commit',
            title: 'untrack node_modules and setup .gitignore',
            description:
              'This commit cleaned up heavy cache indexes that were holding transient module allocations.',
            hash: '02dd7783976917d51f0c8bc7ea534874544f8d45',
          },
        ],
      };
    }

    if (questionLower.includes('package') || questionLower.includes('depend')) {
      return {
        answer: `**Summary**:\nThe package.json was modified in 2 commits.\n\n**Reasoning**:\nThe initial commit established the project dependencies. A subsequent commit added .gitignore to properly track only source files.\n\n**Suggested Fix**:\nReview package-lock.json for any version mismatches and run \`pnpm audit\` to check for vulnerabilities.`,
        confidence: 0.9,
        evidence: [
          {
            type: 'file',
            title: 'package.json',
            description: 'Project dependencies manifest modified in initial setup commits.',
            filePath: 'package.json',
          },
        ],
      };
    }

    return {
      answer: `**Summary**:\nThis is a TraceMind AI mock response for: "${question}".\n\n**Reasoning**:\nNo GEMINI_API_KEY is configured, so the system is running in offline mock mode.\n\n**Suggested Fix**:\nSet GEMINI_API_KEY in apps/api/.env with a valid Google AI Studio key to enable real AI analysis.`,
      confidence: 0.5,
      evidence: [
        {
          type: 'file',
          title: 'apps/api/.env',
          description: 'Add your GEMINI_API_KEY to enable live AI-powered analysis.',
          filePath: 'apps/api/.env',
        },
      ],
    };
  }
}

export default AiService;
