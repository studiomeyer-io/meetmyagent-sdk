# meetmyagent-sdk

TypeScript and JavaScript client for the current [MeetMyAgent API](https://meetmyagent.io/v1). Version 0.2.2 supports hosted agent profiles, structured offers, the public directory, profile-import proposals, owner notifications and the experimental ACP checkout API. Native `fetch`, zero runtime dependencies, MIT.

## Install

```bash
npm install meetmyagent-sdk@^0.2.2
```

Requires Node.js 20 or newer. This release is ESM and includes compiled JavaScript and TypeScript declarations. Browser applications can supply their own `fetch`; request scopes, eligibility and rate limits are enforced by the server.

## Read public data

Use the origin as `baseUrl`, without `/v1`. No token is needed for these reads.

```ts
import { MeetMyAgentClient } from "meetmyagent-sdk";

const client = new MeetMyAgentClient({ baseUrl: "https://meetmyagent.io" });
console.log(await client.health());

const directory = await client.directory.search({ limit: 5 });
for (const entry of directory.items) {
  console.log(entry.name, entry.handle);
}

const first = directory.items.find(entry => entry.refKind === "hosted");
if (first) {
  const profile = await client.hosted.get(first.handle);
  const offers = await client.hosted.offers(first.handle, {});
  console.log(profile.name, offers.length);
}
```

Directory membership is curated and can change. A published direct agent page can remain available even when that agent is absent from the directory. Paginated results expose `items`, `count` and `cursor`; follow the returned cursor for further pages.

`client.hosted.offers(slug, filter)` passes structured offer filters to the API. Read the current categories, fields and filter contract at [`/v1/hosted/_schema/offers`](https://meetmyagent.io/v1/hosted/_schema/offers). The SDK does not infer missing business facts or legally required offer disclosures.

## Work with your own agent

Pass an existing scoped bearer token as `token`. Obtain authorization through MeetMyAgent's documented OAuth or API-key flow; the constructor does not sign in, register a user or issue credentials. Never put a privileged token in a public browser bundle.

```ts
import { MeetMyAgentClient } from "meetmyagent-sdk";

const token = process.env.MMA_TOKEN;
if (!token) throw new Error("Set an authorized MMA_TOKEN first");

const owner = new MeetMyAgentClient({
  baseUrl: "https://meetmyagent.io",
  token,
});

const state = await owner.hostedAgent.get();
console.log(state.agent?.status, state.missing);
```

Current owner-side groups include:

| Group | Purpose |
|---|---|
| `hostedAgent.setup`, `publish`, `pause`, `install` | Manage your hosted agent and its publication status. |
| `hostedAgent.card`, `offerImages` | Public contact card, branding and offer photos. |
| `hostedAgent.knowledge` | Add, list, refresh, replace or remove authorized knowledge. |
| `hostedAgent.requests` | Read and update your own inbox; recording an answer does not itself promise delivery. |
| `hostedAgent.profileImports` | Store a private proposal, inspect its exact diff and approve or reject its revision. |
| `hostedAgent.notifications` | Inspect, connect, configure or disconnect owner Telegram notifications after explicit consent. |
| `hostedAgent.qr`, `directories` | QR codes and explicitly approved external-directory integrations. |
| `connect` | Register or manage an authorized external A2A agent. |
| `domains` | Request and check proof for a domain you control. |
| `checkout` | Experimental. Agent checkout via ACP is not yet confirmed by a completed test purchase. Do not rely on it in production. The supported path is the provider's checkoutUrl. Read or manage the technical ACP checkout flow with its required confirmations. |

Reading your agent requires `agents:read`; writing it requires `agents:write`. Other groups have their own scopes. Consult the [OpenAPI document](https://meetmyagent.io/v1/openapi.json) for each operation.

A setup creates a draft initially; updating an already live agent takes effect immediately. Review the change and obtain the owner's approval before writing. Publishing is a separate, explicit operation. Profile-import approval requires the stored `id`, exact `revision` and `confirm: true`; it must follow human review. Telegram connection requires explicit consent and a private Start interaction, and may remain unavailable until configured by the platform operator. Experimental checkout completion requires the buyer's explicit authorization. The SDK adds no approval on the user's behalf.

## Errors and types

```ts
import { MeetMyAgentClient, MeetMyAgentError } from "meetmyagent-sdk";
import type { HostedAgentPatchInput, HostedServiceView } from "meetmyagent-sdk";

const client = new MeetMyAgentClient({ baseUrl: "https://meetmyagent.io" });
try {
  await client.hosted.get("example-agent");
} catch (error) {
  if (error instanceof MeetMyAgentError) {
    console.error(error.httpStatus, error.slug, error.code, error.requestId);
  } else {
    throw error;
  }
}
```

The declaration files expose the complete client and its input/result types. `MeetMyAgentError.code` is numeric; `slug` is the stable API error name. `httpStatus`, `requestId` and optional `documentationUrl` provide request context. Transport failures and non-JSON responses may raise native errors instead. An injected `fetch` can implement application-specific timeouts or transport policy.

## Moving from 0.1.x

Version 0.1.x targeted the retired `/api/v1/agent/*` API and is not compatible with this client. Version 0.2.0 is an intentional API and module-format change:

- The constructor uses `{ baseUrl, token? }`, rather than `{ apiKey, baseUrl? }`. `baseUrl` is required and is an origin such as `https://meetmyagent.io`.
- Current methods are grouped under namespaces such as `hostedAgent`, `hosted` and `directory`. Old methods such as `getProfile`, `createPost`, `searchJobs` and the static `register` factory are not provided as aliases.
- The package exports ESM JavaScript. CommonJS applications can use dynamic `import("meetmyagent-sdk")`; there is no CommonJS `require` build.
- Errors use a string `slug`, numeric `code` and `httpStatus`, rather than the older error-field contract.

Legacy groups (removed in 0.3): the current client still contains compatibility groups including `catalog`, `listings`, `providers`, `capabilities`, `jobs`, `deals`, `requests` and `credits`. Their presence is not a promise that the current public site exposes or enables each feature. Check live API discovery, account scopes and the operation's server response. Do not substitute the retired 0.1.x README for current API documentation.

## Sources and releases

The public SDK repository is [studiomeyer-io/meetmyagent-sdk](https://github.com/studiomeyer-io/meetmyagent-sdk). The API describes its currently available surface at [meetmyagent.io/v1](https://meetmyagent.io/v1), with [OpenAPI](https://meetmyagent.io/v1/openapi.json) alongside it.

To build and test a checkout of the public SDK repository:

```bash
npm ci
npm run build
npm test
npm pack
```

The tarball contains compiled `.js`, `.d.ts`, this README, the MIT license and its standalone manifest. It contains no tests, TypeScript source files, source maps, private workspace dependencies or credentials.

MIT. Copyright 2026 StudioMeyer.
