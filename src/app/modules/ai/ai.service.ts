import { GoogleGenAI } from '@google/genai';
import status from 'http-status';
import { prisma } from '../../config/prisma.js';
import { envVars } from '../../config/env.js';
import AppError from '../../utils/AppError.js';
import logger from '../../utils/logger.js';

// ─── Gemini client ──────────────────────────────────────────────
const getClient = () => {
  if (!envVars.GEMINI_API_KEY || envVars.GEMINI_API_KEY === 'your_gemini_api_key') {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      'AI service is not configured. Please set GEMINI_API_KEY.',
    );
  }
  return new GoogleGenAI({ apiKey: envVars.GEMINI_API_KEY });
};

const MODEL = 'gemini-2.5-flash-preview-04-17';

// ─── Helper: call Gemini and return text ────────────────────────
const callGemini = async (systemPrompt: string, userMessage: string): Promise<string> => {
  const client = getClient();

  try {
    const response = await client.models.generateContent({
      model: MODEL,
      contents: userMessage,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 2048,
      },
    });

    const text = response.text;
    if (!text) {
      throw new AppError(status.INTERNAL_SERVER_ERROR, 'AI returned no text response.');
    }

    return text;
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('AI service error:', error);
    throw new AppError(status.SERVICE_UNAVAILABLE, 'AI service is temporarily unavailable.');
  }
};

const parseJsonResponse = <T>(text: string): T => {
  // Strip markdown code fences if Gemini wraps the JSON
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();

  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    throw new AppError(status.INTERNAL_SERVER_ERROR, 'AI returned invalid JSON.');
  }
};

// ─── Feature 1: Smart Recommendations ──────────────────────────
interface Recommendation {
  title: string;
  reason: string;
  matchScore: number;
  genre: string;
}

const getRecommendations = async (userId: string) => {
  const watchlist = await prisma.watchlist.findMany({
    where: { userId },
    include: {
      media: {
        include: { genres: { include: { genre: true } } },
      },
    },
    take: 20,
  });

  const userReviews = await prisma.review.findMany({
    where: { userId },
    include: {
      media: { select: { title: true, type: true } },
    },
    take: 20,
  });

  const historyItems = watchlist.map((w) => ({
    title: w.media.title,
    type: w.media.type,
    genres: w.media.genres.map((g) => g.genre.name),
    status: w.status,
  }));

  const reviewItems = userReviews.map((r) => ({
    title: r.media.title,
    type: r.media.type,
    rating: r.rating,
  }));

  const systemPrompt = `You are RatePlex's recommendation engine. Based on a user's watch history and ratings, suggest media they would enjoy. Return ONLY valid JSON with no markdown formatting.`;

  const userMessage = `Based on this user's watch history and ratings, suggest 6 recommendations.

Watch history: ${JSON.stringify(historyItems)}
Reviews/Ratings: ${JSON.stringify(reviewItems)}

Return JSON in this exact format:
{
  "recommendations": [
    { "title": "...", "reason": "...", "matchScore": 92, "genre": "..." }
  ]
}

Each recommendation should have:
- title: a real movie, series, or anime title
- reason: why they'd enjoy it (1-2 sentences)
- matchScore: 0-100 confidence score
- genre: primary genre`;

  const text = await callGemini(systemPrompt, userMessage);
  return parseJsonResponse<{ recommendations: Recommendation[] }>(text);
};

