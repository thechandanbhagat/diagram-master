# MCP Draw.io Diagram Server

A Model Context Protocol (MCP) server that generates Draw.io compatible diagrams from natural language prompts. This server enables AI assistants to create professional diagrams in XML format that can be opened directly in Draw.io.

## Features

- **Unified Interface**: Single tool (`create_diagram`) for all diagram types
- **Flowchart Generation**: Create sequential flowcharts with automatic hierarchical layout and branching support
- **Sequence Diagrams**: Generate professional UML sequence diagrams with lifelines and activation bars
- **Entity Relationship Diagrams (ERD)**: Create database schemas with entities and relationships
- **Network Diagrams**: Build network and architecture diagrams with custom node positioning
- **Custom Diagrams**: Full control over shapes, positions, and connections for any diagram type
- **Draw.io Compatible**: Outputs valid Draw.io XML format that can be imported directly

## Installation

1. Clone or download this repository
2. Install dependencies:

```bash
npm install
```

## Configuration

### Environment Variables

- **DRAWIO_OUTPUT_DIR**: (Optional) Specifies the directory where diagram files will be saved. If not set, files are saved to the current working directory.

Example:
```bash
export DRAWIO_OUTPUT_DIR=/path/to/diagrams  # Linux/macOS
set DRAWIO_OUTPUT_DIR=C:\diagrams          # Windows
```

## Usage with Claude Desktop

Add this server to your Claude Desktop configuration file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

### Basic Configuration

```json
{
  "mcpServers": {
    "diagram-master": {
      "command": "node",
      "args": ["D:\\TopSecret\\diagram-master\\index.js"]
    }
  }
}
```

### With Custom Output Directory

```json
{
  "mcpServers": {
    "diagram-master": {
      "command": "node",
      "args": ["D:\\TopSecret\\diagram-master\\index.js"],
      "env": {
        "DRAWIO_OUTPUT_DIR": "C:\\Users\\YourName\\Documents\\Diagrams"
      }
    }
  }
}
```

Make sure to update the paths to match your actual installation directory and desired output location.

## Available Tools

### create_diagram

Creates a diagram of the specified type and saves it to a file.

**Parameters:**
- `filename`: Name for the output .drawio file (extension added automatically)
- `type`: Type of diagram to generate (`flowchart`, `sequence`, `network`, `erd`, `custom`)
- `data`: Object containing diagram-specific data

#### 1. Flowchart
**Data Structure:**
- `steps`: Array of steps (`id`, `label`, `type`)
- `connections`: Array of connections (`from`, `to`, `label`)

**Example:**
```json
{
  "type": "flowchart",
  "filename": "login-flow",
  "data": {
    "steps": [
      { "id": "start", "label": "Start", "type": "terminator" },
      { "id": "input", "label": "Input Credentials", "type": "data" },
      { "id": "check", "label": "Valid?", "type": "decision" },
      { "id": "end", "label": "End", "type": "terminator" }
    ],
    "connections": [
      { "from": "start", "to": "input" },
      { "from": "input", "to": "check" },
      { "from": "check", "to": "end", "label": "Yes" },
      { "from": "check", "to": "input", "label": "No" }
    ]
  }
}
```

#### 2. Sequence Diagram
**Data Structure:**
- `participants`: Array of participant names
- `interactions`: Array of interactions (`from`, `to`, `message`, `dashed`)

**Example:**
```json
{
  "type": "sequence",
  "filename": "api-call",
  "data": {
    "participants": ["Client", "Server", "DB"],
    "interactions": [
      { "from": "Client", "to": "Server", "message": "Request" },
      { "from": "Server", "to": "DB", "message": "Query" },
      { "from": "DB", "to": "Server", "message": "Result", "dashed": true },
      { "from": "Server", "to": "Client", "message": "Response", "dashed": true }
    ]
  }
}
```

#### 3. Entity Relationship Diagram (ERD)
**Data Structure:**
- `entities`: Array of entities (`id`, `name`, `attributes`)
- `relationships`: Array of relationships (`from`, `to`, `label`)

**Example:**
```json
{
  "type": "erd",
  "filename": "schema",
  "data": {
    "entities": [
      { "id": "users", "name": "Users", "attributes": ["id", "email", "password"] },
      { "id": "posts", "name": "Posts", "attributes": ["id", "user_id", "title"] }
    ],
    "relationships": [
      { "from": "users", "to": "posts", "label": "1:N" }
    ]
  }
}
```

#### 4. Network Diagram
**Data Structure:**
- `nodes`: Array of nodes (`id`, `label`, `type`, `x`, `y`)
- `connections`: Array of connections (`from`, `to`, `label`)

#### 5. Custom Diagram
**Data Structure:**
- `shapes`: Array of shapes (`id`, `label`, `type`, `x`, `y`, `width`, `height`)
- `connectors`: Array of connectors (`from`, `to`, `label`)

## Output Format

The server automatically saves diagrams as `.drawio` files in the configured output directory.
Open these files directly in [Draw.io](https://app.diagrams.net).

## Development

### Project Structure

```
diagram-master/
├── index.js              # MCP server implementation
├── drawio-generator.js   # Draw.io XML generation utilities
├── package.json          # Project dependencies
├── README.md            # This file
├── CHANGELOG.md         # Version history
└── LICENSE              # MIT License
```

## License

MIT

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## Roadmap

Future enhancements:
- Class diagrams and State machines
- Style customization (colors, fonts, line styles)
- Export to multiple formats (PNG, SVG, PDF)

