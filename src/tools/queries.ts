/**
 * Query and Search Tools for Chroma MCP Server
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { chromaClientManager } from '../client/chromaClient.js';
import { DefaultEmbeddingFunction } from 'chromadb';

export function registerQueryTools(server: McpServer) {
  // Query Documents
  server.tool(
    'queryDocuments',
    'Query documents from a Chroma collection with advanced filtering',
    {
      collectionName: z.string().describe('Name of the collection to query'),
      queryTexts: z.array(z.string()).describe('List of query texts to search for'),
      nResults: z.number().optional().default(5).describe('Number of results to return per query'),
      where: z.record(z.any()).optional().describe(`Optional metadata filters using Chroma's query operators.
Examples:
- Simple equality: {"metadata_field": "value"}
- Comparison: {"metadata_field": {"$gt": 5}}
- Logical AND: {"$and": [{"field1": {"$eq": "value1"}}, {"field2": {"$gt": 5}}]}
- Logical OR: {"$or": [{"field1": {"$eq": "value1"}}, {"field1": {"$eq": "value2"}}]}`),
      whereDocument: z.record(z.any()).optional().describe(`Optional document content filters.
Examples:
- Contains: {"$contains": "value"}
- Not contains: {"$not_contains": "value"}
- Regex: {"$regex": "[a-z]+"}
- Not regex: {"$not_regex": "[a-z]+"}
- Logical AND: {"$and": [{"$contains": "value1"}, {"$not_regex": "[a-z]+"}]}
- Logical OR: {"$or": [{"$regex": "[a-z]+"}, {"$not_contains": "value2"}]}`),
      include: z.array(z.string()).optional().default(['documents', 'metadatas', 'distances']).describe('List of what to include in response'),
    },
    async ({ collectionName, queryTexts, nResults = 5, where, whereDocument, include = ['documents', 'metadatas', 'distances'] }) => {
      if (!queryTexts || queryTexts.length === 0) {
        throw new Error("The 'queryTexts' list cannot be empty.");
      }

      try {
        const client = await chromaClientManager.getClient();
        const collection = await client.getCollection({ 
          name: collectionName,
          embeddingFunction: new DefaultEmbeddingFunction()
        });

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
  server.tool(
    'similaritySearch',
    'Find similar documents using semantic search',
    {
      collectionName: z.string().describe('Name of the collection to search'),
      queryText: z.string().describe('Query text to search for similar documents'),
      nResults: z.number().optional().default(5).describe('Number of results to return'),
      where: z.record(z.any()).optional().describe('Optional metadata filters'),
      whereDocument: z.record(z.any()).optional().describe('Optional document content filters'),
      include: z.array(z.string()).optional().default(['documents', 'metadatas', 'distances']).describe('List of what to include in response'),
    },
    async ({ collectionName, queryText, nResults = 5, where, whereDocument, include = ['documents', 'metadatas', 'distances'] }) => {
      if (!queryText || queryText.trim() === '') {
        throw new Error("The 'queryText' cannot be empty.");
      }

      try {
        const client = await chromaClientManager.getClient();
        const collection = await client.getCollection({ 
          name: collectionName,
          embeddingFunction: new DefaultEmbeddingFunction()
        });

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
  server.tool(
    'getNearest',
    'Get nearest neighbors using embedding vector',
    {
      collectionName: z.string().describe('Name of the collection to search'),
      queryEmbedding: z.array(z.number()).describe('Query embedding vector to search for nearest neighbors'),
      nResults: z.number().optional().default(5).describe('Number of results to return'),
      where: z.record(z.any()).optional().describe('Optional metadata filters'),
      whereDocument: z.record(z.any()).optional().describe('Optional document content filters'),
      include: z.array(z.string()).optional().default(['documents', 'metadatas', 'distances']).describe('List of what to include in response'),
    },
    async ({ collectionName, queryEmbedding, nResults = 5, where, whereDocument, include = ['documents', 'metadatas', 'distances'] }) => {
      if (!queryEmbedding || queryEmbedding.length === 0) {
        throw new Error("The 'queryEmbedding' cannot be empty.");
      }

      try {
        const client = await chromaClientManager.getClient();
        const collection = await client.getCollection({ 
          name: collectionName,
          embeddingFunction: new DefaultEmbeddingFunction()
        });

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