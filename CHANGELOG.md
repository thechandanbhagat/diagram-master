# Changelog

All notable changes to this project will be documented in this file.

## [1.0.1] - 2025-12-19

### Added
-   **Unified Tool Interface**: Consolidated multiple tools into a single `create_diagram` tool for better usability.
-   **ERD Support**: Added support for Entity Relationship Diagrams (ERD) with entities and relationships.
-   **Sequence Diagram Improvements**:
    -   Implemented UML Lifeline shapes with dashed vertical lines.
    -   Added Activation Bars (Focus of Control) to show participant activity.
    -   Improved message styling (solid for requests, dashed for responses).
-   **Flowchart Enhancements**:
    -   Added hierarchical layout algorithm for better automatic positioning.
    -   Added support for branching logic (Yes/No paths).
-   Added `LICENSE` (MIT) and `CHANGELOG.md` to the npm package distribution.

### Changed
-   Renamed package from `mcp-drawio-diagram-server` to `diagram-master`.
-   Updated `drawio-generator.js` to support new diagram types and styling.

## [1.0.0] - 2025-12-19

### Added
-   Initial release with individual diagram generation tools (`create_flowchart`, `create_sequence_diagram`, `create_network_diagram`, `create_custom_diagram`).
