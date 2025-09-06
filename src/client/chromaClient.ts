/**
 * ChromaDB Client Manager for TypeScript MCP Server
 */

import { ChromaClient, CloudClient } from 'chromadb';
import { ChromaConfig } from '../types/chroma.js';
import dotenv from 'dotenv';

export class ChromaClientManager {
  private static instance: ChromaClientManager;
  private client: ChromaClient | null = null;
  private config: ChromaConfig | null = null;

  private constructor() {}

  public static getInstance(): ChromaClientManager {
    if (!ChromaClientManager.instance) {
      ChromaClientManager.instance = new ChromaClientManager();
    }
    return ChromaClientManager.instance;
  }

  public async getClient(config?: ChromaConfig): Promise<ChromaClient> {
    if (!this.client || (config && this.configChanged(config))) {
      if (config) {
        this.config = config;
      }
      if (!this.config) {
        throw new Error('ChromaDB configuration is required');
      }
      this.client = await this.createClient(this.config);
    }
    return this.client;
  }

  private configChanged(newConfig: ChromaConfig): boolean {
    if (!this.config) return true;
    return JSON.stringify(this.config) !== JSON.stringify(newConfig);
  }

  private async createClient(config: ChromaConfig): Promise<ChromaClient> {
    // Load environment variables if dotenv path is specified
    if (config.dotenvPath) {
      dotenv.config({ path: config.dotenvPath });
    }

    switch (config.clientType) {
      case 'http':
        return this.createHttpClient(config);
      case 'cloud':
        return this.createCloudClient(config);
      case 'persistent':
        return this.createPersistentClient(config);
      case 'ephemeral':
        return this.createEphemeralClient();
      default:
        throw new Error(`Unknown client type: ${config.clientType}`);
    }
  }

  private async createHttpClient(config: ChromaConfig): Promise<ChromaClient> {
    if (!config.host) {
      throw new Error('Host must be provided when using HTTP client');
    }

    const clientConfig: any = {
      path: `http${config.ssl ? 's' : ''}://${config.host}${config.port ? ':' + config.port : ''}`,
    };

    if (config.customAuthCredentials) {
      clientConfig.auth = {
        provider: 'basic',
        credentials: config.customAuthCredentials,
      };
    }

    if (config.tenant && config.database) {
      clientConfig.tenant = config.tenant;
      clientConfig.database = config.database;
    }

    try {
      return new ChromaClient(clientConfig);
    } catch (error) {
      throw new Error(`Failed to create HTTP client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createCloudClient(config: ChromaConfig): Promise<ChromaClient> {
    if (!config.tenant) {
      throw new Error('Tenant must be provided when using cloud client');
    }
    if (!config.database) {
      throw new Error('Database must be provided when using cloud client');
    }
    if (!config.apiKey) {
      throw new Error('API key must be provided when using cloud client');
    }

    try {
      return new CloudClient({
        tenant: config.tenant,
        database: config.database,
        apiKey: config.apiKey,
      });
    } catch (error) {
      throw new Error(`Failed to create cloud client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createPersistentClient(config: ChromaConfig): Promise<ChromaClient> {
    if (!config.dataDir) {
      throw new Error('Data directory must be provided when using persistent client');
    }

    try {
      return new ChromaClient({
        path: config.dataDir,
      });
    } catch (error) {
      throw new Error(`Failed to create persistent client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createEphemeralClient(): Promise<ChromaClient> {
    try {
      return new ChromaClient();
    } catch (error) {
      throw new Error(`Failed to create ephemeral client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public reset(): void {
    this.client = null;
    this.config = null;
  }
}

// Export singleton instance
export const chromaClientManager = ChromaClientManager.getInstance();