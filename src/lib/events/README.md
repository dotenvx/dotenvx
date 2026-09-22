# CLI and SDK events

Events use Armor's `name`, `outcome`, and `metadata` vocabulary. There is no
`source` field: names identify the interface (`cli/`, `sdk/`, and later `mcp/`).
Instrument the public interface once; internal SDK calls must not duplicate it.

```json
{
  "name": "cli/protect",
  "occurred_at": "2026-09-21T22:00:00.000Z",
  "outcome": "success",
  "metadata": {
    "action": "check",
    "file": ".env.production",
    "decision": "blocked",
    "reason": "PLAINTEXT_ENV",
    "options": { "gitProcess": true },
    "cli_version": "2.29.0"
  }
}
```

CLI and SDK record `occurred_at` when constructing each event, before batching.
Armor assigns `created_at` when it receives the event.
No account, team,
or actor claims come from the local event. An authenticated receiver determines
those separately from the authenticated token.

## Catalog

Every command emits a `phase: complete` event with `exit_code` and `duration_ms`.
Its outcome is `success` for exit code zero and `unsuccessful` otherwise.
SDK calls emit completion with `duration_ms` and an outcome based on their
operation result, including returned errors. They have no process exit code.

| Name | Additional events and metadata |
| --- | --- |
| `cli/encrypt` | `phase: file` per processed source: `file`, `changed`, `output` (`file` or `stdout`) |
| `cli/decrypt` | Same file events as encrypt |
| `cli/set` | Same file events, plus variable `key`; encryption mode is in `options.plain` |
| `cli/del` | Same file events, plus variable `key` |
| `cli/get` | Completion: optional `key`, `error_count` |
| `cli/keypair` | Completion: optional requested key name; never key material |
| `cli/run` | `phase: start` after spawn, with executable basename only; completion includes env `files`, `injected_count`, `proxied_count`, exit code and optional signal |
| `cli/protect` | `action: check` per clean-filter file with decision `allowed`, `blocked`, or `exempt`; configuration completion includes `action: configure`, `filter`, `ignore`, `scope: global`; Docker checks use `action: docker` |
| `sdk/config` | Completion: env `files`, `injected_count`, stable error code if configuration returned or threw an error |
| `sdk/get` | Completion: optional `key`, nonignored `error_count` |
| `sdk/set` | File events after writes, variable `key`, completion `error_count`; encryption mode is in `options.encrypt` |

File success is recorded after its write (or stdout call) succeeds. A later
failure does not erase earlier file successes. `changed` on stdout describes
the transformed content, not a disk mutation. Known per-file failures carry a
stable `error_code`; unhandled failures appear on command completion.

A successful protection check can decide `blocked`. The enclosing invocation
may still end unsuccessfully because Git receives a rejection. These are checks,
not claims that a commit happened. Smudge passthrough does not emit check events.
A start without a completion means no ending was observed, not proof of a live
process. Hard termination can lose pending events.
Noninteractive configuration does not change or report the existing ignore setting.

## Call sites

Register the event name in `catalog.js`, wrap the action once, and add only the
operation-specific details. The wrapper preserves the Commander instance and
restores its previous `events` property when the action finishes.

```js
module.exports = require('../../lib/events/cli')('encrypt', encryptAction)

// Inside the action, after a write:
this.events.file(processedEnv, { output: 'file' })

// Additional command summary metadata:
this.events.add({ error_count: errorCount })

// Before an existing explicit exit (flushes first):
return await this.events.exit(1, error)
```

`index.js` owns event construction and completion; `delivery.js` owns the bounded
queue and transport. `cli.js` alone handles CLI exits. `sdk.js` provides the
explicit `dotenvx.withEvents()` facade and client-scoped `flushEvents()`.
The shared recorder never exits the process. SDK events include `sdk_version`
and `sdk_language`; CLI events include `cli_version`.

`config()` stays synchronous. Await SDK operations before `flushEvents()`;
plain SDK calls remain uninstrumented.

`metadata.js` explicitly selects fields and command options. It excludes tokens,
passwords, inline env values, positional values, raw argv, child output, private
keys, raw error messages, and unknown future options. Strings and arrays have
size limits. Paths and variable names are retained and can themselves be
sensitive organizational metadata. CLI options include only explicit flags or configured option environment inputs,
including explicit values equal to defaults. SDK options reflect caller-supplied
values. Empty options are omitted; secret fields remain excluded.

## Pluggable event custody

The internal `createEvents(name, options, { backend })` seam accepts a backend
implementing `send(events, { signal })`. It is retained for enterprise-supported
customer-managed custody integrations and internal tests. Public `withEvents()`
accepts no arguments and always uses the default Armor backend (when enabled).
There is no public custom-backend option, plugin loader, or licensing enforcement
implementation. This API boundary does not prevent modifications to the source.

Armor is the default when connected and enabled, or given an explicit token.
`--no-armor`, SDK `noArmor`, Armor off, and `DOTENVX_NO_ARMOR=true` disable default delivery
(an explicit token overrides the saved off setting, matching key operations).
Authentication is captured before `run` loads application environment variables.

Delivery is silent and best effort. Batches contain at most 50 events; at most
256 pending events are held in memory. Overflow is dropped, reserving room for
completion by replacing the last queued event if necessary. Each batch has a
500 ms deadline; flushing also has a 500 ms overall deadline. Delivery aborts
on timeout and disables further delivery for that invocation after an error.
Custom backends must honor the abort signal and avoid synchronous blocking.
Commands never await each individual event;
normal completion and explicit exits flush outstanding delivery. There are no
local files, persistent retries, guaranteed delivery, or event strict flag.
Existing command `--strict` behavior is unrelated and unchanged.

## Armor ingestion contract

The client adapter sends POST `/api/events` with the existing bearer token and body:

```json
{
  "events": ["<event objects above>"]
}
```

The sibling Radar repository implements this endpoint. It authenticates the token
and validates the event catalog and metadata. Device identity is available through
the linked OAuth token; it is not sent or copied into event metadata.
Armor assigns its existing Activity ID; repeated submissions are separate records.
Client `occurred_at` preserves event timing; server `created_at` records receipt.
Actor and team attribution comes from the server.
This adapter uses the token's default organization. Automation tokens attribute
events to their organization without claiming a verified device or user.
Radar must apply the occurrence-time migration and deploy the endpoint before
production ingestion works. Existing activities are backfilled from `created_at`;
new server activities default to the same value. Logs display and sort by occurrence.
No production ingestion has been verified; HTTP failures remain silent.

OTel export can map `name` to EventName, `occurred_at` to Timestamp, and metadata
to attributes. CLI service/version belong in Resource. This representation is
not itself an OTLP payload. No OTel exporter is included in this first pass.
