/**
 * Draw.io XML Generator Utilities
 * Generates Draw.io compatible XML diagrams
 */

export class DrawioGenerator {
  constructor() {
    this.cellId = 2; // Start at 2 since Draw.io uses 0 and 1 for root cells
    this.shapes = {
      rectangle: { style: 'rounded=0;whiteSpace=wrap;html=1;' },
      roundedRectangle: { style: 'rounded=1;whiteSpace=wrap;html=1;' },
      ellipse: { style: 'ellipse;whiteSpace=wrap;html=1;' },
      diamond: { style: 'rhombus;whiteSpace=wrap;html=1;' },
      parallelogram: { style: 'shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;' },
      cylinder: { style: 'shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;' },
      hexagon: { style: 'shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;' },
      cloud: { style: 'ellipse;shape=cloud;whiteSpace=wrap;html=1;' },
      document: { style: 'shape=document;whiteSpace=wrap;html=1;boundedLbl=1;' },
      process: { style: 'rounded=0;whiteSpace=wrap;html=1;' },
      decision: { style: 'rhombus;whiteSpace=wrap;html=1;' },
      data: { style: 'shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;' },
      terminator: { style: 'rounded=1;whiteSpace=wrap;html=1;arcSize=50;' },
      delay: { style: 'shape=delay;whiteSpace=wrap;html=1;' },
      database: { style: 'shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;' },
      actor: { style: 'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;' },
      note: { style: 'shape=note;whiteSpace=wrap;html=1;backgroundOutline=1;' }
    };
  }

  getNextId() {
    return (this.cellId++).toString();
  }

  escapeXml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  createCell(value, style, geometry, id = null, parent = '1', vertex = true, edge = false, source = null, target = null) {
    const cellId = id || this.getNextId();
    let cell = `      <mxCell id="${cellId}" `;

    if (value) {
      cell += `value="${this.escapeXml(value)}" `;
    }

    if (style) {
      cell += `style="${style}" `;
    }

    if (vertex) {
      cell += `vertex="1" `;
    }

    if (edge) {
      cell += `edge="1" `;
    }

    cell += `parent="${parent}"`;

    if (source) {
      cell += ` source="${source}"`;
    }

    if (target) {
      cell += ` target="${target}"`;
    }

    cell += '>\n';

    if (geometry) {
      cell += `        <mxGeometry ${geometry} />\n`;
    }

    cell += `      </mxCell>`;

    return { id: cellId, xml: cell };
  }

  createShape(label, type, x, y, width = 120, height = 60, fillColor = '#dae8fc', strokeColor = '#6c8ebf') {
    const shapeInfo = this.shapes[type] || this.shapes.rectangle;
    let style = shapeInfo.style;
    style += `fillColor=${fillColor};strokeColor=${strokeColor};`;

    const geometry = `x="${x}" y="${y}" width="${width}" height="${height}" as="geometry"`;
    return this.createCell(label, style, geometry);
  }

  createConnector(sourceId, targetId, label = '', style = 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;') {
    const geometry = `relative="1" as="geometry"`;
    return this.createCell(label, style, geometry, null, '1', false, true, sourceId, targetId);
  }

  generateDiagram(elements) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="MCP Draw.io Server" version="21.0.0" type="device">
  <diagram name="Page-1" id="diagram1">
    <mxGraphModel dx="1434" dy="764" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
`;

    for (const element of elements) {
      xml += element.xml + '\n';
    }

    xml += `      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

