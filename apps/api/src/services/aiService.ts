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
      logger.warn('GEMINI_API_KEY environment variable is not defined. Running AiService in MOCK MODE.');
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
      const model = this.genAI!.getGenerativeModel(
        {
          model: 'gemini-1.5-flash-latest',
          generationConfig: {
            temperature: 0.3,
          },
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          ],
        },
        { apiVersion: 'v1' }
      );

      const systemPrompt = `You are TraceMind, an expert AI agent specializing in Git repository analysis and debugging.
Your goal is to answer the user's question about the repository based on the provided context.

You must respond ONLY with a valid JSON object matching the following structure:
{
  "answer": "A detailed explanation containing **Summary**, **Reasoning**, and **Suggested Fix** sections.",
  "confidence": 0.95,
  "evidence": [
    {
      "type": "commit",
      "title": "Fix memory leak in buffer allocation",
      "description": "Found commit ec2999db which resolved the buffer allocation memory leak.",
      "hash": "ec2999db8c785b8b55e788cc708f77c063ec4d6f"
    }
  ]
}

Instructions:
- confidence must be a number between 0.0 and 1.0 representing your confidence in the answer.
- The answer field must contain three labelled sections:
    **Summary**: Brief overview of findings.
    **Reasoning**: Step-by-step analysis of the evidence.
    **Suggested Fix**: Actionable next steps or code recommendations.
- evidence must contain a list of relevant files, commits, or diffs that justify your answer. Each item must have:
    - type: 'commit', 'file', or 'diff'
    - title: a short, descriptive title
    - description: why this is relevant
    - hash (optional): the commit hash if type is 'commit' or 'diff'
    - filePath (optional): the file path if type is 'file' or 'diff'
    - snippet (optional): relevant code or text snippet`;

      const userMessage = `Repository Context:\n${context}\n\nUser Question:\n${question}`;

      const result = await model.generateContent([systemPrompt, userMessage]);
      const text = result.response.text();

      if (!text) {
        throw new Error('Gemini returned an empty response content.');
      }

      return this.cleanAndParseJson(text);
    } catch (err: any) {
      logger.error('AI Request failed', err);
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

    if (questionLower.includes('leak') || questionLower.includes('memory') || questionLower.includes('socket')) {
      return {
        answer: `**Summary**:\nA potential memory leak was identified in buffer allocation blocks.\n\n**Reasoning**:\nCommit 02dd778 cleaned up heavy cache indexes that were holding transient module allocations in node_modules directories.\n\n**Suggested Fix**:\nEnsure all socket connections are explicitly closed in the finally block and run a heap snapshot analysis before and after connection teardown.`,
        confidence: 0.85,
        evidence: [
          {
            type: 'commit',
            title: 'untrack node_modules and setup .gitignore',
            description: 'This commit cleaned up heavy cache indexes that were holding transient module allocations.',
            hash: '02dd7783976917d51f0c8bc7ea534874544f8d45',
          },
        ],
      };
    }

    if (questionLower.includes('package') || questionLower.includes('depend')) {
      return {
        answer: `**Summary**:\nThe package.json was modified in 2 commits.\n\n**Reasoning**:\nThe initial commit established the project dependencies. A subsequent commit added .gitignore to properly track only source files.\n\n**Suggested Fix**:\nReview package-lock.json for any version mismatches and run \`pnpm audit\` to check for vulnerabilities.`,
        confidence: 0.90,
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
