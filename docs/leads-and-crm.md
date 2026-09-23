# Video leads and CRM delivery

The per-video **Leads** page shows completed and skipped forms from watch pages and embeds. It reuses the console’s TanStack table and supports answer search, date/status filters, stable pagination, archived columns, original-response details, selection, and CSV export (maximum 50,000 responses per export). The first page polls every 15 seconds; delivery activity polls every 5 seconds while open.

## Deployment

Deploy the backend before the frontend. The existing AutoMigrate startup adds form versions, archived fields, answer snapshots, and the `lead_integration`, `lead_delivery`, and `lead_delivery_attempt` tables. Back up the database before deploying any migration. Legacy answer labels are backfilled from surviving field records. Labels already destroyed by an older form save cannot be reconstructed; these appear as **Removed field** while their values remain accessible.

Set `LEAD_INTEGRATION_KEY` in the API’s secret environment to a base64-encoded 32-byte random key (`openssl rand -base64 32`). Keep this key stable and backed up separately from the database. Every API replica must use the same key. Credentials are encrypted with AES-256-GCM and never returned by the API. Do not replace this key without a planned decrypt/re-encrypt migration; losing it requires re-entering every integration credential. A development key is configured only in the ignored local environment file. Production needs its own key.

The delivery worker runs inside each API process. PostgreSQL row locks, expiring leases, and lease tokens coordinate replicas and recover interrupted work. Allow outbound DNS and HTTPS on port 443. The sender rejects private/reserved addresses, validates all DNS results, pins the validated address, enforces TLS verification and timeouts, and refuses redirects. Keep the API process continuously running; serverless request-only execution is unsuitable for this worker.

Monitor worker error logs and counts/age of queued, retrying, and failed deliveries. Include outbox tables in database backups. Delivery bodies contain lead data: apply the same access, retention and deletion policy as submissions. This implementation does not automatically expire customer records. Arrange retention with the product’s data policy before production launch.

## Form history

Field UUIDs, rather than column positions or labels, identify answers and CRM mappings. Renaming/reordering preserves identity. Removing a field archives it. Changing its type creates a new identity and archives the old field. Every submission stores the form version and each answer’s original label, type, position and value. Adding a new field leaves earlier responses blank in that column. Original labels remain visible in response details and the CSV snapshot column. Current clients send a form version and are asked to reload if the form changed.

CSV headers include complete UUIDs to distinguish identically named fields. Formula-like values are escaped for spreadsheet safety. Exports preserve raw checkbox JSON as well as the original answer snapshot.

## HubSpot

Create a HubSpot private app with `crm.objects.contacts.read` and `crm.objects.contacts.write`, then add a HubSpot connection on the video’s Leads page. Enter the token and map field UUIDs to internal contact property names, including **email**. New fields are never mapped automatically. Review archived mappings after a form change.

The sender looks up contacts by email, PATCHes existing contacts, and creates missing contacts. Only mapped answers actually present in a submission are sent; unmapped/missing properties are preserved. Concurrent create conflicts are looked up again. A test reads the email property metadata without creating a contact; an actual lead delivery is needed to verify write permissions and property values. Checkbox values are joined with semicolons. Choice values must match HubSpot internal enumeration values, or be mapped to text properties. No custom HubSpot properties are created automatically.

Reference: [HubSpot Contacts API](https://developers.hubspot.com/docs/api-reference/legacy/crm/objects/contacts/guide).

## Signed webhooks / other CRMs

Add a public HTTPS endpoint and a random signing secret of at least 16 characters. Save the same secret at the receiver. Webhooks send JSON with:

```json
{
  "id": "stable-delivery-uuid",
  "type": "lead.submitted",
  "schemaVersion": 1,
  "createdAt": "2026-09-22T10:00:00Z",
  "test": false,
  "data": {
    "id": "submission-uuid",
    "videoId": "video-uuid",
    "formId": "form-uuid",
    "formVersion": 2,
    "sessionId": "viewer-session-uuid",
    "placement": "before_video",
    "skipped": false,
    "createdAt": "2026-09-22T10:00:00Z",
    "answers": [{"id":"answer-uuid","submissionId":"submission-uuid","fieldId":"field-uuid","label":"Email","type":"text","position":1,"value":"demo@example.com"}]
  }
}
```

Headers: `X-Rowley-Delivery`, `Idempotency-Key` (both the delivery UUID), `X-Rowley-Timestamp` (Unix seconds), and `X-Rowley-Signature` (`v1=` plus hexadecimal HMAC-SHA256). Compute the HMAC over **timestamp + "." + exact raw request bytes**, using the signing secret. Verify in constant time, reject timestamps more than 5 minutes from your server clock, and atomically deduplicate by delivery UUID. Do not parse/re-serialize the body before verification. Acknowledge with 2xx only after durably accepting the event. Test events have `type: integration.test`, `test: true`, empty answers and no real submission; never create a contact for them.

Webhooks provide at-least-once delivery, not exactly-once execution. Network failures can occur after a receiver processed a request. The same delivery UUID and payload are retained across automatic/manual retries; receivers must deduplicate. Attempts use a fresh timestamp/signature. Do not place API tokens in the URL. Receivers needing a provider-specific payload/authentication protocol should verify the webhook and transform it in their own adapter or automation workflow.

## Queue behavior and operator actions

A submission and its delivery jobs commit atomically; CRM outages never require a viewer to wait for external networking. Skipped forms are not delivered. A unique connection/submission key prevents repeated form submissions or repeated historical selections from creating duplicate jobs.

Transient network failures and HTTP 408/425/429/5xx retry with exponential backoff and jitter, honoring Retry-After up to 24 hours. Other non-2xx responses fail immediately. Eight attempts are allowed per retry cycle. Failed deliveries can be retried manually after fixing configuration. The activity view shows the latest 100 deliveries and up to 100 attempts per delivery; complete history remains in PostgreSQL.

Adding a connection only sends future completed leads. Select existing responses and choose **Send to active connections** to explicitly backfill. Already scheduled leads are not duplicated; retry failed jobs from activity. Pause stops new jobs and leaves queued jobs waiting. Saving or resuming changes the connection version, so old queued jobs fail with a configuration-change explanation instead of silently sending to a changed destination; review and retry them. A request already in flight when a connection is paused may finish.

## Verification

- `go test ./...` from `server` runs unit/regression checks.
- `LEADS_DATABASE_TEST=1 go test ./internal/modules/leads/service ./internal/modules/form/service` with the local `DB_*` environment exercises real PostgreSQL transactions and rolls back fixtures. Run only against an isolated development/test database; the worker test claims the oldest due job within its rollback transaction.
- Frontend: TypeScript, scoped ESLint, and production build.
- A real HubSpot token / receiver must be configured and checked in the target deployment before campaign traffic is enabled. No real customer data is sent during the bundled tests.
