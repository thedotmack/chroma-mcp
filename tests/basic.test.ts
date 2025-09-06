/**
 * Basic test for Chroma MCP TypeScript Server
 */

import { chromaClientManager } from '../src/client/chromaClient.js';
import { ChromaConfig } from '../src/types/chroma.js';

describe('Chroma MCP TypeScript Server', () => {
  test('should create ephemeral ChromaDB client', async () => {
    const config: ChromaConfig = {
      clientType: 'ephemeral'
    };

    const client = await chromaClientManager.getClient(config);
    expect(client).toBeDefined();
  });

  test('should list collections', async () => {
    const config: ChromaConfig = {
      clientType: 'ephemeral'
    };

    const client = await chromaClientManager.getClient(config);
    const collections = await client.listCollections();
    expect(Array.isArray(collections)).toBe(true);
  });

  test('should create and delete collection', async () => {
    const config: ChromaConfig = {
      clientType: 'ephemeral'
    };

    const client = await chromaClientManager.getClient(config);
    
    // Create collection
    const testCollection = await client.createCollection({
      name: 'test-collection-ts'
    });
    expect(testCollection).toBeDefined();

    // Verify it exists
    const collectionsAfter = await client.listCollections();
    expect(collectionsAfter.includes('test-collection-ts')).toBe(true);

    // Clean up
    await client.deleteCollection({ name: 'test-collection-ts' });
    
    // Verify it's deleted
    const collectionsEnd = await client.listCollections();
    expect(collectionsEnd.includes('test-collection-ts')).toBe(false);
  });
});