# File workflow

Read this file only for upload, download, file-field transport, retry, parsing, preview, or job progress.

- Treat upload as a separate mutation unless the server contract declares one atomic multipart form.
- Validate only confirmed client constraints such as size, MIME, and extension; server validation remains authoritative.
- Preserve a selected file after recoverable failure.
- Client parsing, preview, header mapping, multiple selection, large-file jobs, progress polling, cancellation, and rejection reports require explicit product behavior and server support.
- A shared file field owns selection/removal UI and its domain-neutral value contract, not transport, storage type, retry, or workflow policy.

Read [mutation-actions.md](mutation-actions.md) for pending/result presentation and `api-contract` for transport or payload changes.
