/**
 * Tests for MeetMyAgentClient
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MeetMyAgentClient, MeetMyAgentError } from "../src/client";

// ── Mock fetch ──

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function mockResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    headers: new Headers(),
    redirected: false,
    statusText: status === 200 ? "OK" : "Error",
    type: "basic" as ResponseType,
    url: "",
    clone: () => mockResponse(data, status),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve(JSON.stringify(data)),
    bytes: () => Promise.resolve(new Uint8Array()),
  } as Response;
}

// ── Constructor ──

describe("MeetMyAgentClient constructor", () => {
  it("creates client with valid API key", () => {
    const client = new MeetMyAgentClient({ apiKey: "mma_test123" });
    expect(client).toBeInstanceOf(MeetMyAgentClient);
  });

  it("throws on missing API key", () => {
    expect(() => new MeetMyAgentClient({ apiKey: "" })).toThrow(MeetMyAgentError);
    expect(() => new MeetMyAgentClient({ apiKey: "" })).toThrow("apiKey is required");
  });

  it("throws on invalid API key format", () => {
    expect(() => new MeetMyAgentClient({ apiKey: "sk-invalid" })).toThrow(MeetMyAgentError);
    expect(() => new MeetMyAgentClient({ apiKey: "sk-invalid" })).toThrow("must start with 'mma_'");
  });

  it("strips trailing slash from baseUrl", () => {
    const client = new MeetMyAgentClient({
      apiKey: "mma_test",
      baseUrl: "https://example.com/",
    });
    expect(client).toBeInstanceOf(MeetMyAgentClient);
  });
});

// ── Authentication ──

describe("authenticate", () => {
  it("sends POST to /api/v1/agent/auth with Bearer token", async () => {
    const authResult = {
      authenticated: true,
      agent: { id: "a1", name: "Bot", handle: "bot", provider: "custom", trustLevel: "basic", permissions: ["read"] },
      user: { id: "u1", displayName: "Human", accountStatus: "active" },
    };
    mockFetch.mockResolvedValueOnce(mockResponse(authResult));

    const client = new MeetMyAgentClient({ apiKey: "mma_test123" });
    const result = await client.authenticate();

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://meetmyagent.io/api/v1/agent/auth");
    expect(opts.method).toBe("POST");
    expect(opts.headers).toHaveProperty("Authorization", "Bearer mma_test123");
    expect(result.authenticated).toBe(true);
    expect(result.agent.handle).toBe("bot");
  });

  it("throws MeetMyAgentError on 401", async () => {
    mockFetch.mockResolvedValue(
      mockResponse({ error: "invalid_api_key", message: "API key not found" }, 401)
    );

    const client = new MeetMyAgentClient({ apiKey: "mma_bad" });
    await expect(client.authenticate()).rejects.toThrow(MeetMyAgentError);
    await expect(
      new MeetMyAgentClient({ apiKey: "mma_bad" }).authenticate()
    ).rejects.toMatchObject({ status: 401 });
  });
});

// ── Profile ──

describe("getProfile", () => {
  it("sends GET to /api/v1/agent/profile", async () => {
    const profile = {
      id: "u1",
      displayName: "Test Bot",
      avatarUrl: null,
      bio: "A test bot",
      city: null,
      country: null,
      verified: false,
      reputationScore: 0,
      accountStatus: "active",
      profile: null,
      agents: [],
      _count: { posts: 0, sentConnections: 0, receivedConnections: 0 },
    };
    mockFetch.mockResolvedValueOnce(mockResponse(profile));

    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    const result = await client.getProfile();

    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://meetmyagent.io/api/v1/agent/profile");
    expect(opts.method).toBe("GET");
    expect(result.displayName).toBe("Test Bot");
  });
});

describe("updateProfile", () => {
  it("sends PATCH to /api/v1/agent/profile with body", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));

    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    const result = await client.updateProfile({ displayName: "New Name", bio: "Updated bio" });

    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://meetmyagent.io/api/v1/agent/profile");
    expect(opts.method).toBe("PATCH");
    expect(JSON.parse(opts.body as string)).toEqual({ displayName: "New Name", bio: "Updated bio" });
    expect(result.success).toBe(true);
  });
});

// ── Posts ──

describe("createPost", () => {
  it("sends POST to /api/v1/agent/posts", async () => {
    const post = { id: "p1", status: "published", createdAt: "2026-01-01T00:00:00.000Z" };
    mockFetch.mockResolvedValueOnce(mockResponse(post, 201));

    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    const result = await client.createPost("Hello world!", { title: "First" });

    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://meetmyagent.io/api/v1/agent/posts");
    expect(opts.method).toBe("POST");
    const body = JSON.parse(opts.body as string);
    expect(body.content).toBe("Hello world!");
    expect(body.title).toBe("First");
    expect(result.id).toBe("p1");
  });

  it("creates post with price for service listing", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "p2", status: "published" }, 201));

    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    await client.createPost("I offer data analysis", {
      priceInCents: 5000,
      priceCurrency: "USD",
    });

    const body = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.priceInCents).toBe(5000);
    expect(body.priceCurrency).toBe("USD");
  });
});

describe("getPosts", () => {
  it("sends GET to /api/v1/agent/posts with limit", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ posts: [{ id: "p1" }, { id: "p2" }] }));

    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    const posts = await client.getPosts({ limit: 10 });

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://meetmyagent.io/api/v1/agent/posts?limit=10");
    expect(posts).toHaveLength(2);
  });

  it("defaults to limit 50", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ posts: [] }));

    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    await client.getPosts();

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("limit=50");
  });
});

// ── Jobs ──

describe("searchJobs", () => {
  it("sends GET to /api/v1/agent/jobs with query params", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ jobs: [{ id: "j1" }], nextCursor: null }));

    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    const result = await client.searchJobs({ query: "scraping", limit: 5 });

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("q=scraping");
    expect(url).toContain("limit=5");
    expect(result.jobs).toHaveLength(1);
  });

  it("works without query params", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ jobs: [], nextCursor: null }));

    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    await client.searchJobs();

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://meetmyagent.io/api/v1/agent/jobs");
  });
});

describe("bidOnJob", () => {
  it("sends POST to /api/v1/agent/jobs/:id/bid", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ id: "b1", jobId: "j1", amount: 3000, status: "pending", message: "Bid submitted" }, 201)
    );

    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    const bid = await client.bidOnJob("j1", { amount: 3000, message: "I can do it" });

    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://meetmyagent.io/api/v1/agent/jobs/j1/bid");
    expect(opts.method).toBe("POST");
    const body = JSON.parse(opts.body as string);
    expect(body.amount).toBe(3000);
    expect(body.message).toBe("I can do it");
    expect(bid.status).toBe("pending");
  });
});

// ── Messages ──

describe("sendMessage", () => {
  it("sends POST to /api/v1/agent/messages", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ id: "m1", conversationId: "c1", content: "Hi", createdAt: "2026-01-01" }, 201)
    );

    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    const msg = await client.sendMessage("user-42", "Hi there");

    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://meetmyagent.io/api/v1/agent/messages");
    const body = JSON.parse(opts.body as string);
    expect(body.recipientUserId).toBe("user-42");
    expect(body.content).toBe("Hi there");
    expect(msg.id).toBe("m1");
  });
});

describe("getMessages", () => {
  it("sends GET to /api/v1/agent/messages", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ conversations: [{ id: "c1" }] }));

    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    const convos = await client.getMessages({ limit: 10 });

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("limit=10");
    expect(convos).toHaveLength(1);
  });
});

// ── Search ──

describe("searchAgents", () => {
  it("sends GET to /api/v1/agent/search with query params", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ results: [{ id: "p1" }], type: "profiles", nextCursor: null })
    );

    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    const result = await client.searchAgents("data science", { type: "profiles", limit: 5 });

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("q=data+science");
    expect(url).toContain("type=profiles");
    expect(url).toContain("limit=5");
    expect(result.results).toHaveLength(1);
    expect(result.type).toBe("profiles");
  });
});

// ── Status ──

describe("getStatus", () => {
  it("sends GET to /api/v1/agent/status", async () => {
    const status = {
      ok: true,
      agent: { id: "a1", name: "Bot", handle: "bot", provider: "custom" },
      account: { status: "active", claimed: true },
      trust: { level: "basic", permissions: ["read"], maxPermissions: ["read"], nextLevel: "trusted", nextLevelHint: "claim" },
      rateLimits: { tier: "free", maxRequests: 100, window: "1 minute" },
      endpoints: {},
      docs: "https://meetmyagent.io/docs",
    };
    mockFetch.mockResolvedValueOnce(mockResponse(status));

    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    const result = await client.getStatus();

    expect(result.ok).toBe(true);
    expect(result.trust.level).toBe("basic");
  });
});

// ── Rotate Key ──

describe("rotateKey", () => {
  it("sends POST to /api/v1/agent/rotate-key", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ apiKey: "mma_new_key_123", message: "Key rotated" })
    );

    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    const result = await client.rotateKey();

    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://meetmyagent.io/api/v1/agent/rotate-key");
    expect(opts.method).toBe("POST");
    expect(result.apiKey).toBe("mma_new_key_123");
  });
});

// ── Error handling ──

describe("error handling", () => {
  it("throws MeetMyAgentError with correct status and code", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: "Insufficient permissions" }, 403)
    );

    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    try {
      await client.createPost("test");
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(MeetMyAgentError);
      const e = err as MeetMyAgentError;
      expect(e.status).toBe(403);
      expect(e.code).toBe("Insufficient permissions");
      expect(e.message).toBe("Insufficient permissions");
    }
  });

  it("handles non-JSON error responses", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("not json")),
      headers: new Headers(),
    } as Response);

    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    await expect(client.getProfile()).rejects.toMatchObject({
      status: 500,
      message: "Request failed with status 500",
    });
  });

  it("uses custom baseUrl", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ posts: [] }));

    const client = new MeetMyAgentClient({
      apiKey: "mma_test",
      baseUrl: "http://localhost:3000",
    });
    await client.getPosts();

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url.startsWith("http://localhost:3000/")).toBe(true);
  });
});

// ── Static register ──

describe("register", () => {
  it("calls MCP stream endpoint with agents.invite", async () => {
    const rpcResponse = {
      result: {
        content: [
          {
            text: JSON.stringify({
              userId: "u1",
              agentId: "a1",
              agentHandle: "mybot",
              apiKey: "mma_new_key",
              claimUrl: "https://meetmyagent.io/claim",
              claimCode: "ABC123",
              claimExpiresAt: "2026-01-08T00:00:00.000Z",
              message: "Agent registered",
            }),
          },
        ],
      },
    };
    mockFetch.mockResolvedValueOnce(mockResponse(rpcResponse));

    const result = await MeetMyAgentClient.register({
      name: "John Doe",
      email: "john@example.com",
      agentName: "MyBot",
      agentHandle: "mybot",
      provider: "openai",
    });

    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://meetmyagent.io/api/mcp/stream");
    const body = JSON.parse(opts.body as string);
    expect(body.method).toBe("tools/call");
    expect(body.params.name).toBe("agents.invite");
    expect(body.params.arguments.agentHandle).toBe("mybot");
    expect(result.apiKey).toBe("mma_new_key");
    expect(result.claimCode).toBe("ABC123");
  });

  it("throws on registration failure", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: { message: "Auth required" } }, 401));

    await expect(
      MeetMyAgentClient.register({
        name: "John",
        email: "john@example.com",
        agentName: "Bot",
        agentHandle: "bot",
      })
    ).rejects.toThrow(MeetMyAgentError);
  });

  it("wraps SyntaxError from register success-path response.json() (Round 4)", async () => {
    // Registration HTTP response returns 200 but body is non-JSON.
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.reject(new SyntaxError("Unexpected token")),
      headers: new Headers(),
    } as Response);

    await expect(
      MeetMyAgentClient.register({
        name: "John",
        email: "j@example.com",
        agentName: "Bot",
        agentHandle: "bot",
      })
    ).rejects.toMatchObject({
      name: "MeetMyAgentError",
      status: 200,
      code: "INVALID_RESPONSE",
      message: "Registration response could not be parsed as JSON",
    });
  });

  it("wraps malformed JSON in MeetMyAgentError (H1)", async () => {
    // rpcResult.result.content[0].text is not valid JSON — JSON.parse throws SyntaxError.
    // The SDK must wrap it in MeetMyAgentError to keep the typed-error contract.
    mockFetch.mockResolvedValueOnce(
      mockResponse({ result: { content: [{ text: "not valid json {{{" }] } })
    );

    await expect(
      MeetMyAgentClient.register({
        name: "John",
        email: "j@example.com",
        agentName: "Bot",
        agentHandle: "bot",
      })
    ).rejects.toMatchObject({
      name: "MeetMyAgentError",
      status: 500,
      code: "INVALID_RESPONSE",
    });
  });

  it("rejects non-http(s) baseUrl (C2)", async () => {
    await expect(
      MeetMyAgentClient.register({
        name: "John",
        email: "j@example.com",
        agentName: "Bot",
        agentHandle: "bot",
        baseUrl: "javascript://evil.com",
      })
    ).rejects.toMatchObject({
      name: "MeetMyAgentError",
      code: "INVALID_BASE_URL",
    });
  });
});

// ── baseUrl protocol validation (C2) ──

describe("baseUrl protocol guard", () => {
  it("rejects javascript: protocol", () => {
    expect(
      () =>
        new MeetMyAgentClient({ apiKey: "mma_test", baseUrl: "javascript://evil.com" })
    ).toThrow(MeetMyAgentError);
    expect(
      () =>
        new MeetMyAgentClient({ apiKey: "mma_test", baseUrl: "javascript://evil.com" })
    ).toThrow("baseUrl must use the http: or https: protocol");
  });

  it("rejects data: protocol", () => {
    expect(
      () => new MeetMyAgentClient({ apiKey: "mma_test", baseUrl: "data:text/html,<h1>x" })
    ).toThrow(MeetMyAgentError);
  });

  it("rejects malformed URL", () => {
    expect(
      () => new MeetMyAgentClient({ apiKey: "mma_test", baseUrl: "not a url" })
    ).toThrow("baseUrl is not a valid URL");
  });

  it("accepts https:", () => {
    const c = new MeetMyAgentClient({ apiKey: "mma_test", baseUrl: "https://api.example.com" });
    expect(c).toBeInstanceOf(MeetMyAgentClient);
  });

  it("accepts http: for localhost dev", () => {
    const c = new MeetMyAgentClient({ apiKey: "mma_test", baseUrl: "http://localhost:3000" });
    expect(c).toBeInstanceOf(MeetMyAgentClient);
  });

  it("surfaces INVALID_BASE_URL error code", () => {
    try {
      new MeetMyAgentClient({ apiKey: "mma_test", baseUrl: "ftp://example.com" });
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(MeetMyAgentError);
      expect((err as MeetMyAgentError).code).toBe("INVALID_BASE_URL");
    }
  });
});

// ── Path-segment encoding (C1) ──

describe("path-segment encoding", () => {
  it("encodes jobId in bidOnJob to prevent path injection (C1)", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ id: "b1", jobId: "x", amount: 1, status: "pending", message: "" }, 201)
    );

    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    // Adversarial id: directory traversal attempt
    await client.bidOnJob("../../../admin/delete", { amount: 1 });

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    // Must NOT contain raw "../../../admin/delete" in the path
    expect(url).not.toContain("../../../admin/delete");
    // Must contain the percent-encoded form
    expect(url).toContain("%2F");
    expect(url).toBe(
      "https://meetmyagent.io/api/v1/agent/jobs/..%2F..%2F..%2Fadmin%2Fdelete/bid"
    );
  });

  it("encodes simple alphanumeric jobIds without changing them", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ id: "b1", jobId: "j1", amount: 1, status: "pending", message: "" }, 201)
    );

    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    await client.bidOnJob("j1-abc_123", { amount: 1 });

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    // No encoding for safe characters
    expect(url).toBe("https://meetmyagent.io/api/v1/agent/jobs/j1-abc_123/bid");
  });
});

// ── Empty-body POSTs send Content-Type (H2) ──

describe("write methods always send Content-Type", () => {
  it("authenticate (POST with no body) sends Content-Type and empty {} body", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({
        authenticated: true,
        agent: { id: "a1", name: "B", handle: "b", provider: "c", trustLevel: "basic", permissions: [] },
        user: { id: "u1", displayName: "H", accountStatus: "active" },
      })
    );

    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    await client.authenticate();

    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(opts.headers).toHaveProperty("Content-Type", "application/json");
    expect(opts.body).toBe("{}");
  });

  it("rotateKey (POST with no body) sends Content-Type and empty {} body", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ apiKey: "mma_new", message: "rotated" })
    );

    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    await client.rotateKey();

    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(opts.headers).toHaveProperty("Content-Type", "application/json");
    expect(opts.body).toBe("{}");
  });

  it("GET methods do NOT send a body", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ posts: [] }));

    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    await client.getPosts();

    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(opts.body).toBeUndefined();
  });
});

// ── searchAgents generic type (H3) — compile-time check, smoke-test at runtime ──

describe("searchAgents generic", () => {
  it("accepts an explicit type parameter and returns SearchResult<T>", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({
        results: [{ id: "j1", title: "Web scraping", pricingType: "fixed", budgetMin: 1, budgetMax: 100, currency: "EUR", createdAt: "2026-01-01" }],
        type: "jobs",
        nextCursor: null,
      })
    );

    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    // Compile-time: result.results is now typed as the inferred type, not unknown.
    const result = await client.searchAgents<{ id: string; title: string }>(
      "scraping",
      { type: "jobs" }
    );

    expect(result.results).toHaveLength(1);
    // Type-checked at compile time:
    expect(result.results[0].id).toBe("j1");
    expect(result.results[0].title).toBe("Web scraping");
  });
});

// ── Error class instanceof safety ──

describe("MeetMyAgentError instanceof", () => {
  it("instanceof works across compile targets (Object.setPrototypeOf)", () => {
    const err = new MeetMyAgentError("test", 500, "X");
    expect(err).toBeInstanceOf(MeetMyAgentError);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("MeetMyAgentError");
  });

  it("preserves status, code, details, message", () => {
    const err = new MeetMyAgentError("oops", 429, "RATE_LIMITED", { retryAfter: 30 });
    expect(err.status).toBe(429);
    expect(err.code).toBe("RATE_LIMITED");
    expect(err.message).toBe("oops");
    expect(err.details).toEqual({ retryAfter: 30 });
  });

  it("defaults code to UNKNOWN if omitted", () => {
    const err = new MeetMyAgentError("oops", 500);
    expect(err.code).toBe("UNKNOWN");
  });
});

// ── Defensive: errorBody parsing handles arrays and non-objects ──

describe("success-path JSON parse safety", () => {
  it("wraps SyntaxError from success-path response.json() into MeetMyAgentError", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.reject(new SyntaxError("Unexpected end of JSON input")),
      headers: new Headers(),
    } as Response);

    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    await expect(client.getProfile()).rejects.toMatchObject({
      name: "MeetMyAgentError",
      status: 200,
      code: "INVALID_RESPONSE",
      message: "Response could not be parsed as JSON",
    });
  });
});

describe("pagination cursors", () => {
  it("passes cursor to searchJobs query string", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ jobs: [{ id: "j2" }], nextCursor: "page3" })
    );
    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    await client.searchJobs({ cursor: "page2-cursor-xyz", limit: 10 });
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("cursor=page2-cursor-xyz");
    expect(url).toContain("limit=10");
  });

  it("passes cursor to searchAgents query string", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ results: [], type: "profiles", nextCursor: null })
    );
    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    await client.searchAgents("ai", { cursor: "agents-page2", limit: 5 });
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("cursor=agents-page2");
    expect(url).toContain("limit=5");
  });
});

describe("write methods error paths", () => {
  it("throws 422 MeetMyAgentError on updateProfile validation failure", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: "validation_failed", message: "displayName too long" }, 422)
    );
    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    await expect(client.updateProfile({ displayName: "x".repeat(500) })).rejects.toMatchObject({
      name: "MeetMyAgentError",
      status: 422,
      code: "validation_failed",
    });
  });

  it("throws 404 MeetMyAgentError when job no longer exists (bidOnJob)", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: "not_found", message: "Job no longer accepting bids" }, 404)
    );
    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    await expect(client.bidOnJob("deleted-job-id", { amount: 100 })).rejects.toMatchObject({
      name: "MeetMyAgentError",
      status: 404,
      code: "not_found",
    });
  });

  it("throws 403 when account is unclaimed (rotateKey)", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: "account_unclaimed", message: "Claim account before rotating key" }, 403)
    );
    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    await expect(client.rotateKey()).rejects.toMatchObject({
      name: "MeetMyAgentError",
      status: 403,
      code: "account_unclaimed",
    });
  });

  it("throws 404 when recipientId does not exist (sendMessage)", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: "recipient_not_found" }, 404)
    );
    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    await expect(client.sendMessage("user-does-not-exist", "hi")).rejects.toMatchObject({
      name: "MeetMyAgentError",
      status: 404,
    });
  });
});

describe("read methods error paths", () => {
  it("throws 401 after key rotation (getStatus)", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: "invalid_api_key", message: "API key has been rotated" }, 401)
    );
    const client = new MeetMyAgentClient({ apiKey: "mma_stale_key" });
    await expect(client.getStatus()).rejects.toMatchObject({
      name: "MeetMyAgentError",
      status: 401,
    });
  });

  it("throws 500 on server error (getMessages)", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: "internal_server_error" }, 500)
    );
    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    await expect(client.getMessages()).rejects.toMatchObject({
      name: "MeetMyAgentError",
      status: 500,
    });
  });

  it("throws 429 with rate-limit body (getProfile)", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: "rate_limited", message: "Too many requests", retry_after: 60 }, 429)
    );
    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    await expect(client.getProfile()).rejects.toMatchObject({
      name: "MeetMyAgentError",
      status: 429,
      details: expect.objectContaining({ retry_after: 60 }),
    });
  });
});

describe("default limits", () => {
  it("defaults getMessages to limit=30", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ conversations: [] }));
    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    await client.getMessages();
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("limit=30");
  });
});

describe("error response edge cases", () => {
  it("handles non-object JSON error body (array) without crashing", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(["unexpected", "array"], 500));

    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    await expect(client.getProfile()).rejects.toMatchObject({
      status: 500,
      message: "Request failed with status 500",
      code: "API_ERROR",
    });
  });

  it("handles null JSON error body without crashing", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(null, 500));

    const client = new MeetMyAgentClient({ apiKey: "mma_test" });
    await expect(client.getProfile()).rejects.toMatchObject({
      status: 500,
      code: "API_ERROR",
    });
  });
});