    return xml;
  }

  createFlowchart(steps, connections = []) {
    const elements = [];
    const stepIds = {};
    const stepMap = {};

    // Map steps by ID
    steps.forEach((step, index) => {
      const id = step.id || (index + 1).toString();
      stepIds[id] = null; // Will store generated ID later
      stepMap[id] = { ...step, internalId: id };
    });

    // Build graph for layout
    const graph = {};
    const reverseGraph = {}; // To find roots
    Object.keys(stepMap).forEach(id => {
      graph[id] = [];
      if (!reverseGraph[id]) reverseGraph[id] = [];
    });

    // Populate graph
    if (connections && connections.length > 0) {
      connections.forEach(conn => {
        if (graph[conn.from] && stepMap[conn.to]) {
          graph[conn.from].push(conn.to);
          if (!reverseGraph[conn.to]) reverseGraph[conn.to] = [];
          reverseGraph[conn.to].push(conn.from);
        }
      });
    } else {
      // Sequential default
      const ids = Object.keys(stepMap);
      for (let i = 0; i < ids.length - 1; i++) {
        graph[ids[i]].push(ids[i + 1]);
        if (!reverseGraph[ids[i + 1]]) reverseGraph[ids[i + 1]] = [];
        reverseGraph[ids[i + 1]].push(ids[i]);
      }
    }

    // BFS for Leveling
    const levels = {};
    const nodesByLevel = {};
    const queue = [];
    const visited = new Set();

    // Find roots (nodes with no incoming edges)
    const roots = Object.keys(stepMap).filter(id => reverseGraph[id].length === 0);
    // If no roots (cycle?), pick the first one
    if (roots.length === 0 && Object.keys(stepMap).length > 0) {
      roots.push(Object.keys(stepMap)[0]);
    }

    roots.forEach(root => {
      queue.push({ id: root, level: 0 });
      visited.add(root);
    });

    while (queue.length > 0) {
      const { id, level } = queue.shift();
      levels[id] = level;

      if (!nodesByLevel[level]) nodesByLevel[level] = [];
      nodesByLevel[level].push(id);

      graph[id].forEach(neighbor => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push({ id: neighbor, level: level + 1 });
        }
      });
    }

    // Handle disconnected components or unvisited nodes
    Object.keys(stepMap).forEach(id => {
      if (!visited.has(id)) {
        const maxLevel = Math.max(...Object.keys(nodesByLevel).map(Number), -1);
        const newLevel = maxLevel + 1;
        levels[id] = newLevel;
        if (!nodesByLevel[newLevel]) nodesByLevel[newLevel] = [];
        nodesByLevel[newLevel].push(id);
      }
    });

    // Layout Parameters
    const startX = 400; // Center X
    const startY = 50;
    const levelHeight = 120;
    const nodeSpacing = 160; // Horizontal spacing

    // Create Shapes with calculated positions
    Object.keys(nodesByLevel).forEach(level => {
      const nodes = nodesByLevel[level];
      const rowWidth = (nodes.length - 1) * nodeSpacing;
      const startRowX = startX - (rowWidth / 2);

      nodes.forEach((nodeId, index) => {
        const step = stepMap[nodeId];
        const x = startRowX + (index * nodeSpacing);
        const y = startY + (level * levelHeight);

        const width = step.width || 120;
        const height = step.height || 60;

        const shape = this.createShape(step.label, step.type || 'process', x, y, width, height);
        elements.push(shape);
        stepIds[nodeId] = shape.id;
        step.generatedId = shape.id;
      });
    });

    // Create Connections
    if (connections && connections.length > 0) {
      connections.forEach(conn => {
        const sourceId = stepIds[conn.from];
        const targetId = stepIds[conn.to];
        if (sourceId && targetId) {
          elements.push(this.createConnector(sourceId, targetId, conn.label || ''));
        }
      });
    } else {
      // Sequential connections
      const ids = Object.keys(stepMap);
      for (let i = 0; i < ids.length - 1; i++) {
        const sourceId = stepIds[ids[i]];
        const targetId = stepIds[ids[i + 1]];
        const label = stepMap[ids[i]].connectorLabel || '';
        elements.push(this.createConnector(sourceId, targetId, label));
      }
    }

    return this.generateDiagram(elements);
  }

  createSequenceDiagram(participants, interactions) {
    const elements = [];
    const participantSpacing = 200;
    const interactionSpacing = 60; // Vertical space between messages
    const topMargin = 50;
    const participantIds = {};
    const lifelineHeight = interactions.length * interactionSpacing + 100;

    // Create Participants (Lifelines)
    participants.forEach((participant, index) => {
      const x = 100 + (index * participantSpacing);
      const y = topMargin;

      // UML Lifeline Shape
      // shape=umlLifeline;participant=umlActor;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;verticalAlign=top;spacingTop=36;outlineConnect=0;
      // We'll use a standard rectangle with a dashed line for simplicity and better control, 
      // or the specific umlLifeline shape if we can get the style right.
      // Let's use the standard 'umlLifeline' shape which includes the head and the line.

      const style = 'shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;';
      const width = 100;
      const height = lifelineHeight; // The line extends down

      const lifeline = this.createShape(participant, 'umlLifeline', x, y, width, height);
      // Override style to ensure it looks right
      lifeline.xml = lifeline.xml.replace(/style="[^"]*"/, `style="${style}"`);

      elements.push(lifeline);
      participantIds[participant] = { id: lifeline.id, x: x + width / 2 }; // Store center X
    });

    let currentY = topMargin + 80; // Start messages below the headers

    // Create Interactions
    interactions.forEach((interaction, index) => {
      const source = participantIds[interaction.from];
      const target = participantIds[interaction.to];

      if (source && target) {
        // 1. Activation Bars (Focus of Control)
        // We add a small rectangle on the lifeline at the point of interaction
        // For simplicity, we'll just add small rectangles for each message point.
        // A full activation bar logic requires tracking start/end of calls, which is complex for this simple input.
        // We will just place the message.

        // 2. Message Arrows
        // Solid for request (default), Dashed for reply (dashed=true)
        let edgeStyle = 'html=1;verticalAlign=bottom;endArrow=block;edgeStyle=elbowEdgeStyle;elbow=vertical;curved=0;rounded=0;';
        if (interaction.dashed) {
          edgeStyle += 'dashed=1;endArrow=open;'; // Reply message style
        } else {
          edgeStyle += 'endFill=1;'; // Solid arrow for request
        }

        // Anchor points on the lifelines
        // We need to create "points" on the lifeline to connect to.
        // Since umlLifeline is a single shape, we can connect to it directly, but specifying the Y coordinate is tricky with standard connectors.
        // We will use the same trick as before: invisible small circles on the lifeline path.

        const sourceX = source.x;
        const targetX = target.x;

        const pointStyle = 'shape=ellipse;fillColor=none;strokeColor=none;resizable=0;';
        const sourcePointId = this.getNextId();
        const targetPointId = this.getNextId();

        const sourcePoint = this.createCell('', pointStyle, `x="${sourceX}" y="${currentY}" width="0" height="0" as="geometry"`, sourcePointId, '1', true);
        const targetPoint = this.createCell('', pointStyle, `x="${targetX}" y="${currentY}" width="0" height="0" as="geometry"`, targetPointId, '1', true);

        elements.push(sourcePoint);
        elements.push(targetPoint);

        // Activation Bar (Visual candy)
        // Add a small rectangle at source and target to simulate activation
        const activationWidth = 10;
        const activationHeight = 20; // Short activation for single message
        const activationStyle = 'html=1;whiteSpace=wrap;fillColor=#ffffff;';

        // We center the activation bar on the lifeline
        const sourceActivation = this.createShape('', 'rectangle', sourceX - activationWidth / 2, currentY - 10, activationWidth, activationHeight);
        sourceActivation.xml = sourceActivation.xml.replace(/style="[^"]*"/, `style="${activationStyle}"`);
        elements.push(sourceActivation);

        const targetActivation = this.createShape('', 'rectangle', targetX - activationWidth / 2, currentY - 10, activationWidth, activationHeight);
        targetActivation.xml = targetActivation.xml.replace(/style="[^"]*"/, `style="${activationStyle}"`);
        elements.push(targetActivation);

        // Connect the activation bars? Or just the points?
        // Connecting points is safer for straight lines.
        // But visually we want the arrow to touch the activation bar.
        // Let's connect the points which are at the center of the lifeline. 
        // The activation bar sits on top. The line might overlap the activation bar slightly or be behind it.
        // To make it look perfect, we should connect to the activation bars.

        const connector = this.createConnector(sourceActivation.id, targetActivation.id, interaction.message, edgeStyle);
        elements.push(connector);

        currentY += interactionSpacing;
      }
    });

    return this.generateDiagram(elements);
  }

  createNetworkDiagram(nodes, connections) {
    const elements = [];
    const nodeIds = {};

    // Create nodes
    nodes.forEach(node => {
      const type = node.type || 'rectangle';
      const x = node.x || 100;
      const y = node.y || 100;
      const width = node.width || 120;
      const height = node.height || 60;
      const label = node.label || 'Node';

      const shape = this.createShape(label, type, x, y, width, height);
      elements.push(shape);
      nodeIds[node.id] = shape.id;
    });

    // Create connections
    connections.forEach(conn => {
      const sourceId = nodeIds[conn.from];
      const targetId = nodeIds[conn.to];

      if (sourceId && targetId) {
        const connector = this.createConnector(sourceId, targetId, conn.label || '');
        elements.push(connector);
      }
    });

    return this.generateDiagram(elements);
  }

  createERD(entities, relationships) {
    const elements = [];
    const entityIds = {};

    // Layout parameters
    const startX = 100;
    const startY = 100;
    const entityWidth = 160;
    const attributeHeight = 26;
    const headerHeight = 30;
    const spacingX = 250;
    const spacingY = 200;

    // Simple grid layout
    let currentX = startX;
    let currentY = startY;
    const itemsPerRow = 3;

    entities.forEach((entity, index) => {
      // Calculate position
      if (index > 0 && index % itemsPerRow === 0) {
        currentX = startX;
        currentY += spacingY;
      }

      const totalHeight = headerHeight + (entity.attributes.length * attributeHeight);

      // Entity Header (Table Name)
      // Using 'swimlane' style for table-like look or just a rectangle
      // Let's use a rectangle for the header and stack attributes below
      const headerStyle = 'rounded=0;whiteSpace=wrap;html=1;fillColor=#f5f5f5;fontWeight=bold;';
      const header = this.createShape(entity.name, 'rectangle', currentX, currentY, entityWidth, headerHeight);
      // Override style
      header.xml = header.xml.replace(/style="[^"]*"/, `style="${headerStyle}"`);

      elements.push(header);
      entityIds[entity.id] = header.id;

      // Attributes
      entity.attributes.forEach((attr, attrIndex) => {
        const attrY = currentY + headerHeight + (attrIndex * attributeHeight);
        const attrStyle = 'rounded=0;whiteSpace=wrap;html=1;align=left;spacingLeft=10;';
        const attrShape = this.createShape(attr, 'rectangle', currentX, attrY, entityWidth, attributeHeight);
        attrShape.xml = attrShape.xml.replace(/style="[^"]*"/, `style="${attrStyle}"`);
        elements.push(attrShape);
      });

      // Grouping rectangle (optional, but good for moving)
      // For simplicity in this generator, we just place them. 
      // Draw.io grouping requires group cells, which adds complexity.

      currentX += spacingX;
    });

    // Relationships
    relationships.forEach(rel => {
      const sourceId = entityIds[rel.from];
      const targetId = entityIds[rel.to];

      if (sourceId && targetId) {
        // ERD connectors usually have specific endings (crows foot etc)
        // For now, we use standard lines with labels
        const style = 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=none;startArrow=none;';

        const connector = this.createConnector(sourceId, targetId, rel.label || '', style);

        // Add cardinality labels if provided (simple text approach)
        // Real ERD connectors in Draw.io are complex.
        // We'll stick to simple labeled lines for v1.

        elements.push(connector);
      }
    });

    return this.generateDiagram(elements);
  }
}
