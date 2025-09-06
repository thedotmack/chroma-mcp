# Chroma MCP Server - TypeScript Implementation

A TypeScript implementation of the Chroma MCP (Model Context Protocol) Server that provides tools for interacting with ChromaDB vector databases.

## Features

✅ **Complete Tool Parity** - All Python tools converted to TypeScript
✅ **Type Safety** - Full TypeScript type definitions and validation  
✅ **Modern Architecture** - Built with official MCP SDK and ChromaDB client
✅ **Multiple Client Types** - Support for HTTP, Cloud, Persistent, and Ephemeral clients
✅ **Comprehensive Error Handling** - Proper error reporting and validation
✅ **Environment Configuration** - Flexible configuration via CLI args or environment variables

## Tools Available

### Collection Management
- `listCollections` - List all collections with pagination
- `createCollection` - Create new collections with embedding functions
- `getCollectionInfo` - Get collection metadata and stats
- `getCollectionCount` - Get document count in collection
- `peekCollection` - Preview collection contents  
- `modifyCollection` - Update collection name/metadata
- `deleteCollection` - Remove collections

### Document Operations
- `addDocuments` - Add documents with IDs and metadata
- `getDocuments` - Retrieve documents with filtering
- `updateDocuments` - Update existing documents
- `deleteDocuments` - Remove documents by ID

### Query & Search
- `queryDocuments` - Semantic search with advanced filtering
- `similaritySearch` - Find similar documents
- `getNearest` - Get nearest neighbors by embedding

## Installation

```bash
# Install dependencies
npm install

# Build the TypeScript code
npm run build

# Run the server
npm start
```

## Usage

### Basic Usage
```bash
# Start with ephemeral client (in-memory)
node dist/index.js

# Start with persistent client
node dist/index.js --client-type persistent --data-dir ./chroma-data

# Start with HTTP client
node dist/index.js --client-type http --host localhost --port 8000
```

### Configuration Options

| Option | Environment Variable | Description |
|--------|---------------------|-------------|
| `--client-type` | `CHROMA_CLIENT_TYPE` | Client type: `ephemeral`, `persistent`, `http`, `cloud` |
| `--host` | `CHROMA_HOST` | ChromaDB server host |
| `--port` | `CHROMA_PORT` | ChromaDB server port |
| `--data-dir` | `CHROMA_DATA_DIR` | Data directory for persistent client |
| `--tenant` | `CHROMA_TENANT` | Tenant for cloud client |
| `--database` | `CHROMA_DATABASE` | Database for cloud client |
| `--api-key` | `CHROMA_API_KEY` | API key for cloud client |
| `--ssl` | `CHROMA_SSL` | Use SSL connection |

### Environment File
Create a `.chroma_env` file:
```env
CHROMA_CLIENT_TYPE=http
CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_SSL=false
```

## Development

```bash
# Install dependencies
npm install

# Development mode with watch
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## Architecture

```
src/
├── index.ts              # Main server entry point
├── client/
│   └── chromaClient.ts   # ChromaDB client manager
├── tools/
│   ├── collections.ts    # Collection management tools
│   ├── documents.ts      # Document operation tools
│   └── queries.ts        # Query and search tools
└── types/
    └── chroma.ts         # TypeScript type definitions
```

## Comparison with Python Version

| Feature | Python | TypeScript | Status |
|---------|---------|------------|--------|
| Collection Tools | ✅ | ✅ | **Complete Parity** |
| Document Tools | ✅ | ✅ | **Complete Parity** |
| Query Tools | ✅ | ✅ | **Complete Parity** |
| Client Types | ✅ | ✅ | **Complete Parity** |
| Error Handling | ✅ | ✅ | **Improved** |
| Type Safety | ❌ | ✅ | **Enhanced** |
| Modern Tooling | ❌ | ✅ | **Enhanced** |

## Benefits of TypeScript Version

### 🛡️ **Type Safety**
- Compile-time error detection
- Auto-completion and IntelliSense
- Refactoring safety

### 🔧 **Modern Development Experience**
- ESLint for code quality
- Prettier for formatting
- Jest for testing
- Hot reload development

### 📦 **Better Ecosystem**
- Official MCP TypeScript SDK
- Rich npm ecosystem
- Modern JavaScript features

### 🚀 **Performance & Reliability**
- V8 JavaScript engine optimization
- Memory-efficient async operations
- Robust error handling

## Example Usage

```typescript
// Using the MCP client to interact with the server
const client = new MCPClient();

// List all collections
const collections = await client.callTool('listCollections', {});

// Create a new collection
await client.callTool('createCollection', {
  collectionName: 'my-docs',
  embeddingFunctionName: 'openai'
});

// Add documents
await client.callTool('addDocuments', {
  collectionName: 'my-docs',
  documents: ['Hello world', 'TypeScript is great'],
  ids: ['doc1', 'doc2'],
  metadatas: [{ type: 'greeting' }, { type: 'opinion' }]
});

// Query documents
const results = await client.callTool('queryDocuments', {
  collectionName: 'my-docs',
  queryTexts: ['programming languages'],
  nResults: 5
});
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper TypeScript types
4. Add tests for new functionality  
5. Run linting and formatting
6. Submit a pull request

## License

MIT License - see LICENSE file for details.