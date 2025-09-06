/**
 * Basic test for Chroma MCP TypeScript Server
 */

import { chromaClientManager } from '../src/client/chromaClient.js';
import { ChromaConfig } from '../src/types/chroma.js';

async function testBasicFunctionality() {
  console.log('Testing Chroma MCP TypeScript Server...');

  try {
    // Test ephemeral client creation
    const config: ChromaConfig = {
      clientType: 'ephemeral'
    };

    const client = await chromaClientManager.getClient(config);
    console.log('✅ Successfully created ephemeral ChromaDB client');

    // Test basic operations
    const collections = await client.listCollections();
    console.log('✅ Successfully listed collections:', collections);

    // Test creating a collection
    const testCollection = await client.createCollection({
      name: 'test-collection-ts'
    });
    console.log('✅ Successfully created test collection');

    // Test listing collections again
    const collectionsAfter = await client.listCollections();
    console.log('✅ Collections after creation:', collectionsAfter);

    // Clean up
    await client.deleteCollection({ name: 'test-collection-ts' });
    console.log('✅ Successfully deleted test collection');

    console.log('\n🎉 All tests passed! TypeScript implementation is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run the test
testBasicFunctionality();