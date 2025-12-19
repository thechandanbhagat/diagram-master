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
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'create_flowchart',
          description: 'Create a flowchart diagram with sequential steps. Supports process boxes, decision diamonds, terminators, and connectors.',
          inputSchema: {
            type: 'object',
            properties: {
              filename: {
                type: 'string',
                description: 'Name for the output .drawio file (extension will be added automatically)',
              },
              steps: {
                type: 'array',
                description: 'Array of flowchart steps',
                items: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      description: 'Optional unique identifier for the step (used for connections)',
                    },
                    label: {
                      type: 'string',
                      description: 'Text label for the step',
                    },
                    type: {
                      type: 'string',
                      enum: ['process', 'decision', 'terminator', 'data', 'document', 'delay'],
                      description: 'Shape type for the step',
                    },
                    connectorLabel: {
                      type: 'string',
                      description: 'Optional label for the connector to this step (for sequential flow)',
                    },
                  },
                  required: ['label'],
                },
              },
              connections: {
                type: 'array',
                description: 'Optional array of explicit connections between steps. If provided, overrides sequential flow.',
                items: {
                  type: 'object',
                  properties: {
                    from: {
                      type: 'string',
                      description: 'Source step ID',
                    },
                    to: {
                      type: 'string',
                      description: 'Target step ID',
                    },
                    label: {
                      type: 'string',
                      description: 'Connection label',
                    },
                  },
                  required: ['from', 'to'],
                },
              },
            },
            required: ['filename', 'steps'],
          },
        },
        {
          name: 'create_sequence_diagram',
          description: 'Create a UML sequence diagram showing interactions between participants/actors.',
          inputSchema: {
            type: 'object',
            properties: {
              filename: {
                type: 'string',
                description: 'Name for the output .drawio file (extension will be added automatically)',
              },
              participants: {
                type: 'array',
                description: 'Array of participant names',
                items: { type: 'string' },
              },
              interactions: {
                type: 'array',
                description: 'Array of interactions between participants',
                items: {
                  type: 'object',
                  properties: {
                    from: {
                      type: 'string',
                      description: 'Source participant name',
                    },
                    to: {
                      type: 'string',
                      description: 'Target participant name',
                    },
                    message: {
                      type: 'string',
                      description: 'Message/interaction label',
                    },
                    dashed: {
                      type: 'boolean',
                      description: 'Use dashed line for return messages',
                    },
                  },
                  required: ['from', 'to', 'message'],
                },
              },
            },
            required: ['filename', 'participants', 'interactions'],
          },
        },
        {
          name: 'create_network_diagram',
          description: 'Create a network or architecture diagram with custom positioned nodes and connections.',
          inputSchema: {
            type: 'object',
            properties: {
              filename: {
                type: 'string',
                description: 'Name for the output .drawio file (extension will be added automatically)',
              },
              nodes: {
                type: 'array',
                description: 'Array of network nodes',
                items: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      description: 'Unique identifier for the node',
                    },
                    label: {
                      type: 'string',
                      description: 'Display label for the node',
                    },
                    type: {
                      type: 'string',
                      enum: ['rectangle', 'cylinder', 'database', 'cloud', 'hexagon', 'ellipse'],
                      description: 'Shape type for the node',
                    },
                    x: {
                      type: 'number',
                      description: 'X coordinate position',
                    },
                    y: {
                      type: 'number',
                      description: 'Y coordinate position',
                    },
                  },
                  required: ['id', 'label', 'x', 'y'],
                },
              },
              connections: {
                type: 'array',
                description: 'Array of connections between nodes',
                items: {
                  type: 'object',
                  properties: {
                    from: {
                      type: 'string',
                      description: 'Source node ID',
                    },
                    to: {
                      type: 'string',
                      description: 'Target node ID',
                    },
                    label: {
                      type: 'string',
                      description: 'Connection label',
                    },
                  },
                  required: ['from', 'to'],
                },
              },
            },
            required: ['filename', 'nodes', 'connections'],
          },
        },
        {
          name: 'create_custom_diagram',
          description: 'Create a custom diagram with full control over shapes and connectors. Use this for any diagram type not covered by other tools.',
          inputSchema: {
            type: 'object',
            properties: {
              filename: {
                type: 'string',
                description: 'Name for the output .drawio file (extension will be added automatically)',
              },
              shapes: {
                type: 'array',
                description: 'Array of shapes to create',
                items: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      description: 'Unique identifier for referencing in connections',
                    },
                    label: {
                      type: 'string',
                      description: 'Text label for the shape',
                    },
                    type: {
                      type: 'string',
                      enum: [
                        'rectangle',
                        'roundedRectangle',
                        'ellipse',
                        'diamond',
                        'parallelogram',
                        'cylinder',
                        'hexagon',
                        'cloud',
                        'document',
                        'process',
                        'decision',
                        'data',
                        'terminator',
                        'database',
                        'actor',
                        'note',
                      ],
                      description: 'Shape type',
                    },
                    x: {
                      type: 'number',
                      description: 'X coordinate',
                    },
                    y: {
                      type: 'number',
                      description: 'Y coordinate',
                    },
                    width: {
                      type: 'number',
                      description: 'Shape width (default: 120)',
                    },
                    height: {
                      type: 'number',
                      description: 'Shape height (default: 60)',
                    },
                  },
                  required: ['id', 'label', 'type', 'x', 'y'],
                },
              },
              connectors: {
                type: 'array',
                description: 'Array of connectors between shapes',
                items: {
                  type: 'object',
                  properties: {
                    from: {
                      type: 'string',
                      description: 'Source shape ID',
                    },
                    to: {
                      type: 'string',
                      description: 'Target shape ID',
                    },
                    label: {
                      type: 'string',
                      description: 'Connector label',
                    },
                  },
                  required: ['from', 'to'],
                },
              },
            },
            required: ['filename', 'shapes'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case 'create_flowchart':
            return this.handleCreateFlowchart(args);

          case 'create_sequence_diagram':
            return this.handleCreateSequenceDiagram(args);

          case 'create_network_diagram':
            return this.handleCreateNetworkDiagram(args);

          case 'create_custom_diagram':
            return this.handleCreateCustomDiagram(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  handleCreateFlowchart(args) {
    const xml = this.generator.createFlowchart(args.steps, args.connections);
    const filePath = this.saveToFile(args.filename, xml);
    return {
      content: [
        {
          type: 'text',
          text: `Flowchart diagram created successfully and saved to: ${filePath}\n\nYou can open this file directly in Draw.io.`,
        },
      ],
    };
  }

  handleCreateSequenceDiagram(args) {
    const xml = this.generator.createSequenceDiagram(args.participants, args.interactions);
    const filePath = this.saveToFile(args.filename, xml);
    return {
      content: [
        {
          type: 'text',
          text: `Sequence diagram created successfully and saved to: ${filePath}\n\nYou can open this file directly in Draw.io.`,
        },
      ],
    };
  }

  handleCreateNetworkDiagram(args) {
    const xml = this.generator.createNetworkDiagram(args.nodes, args.connections);
    const filePath = this.saveToFile(args.filename, xml);
    return {
      content: [
        {
          type: 'text',
          text: `Network diagram created successfully and saved to: ${filePath}\n\nYou can open this file directly in Draw.io.`,
        },
      ],
    };
  }

  handleCreateCustomDiagram(args) {
    const elements = [];
    const shapeIds = {};

    // Create shapes
    if (args.shapes) {
      for (const shape of args.shapes) {
        const element = this.generator.createShape(
          shape.label,
          shape.type,
          shape.x,
          shape.y,
          shape.width,
          shape.height
        );
        elements.push(element);
        shapeIds[shape.id] = element.id;
      }
    }

    // Create connectors
    if (args.connectors) {
      for (const conn of args.connectors) {
        const sourceId = shapeIds[conn.from];
        const targetId = shapeIds[conn.to];

        if (sourceId && targetId) {
          const connector = this.generator.createConnector(sourceId, targetId, conn.label || '');
          elements.push(connector);
        }
      }
    }

    const xml = this.generator.generateDiagram(elements);
    const filePath = this.saveToFile(args.filename, xml);
    return {
      content: [
        {
          type: 'text',
          text: `Custom diagram created successfully and saved to: ${filePath}\n\nYou can open this file directly in Draw.io.`,
        },
      ],
    };
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
