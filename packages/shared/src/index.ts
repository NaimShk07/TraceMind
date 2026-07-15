// API Request/Response Types

export interface ImportRepositoryRequest {
  path: string;
}

export interface ImportRepositoryResponse {
  repositoryId: string;
  name: string;
  branch: string;
}

export interface RepositoryDetails {
  repositoryId: string;
  name: string;
  branch: string;
  path: string;
  createdAt: string;
}

export interface CommitMetadata {
  hash: string;
  author: string;
  date: string;
  message: string;
  filesChangedCount: number;
}

export interface CommitDetails {
  hash: string;
  author: string;
  date: string;
  message: string;
  diff: string;
  filesChanged: string[];
  stats: {
    additions: number;
    deletions: number;
    filesChanged: number;
  };
}

export interface CommitExplanation {
  hash: string;
  explanation: string;
}

export interface ChatRequest {
  repositoryId: string;
  question: string;
}

export interface EvidenceItem {
  type: 'commit' | 'file' | 'diff';
  title: string;
  description: string;
  hash?: string;
  filePath?: string;
  snippet?: string;
}

export interface ChatResponse {
  answer: string;
  confidence: number; // 0.0 to 1.0
  evidence: EvidenceItem[];
}

export interface SearchResult {
  commits: CommitMetadata[];
  files: string[];
}

export interface HealthResponse {
  status: 'ok';
  timestamp: string;
}
