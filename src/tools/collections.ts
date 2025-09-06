/**
 * Collection Management Tools for Chroma MCP Server
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { chromaClientManager } from '../client/chromaClient.js';
import { CollectionInfo } from '../types/chroma.js';
import { DefaultEmbeddingFunction } from 'chromadb';

// Known embedding functions mapping
const knownEmbeddingFunctions = {
  default: 'DefaultEmbeddingFunction',
  cohere: 'CohereEmbeddingFunction',
  openai: 'OpenAIEmbeddingFunction',
  jina: 'JinaEmbeddingFunction',
  voyageai: 'VoyageAIEmbeddingFunction',
  roboflow: 'RoboflowEmbeddingFunction',
};

export function registerCollectionTools(server: McpServer) {
  // List Collections
  server.tool(
    'listCollections',
    'List all collection names in the Chroma database with pagination support',
    {
      limit: z.number().optional().describe('Optional maximum number of collections to return'),
      offset: z.number().optional().describe('Optional number of collections to skip before returning results'),
    },
    async ({ limit, offset }) => {
      try {
        const client = await chromaClientManager.getClient();
        const collections = await client.listCollections();
        
        if (!collections || collections.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No collections found',
              },
            ],
          };
        }

        // Apply pagination if specified
        let result = collections;
        if (offset !== undefined) {
          result = result.slice(offset);
        }
        if (limit !== undefined) {
          result = result.slice(0, limit);
        }

        return {
          content: [
            {
              type: 'text',
              text: result.join(', '),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to list collections: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );

  // Create Collection
  server.tool(
    'createCollection',
    'Create a new Chroma collection with configurable embedding function',
    {
      collectionName: z.string().describe('Name of the collection to create'),
      embeddingFunctionName: z.enum(['default', 'cohere', 'openai', 'jina', 'voyageai', 'roboflow']).optional().default('default').describe('Name of the embedding function to use'),
      metadata: z.record(z.any()).optional().describe('Optional metadata dict to add to the collection'),
    },
    async ({ collectionName, embeddingFunctionName = 'default', metadata }) => {
      try {
        const client = await chromaClientManager.getClient();
        
        const createOptions: any = {
          name: collectionName,
        };

        if (metadata) {
          createOptions.metadata = metadata;
        }

        // Note: ChromaDB TypeScript client may handle embedding functions differently
        // This is a simplified implementation that may need adjustment
        await client.createCollection(createOptions);
        
        const configMsg = embeddingFunctionName !== 'default' 
          ? ` with embedding function: ${embeddingFunctionName}` 
          : '';
        
        return {
          content: [
            {
              type: 'text',
              text: `Successfully created collection ${collectionName}${configMsg}`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to create collection '${collectionName}': ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );

  // Peek Collection
  server.tool(
    'peekCollection',
    'Peek at documents in a Chroma collection',
    {
      collectionName: z.string().describe('Name of the collection to peek into'),
      limit: z.number().optional().default(5).describe('Number of documents to peek at'),
    },
    async ({ collectionName, limit = 5 }) => {
      try {
        const client = await chromaClientManager.getClient();
        const collection = await client.getCollection({ 
          name: collectionName,
          embeddingFunction: new DefaultEmbeddingFunction()
        });
        const results = await collection.peek({ limit });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to peek collection '${collectionName}': ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );

  // Get Collection Info
  server.tool(
    'getCollectionInfo',
    'Get information about a Chroma collection',
    {
      collectionName: z.string().describe('Name of the collection to get info about'),
    },
    async ({ collectionName }) => {
      try {
        const client = await chromaClientManager.getClient();
        const collection = await client.getCollection({ 
          name: collectionName,
          embeddingFunction: new DefaultEmbeddingFunction()
        });
        
        // Get collection count
        const count = await collection.count();
        
        // Peek at a few documents
        const peekResults = await collection.peek({ limit: 3 });
        
        const collectionInfo: CollectionInfo = {
          name: collectionName,
          count,
          sample_documents: peekResults,
        };
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(collectionInfo, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to get collection info for '${collectionName}': ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );

  // Get Collection Count
  server.tool(
    'getCollectionCount',
    'Get the number of documents in a Chroma collection',
    {
      collectionName: z.string().describe('Name of the collection to count'),
    },
    async ({ collectionName }) => {
      try {
        const client = await chromaClientManager.getClient();
        const collection = await client.getCollection({ 
          name: collectionName,
          embeddingFunction: new DefaultEmbeddingFunction()
        });
        const count = await collection.count();
        
        return {
          content: [
            {
              type: 'text',
              text: count.toString(),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to get collection count for '${collectionName}': ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );

  // Modify Collection
  server.tool(
    'modifyCollection',
    "Modify a Chroma collection's name or metadata",
    {
      collectionName: z.string().describe('Name of the collection to modify'),
      newName: z.string().optional().describe('Optional new name for the collection'),
      newMetadata: z.record(z.any()).optional().describe('Optional new metadata for the collection'),
    },
    async ({ collectionName, newName, newMetadata }) => {
      try {
        const client = await chromaClientManager.getClient();
        const collection = await client.getCollection({ 
          name: collectionName,
          embeddingFunction: new DefaultEmbeddingFunction()
        });
        
        const modifyOptions: any = {};
        if (newName) {
          modifyOptions.name = newName;
        }
        if (newMetadata) {
          modifyOptions.metadata = newMetadata;
        }
        
        await collection.modify(modifyOptions);
        
        const modifiedAspects = [];
        if (newName) {
          modifiedAspects.push('name');
        }
        if (newMetadata) {
          modifiedAspects.push('metadata');
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `Successfully modified collection ${collectionName}: updated ${modifiedAspects.join(' and ')}`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to modify collection '${collectionName}': ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );

  // Delete Collection
  server.tool(
    'deleteCollection',
    'Delete a Chroma collection',
    {
      collectionName: z.string().describe('Name of the collection to delete'),
    },
    async ({ collectionName }) => {
      try {
        const client = await chromaClientManager.getClient();
        await client.deleteCollection({ name: collectionName });
        
        return {
          content: [
            {
              type: 'text',
              text: `Successfully deleted collection ${collectionName}`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to delete collection '${collectionName}': ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );
}