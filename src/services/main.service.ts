export function exampleService() {
  return {
    message: 'API is working',
  };
}
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

function parseQueries(query: string): string[] {
  return query
    .split(',')
    .map((item) => normalizeQuery(item))
    .filter(Boolean)
    .slice(0, 10);
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
  language?: string
): Promise<KeywordSuggestionResponse> {
  if (!query || !query.trim()) {
    throw new Error('Query parameter is required');
  }

  const parsedQueries = parseQueries(query);

  if (parsedQueries.length === 0) {
    throw new Error('At least one valid query is required');
  }

  const normalizedCountry = normalizeCountry(country);
  const normalizedLanguage = normalizeLanguage(language);

  const results: KeywordSuggestionItem[] = [];
  let allResultsFromCache = true;

  for (const currentQuery of parsedQueries) {
    const cacheKey = buildCacheKey(
      currentQuery,
      normalizedCountry,
      normalizedLanguage
    );

    const cachedSuggestions = keywordCache.get<string[]>(cacheKey);

    if (cachedSuggestions) {
      results.push({
        query: currentQuery,
        suggestions: cachedSuggestions,
        count: cachedSuggestions.length,
      });

      continue;
    }

    allResultsFromCache = false;

    const suggestions = await fetchGoogleSuggestions(
      currentQuery,
      normalizedCountry,
      normalizedLanguage
    );

    keywordCache.set(cacheKey, suggestions);

    results.push({
      query: currentQuery,
      suggestions,
      count: suggestions.length,
    });
  }

  return {
    results,
    meta: {
      totalQueries: parsedQueries.length,
      country: normalizedCountry,
      language: normalizedLanguage,
      source: 'google_autocomplete',
      cached: allResultsFromCache,
    },
  };
}