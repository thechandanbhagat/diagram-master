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

  createFlowchart(steps) {
    const elements = [];
    const spacing = 150;
    let currentY = 50;
    let previousId = null;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const type = step.type || 'process';
      const label = step.label || `Step ${i + 1}`;
      const width = step.width || 120;
      const height = step.height || 60;

      const shape = this.createShape(label, type, 300, currentY, width, height);
      elements.push(shape);

      if (previousId) {
        const connector = this.createConnector(previousId, shape.id, step.connectorLabel || '');
        elements.push(connector);
      }

      previousId = shape.id;
      currentY += spacing;
    }

    return this.generateDiagram(elements);
  }

  createSequenceDiagram(participants, interactions) {
    const elements = [];
    const participantSpacing = 200;
    const interactionHeight = 100;
    const participantIds = {};

    // Create participants
    participants.forEach((participant, index) => {
      const x = 100 + (index * participantSpacing);
      const shape = this.createShape(participant, 'actor', x, 50, 40, 80);
      elements.push(shape);
      participantIds[participant] = shape.id;
    });

    // Create interactions
    interactions.forEach((interaction, index) => {
      const sourceId = participantIds[interaction.from];
      const targetId = participantIds[interaction.to];

      if (sourceId && targetId) {
        const connector = this.createConnector(
          sourceId,
          targetId,
          interaction.message,
          'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;dashed=' + (interaction.dashed ? '1' : '0') + ';'
        );
        elements.push(connector);
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
}
