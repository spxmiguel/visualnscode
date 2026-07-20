# Future plugin contract

VisualnsCode does not load third-party plugins today. This document is the design contract contributors
should use when proposing that future capability; the examples below are not installable manifests.

## Goals

- Extend providers, tools, templates, agents, and UI contributions without weakening desktop isolation.
- Make every requested capability visible before installation and revocable afterward.
- Keep plugin code out of the renderer and main process unless a reviewed host API explicitly permits it.
- Support signed packages, version constraints, deterministic activation, and safe removal.

## Proposed package shape

```text
visualnscode-plugin-example/
├── visualnscode.plugin.json
├── dist/
│   └── worker.js
├── README.md
└── LICENSE
```

Proposed manifest fields:

```json
{
  "schemaVersion": 1,
  "id": "com.example.readonly-tools",
  "name": "Read-only tools",
  "version": "1.0.0",
  "engines": { "visualnscode": ">=1.0.0" },
  "entry": "dist/worker.js",
  "capabilities": ["workspace.read", "commands.safe"],
  "contributes": { "tools": ["example-inspect"] }
}
```

## Required security properties

1. Plugins run in an isolated utility process with a versioned message protocol.
2. Installation verifies a signed package and displays publisher, source, requested capabilities,
   external hosts, commands, and workspace scope.
3. The host grants opaque capability handles, not Node.js or Electron primitives.
4. Network hosts, executables, arguments, and filesystem roots are declared and enforced.
5. Secrets are referenced by vault handle and never passed through plugin logs or general messages.
6. Updates that add a capability require a new user review.
7. Revocation stops the process, closes handles, cancels work, and removes cached executable code.
8. A kill switch and publisher revocation list can block known-malicious versions.

YOLO mode must not expand plugin capabilities. A plugin cannot publish, deploy to production, push,
read credentials, or write outside a trusted workspace without the same core confirmation gates used
by built-in features.

## Contribution path before the SDK exists

Contribute an adapter directly to the relevant package using the provider, integration, template, or
agent guide. A pull request must include tests and security review. Do not add ad-hoc dynamic imports,
execute an npm package from the renderer, or create a hidden plugin directory.

## SDK acceptance criteria

The first plugin release requires a manifest schema, threat model, process sandbox prototype,
capability broker, signature and update verification, audit log, deterministic test host, compatibility
policy, and at least one complete reference plugin. An ADR must approve these boundaries before the
loader is merged.
