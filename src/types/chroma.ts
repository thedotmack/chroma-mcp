/**
 * TypeScript type definitions for Chroma MCP Server
 */

export interface ChromaConfig {
  clientType: 'http' | 'cloud' | 'persistent' | 'ephemeral';
  host?: string;
  port?: number;
  ssl?: boolean;
  tenant?: string;
  database?: string;
  apiKey?: string;
  dataDir?: string;
  customAuthCredentials?: string;
  dotenvPath?: string;
}

export interface CollectionInfo {
  name: string;
  count: number;
  metadata?: Record<string, any>;
  sample_documents?: any;
}

export interface DocumentQuery {
  queryTexts: string[];
  nResults?: number;
  where?: Record<string, any>;
  whereDocument?: Record<string, any>;
  include?: string[];
}

export interface EmbeddingFunctionType {
  name: string;
  parameters?: Record<string, any>;
}

export interface ChromaDocument {
  id: string;
  document?: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}

export interface QueryResult {
  ids?: string[][];
  documents?: string[][];
  metadatas?: Record<string, any>[][];
  distances?: number[][];
  embeddings?: number[][][];
}

export interface GetResult {
  ids: string[];
  documents?: string[];
  metadatas?: Record<string, any>[];
  embeddings?: number[][];
}

export interface UpdateDocumentParams {
  ids: string[];
  embeddings?: number[][];
  metadatas?: Record<string, any>[];
  documents?: string[];
}

export interface AddDocumentParams {
  documents: string[];
  ids: string[];
  metadatas?: Record<string, any>[];
  embeddings?: number[][];
}