// ─── Feature 2: AI Chat Assistant ───────────────────────────────
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const chat = async (message: string, history: ChatMessage[]) => {
  const client = getClient();

  const systemPrompt = `You are RatePlex's AI assistant. Help users discover movies, series, and anime. Answer questions about content, suggest what to watch, and explain ratings. Be concise and friendly. Keep responses under 200 words.`;

  // Build conversation history as a single prompt for Gemini
  const conversationHistory = history
    .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`)
    .join('\n');

  const fullMessage = conversationHistory
    ? `${conversationHistory}\nUser: ${message}`
    : message;

  try {
    const response = await client.models.generateContent({
      model: MODEL,
      contents: fullMessage,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 1024,
      },
    });

    return {
      reply: response.text ?? 'I could not generate a response.',
    };
  } catch (error) {
    logger.error('AI chat error:', error);
    throw new AppError(status.SERVICE_UNAVAILABLE, 'AI chat service is temporarily unavailable.');
  }
};

// ─── Feature 3: Taste Analyzer ──────────────────────────────────
interface TasteProfile {
  profile: string;
  traits: string[];
  topGenres: string[];
  insight: string;
}

const analyzeTaste = async (userId: string) => {
  const [watchlist, reviews] = await Promise.all([
    prisma.watchlist.findMany({
      where: { userId, status: 'COMPLETED' },
      include: {
        media: {
          include: { genres: { include: { genre: true } } },
        },
      },
      take: 30,
    }),
    prisma.review.findMany({
      where: { userId },
      include: {
        media: {
          include: { genres: { include: { genre: true } } },
        },
      },
      take: 30,
    }),
  ]);

  const completed = watchlist.map((w) => ({
    title: w.media.title,
    type: w.media.type,
    genres: w.media.genres.map((g) => g.genre.name),
  }));

  const rated = reviews.map((r) => ({
    title: r.media.title,
    type: r.media.type,
    rating: r.rating,
    genres: r.media.genres.map((g) => g.genre.name),
  }));

  const systemPrompt = `You are a media taste analysis engine. Analyze a user's viewing and rating patterns to create a taste personality profile. Return ONLY valid JSON with no markdown formatting.`;

  const userMessage = `Analyze this user's taste profile based on their completed watchlist and ratings.

Completed: ${JSON.stringify(completed)}
Ratings: ${JSON.stringify(rated)}

Return JSON in this exact format:
{
  "profile": "A short personality title like 'Psychological Thriller Enthusiast'",
  "traits": ["Trait 1", "Trait 2", "Trait 3"],
  "topGenres": ["Genre1", "Genre2", "Genre3"],
  "insight": "A 2-3 sentence insight about their viewing preferences and patterns"
}`;

  const text = await callGemini(systemPrompt, userMessage);
  return parseJsonResponse<TasteProfile>(text);
};

// ─── Feature 4: Community Sentiment ─────────────────────────────
interface SentimentResult {
  summary: string;
  positiveThemes: string[];
  negativeThemes: string[];
  sentimentScore: number;
}

const reviewSentiment = async (mediaId: string) => {
  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    select: { title: true },
  });

  if (!media) {
    throw new AppError(status.NOT_FOUND, 'Media not found.');
  }

  const reviews = await prisma.review.findMany({
    where: { mediaId, status: 'APPROVED', content: { not: null } },
    select: { content: true, rating: true },
    take: 50,
  });

  if (reviews.length === 0) {
    throw new AppError(status.BAD_REQUEST, 'Not enough reviews to analyze sentiment.');
  }

  const reviewTexts = reviews
    .filter((r) => r.content)
    .map((r) => `[Rating: ${r.rating}/10] ${r.content}`);

  const systemPrompt = `You are a review sentiment analysis engine. Summarize community sentiment from multiple reviews. Return ONLY valid JSON with no markdown formatting.`;

  const userMessage = `Analyze the community sentiment for "${media.title}" based on these ${reviewTexts.length} reviews:

${reviewTexts.join('\n\n')}

Return JSON in this exact format:
{
  "summary": "2-3 sentence summary of community sentiment",
  "positiveThemes": ["Theme 1", "Theme 2"],
  "negativeThemes": ["Theme 1", "Theme 2"],
  "sentimentScore": 78
}

sentimentScore should be 0-100 (0 = very negative, 100 = very positive)`;

  const text = await callGemini(systemPrompt, userMessage);
  return parseJsonResponse<SentimentResult>(text);
};

// ─── Feature 5: Auto-tag / Description Generator (Admin) ────────
interface AutoTagResult {
  description: string;
  suggestedGenres: string[];
  suggestedTags: string[];
  ageRating: string;
}

const autoTag = async (input: {
  title: string;
  releaseYear?: number;
  type?: string;
  director?: string;
}) => {
  const systemPrompt = `You are a media metadata generator. Given basic info about a movie, series, or anime, generate a description, suggest genres, tags, and an age rating. Return ONLY valid JSON with no markdown formatting.`;

  const userMessage = `Generate metadata for this media:
Title: ${input.title}
${input.releaseYear ? `Release Year: ${input.releaseYear}` : ''}
${input.type ? `Type: ${input.type}` : ''}
${input.director ? `Director: ${input.director}` : ''}

Return JSON in this exact format:
{
  "description": "A compelling 2-3 sentence description",
  "suggestedGenres": ["Genre1", "Genre2"],
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "ageRating": "PG-13"
}`;

  const text = await callGemini(systemPrompt, userMessage);
  return parseJsonResponse<AutoTagResult>(text);
};

export const AIService = {
  getRecommendations,
  chat,
  analyzeTaste,
  reviewSentiment,
  autoTag,
};
