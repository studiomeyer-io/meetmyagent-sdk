import { ACP_API_VERSION } from "./checkout.js";
import type { CheckoutCreateInput, CheckoutUpdateInput, CheckoutCompleteInput, CheckoutSessionView, CheckoutMutationOptions, CheckoutCompleteOptions } from "./checkout.js";
import type { DirectoriesView, DirectoryActionView, DirectoryPreviewView, AgentView, AnswerView, ApiKeyView, ApprovalView, BidView, BlogPostMeta, BlogPostView, CatalogSchemaView, ChatSendResult, ChatSessionView, CreateListingInput, CreatedApiKeyView, DealView, DeliveryView, DomainVerifyView, Envelope, CreateReviewInput, ImportResultView, IntakeJobView, IntakeSourceView, JobView, ListingView, LoginResultView, MagicLinkLocale, MeView, MeScopesView, OAuthClientRegistration, OAuthTokenGrant, PrincipalView, ProviderDirectoryView, ProviderView, PublishResultView, RequestView, ResolvedSetting, ResultInfo, ReviewView, SearchQueryInput, StructuredImportView, SyncReportView, TopupView, UploadLinkView, VisibilityReport, WebhookView, BookingReceiptView, CapabilityAdaptersView, CapabilityDirectoryView, CapabilityOwnedView, CapabilityPublicView, CapabilityPublishResult, CapabilitySetupResult, CapabilitySetupState, CapabilitySlotsView, ConnectionView, AgentAskResultView, AgentInstallView, AgentRequestPatchInput, AgentRequestStatus, AgentRequestView, DirectoryEntryView, DirectoryPageView, DirectoryRefKind, ExternalAgentView, HostedAgentPatchInput, HostedAgentSetupView, HostedAgentStateView, HostedCardPatchInput, HostedCardStateView, CardImageKind, CardImageUploadType, HostedContactClickInput, QrCodeCreateInput, QrCodeUpdateInput, QrCodeView, QrDownloadLinkView, QrFileDownload, QrFileOptions, QrResolutionView, QrStatsView, HostedMessageReply, HostedPublicView, HostedRequestReply, KnowledgeInput, KnowledgeRefreshView, KnowledgeReplaceView, KnowledgeSourceView, BillingCheckoutInput, BillingRedirectView, BillingView, CancellationInput, CancellationReceiptView, CancellationScheduledView, CancellationUndoView, } from "./types.js";
import type { AssistantMessageResult, AssistantMessageView, AssistantSessionView, AssistantStateView } from "./types.js";
export interface ClientOptions {
    baseUrl: string;
    token?: string;
    fetch?: typeof fetch;
}
export class MeetMyAgentError extends Error {
    readonly slug: string;
    readonly code: number;
    readonly requestId: string;
    readonly httpStatus: number;
    readonly documentationUrl: string | undefined;
    constructor(slug: string, code: number, message: string, requestId: string, httpStatus = 0, documentationUrl?: string) {
        super(message);
        this.name = "MeetMyAgentError";
        this.slug = slug;
        this.code = code;
        this.requestId = requestId;
        this.httpStatus = httpStatus;
        this.documentationUrl = documentationUrl;
    }
}
export class MeetMyAgentClient {
    private readonly baseUrl: string;
    private readonly token: string | undefined;
    private readonly f: typeof fetch;
    constructor(opts: ClientOptions) {
        this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
        this.token = opts.token;
        this.f = opts.fetch ?? fetch;
    }
    private async requestWithInfo<T>(method: string, path: string, body?: unknown, extraHeaders?: Record<string, string>): Promise<{
        result: T;
        info: ResultInfo | undefined;
    }> {
        const headers: Record<string, string> = { "content-type": "application/json", ...(extraHeaders ?? {}) };
        if (this.token)
            headers["authorization"] = `Bearer ${this.token}`;
        const res = await this.f(`${this.baseUrl}${path}`, {
            method,
            headers,
            ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        });
        const env = (await res.json()) as Envelope<T>;
        if (!env.success || env.result === null) {
            const first = env.errors[0];
            throw new MeetMyAgentError(first?.slug ?? "unknown", first?.code ?? 0, first?.message ?? "request failed", env.request_id, res.status, first?.documentation_url);
        }
        return { result: env.result, info: env.result_info };
    }
    private async request<T>(method: string, path: string, body?: unknown, extraHeaders?: Record<string, string>): Promise<T> {
        return (await this.requestWithInfo<T>(method, path, body, extraHeaders)).result;
    }
    private async checkoutRequest(method: "GET" | "POST", path: string, body?: unknown, options?: CheckoutMutationOptions, userConfirmed?: true): Promise<CheckoutSessionView> {
        if (method === "POST" && (!options?.idempotencyKey || options.idempotencyKey.trim() !== options.idempotencyKey)) {
            throw new MeetMyAgentError("idempotency_key_required", 400, "Provide a stable Idempotency-Key and reuse it for retries.", "-", 400);
        }
        const headers: Record<string, string> = { "content-type": "application/json", "api-version": ACP_API_VERSION };
        if (this.token)
            headers["authorization"] = `Bearer ${this.token}`;
        if (options)
            headers["idempotency-key"] = options.idempotencyKey;
        if (userConfirmed)
            headers["x-mma-user-confirmed"] = "true";
        const response = await this.f(`${this.baseUrl}${path}`, {
            method, headers, ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        });
        const data: unknown = await response.json().catch(() => null);
        const record = typeof data === "object" && data !== null ? data as Record<string, unknown> : {};
        if (!response.ok) {
            const errors = Array.isArray(record["errors"]) ? record["errors"] : [];
            const first = typeof errors[0] === "object" && errors[0] !== null ? errors[0] as Record<string, unknown> : {};
            const slug = typeof record["code"] === "string" ? record["code"] : typeof first["slug"] === "string" ? first["slug"] : "checkout_failed";
            const message = typeof record["message"] === "string" ? record["message"] : typeof first["message"] === "string" ? first["message"] : "Checkout request failed. Read the existing session before retrying.";
            const requestId = response.headers.get("request-id") ?? (typeof record["request_id"] === "string" ? record["request_id"] : "-");
            throw new MeetMyAgentError(slug, response.status, message, requestId, response.status);
        }
        if (typeof record["id"] !== "string" || typeof record["status"] !== "string" || typeof record["currency"] !== "string"
            || !Array.isArray(record["line_items"]) || !Array.isArray(record["totals"]) || !Array.isArray(record["messages"])
            || !Array.isArray(record["links"]) || !Array.isArray(record["fulfillment_options"])
            || typeof record["capabilities"] !== "object" || record["capabilities"] === null) {
            throw new MeetMyAgentError("checkout_invalid_response", 502, "The checkout response is incomplete. Do not treat this purchase as paid.", response.headers.get("request-id") ?? "-", response.status);
        }
        return data as CheckoutSessionView;
    }
    readonly checkout = {
        create: (input: CheckoutCreateInput, options: CheckoutMutationOptions): Promise<CheckoutSessionView> => this.checkoutRequest("POST", "/checkout_sessions", input, options),
        get: (id: string): Promise<CheckoutSessionView> => this.checkoutRequest("GET", `/checkout_sessions/${encodeURIComponent(id)}`),
        update: (id: string, input: CheckoutUpdateInput, options: CheckoutMutationOptions): Promise<CheckoutSessionView> => this.checkoutRequest("POST", `/checkout_sessions/${encodeURIComponent(id)}`, input, options),
        complete: (id: string, input: CheckoutCompleteInput, options: CheckoutCompleteOptions): Promise<CheckoutSessionView> => {
            if (options.userConfirmed !== true)
                return Promise.reject(new MeetMyAgentError("buyer_confirmation_required", 400, "The buyer must explicitly authorize this purchase.", "-", 400));
            return this.checkoutRequest("POST", `/checkout_sessions/${encodeURIComponent(id)}/complete`, input, options, true);
        },
        cancel: (id: string, options: CheckoutMutationOptions): Promise<CheckoutSessionView> => this.checkoutRequest("POST", `/checkout_sessions/${encodeURIComponent(id)}/cancel`, {}, options),
    };
    private async fileRequest(path: string): Promise<QrFileDownload> {
        const headers: Record<string, string> = {};
        if (this.token)
            headers["authorization"] = `Bearer ${this.token}`;
        const res = await this.f(`${this.baseUrl}${path}`, { method: "GET", headers });
        if (!res.ok) {
            const env = (await res.json().catch(() => null)) as Envelope<unknown> | null;
            const first = env?.errors?.[0];
            throw new MeetMyAgentError(first?.slug ?? "unknown", first?.code ?? 0, first?.message ?? "request failed", env?.request_id ?? "-", res.status, first?.documentation_url);
        }
        const disposition = res.headers.get("content-disposition") ?? "";
        const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? "download";
        return { filename, contentType: res.headers.get("content-type") ?? "application/octet-stream", bytes: new Uint8Array(await res.arrayBuffer()) };
    }
    private async binaryRequest<T>(method: string, path: string, data: Blob | ArrayBuffer | Uint8Array, contentType: string): Promise<T> {
        const headers: Record<string, string> = { "content-type": contentType };
        if (this.token)
            headers["authorization"] = `Bearer ${this.token}`;
        const body = data instanceof Uint8Array ? new Uint8Array(data) : data;
        const res = await this.f(`${this.baseUrl}${path}`, { method, headers, body });
        const env = (await res.json().catch(() => null)) as Envelope<T> | null;
        if (!env || !env.success || env.result === null) {
            const first = env?.errors?.[0];
            throw new MeetMyAgentError(first?.slug ?? "unknown", first?.code ?? 0, first?.message ?? "request failed", env?.request_id ?? "-", res.status, first?.documentation_url);
        }
        return env.result;
    }
    health(): Promise<{
        status: string;
    }> {
        return this.request<{
            status: string;
        }>("GET", "/v1/health");
    }
    private async rawRequest<T>(path: string, payload: unknown): Promise<T> {
        const res = await this.f(`${this.baseUrl}${path}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
        });
        const data = (await res.json()) as T & {
            error?: string;
            error_description?: string;
        };
        if (!res.ok || (typeof data === "object" && data !== null && "error" in data && data.error)) {
            throw new MeetMyAgentError(data.error ?? "oauth_error", res.status, data.error_description ?? "OAuth request failed", "-");
        }
        return data;
    }
    readonly auth = {
        register: (input: {
            email: string;
            password: string;
            displayName?: string;
        }): Promise<LoginResultView> => this.request<LoginResultView>("POST", "/v1/auth/register", input),
        login: (email: string, password: string): Promise<LoginResultView> => this.request<LoginResultView>("POST", "/v1/auth/login", { email, password }),
        requestMagicLink: (email: string, locale?: MagicLinkLocale): Promise<{
            status: string;
        }> => this.request("POST", "/v1/auth/magic/request", locale === undefined ? { email } : { email, locale }),
        verifyMagicLink: (token: string, locale?: MagicLinkLocale): Promise<LoginResultView> => this.request<LoginResultView>("POST", "/v1/auth/magic/verify", locale === undefined ? { token } : { token, locale }),
        loginWithGoogle: (idToken: string, locale?: MagicLinkLocale): Promise<LoginResultView> => this.request<LoginResultView>("POST", "/v1/auth/google", locale === undefined ? { idToken } : { idToken, locale }),
        logout: (): Promise<{
            status: string;
        }> => this.request("POST", "/v1/auth/logout", {}),
        oauth: {
            registerClient: (clientName: string, redirectUris: string[]): Promise<OAuthClientRegistration> => this.rawRequest<OAuthClientRegistration>("/v1/auth/oauth/register", {
                client_name: clientName,
                redirect_uris: redirectUris,
            }),
            authorize: (input: {
                clientId: string;
                redirectUri: string;
                scope: string;
                state?: string;
                codeChallenge: string;
            }): Promise<{
                authorizationId: string;
                scopes: string[];
                expiresAt: number;
            }> => this.request("POST", "/v1/auth/oauth/authorize", {
                client_id: input.clientId,
                redirect_uri: input.redirectUri,
                scope: input.scope,
                ...(input.state !== undefined ? { state: input.state } : {}),
                code_challenge: input.codeChallenge,
                code_challenge_method: "S256",
            }),
            getRequest: (id: string): Promise<{
                id: string;
                clientName: string;
                scopes: string[];
                redirectUri: string;
                expiresAt: number;
            }> => this.request("GET", `/v1/auth/oauth/requests/${encodeURIComponent(id)}`),
            decide: (id: string, approve: boolean, grantedScopes?: string[]): Promise<{
                redirectTo: string;
            }> => this.request("POST", `/v1/auth/oauth/requests/${encodeURIComponent(id)}/decision`, {
                approve,
                ...(grantedScopes !== undefined ? { granted_scopes: grantedScopes } : {}),
            }),
            exchangeCode: (input: {
                code: string;
                codeVerifier: string;
                clientId: string;
                redirectUri: string;
            }): Promise<OAuthTokenGrant> => this.rawRequest<OAuthTokenGrant>("/v1/auth/oauth/token", {
                grant_type: "authorization_code",
                code: input.code,
                code_verifier: input.codeVerifier,
                client_id: input.clientId,
                redirect_uri: input.redirectUri,
            }),
            refresh: (refreshToken: string, clientId: string): Promise<OAuthTokenGrant> => this.rawRequest<OAuthTokenGrant>("/v1/auth/oauth/token", {
                grant_type: "refresh_token",
                refresh_token: refreshToken,
                client_id: clientId,
            }),
        },
    };
    readonly me = {
        get: (): Promise<MeView> => this.request<MeView>("GET", "/v1/me"),
        scopes: (): Promise<MeScopesView> => this.request<MeScopesView>("GET", "/v1/me/scopes"),
        update: (patch: {
            displayName?: string;
            bio?: string;
            kind?: "person" | "business";
        }): Promise<PrincipalView> => this.request<PrincipalView>("PATCH", "/v1/me", patch),
    };
    readonly keys = {
        create: (name: string, scopes: string[]): Promise<CreatedApiKeyView> => this.request<CreatedApiKeyView>("POST", "/v1/keys", { name, scopes }),
        list: (): Promise<ApiKeyView[]> => this.request<ApiKeyView[]>("GET", "/v1/keys"),
        revoke: (id: string): Promise<ApiKeyView> => this.request<ApiKeyView>("DELETE", `/v1/keys/${encodeURIComponent(id)}`),
        grantableScopes: (): Promise<{
            grantable: string[];
        }> => this.request("GET", "/v1/keys/scopes"),
    };
    readonly agents = {
        list: (params?: {
            limit?: number;
            cursor?: string;
        }): Promise<AgentView[]> => {
            const q = new URLSearchParams();
            if (params?.limit !== undefined)
                q.set("limit", String(params.limit));
            if (params?.cursor !== undefined)
                q.set("cursor", params.cursor);
            const qs = q.toString();
            return this.request<AgentView[]>("GET", `/v1/agents${qs ? `?${qs}` : ""}`);
        },
        get: (id: string): Promise<AgentView> => this.request<AgentView>("GET", `/v1/agents/${encodeURIComponent(id)}`),
    };
    readonly catalog = {
        schema: (category?: string): Promise<CatalogSchemaView> => this.request<CatalogSchemaView>("GET", `/v1/catalog/schema${category ? `?category=${encodeURIComponent(category)}` : ""}`),
        search: (query: SearchQueryInput): Promise<ListingView[]> => this.request<ListingView[]>("POST", "/v1/catalog/search", query),
        searchPage: async (query: SearchQueryInput): Promise<{
            items: ListingView[];
            count: number;
            cursor: string | null;
        }> => {
            const { result, info } = await this.requestWithInfo<ListingView[]>("POST", "/v1/catalog/search", query);
            return { items: result, count: info?.count ?? result.length, cursor: info?.cursor ?? null };
        },
    };
    readonly listings = {
        create: (input: CreateListingInput, idempotencyKey?: string): Promise<ListingView> => this.request<ListingView>("POST", "/v1/listings", input, idempotencyKey ? { "idempotency-key": idempotencyKey } : undefined),
        get: (id: string): Promise<ListingView> => this.request<ListingView>("GET", `/v1/listings/${encodeURIComponent(id)}`),
        mine: (): Promise<ListingView[]> => this.request<ListingView[]>("GET", "/v1/listings?provider=me"),
        byProvider: (providerId: string): Promise<ListingView[]> => this.request<ListingView[]>("GET", `/v1/listings?provider=${encodeURIComponent(providerId)}`),
        update: (id: string, patch: Partial<CreateListingInput> & {
            status?: "draft" | "active" | "paused";
        }): Promise<ListingView> => this.request<ListingView>("PATCH", `/v1/listings/${encodeURIComponent(id)}`, patch),
        archive: (id: string): Promise<ListingView> => this.request<ListingView>("POST", `/v1/listings/${encodeURIComponent(id)}/archive`),
        visibility: (id: string): Promise<VisibilityReport> => this.request<VisibilityReport>("GET", `/v1/listings/${encodeURIComponent(id)}/visibility`),
        boost: (id: string, days: number): Promise<{
            listing: ListingView;
            credits: {
                debited: number;
                balance: number;
            };
        }> => this.request("POST", `/v1/listings/${encodeURIComponent(id)}/boost`, { days }),
        reviews: (id: string): Promise<ReviewView[]> => this.request<ReviewView[]>("GET", `/v1/listings/${encodeURIComponent(id)}/reviews`),
        review: (id: string, input: CreateReviewInput, idempotencyKey?: string): Promise<ReviewView> => this.request<ReviewView>("POST", `/v1/listings/${encodeURIComponent(id)}/reviews`, input, idempotencyKey ? { "idempotency-key": idempotencyKey } : undefined),
    };
    readonly providers = {
        get: (id: string): Promise<ProviderView> => this.request<ProviderView>("GET", `/v1/providers/${encodeURIComponent(id)}`),
        list: (params?: {
            category?: string;
            q?: string;
        }): Promise<ProviderDirectoryView> => {
            const qs = new URLSearchParams();
            if (params?.category)
                qs.set("category", params.category);
            if (params?.q)
                qs.set("q", params.q);
            const suffix = qs.size > 0 ? `?${qs.toString()}` : "";
            return this.request<ProviderDirectoryView>("GET", `/v1/providers${suffix}`);
        },
    };
    readonly capabilities = {
        find: (params?: {
            type?: string;
            q?: string;
            limit?: number;
        }): Promise<CapabilityDirectoryView> => {
            const qs = new URLSearchParams();
            if (params?.type)
                qs.set("type", params.type);
            if (params?.q)
                qs.set("q", params.q);
            if (params?.limit)
                qs.set("limit", String(params.limit));
            const suffix = qs.size > 0 ? `?${qs.toString()}` : "";
            return this.request<CapabilityDirectoryView>("GET", `/v1/capabilities${suffix}`);
        },
        get: (id: string): Promise<{
            capability: CapabilityPublicView;
        }> => this.request<{
            capability: CapabilityPublicView;
        }>("GET", `/v1/capabilities/${encodeURIComponent(id)}`),
        mine: (): Promise<{
            capabilities: CapabilityOwnedView[];
        }> => this.request<{
            capabilities: CapabilityOwnedView[];
        }>("GET", "/v1/capabilities/mine"),
        create: (input: {
            type: string;
            name: string;
            headline?: string;
            description?: string;
            locationLabel?: string;
        }, idemKey?: string): Promise<CapabilitySetupResult> => this.request<CapabilitySetupResult>("POST", "/v1/capabilities", input, idemKey ? { "idempotency-key": idemKey } : undefined),
        configure: (id: string, input: {
            name?: string;
            headline?: string;
            description?: string;
            locationLabel?: string;
            config?: Record<string, unknown>;
            connectionId?: string | null;
        }): Promise<CapabilitySetupResult> => this.request<CapabilitySetupResult>("PATCH", `/v1/capabilities/${encodeURIComponent(id)}`, input),
        setup: (id: string): Promise<{
            setup: CapabilitySetupState;
        }> => this.request<{
            setup: CapabilitySetupState;
        }>("GET", `/v1/capabilities/${encodeURIComponent(id)}/setup`),
        publish: (id: string, idemKey?: string): Promise<CapabilityPublishResult> => this.request<CapabilityPublishResult>("POST", `/v1/capabilities/${encodeURIComponent(id)}/publish`, {}, idemKey ? { "idempotency-key": idemKey } : undefined),
        pause: (id: string): Promise<{
            capability: {
                id: string;
                status: string;
            };
        }> => this.request<{
            capability: {
                id: string;
                status: string;
            };
        }>("POST", `/v1/capabilities/${encodeURIComponent(id)}/pause`, {}),
        slots: (id: string, params?: {
            service?: string;
            from?: string;
            to?: string;
        }): Promise<CapabilitySlotsView> => {
            const qs = new URLSearchParams();
            if (params?.service)
                qs.set("service", params.service);
            if (params?.from)
                qs.set("from", params.from);
            if (params?.to)
                qs.set("to", params.to);
            const suffix = qs.size > 0 ? `?${qs.toString()}` : "";
            return this.request<CapabilitySlotsView>("GET", `/v1/capabilities/${encodeURIComponent(id)}/slots${suffix}`);
        },
        book: (id: string, input: {
            serviceKey: string;
            start: string;
            attendee: {
                name: string;
                email: string;
                timeZone?: string;
            };
            note?: string;
        }, idemKey?: string): Promise<{
            booking: BookingReceiptView;
        }> => this.request<{
            booking: BookingReceiptView;
        }>("POST", `/v1/capabilities/${encodeURIComponent(id)}/book`, input, idemKey ? { "idempotency-key": idemKey } : undefined),
        adapters: (id: string): Promise<CapabilityAdaptersView> => this.request<CapabilityAdaptersView>("GET", `/v1/capabilities/${encodeURIComponent(id)}/adapters`),
    };
    readonly connections = {
        list: (): Promise<{
            connections: ConnectionView[];
        }> => this.request<{
            connections: ConnectionView[];
        }>("GET", "/v1/connections"),
        create: (input: {
            kind: "calcom";
            label?: string;
            config: {
                baseUrl: string;
                username: string;
            };
        }, idemKey?: string): Promise<{
            connection: ConnectionView;
        }> => this.request<{
            connection: ConnectionView;
        }>("POST", "/v1/connections", input, idemKey ? { "idempotency-key": idemKey } : undefined),
        delete: (id: string): Promise<{
            deleted: boolean;
        }> => this.request<{
            deleted: boolean;
        }>("DELETE", `/v1/connections/${encodeURIComponent(id)}`),
    };
    readonly bookings = {
        list: (params?: {
            role?: "provider" | "caller";
            limit?: number;
        }): Promise<{
            bookings: BookingReceiptView[];
            count: number;
            role: string;
        }> => {
            const qs = new URLSearchParams();
            if (params?.role)
                qs.set("role", params.role);
            if (params?.limit)
                qs.set("limit", String(params.limit));
            const suffix = qs.size > 0 ? `?${qs.toString()}` : "";
            return this.request<{
                bookings: BookingReceiptView[];
                count: number;
                role: string;
            }>("GET", `/v1/bookings${suffix}`);
        },
        get: (id: string): Promise<{
            booking: BookingReceiptView;
        }> => this.request<{
            booking: BookingReceiptView;
        }>("GET", `/v1/bookings/${encodeURIComponent(id)}`),
        cancel: (id: string, reason?: string): Promise<{
            booking: BookingReceiptView;
        }> => this.request<{
            booking: BookingReceiptView;
        }>("POST", `/v1/bookings/${encodeURIComponent(id)}/cancel`, reason ? { reason } : {}),
    };
    readonly domains = {
        list: (): Promise<DomainVerifyView[]> => this.request<DomainVerifyView[]>("GET", "/v1/domains"),
        request: (domain: string): Promise<DomainVerifyView> => this.request<DomainVerifyView>("POST", "/v1/domains", { domain }),
        check: (domain: string): Promise<DomainVerifyView> => this.request<DomainVerifyView>("POST", "/v1/domains/check", { domain }),
    };
    readonly jobs = {
        create: (input: {
            title: string;
            description: string;
            category?: string;
            budgetCents?: number;
            currency?: string;
        }): Promise<JobView> => this.request<JobView>("POST", "/v1/jobs", input),
        list: (params?: {
            status?: string;
            category?: string;
            limit?: number;
        }): Promise<JobView[]> => {
            const q = new URLSearchParams();
            if (params?.status)
                q.set("status", params.status);
            if (params?.category)
                q.set("category", params.category);
            if (params?.limit !== undefined)
                q.set("limit", String(params.limit));
            const qs = q.toString();
            return this.request<JobView[]>("GET", `/v1/jobs${qs ? `?${qs}` : ""}`);
        },
        get: (id: string): Promise<{
            job: JobView;
            bids: BidView[];
        }> => this.request("GET", `/v1/jobs/${encodeURIComponent(id)}`),
        bid: (jobId: string, input: {
            amountCents: number;
            currency?: string;
            message?: string;
        }): Promise<BidView> => this.request<BidView>("POST", `/v1/jobs/${encodeURIComponent(jobId)}/bids`, input),
        acceptBid: (jobId: string, bidId: string): Promise<{
            job: JobView;
            bid: BidView;
            dealId: string;
        }> => this.request("POST", `/v1/jobs/${encodeURIComponent(jobId)}/bids/${encodeURIComponent(bidId)}/accept`),
    };
    readonly deals = {
        create: (input: {
            sellerAgent: string;
            amountCents: number;
            currency?: string;
        }, idempotencyKey?: string): Promise<DealView> => this.request<DealView>("POST", "/v1/deals", input, idempotencyKey ? { "idempotency-key": idempotencyKey } : undefined),
        get: (id: string): Promise<DealView> => this.request<DealView>("GET", `/v1/deals/${encodeURIComponent(id)}`),
        propose: (id: string): Promise<DealView> => this.request<DealView>("POST", `/v1/deals/${encodeURIComponent(id)}/propose`),
        requestApproval: (id: string, action: "deal.approve" | "deal.confirm"): Promise<ApprovalView> => this.request<ApprovalView>("POST", `/v1/deals/${encodeURIComponent(id)}/request-approval`, { action }),
        applyApproval: (id: string, approvalId: string): Promise<DealView> => this.request<DealView>("POST", `/v1/deals/${encodeURIComponent(id)}/apply-approval`, { approvalId }),
        fund: (id: string): Promise<DealView> => this.request<DealView>("POST", `/v1/deals/${encodeURIComponent(id)}/fund`),
        start: (id: string): Promise<DealView> => this.request<DealView>("POST", `/v1/deals/${encodeURIComponent(id)}/start`),
        deliver: (id: string): Promise<DealView> => this.request<DealView>("POST", `/v1/deals/${encodeURIComponent(id)}/deliver`),
        confirmRelease: (id: string, approvalId: string): Promise<DealView> => this.request<DealView>("POST", `/v1/deals/${encodeURIComponent(id)}/confirm-release`, { approvalId }),
        dispute: (id: string): Promise<DealView> => this.request<DealView>("POST", `/v1/deals/${encodeURIComponent(id)}/dispute`),
        resolveRefund: (id: string): Promise<DealView> => this.request<DealView>("POST", `/v1/deals/${encodeURIComponent(id)}/resolve-refund`),
    };
    readonly approvals = {
        list: (status?: string): Promise<ApprovalView[]> => this.request<ApprovalView[]>("GET", `/v1/approvals${status ? `?status=${encodeURIComponent(status)}` : ""}`),
        get: (id: string): Promise<ApprovalView> => this.request<ApprovalView>("GET", `/v1/approvals/${encodeURIComponent(id)}`),
        approve: (id: string): Promise<ApprovalView> => this.request<ApprovalView>("POST", `/v1/approvals/${encodeURIComponent(id)}/approve`),
        reject: (id: string): Promise<ApprovalView> => this.request<ApprovalView>("POST", `/v1/approvals/${encodeURIComponent(id)}/reject`),
    };
    readonly requests = {
        create: (input: {
            title: string;
            body: string;
            category?: string;
            tags?: string[];
        }): Promise<RequestView> => this.request<RequestView>("POST", "/v1/requests", input),
        list: (params?: {
            status?: string;
            category?: string;
            tag?: string;
            sort?: "hot" | "new" | "top";
            limit?: number;
        }): Promise<RequestView[]> => {
            const q = new URLSearchParams();
            if (params?.status)
                q.set("status", params.status);
            if (params?.category)
                q.set("category", params.category);
            if (params?.tag)
                q.set("tag", params.tag);
            if (params?.sort)
                q.set("sort", params.sort);
            if (params?.limit !== undefined)
                q.set("limit", String(params.limit));
            const qs = q.toString();
            return this.request<RequestView[]>("GET", `/v1/requests${qs ? `?${qs}` : ""}`);
        },
        get: (id: string): Promise<{
            request: RequestView;
            answers: AnswerView[];
            jsonld?: unknown;
        }> => this.request("GET", `/v1/requests/${encodeURIComponent(id)}`),
        answer: (requestId: string, input: {
            body: string;
            offer?: {
                amountCents: number;
                currency?: string;
                listingId?: string;
            };
        }): Promise<AnswerView> => this.request<AnswerView>("POST", `/v1/requests/${encodeURIComponent(requestId)}/answers`, input),
        vote: (requestId: string, answerId: string): Promise<AnswerView> => this.request<AnswerView>("POST", `/v1/requests/${encodeURIComponent(requestId)}/answers/${encodeURIComponent(answerId)}/vote`),
        voteRequest: (requestId: string): Promise<RequestView> => this.request<RequestView>("POST", `/v1/requests/${encodeURIComponent(requestId)}/vote`),
        accept: (requestId: string, answerId: string): Promise<{
            answer?: AnswerView;
            dealId?: string;
            request?: RequestView;
        }> => this.request("POST", `/v1/requests/${encodeURIComponent(requestId)}/answers/${encodeURIComponent(answerId)}/accept`),
        close: (requestId: string): Promise<RequestView> => this.request<RequestView>("POST", `/v1/requests/${encodeURIComponent(requestId)}/close`),
    };
    readonly settings = {
        all: (): Promise<ResolvedSetting[]> => this.request<ResolvedSetting[]>("GET", "/v1/settings"),
        get: (key: string): Promise<ResolvedSetting> => this.request<ResolvedSetting>("GET", `/v1/settings/${encodeURIComponent(key)}`),
        set: (key: string, value: unknown, scope?: "principal" | "agent" | "org" | "platform", scopeId?: string): Promise<unknown> => this.request("PATCH", `/v1/settings/${encodeURIComponent(key)}`, { value, scope: scope ?? "principal", scopeId }),
        unset: (key: string, scope = "principal"): Promise<{
            deleted: boolean;
        }> => this.request("DELETE", `/v1/settings/${encodeURIComponent(key)}?scope=${encodeURIComponent(scope)}`),
    };
    readonly webhooks = {
        create: (url: string, events: string[]): Promise<WebhookView> => this.request<WebhookView>("POST", "/v1/webhooks", { url, events }),
        list: (): Promise<WebhookView[]> => this.request<WebhookView[]>("GET", "/v1/webhooks"),
        rotateSecret: (id: string): Promise<WebhookView> => this.request<WebhookView>("POST", `/v1/webhooks/${encodeURIComponent(id)}/rotate-secret`),
        delete: (id: string): Promise<{
            deleted: boolean;
        }> => this.request("DELETE", `/v1/webhooks/${encodeURIComponent(id)}`),
        deliveries: (id: string): Promise<DeliveryView[]> => this.request<DeliveryView[]>("GET", `/v1/webhooks/${encodeURIComponent(id)}/deliveries`),
    };
    readonly credits = {
        balance: (): Promise<{
            balance: number;
            recent: unknown[];
        }> => this.request("GET", "/v1/credits"),
        bundles: (): Promise<Array<{
            credits: number;
            amountCents: number;
        }>> => this.request("GET", "/v1/credits/bundles"),
        topup: (credits: number): Promise<TopupView> => this.request<TopupView>("POST", "/v1/credits/topups", { credits }),
        confirmTopup: (id: string): Promise<TopupView> => this.request<TopupView>("POST", `/v1/credits/topups/${encodeURIComponent(id)}/confirm`),
    };
    readonly chat = {
        createSession: (title?: string): Promise<ChatSessionView> => this.request<ChatSessionView>("POST", "/v1/chat/sessions", { title }),
        getSession: (id: string): Promise<{
            session: ChatSessionView;
            messages: unknown[];
        }> => this.request("GET", `/v1/chat/sessions/${encodeURIComponent(id)}`),
        send: (sessionId: string, message: string): Promise<ChatSendResult> => this.request<ChatSendResult>("POST", `/v1/chat/sessions/${encodeURIComponent(sessionId)}/messages`, { message }),
    };
    readonly assistant = {
        get: (): Promise<AssistantStateView> => this.request<AssistantStateView>("GET", "/v1/me/assistant"),
        createSession: (): Promise<AssistantSessionView> => this.request<AssistantSessionView>("POST", "/v1/me/assistant/sessions"),
        getSession: (id: string): Promise<{
            session: AssistantSessionView;
            messages: AssistantMessageView[];
        }> => this.request("GET", `/v1/me/assistant/sessions/${encodeURIComponent(id)}`),
        send: (sessionId: string, message: string, locale: "de" | "en"): Promise<AssistantMessageResult> => this.request<AssistantMessageResult>("POST", `/v1/me/assistant/sessions/${encodeURIComponent(sessionId)}/messages`, { message, locale }),
    };
    readonly blog = {
        list: (locale?: string): Promise<BlogPostMeta[]> => this.request<BlogPostMeta[]>("GET", `/v1/blog${locale ? `?locale=${encodeURIComponent(locale)}` : ""}`),
        get: (slug: string, locale?: string): Promise<{
            post: BlogPostView;
            jsonld: Record<string, unknown>;
        }> => this.request("GET", `/v1/blog/${encodeURIComponent(slug)}${locale ? `?locale=${encodeURIComponent(locale)}` : ""}`),
    };
    readonly intake = {
        import: (input: {
            sourceUrl?: string;
            rawContent?: string;
            categoryHint?: string;
        }, idempotencyKey?: string): Promise<ImportResultView> => this.request<ImportResultView>("POST", "/v1/intake/imports", input, idempotencyKey ? { "idempotency-key": idempotencyKey } : undefined),
        importStructured: (input: {
            source: string;
            url: string;
            limit?: number;
        }, idempotencyKey?: string): Promise<StructuredImportView> => this.request<StructuredImportView>("POST", "/v1/intake/import-structured", input, idempotencyKey ? { "idempotency-key": idempotencyKey } : undefined),
        job: (id: string): Promise<IntakeJobView> => this.request<IntakeJobView>("GET", `/v1/intake/jobs/${encodeURIComponent(id)}`),
        jobs: (status?: string): Promise<IntakeJobView[]> => this.request<IntakeJobView[]>("GET", `/v1/intake/jobs${status ? `?status=${encodeURIComponent(status)}` : ""}`),
        updateDraft: (draftId: string, fields: Record<string, unknown>): Promise<ImportResultView> => this.request<ImportResultView>("PATCH", `/v1/intake/drafts/${encodeURIComponent(draftId)}`, fields),
        publish: (draftId: string, idempotencyKey?: string): Promise<PublishResultView> => this.request<PublishResultView>("POST", `/v1/intake/drafts/${encodeURIComponent(draftId)}/publish`, {}, idempotencyKey ? { "idempotency-key": idempotencyKey } : undefined),
        uploadLink: (draftId: string, purpose: "photos" | "documents" = "photos"): Promise<UploadLinkView> => this.request<UploadLinkView>("POST", `/v1/intake/drafts/${encodeURIComponent(draftId)}/upload-link`, { purpose }),
        report: (input: {
            listingId: string;
            reason: "illegal" | "scam" | "wrong_category" | "copyright" | "other";
            detail: string;
        }): Promise<{
            id: string;
            status: string;
        }> => this.request("POST", "/v1/intake/reports", input),
        feedback: (area: string, detail: string): Promise<{
            received: boolean;
        }> => this.request("POST", "/v1/intake/feedback", { area, detail }),
        sources: {
            create: (input: {
                source: string;
                url: string;
                intervalMinutes?: number;
            }, idempotencyKey?: string): Promise<{
                source: IntakeSourceView;
                report: SyncReportView;
            }> => this.request("POST", "/v1/intake/sources", input, idempotencyKey ? { "idempotency-key": idempotencyKey } : undefined),
            list: (): Promise<IntakeSourceView[]> => this.request("GET", "/v1/intake/sources"),
            get: (id: string): Promise<IntakeSourceView> => this.request("GET", `/v1/intake/sources/${encodeURIComponent(id)}`),
            update: (id: string, patch: {
                enabled?: boolean;
                intervalMinutes?: number;
            }): Promise<IntakeSourceView> => this.request("PATCH", `/v1/intake/sources/${encodeURIComponent(id)}`, patch),
            delete: (id: string): Promise<{
                deleted: boolean;
            }> => this.request("DELETE", `/v1/intake/sources/${encodeURIComponent(id)}`),
            sync: (id: string): Promise<SyncReportView> => this.request("POST", `/v1/intake/sources/${encodeURIComponent(id)}/sync`, {}),
        },
    };
    readonly billing = {
        get: (): Promise<BillingView> => this.request<BillingView>("GET", "/v1/billing"),
        checkout: (input: BillingCheckoutInput, idemKey?: string): Promise<BillingRedirectView> => this.request<BillingRedirectView>("POST", "/v1/billing/checkout", input, idemKey ? { "idempotency-key": idemKey } : undefined),
        portal: (input: {
            locale?: "de" | "en";
        } = {}): Promise<BillingRedirectView> => this.request<BillingRedirectView>("POST", "/v1/billing/portal", input),
        cancel: (input: CancellationInput): Promise<CancellationReceiptView> => this.request<CancellationReceiptView>("POST", "/v1/billing/cancellation", input),
        cancellations: (): Promise<CancellationScheduledView> => this.request<CancellationScheduledView>("GET", "/v1/billing/cancellation"),
        undoCancel: (): Promise<CancellationUndoView> => this.request<CancellationUndoView>("POST", "/v1/billing/cancellation/undo", {}),
    };
    readonly hostedAgent = {
        profileImports: {
            propose: (input: import("./types.js").ProfileImportProposeInput): Promise<import("./types.js").ProfileImportDraftView> => this.request("POST", "/v1/me/agent/profile-imports", input),
            list: (): Promise<import("./types.js").ProfileImportDraftView[]> => this.request("GET", "/v1/me/agent/profile-imports"),
            get: (id: string): Promise<import("./types.js").ProfileImportDraftView> => this.request("GET", `/v1/me/agent/profile-imports/${encodeURIComponent(id)}`),
            approve: (id: string, input: {
                revision: string;
                confirm: true;
            }): Promise<import("./types.js").ProfileImportDraftView> => this.request("POST", `/v1/me/agent/profile-imports/${encodeURIComponent(id)}/approve`, input),
            reject: (id: string, input: {
                revision: string;
            }): Promise<import("./types.js").ProfileImportDraftView> => this.request("POST", `/v1/me/agent/profile-imports/${encodeURIComponent(id)}/reject`, input),
        },
        notifications: {
            status: (): Promise<import("./types.js").NotificationStatusView> => this.request("GET", "/v1/me/agent/notifications"),
            connect: (input: {
                events: "new_request"[];
                consent: true;
                locale?: "de" | "en" | undefined;
            }): Promise<import("./types.js").NotificationConnectView> => this.request("POST", "/v1/me/agent/notifications/connect", input),
            preferences: (input: {
                events: "new_request"[];
            }): Promise<import("./types.js").NotificationStatusView> => this.request("PUT", "/v1/me/agent/notifications/preferences", input),
            disconnect: (): Promise<import("./types.js").NotificationStatusView> => this.request("DELETE", "/v1/me/agent/notifications/telegram"),
        },
        get: (): Promise<HostedAgentStateView> => this.request<HostedAgentStateView>("GET", "/v1/me/agent"),
        setup: (patch: HostedAgentPatchInput, idemKey?: string): Promise<HostedAgentSetupView> => this.request<HostedAgentSetupView>("PUT", "/v1/me/agent", patch, idemKey ? { "idempotency-key": idemKey } : undefined),
        publish: (idemKey?: string): Promise<HostedAgentSetupView> => this.request<HostedAgentSetupView>("POST", "/v1/me/agent/publish", {}, idemKey ? { "idempotency-key": idemKey } : undefined),
        pause: (): Promise<HostedAgentSetupView> => this.request<HostedAgentSetupView>("POST", "/v1/me/agent/pause", {}),
        install: (): Promise<AgentInstallView> => this.request<AgentInstallView>("GET", "/v1/me/agent/install"),
        offerImages: {
            upload: (data: Blob | ArrayBuffer | Uint8Array, contentType: "image/png" | "image/jpeg" | "image/webp"): Promise<{
                hash: string;
                kind: "photo";
                width: number;
                height: number;
                size: number;
            }> => this.binaryRequest("PUT", "/v1/me/agent/offer-images", data, contentType),
            preview: (hash: string): Promise<QrFileDownload> => this.fileRequest(`/v1/me/agent/offer-images/${encodeURIComponent(hash)}.webp`),
        },
        card: {
            get: (): Promise<HostedCardStateView> => this.request<HostedCardStateView>("GET", "/v1/me/agent/card"),
            update: (patch: HostedCardPatchInput): Promise<HostedCardStateView> => this.request<HostedCardStateView>("PATCH", "/v1/me/agent/card", patch),
            images: {
                upload: (kind: CardImageKind, data: Blob | ArrayBuffer | Uint8Array, contentType: CardImageUploadType): Promise<HostedCardStateView> => this.binaryRequest<HostedCardStateView>("PUT", `/v1/me/agent/card/images/${encodeURIComponent(kind)}`, data, contentType),
                remove: (kind: CardImageKind): Promise<HostedCardStateView> => this.request<HostedCardStateView>("DELETE", `/v1/me/agent/card/images/${encodeURIComponent(kind)}`),
                preview: (kind: CardImageKind): Promise<QrFileDownload> => this.fileRequest(`/v1/me/agent/card/images/${encodeURIComponent(kind)}`),
            },
        },
        qr: {
            list: (): Promise<QrCodeView[]> => this.request<QrCodeView[]>("GET", "/v1/me/agent/qr"),
            get: (id: string): Promise<QrCodeView> => this.request<QrCodeView>("GET", `/v1/me/agent/qr/${encodeURIComponent(id)}`),
            create: (input: QrCodeCreateInput, idemKey?: string): Promise<QrCodeView> => this.request<QrCodeView>("POST", "/v1/me/agent/qr", input, idemKey ? { "idempotency-key": idemKey } : undefined),
            update: (id: string, patch: QrCodeUpdateInput): Promise<QrCodeView> => this.request<QrCodeView>("PATCH", `/v1/me/agent/qr/${encodeURIComponent(id)}`, patch),
            pause: (id: string): Promise<QrCodeView> => this.request<QrCodeView>("PATCH", `/v1/me/agent/qr/${encodeURIComponent(id)}`, { state: "paused" }),
            resume: (id: string): Promise<QrCodeView> => this.request<QrCodeView>("PATCH", `/v1/me/agent/qr/${encodeURIComponent(id)}`, { state: "active" }),
            retire: (id: string): Promise<QrCodeView> => this.request<QrCodeView>("POST", `/v1/me/agent/qr/${encodeURIComponent(id)}/retire`, { confirm: true }),
            file: (id: string, opts: QrFileOptions): Promise<QrFileDownload> => this.fileRequest(`/v1/me/agent/qr/${encodeURIComponent(id)}/file${qrFileQuery(opts)}`),
            link: (id: string, opts: QrFileOptions): Promise<QrDownloadLinkView> => this.request<QrDownloadLinkView>("GET", `/v1/me/agent/qr/${encodeURIComponent(id)}/link${qrFileQuery(opts)}`),
            stats: (id: string, days?: number): Promise<QrStatsView> => this.request<QrStatsView>("GET", `/v1/me/agent/qr/${encodeURIComponent(id)}/stats${days !== undefined ? `?days=${days}` : ""}`),
        },
        directories: {
            status: (): Promise<DirectoriesView> => this.request<DirectoriesView>("GET", "/v1/me/agent/directories"),
            preview: (ziel: string): Promise<DirectoryPreviewView> => this.request<DirectoryPreviewView>("GET", `/v1/me/agent/directories/${encodeURIComponent(ziel)}/preview`),
            activate: (ziel: string, freigabeRevision: number): Promise<DirectoryActionView> => this.request<DirectoryActionView>("POST", `/v1/me/agent/directories/${encodeURIComponent(ziel)}/activate`, { freigabeRevision }),
            publish: (ziel: string): Promise<DirectoryActionView> => this.request<DirectoryActionView>("POST", `/v1/me/agent/directories/${encodeURIComponent(ziel)}/publish`, {}),
            update: (ziel: string): Promise<DirectoryActionView> => this.request<DirectoryActionView>("POST", `/v1/me/agent/directories/${encodeURIComponent(ziel)}/update`, {}),
            revoke: (ziel: string): Promise<DirectoryActionView> => this.request<DirectoryActionView>("POST", `/v1/me/agent/directories/${encodeURIComponent(ziel)}/revoke`, {}),
            remove: (ziel: string, bestaetigung?: "dauerhaft"): Promise<DirectoryActionView> => this.request<DirectoryActionView>("POST", `/v1/me/agent/directories/${encodeURIComponent(ziel)}/remove`, bestaetigung ? { bestaetigung } : {}),
        },
        knowledge: {
            list: (): Promise<KnowledgeSourceView[]> => this.request<KnowledgeSourceView[]>("GET", "/v1/me/agent/knowledge"),
            add: (input: KnowledgeInput, idemKey?: string): Promise<KnowledgeSourceView> => this.request<KnowledgeSourceView>("POST", "/v1/me/agent/knowledge", input, idemKey ? { "idempotency-key": idemKey } : undefined),
            remove: (sourceId: string): Promise<{
                removed: true;
            }> => this.request<{
                removed: true;
            }>("DELETE", `/v1/me/agent/knowledge/${encodeURIComponent(sourceId)}`),
            refresh: (sourceId: string, idemKey?: string): Promise<KnowledgeRefreshView> => this.request<KnowledgeRefreshView>("POST", `/v1/me/agent/knowledge/${encodeURIComponent(sourceId)}/refresh`, {}, idemKey ? { "idempotency-key": idemKey } : undefined),
            replace: (sources: KnowledgeInput[]): Promise<KnowledgeReplaceView> => this.request<KnowledgeReplaceView>("PUT", "/v1/me/agent/knowledge", { sources, confirm: true }),
        },
        requests: {
            list: async (params?: {
                status?: AgentRequestStatus;
                cursor?: string;
                limit?: number;
            }): Promise<{
                items: AgentRequestView[];
                count: number;
                cursor: string | null;
            }> => {
                const qs = new URLSearchParams();
                if (params?.status)
                    qs.set("status", params.status);
                if (params?.cursor)
                    qs.set("cursor", params.cursor);
                if (params?.limit)
                    qs.set("limit", String(params.limit));
                const suffix = qs.size > 0 ? `?${qs.toString()}` : "";
                const { result, info } = await this.requestWithInfo<AgentRequestView[]>("GET", `/v1/me/agent/requests${suffix}`);
                return { items: result, count: info?.count ?? result.length, cursor: info?.cursor ?? null };
            },
            update: (id: string, patch: AgentRequestPatchInput): Promise<AgentRequestView> => this.request<AgentRequestView>("PATCH", `/v1/me/agent/requests/${encodeURIComponent(id)}`, patch),
        },
    };
    readonly hosted = {
        offers: (slug: string, filter: Record<string, unknown> = {}): Promise<import("./types.js").HostedServiceView[]> => this.request("GET", `/v1/hosted/${encodeURIComponent(slug)}/offers?filter=${encodeURIComponent(JSON.stringify(filter))}`),
        get: (slug: string, opts?: {
            entry?: string;
        }): Promise<HostedPublicView> => this.request<HostedPublicView>("GET", `/v1/hosted/${encodeURIComponent(slug)}${opts?.entry ? `?entry=${encodeURIComponent(opts.entry)}` : ""}`),
        message: (slug: string, input: {
            text: string;
            contextId?: string;
            channel?: "page" | "embed";
            entry?: string;
        }): Promise<HostedMessageReply> => this.request<HostedMessageReply>("POST", `/v1/hosted/${encodeURIComponent(slug)}/messages`, input),
        request: (slug: string, input: {
            name: string;
            contact: string;
            message: string;
            channel?: "page" | "embed";
            entry?: string;
        }): Promise<HostedRequestReply> => this.request<HostedRequestReply>("POST", `/v1/hosted/${encodeURIComponent(slug)}/requests`, input),
        event: (slug: string, input: HostedContactClickInput): Promise<{
            received: true;
        }> => this.request<{
            received: true;
        }>("POST", `/v1/hosted/${encodeURIComponent(slug)}/events`, input),
    };
    readonly qr = {
        resolve: (code: string): Promise<QrResolutionView> => this.request<QrResolutionView>("GET", `/v1/qr/${encodeURIComponent(code)}`),
        visit: (code: string): Promise<QrResolutionView> => this.request<QrResolutionView>("POST", `/v1/qr/${encodeURIComponent(code)}/visits`, {}),
    };
    readonly directory = {
        search: async (params?: {
            q?: string;
            kind?: DirectoryRefKind;
            verified?: boolean;
            cursor?: string;
            limit?: number;
        }): Promise<DirectoryPageView> => {
            const qs = new URLSearchParams();
            if (params?.q)
                qs.set("q", params.q);
            if (params?.kind)
                qs.set("kind", params.kind);
            if (params?.verified !== undefined)
                qs.set("verified", String(params.verified));
            if (params?.cursor)
                qs.set("cursor", params.cursor);
            if (params?.limit)
                qs.set("limit", String(params.limit));
            const suffix = qs.size > 0 ? `?${qs.toString()}` : "";
            const { result, info } = await this.requestWithInfo<DirectoryEntryView[]>("GET", `/v1/directory${suffix}`);
            return { items: result, count: info?.count ?? result.length, cursor: info?.cursor ?? null };
        },
        get: (kind: DirectoryRefKind, id: string): Promise<DirectoryEntryView> => this.request<DirectoryEntryView>("GET", `/v1/directory/${encodeURIComponent(kind)}/${encodeURIComponent(id)}`),
        ask: (kind: DirectoryRefKind, id: string, input: {
            text: string;
            contextId?: string;
        }): Promise<AgentAskResultView> => this.request<AgentAskResultView>("POST", `/v1/directory/${encodeURIComponent(kind)}/${encodeURIComponent(id)}/ask`, input),
    };
    readonly connect = {
        submit: (url: string, idemKey?: string): Promise<ExternalAgentView> => this.request<ExternalAgentView>("POST", "/v1/connect", { url }, idemKey ? { "idempotency-key": idemKey } : undefined),
        mine: (): Promise<ExternalAgentView[]> => this.request<ExternalAgentView[]>("GET", "/v1/connect/mine"),
        recheck: (id: string): Promise<ExternalAgentView> => this.request<ExternalAgentView>("POST", `/v1/connect/${encodeURIComponent(id)}/recheck`, {}),
        claim: (id: string): Promise<ExternalAgentView> => this.request<ExternalAgentView>("POST", `/v1/connect/${encodeURIComponent(id)}/claim`, {}),
        remove: (id: string): Promise<{
            removed: true;
        }> => this.request<{
            removed: true;
        }>("DELETE", `/v1/connect/${encodeURIComponent(id)}`),
    };
}
function qrFileQuery(opts: QrFileOptions): string {
    const q = new URLSearchParams({ format: opts.format });
    if (opts.scale !== undefined)
        q.set("scale", String(opts.scale));
    if (opts.locale !== undefined)
        q.set("locale", opts.locale);
    if (opts.bleed !== undefined)
        q.set("bleed", String(opts.bleed));
    return `?${q.toString()}`;
}
