import axios from 'axios';
import NodeCache from 'node-cache';
import {
  KeywordSuggestionItem,
  KeywordSuggestionResponse,
} from '../types/keyword.types';

const cacheTtlSeconds = Number(process.env.CACHE_TTL_SECONDS || 86400);

const keywordCache = new NodeCache({
  stdTTL: cacheTtlSeconds,
  checkperiod: 120,
});

function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

function cleanSuggestions(query: string, suggestions: string[]): string[] {
  const normalizedQuery = query.toLowerCase();

  return Array.from(
    new Set(
      suggestions
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .filter((s) => s.toLowerCase() !== normalizedQuery)
    )
  ).sort((a, b) => a.length - b.length);
}

function parseQueries(query: string): string[] {
  return query
    .split(',')
    .map((item) => normalizeQuery(item))
    .filter(Boolean);
}

function normalizeCountry(country?: string): string {
  return String(country || 'US').trim().toUpperCase();
}

function normalizeLanguage(language?: string): string {
  return String(language || 'en').trim().toLowerCase();
}

function buildCacheKey(query: string, country: string, language: string): string {
  return `keyword:${query}:${country}:${language}`;
}

async function fetchGoogleSuggestions(
  query: string,
  country: string,
  language: string
): Promise<string[]> {
  const url = 'https://suggestqueries.google.com/complete/search';

  const response = await axios.get(url, {
    params: {
      client: 'firefox',
      q: query,
      gl: country,
      hl: language,
    },
    timeout: 8000,
  });

  return Array.isArray(response.data?.[1]) ? response.data[1] : [];
}

export async function getKeywordSuggestions(
  query: string,
  country?: string,
  language?: string,
  limit?: number
): Promise<KeywordSuggestionResponse> {
  if (!query || !query.trim()) {
    throw new Error('Query parameter is required');
  }
  const startTime = Date.now();
  const parsedQueries = parseQueries(query);

  if (parsedQueries.length === 0) {
    throw new Error('At least one valid query is required');
  }

  if (parsedQueries.length > 10) {
    throw new Error('Maximum 10 queries allowed per request');
  }

  const normalizedCountry = normalizeCountry(country);
  const normalizedLanguage = normalizeLanguage(language);
  const normalizedLimit = Math.min(Math.max(Number(limit || 10), 1), 20);

  const resultsWithCache = await Promise.all(
    parsedQueries.map(async (currentQuery) => {
      const cacheKey = buildCacheKey(
        currentQuery,
        normalizedCountry,
        normalizedLanguage
      );

      const cachedSuggestions = keywordCache.get<string[]>(cacheKey);

      if (cachedSuggestions) {
        return {
          query: currentQuery,
          suggestions: cachedSuggestions,
          count: cachedSuggestions.length,
          cached: true,
        };
      }

      const rawSuggestions = await fetchGoogleSuggestions(
        currentQuery,
        normalizedCountry,
        normalizedLanguage
      );

      const suggestions = cleanSuggestions(currentQuery, rawSuggestions).slice(
        0,
        normalizedLimit
      );

      keywordCache.set(cacheKey, suggestions);

      return {
        query: currentQuery,
        suggestions,
        count: suggestions.length,
        cached: false,
      };
    })
  );

  const results: KeywordSuggestionItem[] = resultsWithCache.map(
    ({ cached, ...item }) => item
  );

  const allResultsFromCache = resultsWithCache.every((item) => item.cached);

  return {
    results,
    meta: {
      totalQueries: parsedQueries.length,
      country: normalizedCountry,
      language: normalizedLanguage,
      source: 'google_autocomplete',
      cached: allResultsFromCache,
      processingTimeMs: Date.now() - startTime,
    },
  };
}