# Security Policy

## Supported versions

VisualnsCode is in alpha. Until the first stable release, security fixes target the latest commit on
`main`. Older commits and locally modified builds are not supported.

## Report a vulnerability

Do not publish vulnerability details in an issue, discussion, pull request, chat export, or log.
Use GitHub's private
[Report a vulnerability](https://github.com/spxmiguel/visualnscode/security/advisories/new) form.

Include only the information needed to reproduce and assess the report:

- affected component and commit;
- impact and prerequisites;
- minimal reproduction steps using test data;
- a suggested mitigation, if known.

Do not include credentials or data belonging to another person. A maintainer will acknowledge the
report, triage it, and coordinate remediation and disclosure through the private advisory.

## Security boundaries

- Electron renderers run with `nodeIntegration: false`, `contextIsolation: true`, and sandboxing.
- The preload exposes named capabilities, never a general shell or filesystem primitive.
- IPC payloads are treated as untrusted and validated in the main process.
- Workspace paths are checked lexically and by real path; unsafe symlinks and traversal are rejected.
- Commands use executable/argument arrays, an allowlist, risk classification, and confirmation gates.
- Provider keys are encrypted through Electron `safeStorage` and are never returned to the renderer.
- Remote AI context passes through sensitive-file checks and secret redaction.
- Logs and exported errors are sanitized before they leave their owning service.
- Production deployment, repository push, and other remote mutations require explicit confirmation.
- Extreme destructive commands stay blocked even when YOLO mode is enabled.

The complete threat model, known limitations, and security test map are in
[docs/security-model.md](./docs/security-model.md).
