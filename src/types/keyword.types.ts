export interface KeywordSuggestionItem {
  query: string;
  suggestions: string[];
  count: number;
}

export interface KeywordSuggestionResponse {
  results: KeywordSuggestionItem[];
  meta: {
    totalQueries: number;
    country: string;
    language: string;
    source: string;
    cached: boolean;
    processingTimeMs: number;
  };
}