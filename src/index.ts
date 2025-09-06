#!/usr/bin/env node

/**
 * Chroma MCP Server - TypeScript Implementation
 * Main entry point for the Model Context Protocol server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Command } from 'commander';
import dotenv from 'dotenv';
import { chromaClientManager } from './client/chromaClient.js';
import { registerCollectionTools } from './tools/collections.js';
import { registerDocumentTools } from './tools/documents.js';
import { registerQueryTools } from './tools/queries.js';
import { ChromaConfig } from './types/chroma.js';

// Create command line interface
const program = new Command();

program
  .name('chroma-mcp-ts')
  .description('TypeScript implementation of Chroma MCP Server')
  .version('1.0.0')
  .option('--client-type <type>', 'Type of Chroma client to use', 'ephemeral')
  .option('--data-dir <dir>', 'Directory for persistent client data')
  .option('--host <host>', 'Chroma host (required for http client)')
  .option('--port <port>', 'Chroma port (optional for http client)', parseInt)
  .option('--custom-auth-credentials <credentials>', 'Custom auth credentials')
  .option('--tenant <tenant>', 'Chroma tenant (optional for http client)')
  .option('--database <database>', 'Chroma database (required if tenant is provided)')
  .option('--api-key <key>', 'Chroma API key (required if tenant is provided)')
  .option('--ssl', 'Use SSL (optional for http client)', false)
  .option('--dotenv-path <path>', 'Path to .env file', '.chroma_env');

// Parse environment variables
function parseEnvironmentConfig(): ChromaConfig {
  const config: ChromaConfig = {
    clientType: (process.env.CHROMA_CLIENT_TYPE as any) || 'ephemeral',
    host: process.env.CHROMA_HOST,
    port: process.env.CHROMA_PORT ? parseInt(process.env.CHROMA_PORT) : undefined,
    ssl: process.env.CHROMA_SSL?.toLowerCase() === 'true',
    tenant: process.env.CHROMA_TENANT,
    database: process.env.CHROMA_DATABASE,
    apiKey: process.env.CHROMA_API_KEY,
    dataDir: process.env.CHROMA_DATA_DIR,
    customAuthCredentials: process.env.CHROMA_CUSTOM_AUTH_CREDENTIALS,
    dotenvPath: process.env.CHROMA_DOTENV_PATH || '.chroma_env',
  };

  return config;
}

// Validate configuration based on client type
function validateConfig(config: ChromaConfig): void {
  switch (config.clientType) {
    case 'http':
      if (!config.host) {
        throw new Error('Host must be provided via --host flag or CHROMA_HOST environment variable when using HTTP client');
      }
      break;
    case 'cloud':
      if (!config.tenant) {
        throw new Error('Tenant must be provided via --tenant flag or CHROMA_TENANT environment variable when using cloud client');
      }
      if (!config.database) {
        throw new Error('Database must be provided via --database flag or CHROMA_DATABASE environment variable when using cloud client');
      }
      if (!config.apiKey) {
        throw new Error('API key must be provided via --api-key flag or CHROMA_API_KEY environment variable when using cloud client');
      }
      break;
    case 'persistent':
      if (!config.dataDir) {
        throw new Error('Data directory must be provided via --data-dir flag when using persistent client');
      }
      break;
    case 'ephemeral':
      // No additional validation needed for ephemeral client
      break;
    default:
      throw new Error(`Unknown client type: ${config.clientType}`);
  }
}

// Initialize the MCP server
async function initializeServer(): Promise<Server> {
  const server = new Server(
    {
      name: 'chroma-mcp-ts',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register all tool categories
  registerCollectionTools(server);
  registerDocumentTools(server);
  registerQueryTools(server);

  return server;
}

// Main function
async function main() {
  try {
    program.parse();
    const options = program.opts();

    // Load environment variables from .env file if it exists
    if (options.dotenvPath) {
      dotenv.config({ path: options.dotenvPath });
    }

    // Merge command line options with environment variables
    const envConfig = parseEnvironmentConfig();
    const config: ChromaConfig = {
      clientType: options.clientType || envConfig.clientType,
      host: options.host || envConfig.host,
      port: options.port || envConfig.port,
      ssl: options.ssl || envConfig.ssl,
      tenant: options.tenant || envConfig.tenant,
      database: options.database || envConfig.database,
      apiKey: options.apiKey || envConfig.apiKey,
      dataDir: options.dataDir || envConfig.dataDir,
      customAuthCredentials: options.customAuthCredentials || envConfig.customAuthCredentials,
      dotenvPath: options.dotenvPath || envConfig.dotenvPath,
    };

    // Validate configuration
    validateConfig(config);

    // Initialize ChromaDB client
    try {
      await chromaClientManager.getClient(config);
      console.error('Successfully initialized Chroma client');
    } catch (error) {
      console.error(`Failed to initialize Chroma client: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }

    // Initialize MCP server
    const server = await initializeServer();

    // Create stdio transport and start server
    const transport = new StdioServerTransport();
    console.error('Starting Chroma MCP Server (TypeScript)');
    
    await server.connect(transport);
    
    console.error('Chroma MCP Server is running');
    
  } catch (error) {
    console.error(`Error starting server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.error('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

// Run the server
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`Unhandled error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  });
}