/**
 * Query and Search Tools for Chroma MCP Server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { chromaClientManager } from '../client/chromaClient.js';
import { DocumentQuery, QueryResult } from '../types/chroma.js';

export function registerQueryTools(server: Server) {
  // Query Documents
  server.registerTool(
    'queryDocuments',
    {
      title: 'Query Documents',
      description: 'Query documents from a Chroma collection with advanced filtering',
      inputSchema: {
        type: 'object',
        properties: {
          collectionName: {
            type: 'string',
            description: 'Name of the collection to query',
          },
          queryTexts: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of query texts to search for',
          },
          nResults: {
            type: 'number',
            description: 'Number of results to return per query',
            default: 5,
          },
          where: {
            type: 'object',
            description: `Optional metadata filters using Chroma's query operators.
Examples:
- Simple equality: {"metadata_field": "value"}
- Comparison: {"metadata_field": {"$gt": 5}}
- Logical AND: {"$and": [{"field1": {"$eq": "value1"}}, {"field2": {"$gt": 5}}]}
- Logical OR: {"$or": [{"field1": {"$eq": "value1"}}, {"field1": {"$eq": "value2"}}]}`,
          },
          whereDocument: {
            type: 'object',
            description: `Optional document content filters.
Examples:
- Contains: {"$contains": "value"}
- Not contains: {"$not_contains": "value"}
- Regex: {"$regex": "[a-z]+"}
- Not regex: {"$not_regex": "[a-z]+"}
- Logical AND: {"$and": [{"$contains": "value1"}, {"$not_regex": "[a-z]+"}]}
- Logical OR: {"$or": [{"$regex": "[a-z]+"}, {"$not_contains": "value2"}]}`,
          },
          include: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of what to include in response',
            default: ['documents', 'metadatas', 'distances'],
          },
        },
        required: ['collectionName', 'queryTexts'],
        additionalProperties: false,
      },
    },
    async ({ collectionName, queryTexts, nResults = 5, where, whereDocument, include = ['documents', 'metadatas', 'distances'] }) => {
      if (!queryTexts || queryTexts.length === 0) {
        throw new Error("The 'queryTexts' list cannot be empty.");
      }

      try {
        const client = await chromaClientManager.getClient();
        const collection = await client.getCollection({ name: collectionName });

        const queryParams: any = {
          queryTexts,
          nResults,
          include,
        };

        if (where) {
          queryParams.where = where;
        }
        if (whereDocument) {
          queryParams.whereDocument = whereDocument;
        }

        const results = await collection.query(queryParams);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to query documents from collection '${collectionName}': ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );

  // Similarity Search (alias for query with single text)
  server.registerTool(
    'similaritySearch',
    {
      title: 'Similarity Search',
      description: 'Find similar documents using semantic search',
      inputSchema: {
        type: 'object',
        properties: {
          collectionName: {
            type: 'string',
            description: 'Name of the collection to search',
          },
          queryText: {
            type: 'string',
            description: 'Query text to search for similar documents',
          },
          nResults: {
            type: 'number',
            description: 'Number of results to return',
            default: 5,
          },
          where: {
            type: 'object',
            description: 'Optional metadata filters',
          },
          whereDocument: {
            type: 'object',
            description: 'Optional document content filters',
          },
          include: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of what to include in response',
            default: ['documents', 'metadatas', 'distances'],
          },
        },
        required: ['collectionName', 'queryText'],
        additionalProperties: false,
      },
    },
    async ({ collectionName, queryText, nResults = 5, where, whereDocument, include = ['documents', 'metadatas', 'distances'] }) => {
      if (!queryText || queryText.trim() === '') {
        throw new Error("The 'queryText' cannot be empty.");
      }

      try {
        const client = await chromaClientManager.getClient();
        const collection = await client.getCollection({ name: collectionName });

        const queryParams: any = {
          queryTexts: [queryText],
          nResults,
          include,
        };

        if (where) {
          queryParams.where = where;
        }
        if (whereDocument) {
          queryParams.whereDocument = whereDocument;
        }

        const results = await collection.query(queryParams);

        // Simplify results for single query
        const simplifiedResults: any = {};
        if (results.ids && results.ids[0]) {
          simplifiedResults.ids = results.ids[0];
        }
        if (results.documents && results.documents[0]) {
          simplifiedResults.documents = results.documents[0];
        }
        if (results.metadatas && results.metadatas[0]) {
          simplifiedResults.metadatas = results.metadatas[0];
        }
        if (results.distances && results.distances[0]) {
          simplifiedResults.distances = results.distances[0];
        }
        if (results.embeddings && results.embeddings[0]) {
          simplifiedResults.embeddings = results.embeddings[0];
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(simplifiedResults, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to perform similarity search in collection '${collectionName}': ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );

  // Get Nearest Neighbors (alias for query with embedding)
  server.registerTool(
    'getNearest',
    {
      title: 'Get Nearest Neighbors',
      description: 'Get nearest neighbors using embedding vector',
      inputSchema: {
        type: 'object',
        properties: {
          collectionName: {
            type: 'string',
            description: 'Name of the collection to search',
          },
          queryEmbedding: {
            type: 'array',
            items: { type: 'number' },
            description: 'Query embedding vector to search for nearest neighbors',
          },
          nResults: {
            type: 'number',
            description: 'Number of results to return',
            default: 5,
          },
          where: {
            type: 'object',
            description: 'Optional metadata filters',
          },
          whereDocument: {
            type: 'object',
            description: 'Optional document content filters',
          },
          include: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of what to include in response',
            default: ['documents', 'metadatas', 'distances'],
          },
        },
        required: ['collectionName', 'queryEmbedding'],
        additionalProperties: false,
      },
    },
    async ({ collectionName, queryEmbedding, nResults = 5, where, whereDocument, include = ['documents', 'metadatas', 'distances'] }) => {
      if (!queryEmbedding || queryEmbedding.length === 0) {
        throw new Error("The 'queryEmbedding' cannot be empty.");
      }

      try {
        const client = await chromaClientManager.getClient();
        const collection = await client.getCollection({ name: collectionName });

        const queryParams: any = {
          queryEmbeddings: [queryEmbedding],
          nResults,
          include,
        };

        if (where) {
          queryParams.where = where;
        }
        if (whereDocument) {
          queryParams.whereDocument = whereDocument;
        }

        const results = await collection.query(queryParams);

        // Simplify results for single query
        const simplifiedResults: any = {};
        if (results.ids && results.ids[0]) {
          simplifiedResults.ids = results.ids[0];
        }
        if (results.documents && results.documents[0]) {
          simplifiedResults.documents = results.documents[0];
        }
        if (results.metadatas && results.metadatas[0]) {
          simplifiedResults.metadatas = results.metadatas[0];
        }
        if (results.distances && results.distances[0]) {
          simplifiedResults.distances = results.distances[0];
        }
        if (results.embeddings && results.embeddings[0]) {
          simplifiedResults.embeddings = results.embeddings[0];
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(simplifiedResults, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to get nearest neighbors in collection '${collectionName}': ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );
}