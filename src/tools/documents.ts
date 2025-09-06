/**
 * Document Operation Tools for Chroma MCP Server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { chromaClientManager } from '../client/chromaClient.js';
import { AddDocumentParams, UpdateDocumentParams, GetResult } from '../types/chroma.js';

export function registerDocumentTools(server: Server) {
  // Add Documents
  server.registerTool(
    'addDocuments',
    {
      title: 'Add Documents',
      description: 'Add documents to a Chroma collection',
      inputSchema: {
        type: 'object',
        properties: {
          collectionName: {
            type: 'string',
            description: 'Name of the collection to add documents to',
          },
          documents: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of text documents to add',
          },
          ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of IDs for the documents (required)',
          },
          metadatas: {
            type: 'array',
            items: { type: 'object' },
            description: 'Optional list of metadata dictionaries for each document',
          },
        },
        required: ['collectionName', 'documents', 'ids'],
        additionalProperties: false,
      },
    },
    async ({ collectionName, documents, ids, metadatas }) => {
      if (!documents || documents.length === 0) {
        throw new Error("The 'documents' list cannot be empty.");
      }

      if (!ids || ids.length === 0) {
        throw new Error("The 'ids' list is required and cannot be empty.");
      }

      // Check if there are empty strings in the ids list
      if (ids.some(id => !id.trim())) {
        throw new Error("IDs cannot be empty strings.");
      }

      if (ids.length !== documents.length) {
        throw new Error(`Number of ids (${ids.length}) must match number of documents (${documents.length}).`);
      }

      if (metadatas && metadatas.length !== documents.length) {
        throw new Error(`Number of metadatas (${metadatas.length}) must match number of documents (${documents.length}).`);
      }

      try {
        const client = await chromaClientManager.getClient();
        const collection = await client.getOrCreateCollection({ name: collectionName });

        // Check for duplicate IDs
        const existingDocuments = await collection.get({ ids });
        const existingIds = existingDocuments.ids;
        const duplicateIds = ids.filter(id => existingIds.includes(id));

        if (duplicateIds.length > 0) {
          throw new Error(
            `The following IDs already exist in collection '${collectionName}': ${duplicateIds.join(', ')}. ` +
            `Use 'updateDocuments' to update existing documents.`
          );
        }

        const addParams: any = {
          documents,
          ids,
        };

        if (metadatas) {
          addParams.metadatas = metadatas;
        }

        await collection.add(addParams);

        return {
          content: [
            {
              type: 'text',
              text: `Successfully added ${documents.length} documents to collection ${collectionName}`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to add documents to collection '${collectionName}': ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );

  // Get Documents
  server.registerTool(
    'getDocuments',
    {
      title: 'Get Documents',
      description: 'Get documents from a Chroma collection with optional filtering',
      inputSchema: {
        type: 'object',
        properties: {
          collectionName: {
            type: 'string',
            description: 'Name of the collection to get documents from',
          },
          ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional list of document IDs to retrieve',
          },
          where: {
            type: 'object',
            description: 'Optional metadata filters using Chroma query operators',
          },
          whereDocument: {
            type: 'object',
            description: 'Optional document content filters',
          },
          include: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of what to include in response',
            default: ['documents', 'metadatas'],
          },
          limit: {
            type: 'number',
            description: 'Optional maximum number of documents to return',
          },
          offset: {
            type: 'number',
            description: 'Optional number of documents to skip before returning results',
          },
        },
        required: ['collectionName'],
        additionalProperties: false,
      },
    },
    async ({ collectionName, ids, where, whereDocument, include = ['documents', 'metadatas'], limit, offset }) => {
      try {
        const client = await chromaClientManager.getClient();
        const collection = await client.getCollection({ name: collectionName });

        const getParams: any = {
          include,
        };

        if (ids) {
          getParams.ids = ids;
        }
        if (where) {
          getParams.where = where;
        }
        if (whereDocument) {
          getParams.whereDocument = whereDocument;
        }
        if (limit) {
          getParams.limit = limit;
        }
        if (offset) {
          getParams.offset = offset;
        }

        const results = await collection.get(getParams);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to get documents from collection '${collectionName}': ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );

  // Update Documents
  server.registerTool(
    'updateDocuments',
    {
      title: 'Update Documents',
      description: 'Update documents in a Chroma collection',
      inputSchema: {
        type: 'object',
        properties: {
          collectionName: {
            type: 'string',
            description: 'Name of the collection to update documents in',
          },
          ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of document IDs to update (required)',
          },
          embeddings: {
            type: 'array',
            items: {
              type: 'array',
              items: { type: 'number' },
            },
            description: 'Optional list of new embeddings for the documents',
          },
          metadatas: {
            type: 'array',
            items: { type: 'object' },
            description: 'Optional list of new metadata dictionaries for the documents',
          },
          documents: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional list of new text documents',
          },
        },
        required: ['collectionName', 'ids'],
        additionalProperties: false,
      },
    },
    async ({ collectionName, ids, embeddings, metadatas, documents }) => {
      if (!ids || ids.length === 0) {
        throw new Error("The 'ids' list cannot be empty.");
      }

      if (!embeddings && !metadatas && !documents) {
        throw new Error(
          "At least one of 'embeddings', 'metadatas', or 'documents' must be provided for update."
        );
      }

      // Ensure provided lists match the length of ids if they are not undefined
      if (embeddings && embeddings.length !== ids.length) {
        throw new Error("Length of 'embeddings' list must match length of 'ids' list.");
      }
      if (metadatas && metadatas.length !== ids.length) {
        throw new Error("Length of 'metadatas' list must match length of 'ids' list.");
      }
      if (documents && documents.length !== ids.length) {
        throw new Error("Length of 'documents' list must match length of 'ids' list.");
      }

      try {
        const client = await chromaClientManager.getClient();
        const collection = await client.getCollection({ name: collectionName });

        const updateParams: any = { ids };

        if (embeddings) {
          updateParams.embeddings = embeddings;
        }
        if (metadatas) {
          updateParams.metadatas = metadatas;
        }
        if (documents) {
          updateParams.documents = documents;
        }

        await collection.update(updateParams);

        return {
          content: [
            {
              type: 'text',
              text: `Successfully processed update request for ${ids.length} documents in collection '${collectionName}'. Note: Non-existent IDs are ignored by ChromaDB.`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to update documents in collection '${collectionName}': ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );

  // Delete Documents
  server.registerTool(
    'deleteDocuments',
    {
      title: 'Delete Documents',
      description: 'Delete documents from a Chroma collection',
      inputSchema: {
        type: 'object',
        properties: {
          collectionName: {
            type: 'string',
            description: 'Name of the collection to delete documents from',
          },
          ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of document IDs to delete',
          },
        },
        required: ['collectionName', 'ids'],
        additionalProperties: false,
      },
    },
    async ({ collectionName, ids }) => {
      if (!ids || ids.length === 0) {
        throw new Error("The 'ids' list cannot be empty.");
      }

      try {
        const client = await chromaClientManager.getClient();
        const collection = await client.getCollection({ name: collectionName });

        await collection.delete({ ids });

        return {
          content: [
            {
              type: 'text',
              text: `Successfully deleted ${ids.length} documents from collection '${collectionName}'. Note: Non-existent IDs are ignored by ChromaDB.`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to delete documents from collection '${collectionName}': ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );
}