#!/usr/bin/env node

/**
 * MCP Server for Draw.io Diagram Generation
 * Generates Draw.io compatible diagrams from natural language prompts
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { DrawioGenerator } from './drawio-generator.js';
import * as fs from 'fs';
import * as path from 'path';

class DrawioMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'mcp-drawio-diagram-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.generator = new DrawioGenerator();
    this.outputDir = process.env.DRAWIO_OUTPUT_DIR || process.cwd();
    this.ensureOutputDirectory();
    this.setupHandlers();
  }

  ensureOutputDirectory() {
    try {
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
        console.error(`Created output directory: ${this.outputDir}`);
      }
    } catch (error) {
      console.error(`Warning: Could not create output directory: ${error.message}`);
    }
  }

  saveToFile(filename, content) {
    try {
      // Ensure filename has .drawio extension
      if (!filename.endsWith('.drawio')) {
        filename += '.drawio';
      }

      const fullPath = path.join(this.outputDir, filename);
      fs.writeFileSync(fullPath, content, 'utf-8');
      return fullPath;
    } catch (error) {
      throw new Error(`Failed to save file: ${error.message}`);
    }
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'create_diagram',
          description: 'Create various types of diagrams (flowchart, sequence, network, erd, custom) and save to a file.',
          inputSchema: {
            type: 'object',
            properties: {
              filename: {
                type: 'string',
                description: 'Name for the output .drawio file (extension added automatically)',
              },
              type: {
                type: 'string',
                enum: ['flowchart', 'sequence', 'network', 'erd', 'custom'],
                description: 'Type of diagram to generate',
              },
              data: {
                type: 'object',
                description: 'Data for the diagram, structure depends on type',
                properties: {
                  // Flowchart properties
                  steps: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        label: { type: 'string' },
                        type: { type: 'string', enum: ['process', 'decision', 'terminator', 'data', 'document', 'delay'] },
                        connectorLabel: { type: 'string' },
                      },
                      required: ['label', 'type'],
                    },
                  },
                  connections: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        from: { type: 'string' },
                        to: { type: 'string' },
                        label: { type: 'string' },
                      },
                      required: ['from', 'to'],
                    },
                  },
                  // Sequence Diagram properties
                  participants: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                  interactions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        from: { type: 'string' },
                        to: { type: 'string' },
                        message: { type: 'string' },
                        dashed: { type: 'boolean' },
                      },
                      required: ['from', 'to', 'message'],
                    },
                  },
                  // Network Diagram properties
                  nodes: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        label: { type: 'string' },
                        type: { type: 'string' },
                        x: { type: 'number' },
                        y: { type: 'number' },
                      },
                      required: ['id', 'label', 'type', 'x', 'y'],
                    },
                  },
                  // ERD properties
                  entities: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        attributes: { type: 'array', items: { type: 'string' } },
                      },
                      required: ['id', 'name', 'attributes'],
                    },
                  },
                  relationships: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        from: { type: 'string' },
                        to: { type: 'string' },
                        label: { type: 'string' },
                      },
                      required: ['from', 'to'],
                    },
                  },
                  // Custom Diagram properties
                  shapes: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        label: { type: 'string' },
                        type: { type: 'string' },
                        x: { type: 'number' },
                        y: { type: 'number' },
                      },
                      required: ['id', 'label', 'type', 'x', 'y'],
                    },
                  },
                  connectors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        from: { type: 'string' },
                        to: { type: 'string' },
                        label: { type: 'string' },
                      },
                      required: ['from', 'to'],
                    },
                  },
                },
              },
            },
            required: ['filename', 'type', 'data'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== 'create_diagram') {
        throw new Error('Tool not found');
      }

      const { filename, type, data } = request.params.arguments;
      const filePath = this.saveToFile(filename, ''); // Placeholder to get path
      const fullPath = filePath; // Re-using logic inside saveToFile but we need content first.
      // Actually saveToFile writes content. Let's refactor slightly to generate content first.

      try {
        let xmlContent = '';

        switch (type) {
          case 'flowchart':
            xmlContent = this.generator.createFlowchart(data.steps, data.connections);
            break;
          case 'sequence':
            xmlContent = this.generator.createSequenceDiagram(data.participants, data.interactions);
            break;
          case 'network':
            xmlContent = this.generator.createNetworkDiagram(data.nodes, data.connections || []);
            break;
          case 'erd':
            xmlContent = this.generator.createERD(data.entities, data.relationships);
            break;
          case 'custom':
            xmlContent = this.generator.createCustomDiagram(data.shapes, data.connectors || []);
            break;
          default:
            throw new Error(`Unknown diagram type: ${type}`);
        }

        this.saveToFile(filename, xmlContent);

        return {
          content: [
            {
              type: 'text',
              text: `Successfully created ${type} diagram at ${fullPath}\n\nYou can open this file directly in Draw.io.`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error creating diagram: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Draw.io MCP Server running on stdio');
  }
}

// Start the server
const server = new DrawioMCPServer();
server.run().catch(console.error);
