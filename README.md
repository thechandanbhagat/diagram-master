# MCP Draw.io Diagram Server

A Model Context Protocol (MCP) server that generates Draw.io compatible diagrams from natural language prompts. This server enables AI assistants to create professional diagrams in XML format that can be opened directly in Draw.io.

## Features

- **Flowchart Generation**: Create sequential flowcharts with various shapes (process, decision, terminator, data, etc.)
- **Sequence Diagrams**: Generate UML sequence diagrams showing interactions between participants
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
    "drawio-diagram": {
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
    "drawio-diagram": {
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

### 1. create_flowchart

Creates a sequential flowchart diagram and saves it to a file.

**Parameters:**
- `filename`: Name for the output .drawio file (extension added automatically)
- `steps`: Array of flowchart steps
  - `label`: Text for the step
  - `type`: Shape type (process, decision, terminator, data, document, delay)
  - `connectorLabel`: Optional label for the connector arrow

**Example:**
```
Create a flowchart named "login-process" for a login process with these steps:
1. Start (terminator)
2. Enter credentials (data)
3. Validate credentials (process)
4. Is valid? (decision)
5. Show dashboard (process)
6. End (terminator)
```

### 2. create_sequence_diagram

Creates a UML sequence diagram showing interactions and saves it to a file.

**Parameters:**
- `filename`: Name for the output .drawio file (extension added automatically)
- `participants`: Array of participant names
- `interactions`: Array of interactions
  - `from`: Source participant
  - `to`: Target participant
  - `message`: Interaction message
  - `dashed`: Use dashed line for returns (optional)

**Example:**
```
Create a sequence diagram named "api-request" for an API request with participants: Client, API Server, Database
Show these interactions:
- Client sends "GET /users" to API Server
- API Server sends "SELECT * FROM users" to Database
- Database returns "User data" to API Server (dashed)
- API Server returns "200 OK" to Client (dashed)
```

### 3. create_network_diagram

Creates a network or architecture diagram with positioned nodes and saves it to a file.

**Parameters:**
- `filename`: Name for the output .drawio file (extension added automatically)
- `nodes`: Array of network nodes
  - `id`: Unique identifier
  - `label`: Display label
  - `type`: Shape type (rectangle, cylinder, database, cloud, hexagon, ellipse)
  - `x`, `y`: Position coordinates
  - `width`, `height`: Optional dimensions
- `connections`: Array of connections
  - `from`: Source node ID
  - `to`: Target node ID
  - `label`: Connection label (optional)

**Example:**
```
Create a network diagram named "web-architecture" showing:
- Web Server (rectangle) at position 100, 100
- Application Server (rectangle) at position 300, 100
- Database (database/cylinder) at position 500, 100
Connect them in sequence with labeled connections
```

### 4. create_custom_diagram

Creates a custom diagram with full control over all elements and saves it to a file.

**Parameters:**
- `filename`: Name for the output .drawio file (extension added automatically)
- `shapes`: Array of shapes
  - `id`: Unique identifier for connections
  - `label`: Text label
  - `type`: Shape type (see supported shapes below)
  - `x`, `y`: Position
  - `width`, `height`: Optional dimensions
- `connectors`: Array of connectors (optional)
  - `from`: Source shape ID
  - `to`: Target shape ID
  - `label`: Connector label (optional)

**Supported shape types:**
- `rectangle`, `roundedRectangle`, `ellipse`, `diamond`
- `parallelogram`, `cylinder`, `hexagon`, `cloud`
- `document`, `process`, `decision`, `data`
- `terminator`, `database`, `actor`, `note`

## Example Prompts

Here are some example prompts you can use with Claude:

1. **Simple Flowchart:**
   ```
   Create a flowchart named "password-reset" for password reset: Start -> Enter Email -> Send Reset Link -> Check Email -> Reset Password -> End
   ```

2. **System Architecture:**
   ```
   Create a network diagram named "web-architecture" showing a three-tier web architecture with load balancer, web servers, app servers, and database
   ```

3. **UML Sequence:**
   ```
   Create a sequence diagram named "user-auth" for user authentication with User, Frontend, Auth Service, and Database
   ```

4. **Custom Business Process:**
   ```
   Create a custom diagram named "order-process" showing an order processing workflow with decision points for inventory check and payment validation
   ```

## Output Format

The server automatically saves diagrams as `.drawio` files in the configured output directory (or current working directory if not configured).

To use the generated diagrams:

1. The server will report the full path where the file was saved
2. Open the `.drawio` file directly in Draw.io (https://app.diagrams.net)
3. Edit, export, or share the diagram as needed

**File Naming:**
- Files are automatically saved with the `.drawio` extension
- If you specify `filename: "my-diagram"`, it will be saved as `my-diagram.drawio`
- The `.drawio` extension is added automatically if not present

## Development

### Project Structure

```
diagram-master/
├── index.js              # MCP server implementation
├── drawio-generator.js   # Draw.io XML generation utilities
├── package.json          # Project dependencies
└── README.md            # This file
```

### Running Standalone

While this is designed as an MCP server, you can test the diagram generation directly:

```javascript
import { DrawioGenerator } from './drawio-generator.js';

const generator = new DrawioGenerator();

const steps = [
  { label: 'Start', type: 'terminator' },
  { label: 'Process Data', type: 'process' },
  { label: 'End', type: 'terminator' }
];

const xml = generator.createFlowchart(steps);
console.log(xml);
```

## Troubleshooting

**Server not appearing in Claude:**
- Verify the path in `claude_desktop_config.json` is correct
- Ensure Node.js 18+ is installed
- Check that `npm install` completed successfully
- Restart Claude Desktop after configuration changes

**Diagrams not opening in Draw.io:**
- Ensure you saved the file with `.drawio` extension
- Verify the XML is complete (starts with `<?xml` and ends with `</mxfile>`)
- Try importing via File > Import in Draw.io

## License

MIT

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## Roadmap

Future enhancements:
- More diagram types (ERD, class diagrams, state machines)
- Style customization (colors, fonts, line styles)
- Layout algorithms for automatic positioning
- Template library for common diagram patterns
- Export to multiple formats (PNG, SVG, PDF)
