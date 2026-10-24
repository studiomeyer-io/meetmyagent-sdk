export interface EnvelopeError {
    code: number;
    slug: string;
    message: string;
    documentation_url: string;
}
export interface ResultInfo {
    cursor: string | null;
    count: number;
    per_page: number;
}
export interface Link {
    rel: string;
    href: string;
    method: "GET" | "POST" | "PATCH" | "DELETE";
    title?: string;
}
export interface Envelope<T> {
    success: boolean;
    result: T | null;
    errors: EnvelopeError[];
    messages: string[];
    result_info?: ResultInfo;
    links?: Link[];
    request_id: string;
}
export interface AgentView {
    id: string;
    handle: string;
    displayName: string;
    bio?: string;
    skills: string[];
}
export interface FacetPublic {
    key: string;
    label: string;
    type: "enum" | "number" | "range" | "bool" | "geo" | "semantic-tag" | "text";
    unit?: string;
    allowedValues?: string[];
    min?: number;
    max?: number;
    filterable: boolean;
    sortable: boolean;
    aiWeight: number;
    valueDistribution?: Record<string, number>;
}
export interface CategoryPublic {
    slug: string;
    name: string;
    description?: string;
    count?: number;
}
export interface CatalogSchemaView {
    categories: CategoryPublic[];
    category?: CategoryPublic;
    facets: FacetPublic[];
    usage: string;
}
export interface SearchFilter {
    facet: string;
    op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains" | "between";
    value: string | number | boolean | Array<string | number>;
}
export interface SearchQueryInput {
    q?: string;
    category?: string;
    filters?: SearchFilter[];
    location?: {
        lat: number;
        lng: number;
        radiusKm: number;
    };
    sort?: "relevance" | "price_asc" | "price_desc" | "newest" | "ai_visibility";
    cursor?: string | null;
    limit?: number;
}
export interface ListingView {
    id: string;
    category: string;
    title: string;
    description: string;
    priceCents?: number;
    currency?: string;
    location?: {
        lat: number;
        lng: number;
        label?: string;
    };
    media: string[];
    providerId: string;
    status: "draft" | "active" | "paused" | "archived";
    attributes: Record<string, unknown>;
    ratingAvg?: number;
    ratingCount?: number;
    provider?: {
        name?: string;
        bio?: string;
    };
    domainVerified?: boolean;
    boosted: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface ProviderView {
    id: string;
    name: string;
    kind: "person" | "business";
    bio?: string;
    agents: {
        id: string;
        handle: string;
        name: string;
        bio?: string;
        skills: string[];
    }[];
    verifiedDomains?: string[];
}
export interface ProviderCardView {
    id: string;
    name: string;
    kind: "person" | "business";
    bio?: string;
    snippet: string;
    tags: string[];
    categories: string[];
    listingCount: number;
    logo?: string;
    domainVerified: boolean;
    featured?: boolean;
    newestListingAt: number;
}
export interface ProviderDirectoryView {
    providers: ProviderCardView[];
    count: number;
    truncated: boolean;
}
export interface DomainVerifyView {
    domain: string;
    verified: boolean;
    token: string;
    wellKnownUrl: string;
    requestedAt: string;
    verifiedAt?: string;
}
export interface StructuredImportView {
    imported: ImportResultView[];
    skipped: Array<{
        sourceRef: string;
        reason: string;
    }>;
    totalFound: number;
}
export interface SyncReportView {
    startedAt: number;
    finishedAt: number;
    found: number;
    imported: number;
    updated: number;
    archived: number;
    reappeared: number;
    blocked: Array<{
        sourceRef: string;
        reason: string;
    }>;
    budgetExhausted: boolean;
    complete: boolean;
    error?: string;
}
export interface IntakeSourceView {
    id: string;
    adapter: string;
    feedUrl: string;
    intervalMinutes: number;
    enabled: boolean;
    nextSyncAt: string;
    lastSyncAt?: string;
    lastResult?: SyncReportView;
    createdAt: string;
}
export interface CreateListingInput {
    category: string;
    title: string;
    description: string;
    priceCents?: number;
    currency?: string;
    location?: {
        lat: number;
        lng: number;
        label?: string;
    };
    media?: string[];
    attributes?: Record<string, unknown>;
}
export interface VisibilityReport {
    score: number;
    parts: Array<{
        key: string;
        points: number;
        max: number;
    }>;
    hints: string[];
    jsonld: Record<string, unknown>;
}
export type DealStatus = "draft" | "proposed" | "approved" | "funded" | "in_progress" | "delivered" | "confirmed" | "released" | "reviewed" | "disputed" | "resolved" | "cancelled";
export interface DealView {
    id: string;
    buyerPrincipal: string;
    sellerAgent: string;
    amountCents: number;
    currency: string;
    status: DealStatus;
    paymentIntentId?: string;
    transferId?: string;
}
export interface ApprovalView {
    id: string;
    principalId: string;
    dealId: string;
    action: string;
    status: "pending" | "approved" | "rejected" | "expired";
    payload: unknown;
}
export interface JobView {
    id: string;
    principalId: string;
    title: string;
    description: string;
    category?: string;
    budgetCents?: number;
    currency: string;
    status: "open" | "awarded" | "closed";
    createdAt: number;
}
export interface BidView {
    id: string;
    jobId: string;
    agentId: string;
    amountCents: number;
    currency: string;
    message: string;
    status: "pending" | "accepted" | "rejected" | "withdrawn";
    createdAt: number;
}
export interface BoardAuthorView {
    name: string;
    kind: "person" | "business" | "agent";
    handle?: string;
    profileId?: string;
}
export interface RequestView {
    id: string;
    authorType: "principal" | "agent";
    authorId: string;
    title: string;
    body: string;
    category?: string;
    tags: string[];
    status: "open" | "answered" | "closed";
    acceptedAnswerId?: string;
    score: number;
    answerCount: number;
    author?: BoardAuthorView;
    createdAt: number;
}
export interface AnswerView {
    id: string;
    requestId: string;
    authorType: "principal" | "agent";
    authorId: string;
    body: string;
    kind: "comment" | "offer";
    offer?: {
        amountCents: number;
        currency: string;
        listingId?: string;
    };
    votes: number;
    dealId?: string;
    author?: BoardAuthorView;
    createdAt: number;
}
export interface ResolvedSetting {
    key: string;
    value: unknown;
    source: "platform" | "org" | "principal" | "agent" | "default";
    description: string;
}
export interface WebhookView {
    id: string;
    principalId: string;
    url: string;
    events: string[];
    secret: string;
    active: boolean;
    createdAt: number;
}
export interface DeliveryView {
    id: string;
    webhookId: string;
    event: string;
    payload: string;
    attempt: number;
    status: "pending" | "success" | "failed" | "exhausted";
    lastStatusCode?: number;
    nextAttemptAt?: number;
    updatedAt: number;
}
export interface TopupView {
    id: string;
    principalId: string;
    credits: number;
    amountCents: number;
    currency: string;
    status: "pending" | "confirmed" | "failed";
    checkoutUrl?: string;
}
export interface ChatSessionView {
    id: string;
    principalId: string;
    title?: string;
    createdAt: number;
}
export interface ChatSendResult {
    reply: string;
    credits: number;
    balance: number;
    aborted: boolean;
    toolCalls: number;
}
export interface BlogPostMeta {
    id: string;
    slug: string;
    locale: string;
    title: string;
    description: string;
    category?: string;
    tags: string[];
    status: "draft" | "published" | "archived";
    publishedAt?: number;
    createdAt?: number;
    updatedAt?: number;
    authorId: string;
    listingIds: string[];
}
export interface BlogPostView extends BlogPostMeta {
    body: string;
}
export interface PrincipalView {
    id: string;
    email: string;
    displayName?: string;
    bio?: string;
    kind: "person" | "business";
    createdAt: number;
}
export type MagicLinkLocale = "en" | "de";
export interface LoginResultView {
    sessionToken: string;
    expiresAt: number;
    principal: PrincipalView;
}
export interface MeView {
    principal: PrincipalView;
    scopes: string[];
    agentId?: string;
}
export interface ApiKeyView {
    id: string;
    name: string;
    scopes: string[];
    last4: string;
    createdAt: number;
    revokedAt?: number;
    lastUsedAt?: number;
}
export interface CreatedApiKeyView {
    token: string;
    key: ApiKeyView;
}
export interface OAuthTokenGrant {
    access_token: string;
    token_type: "Bearer";
    expires_in: number;
    refresh_token: string;
    scope: string;
}
export interface OAuthClientRegistration {
    client_id: string;
    client_name: string;
    redirect_uris: string[];
    token_endpoint_auth_method: "none";
    grant_types: string[];
    response_types: string[];
}
export interface GapReportView {
    category: string;
    categoryConfidence: number;
    categoryProposalId?: string;
    missing: string[];
    lowConfidence: Array<{
        field: string;
        extracted: unknown;
        evidence: string;
    }>;
    complianceBlockers: string[];
    mediaPlan: {
        detectedUrls: string[];
        needsUpload: boolean;
    };
    duplicates: Array<{
        listingId: string;
        similarity: number;
        own: boolean;
    }>;
    parkedAttributes?: Record<string, unknown>;
}
export interface IntakeJobView {
    id: string;
    status: "extracted" | "awaiting_user" | "awaiting_category" | "in_review" | "published" | "rejected";
    draftListingId?: string;
    sourceUrl?: string;
    gapReport: GapReportView;
    statementOfReasons?: string;
    createdAt: string;
    updatedAt: string;
}
export interface ImportResultView {
    job: IntakeJobView;
    draft: ListingView;
}
export interface PublishResultView {
    job: IntakeJobView;
    listing: ListingView;
    live: boolean;
}
export interface UploadLinkView {
    url: string;
    expiresAt: number;
    maxFiles: number;
}
export interface ReviewView {
    id: string;
    listingId: string;
    reviewerPrincipalId: string;
    verifiedDeal: boolean;
    rating: number;
    likeBest?: string;
    dislike?: string;
    body: string;
    source: string;
    createdAt: string;
}
export interface CreateReviewInput {
    rating: number;
    body: string;
    likeBest?: string;
    dislike?: string;
    dealId?: string;
}
export interface CapabilityServiceView {
    key: string;
    name: string;
    durationMin: number;
    priceCents?: number;
    currency?: string;
    description?: string;
}
export interface CapabilityPublicView {
    id: string;
    type: string;
    name: string;
    headline: string;
    description: string;
    status: string;
    providerId: string;
    services: CapabilityServiceView[];
    timezone?: string;
    locationLabel?: string;
    priceFromCents?: number;
    currency?: string;
    publishedAt?: number;
    provider?: {
        name: string;
        kind: "person" | "business";
    } | null;
}
export interface CapabilityDirectoryView {
    capabilities: CapabilityPublicView[];
    count: number;
}
export interface CapabilitySetupGap {
    key: string;
    label: string;
    ask: string;
}
export interface CapabilitySetupState {
    capabilityId: string;
    type: string;
    status: string;
    complete: boolean;
    missing: CapabilitySetupGap[];
    next: {
        action: "configure" | "connect_backend" | "publish" | "none";
        hint: string;
    };
}
export interface CapabilitySetupResult {
    capability: {
        id: string;
        type: string;
        name: string;
        status: string;
        config?: Record<string, unknown>;
    };
    setup: CapabilitySetupState;
}
export interface CapabilityOwnedView {
    id: string;
    type: string;
    name: string;
    status: string;
    connectionId?: string;
    config: Record<string, unknown>;
    setup: CapabilitySetupState;
}
export interface CapabilityPublishResult {
    capability: {
        id: string;
        status: string;
        publishedAt?: number;
    };
    probe: {
        slotsFound: number;
        window: string;
    };
    setup: CapabilitySetupState;
}
export interface CapabilitySlotsView {
    capabilityId: string;
    serviceKey: string;
    timezone: string;
    slots: {
        start: string;
        end: string;
    }[];
    count: number;
}
export interface BookingReceiptView {
    id: string;
    capabilityId: string;
    serviceKey: string;
    backendKind: string;
    backendRef: string;
    startsAt: string;
    endsAt: string;
    timezone: string;
    status: string;
    priceCents?: number;
    currency?: string;
    provenance: {
        callerType: string;
        callerId?: string;
    };
    contactName: string;
    contactEmail: string;
    note: string;
    createdAt: string;
}
export interface ConnectionView {
    id: string;
    kind: string;
    status: string;
    label: string;
    config: Record<string, unknown>;
    createdAt?: string;
}
export interface CapabilityAdaptersView {
    capabilityId: string;
    schemaOrg: Record<string, unknown> | null;
    a2aSkill: Record<string, unknown> | null;
    mcp: {
        tools: string[];
        endpoint: string;
    };
    rest: {
        slots: string;
        book: string;
    };
}
export type HostedAgentStatus = "draft" | "live" | "paused";
export type HostedMissingField = "name" | "description" | "languages" | "knowledge_or_services";
export type OfferCategory = "real-estate" | "vehicle" | "accommodation" | "service";
export type OfferAttributes = {
    [key: string]: string | number | boolean | undefined;
};
export interface OfferImageView {
    hash: string;
    kind: "photo" | "floorplan";
    alt?: string;
    url?: string;
}
export interface HostedServiceView {
    category?: OfferCategory | undefined;
    attributes?: OfferAttributes | undefined;
    images?: OfferImageView[] | undefined;
    key: string;
    name: string;
    description?: string | undefined;
    priceCents?: number | undefined;
    currency?: string | undefined;
    availability?: "available" | "limited" | "unavailable" | undefined;
    checkoutUrl?: string | undefined;
}
export type HostedServicePatchInput = Omit<HostedServiceView, "priceCents" | "currency" | "availability" | "checkoutUrl" | "category" | "attributes" | "images"> & {
    category?: OfferCategory | null;
    attributes?: OfferAttributes | null;
    images?: OfferImageView[] | null;
    priceCents?: number | null;
    currency?: string | null;
    availability?: HostedServiceView["availability"] | null;
    checkoutUrl?: string | null;
};
export interface HostedAgentView {
    shareUrl?: string;
    agentId: string;
    principalId: string;
    slug: string;
    name: string;
    tagline?: string;
    description?: string;
    websiteUrl?: string;
    languages: string[];
    services: HostedServiceView[];
    chatEnabled: boolean;
    monthlyChatCap: number;
    status: HostedAgentStatus;
    cardVersion: number;
    publishedAt?: number;
    createdAt: number;
    updatedAt: number;
}
export interface HostedAgentStateView {
    offerBlockers?: string[];
    agent: HostedAgentView | null;
    missing: HostedMissingField[];
}
export interface HostedAgentSetupView {
    shareUrl?: string;
    offerBlockers?: string[];
    agent: HostedAgentView;
    missing: HostedMissingField[];
    previousSlug?: string;
    previousSlugRedirects?: boolean;
}
export interface MeScopesView {
    principalId: string;
    scopes: string[];
    agentId?: string;
}
export interface HostedAgentPatchInput {
    slug?: string;
    name?: string;
    tagline?: string;
    description?: string;
    websiteUrl?: string;
    languages?: string[];
    services?: HostedServicePatchInput[];
    chatEnabled?: boolean;
}
export type KnowledgeKind = "text" | "faq" | "url";
export interface KnowledgeSourceView {
    sourceId: string;
    agentId: string;
    kind: KnowledgeKind;
    title: string;
    sourceUrl?: string;
    chars: number;
    chunks: number;
    createdAt: number;
}
export interface KnowledgeRefreshView {
    source: KnowledgeSourceView;
    replaced: string;
}
export interface KnowledgeReplaceView {
    sources: KnowledgeSourceView[];
    removed: number;
}
export type KnowledgeInput = {
    kind: "text";
    title: string;
    content: string;
} | {
    kind: "faq";
    title: string;
    content: string;
} | {
    kind: "url";
    url: string;
    title?: string;
};
export type AgentRequestChannel = "page" | "embed" | "a2a" | "mcp" | "directory";
export type AgentRequestStatus = "new" | "seen" | "answered" | "archived";
export interface AgentRequestView {
    id: string;
    agentId: string;
    channel: AgentRequestChannel;
    fromName: string;
    fromContact: string;
    message: string;
    status: AgentRequestStatus;
    answer?: string;
    answeredAt?: number;
    originRef?: string;
    createdAt: number;
}
export interface AgentRequestPatchInput {
    status?: AgentRequestStatus;
    answer?: string;
}
export interface AgentInstallView {
    cardUrl: string;
    endpointUrl: string;
    pageUrl: string;
    wellKnownPath: "/.well-known/agent-card.json";
    embedSnippet: string;
    domain?: string;
    domainVerified: boolean;
}
export type CardPresentation = "company" | "person";
export type CardTheme = "dark" | "light" | "auto";
export type CardLinkKind = "instagram" | "facebook" | "linkedin" | "youtube" | "tiktok" | "x";
export type CardAction = "ask" | "save_contact" | "call" | "email" | "whatsapp" | "website" | "maps";
export type CardContactMissing = "display_name" | "contact_way";
export interface CardLinkView {
    kind: CardLinkKind;
    url: string;
}
export interface CardPersonView {
    name: string;
    givenName?: string;
    familyName?: string;
    role?: string;
}
export interface CardAddressView {
    street?: string;
    postalCode?: string;
    city: string;
    region?: string;
    country?: string;
}
export interface CardLocationView {
    label: string;
    lat: number;
    lng: number;
}
export interface HostedCardView {
    presentation: CardPresentation;
    companyName?: string;
    person?: CardPersonView;
    theme: CardTheme;
    accentColor?: string;
    phone?: string;
    email?: string;
    whatsapp?: string;
    address?: CardAddressView;
    links: CardLinkView[];
    googleProfileUrl?: string;
    location?: CardLocationView;
    actions?: CardAction[];
    images?: CardImageRefsView;
}
export type CardImageKind = "logo" | "portrait" | "cover";
export interface CardImageRefView {
    hash: string;
    width: number;
    height: number;
}
export interface CardImageRefsView {
    logo?: CardImageRefView;
    portrait?: CardImageRefView;
    cover?: CardImageRefView;
}
export interface PublicCardImageView {
    url: string;
    width: number;
    height: number;
}
export interface PublicCardImagesView {
    logo?: PublicCardImageView;
    portrait?: PublicCardImageView;
    cover?: PublicCardImageView;
}
export type CardImageUploadType = "image/png" | "image/jpeg" | "image/webp" | "image/svg+xml";
export interface HostedPublicCardView {
    presentation: CardPresentation;
    companyName?: string;
    person?: CardPersonView;
    theme: CardTheme;
    accentColor?: string;
    accentForeground?: "#000000" | "#ffffff";
    phone?: string;
    email?: string;
    whatsapp?: string;
    address?: CardAddressView;
    links: CardLinkView[];
    googleProfileUrl?: string;
    location?: CardLocationView;
    actions: CardAction[];
    vcardUrl?: string;
    images?: PublicCardImagesView;
}
export interface HostedCardStateView {
    card: HostedCardView;
    revision: number;
    googleProfileAllowed: boolean;
    preview: HostedPublicCardView;
    contactMissing: CardContactMissing[];
}
export interface HostedCardPatchInput {
    revision: number;
    presentation?: CardPresentation;
    companyName?: string | null;
    person?: CardPersonView | null;
    theme?: CardTheme;
    accentColor?: string | null;
    phone?: string | null;
    email?: string | null;
    whatsapp?: string | null;
    address?: CardAddressView | null;
    links?: CardLinkView[] | null;
    googleProfileUrl?: string | null;
    location?: {
        label: string;
        lat?: number;
        lng?: number;
        mapsUrl?: string;
    } | null;
    actions?: CardAction[] | null;
}
export interface HostedPublicView {
    shareUrl?: string;
    agentId: string;
    slug: string;
    name: string;
    tagline?: string;
    description?: string;
    websiteUrl?: string;
    languages: string[];
    services: HostedServiceView[];
    chatEnabled: boolean;
    verified: boolean;
    signed: boolean;
    branding: boolean;
    pageUrl: string;
    cardUrl: string;
    endpointUrl: string;
    card?: HostedPublicCardView;
    entry?: QrEntryView;
    updatedAt: number;
}
export type QrPlacement = "business_card" | "shop_window" | "flyer" | "stand" | "other";
export type QrState = "active" | "paused" | "retired";
export interface QrCodeView {
    id: string;
    code: string;
    url: string;
    shortUrl: string;
    label: string;
    placement: QrPlacement;
    greeting?: string;
    questions: string[];
    state: QrState;
    createdAt: number;
    updatedAt: number;
    retiredAt?: number;
}
export interface QrCodeCreateInput {
    label: string;
    placement: QrPlacement;
    greeting?: string;
    questions?: string[];
}
export interface QrCodeUpdateInput {
    label?: string;
    placement?: QrPlacement;
    greeting?: string | null;
    questions?: string[];
    state?: "active" | "paused";
}
export type QrResolutionView = {
    code: string;
    state: "active";
    slug: string;
    pagePath: string;
} | {
    code: string;
    state: "retired";
};
export interface QrEntryView {
    code: string;
    placement: QrPlacement;
    greeting?: string;
    questions: string[];
}
export interface QrDayStatsView {
    day: string;
    views: number;
    chats: number;
    requests: number;
    vcards: number;
    contactClicks: number;
}
export interface QrStatsView {
    id: string;
    code: string;
    from: string;
    to: string;
    days: QrDayStatsView[];
    totals: Omit<QrDayStatsView, "day">;
}
export type QrFileFormat = "svg" | "png" | "pdf";
export interface QrFileOptions {
    format: QrFileFormat;
    scale?: number;
    locale?: "de" | "en";
    bleed?: number;
}
export interface QrDownloadLinkView {
    url: string;
    format: QrFileFormat;
    filename: string;
    expiresAt: number;
}
export interface QrFileDownload {
    filename: string;
    contentType: string;
    bytes: Uint8Array;
}
export interface HostedContactClickInput {
    type: "contact_click";
    action: "call" | "email" | "whatsapp" | "website" | "maps";
    entry: string;
}
export type AgentMessagePart = {
    kind: "text";
    text: string;
} | {
    kind: "data";
    data: Record<string, unknown>;
};
export interface HostedMessageReply {
    contextId: string;
    text: string;
    parts: AgentMessagePart[];
    aiGenerated: boolean;
    fallbackReason?: string;
}
export interface HostedRequestReply {
    requestId: string;
    status: "received";
}
export type DirectoryRefKind = "hosted" | "external";
export interface DirectorySkillView {
    id: string;
    name: string;
    description?: string;
    tags: string[];
}
export interface DirectoryEntryView {
    logoUrl?: string;
    refKind: DirectoryRefKind;
    refId: string;
    handle: string;
    name: string;
    description: string;
    skills: DirectorySkillView[];
    languages: string[];
    verified: boolean;
    signed: boolean;
    pagePath?: string;
    cardUrl: string;
    location?: CardLocationView;
    updatedAt: number;
}
export interface DirectoryPageView {
    items: DirectoryEntryView[];
    count: number;
    cursor: string | null;
}
export interface AgentAskResultView {
    text: string;
    refKind: DirectoryRefKind;
    refId: string;
    external: boolean;
    contextId?: string;
}
export type ExternalAgentStatus = "listed" | "pending" | "rejected" | "stale" | "removed";
export type CardSignatureStatus = "none" | "valid" | "invalid";
export type CardProtocolVersion = "1.0" | "0.3" | "unknown";
export interface CardCheckReportView {
    protocolVersion: CardProtocolVersion;
    errors: string[];
    warnings: string[];
}
export interface CardSummaryView {
    name: string;
    description: string;
    interfaceUrl?: string;
    interfaceBinding?: string;
    interfaceVersion?: string;
    skills: DirectorySkillView[];
    languages: string[];
    providerName?: string;
    providerUrl?: string;
}
export interface ExternalAgentView {
    id: string;
    cardUrl: string;
    host: string;
    card: Record<string, unknown>;
    cardHash: string;
    summary: CardSummaryView;
    protocolVersion: CardProtocolVersion;
    signature: CardSignatureStatus;
    report: CardCheckReportView;
    reachable: boolean;
    status: ExternalAgentStatus;
    submittedBy?: string;
    claimedBy?: string;
    domainVerified: boolean;
    failCount: number;
    lastCheckedAt: number;
    createdAt: number;
    updatedAt: number;
}
export type PlanId = "free" | "business";
export type SubscriptionStatus = "none" | "active" | "trialing" | "past_due" | "unpaid" | "canceled" | "incomplete" | "incomplete_expired" | "paused";
export interface PlanLimitsView {
    monthlyAnswers: number;
    knowledgeSources: number;
    branding: boolean;
    ownerMail: boolean;
}
export interface BillingView {
    compUntil?: number | null;
    compExpiring?: boolean;
    compNotice?: string | null;
    plan: PlanId;
    status: SubscriptionStatus;
    comp: boolean;
    interval: "month" | "year" | null;
    currentPeriodEnd: number | null;
    cancelAtPeriodEnd: boolean;
    limits: PlanLimitsView;
    usage: {
        answersThisMonth: number;
        knowledgeSources: number;
    };
    prices: {
        currency: "eur";
        businessMonthlyCents: number;
        businessYearlyCents: number;
    };
    offer: {
        name: "KI-Shop";
        currency: "eur";
        monthlyCents: number;
        interval: "month";
        available: boolean;
    };
    currentSubscription: {
        interval: "month" | "year" | null;
        amountCents: null;
        currency: null;
    } | null;
    termsVersion: string;
    available: boolean;
}
export interface BillingCheckoutInput {
    interval: "month" | "year";
    b2bConfirmed: true;
    termsAccepted: true;
    termsVersion: string;
    locale?: "de" | "en";
}
export interface BillingRedirectView {
    url: string;
}
export type CancellationRequestedEnd = {
    type: "next_possible";
} | {
    type: "date";
    date: string;
};
export interface CancellationInput {
    kind: "ordinary" | "extraordinary";
    reason?: string | undefined;
    name: string;
    company?: string | undefined;
    accountEmail?: string | undefined;
    requestedEnd: CancellationRequestedEnd;
    confirmEmail: string;
    locale: "de" | "en";
}
export type CancellationOutcome = "executed" | "scheduled_later" | "extraordinary" | "no_contract";
export interface CancellationReceiptView {
    ref: string;
    receivedAt: number;
    receivedAtText: {
        date: string;
        time: string;
        zone: string;
    };
    declaration: {
        kind: "ordinary" | "extraordinary";
        reason: string | null;
        name: string;
        company: string | null;
        accountEmail: string;
        contract: string;
        requestedEnd: CancellationRequestedEnd;
    };
    confirmEmail: string;
    account: {
        outcome: CancellationOutcome;
        endAt: number | null;
    } | null;
    mailSent?: boolean;
}
export interface CancellationScheduledView {
    scheduled: Array<{
        ref: string;
        receivedAt: number;
        kind: "ordinary" | "extraordinary";
        requestedEnd: CancellationRequestedEnd;
    }>;
}
export interface CancellationUndoView {
    renewsAt: number | null;
}
export interface AssistantStateView {
    enabled: boolean;
    reason?: "off" | "no_model" | "plan";
    plan: string;
    used: number;
    cap: number;
    remaining: number;
    resetsAt: string;
}
export interface AssistantSessionView {
    id: string;
    principalId: string;
    title?: string;
    createdAt: number;
}
export interface AssistantMessageView {
    id: string;
    sessionId: string;
    role: "user" | "assistant";
    content: string;
    creditsCharged: number;
    createdAt: number;
}
export interface AssistantMessageResult {
    reply: string;
    toolSteps: Array<{
        name: string;
    }>;
    used: number;
    cap: number;
    remaining: number;
    aborted: boolean;
}
export type AssistantStreamEvent = {
    type: "text";
    text: string;
} | {
    type: "tool_call";
    name: string;
    input: unknown;
} | {
    type: "tool_result";
    name: string;
} | {
    type: "done";
    used: number;
    cap: number;
    remaining: number;
    aborted: boolean;
};
export type DirectoryState = "nicht_aktiviert" | "voraussetzungen_fehlen" | "wartet" | "veroeffentlicht" | "aenderung_ausstehend" | "fehler" | "entfernung_ausstehend" | "entfernt";
export interface DirectoryCapabilities {
    vorschau: "lokal" | "anbieter";
    suchen: boolean;
    veroeffentlichen: boolean;
    lesen: boolean;
    aktualisieren: boolean;
    pausieren: boolean;
    entfernen: "dauerhaft" | "rueckholbar" | "nicht_unterstuetzt";
}
export type DirectoryNote = "keine_pause" | "entfernen_dauerhaft" | "extern_besteht_weiter" | "ausgang_ungewiss" | "freigabe_veraltet" | "agent_nicht_live" | "eingabe_gesperrt";
export interface DirectoryTargetView {
    ziel: string;
    name: string;
    verfuegbar: boolean;
    abgeschaltet?: "schalter_aus" | "schluessel_fehlt";
    faehigkeiten: DirectoryCapabilities;
    freigabeRevision: number;
    zustand: DirectoryState;
    freigabe?: {
        revision: number;
        am: number;
        aktuell: boolean;
    };
    externeUrl?: string;
    externBesteht: boolean;
    entfernung: "keine" | "ausstehend" | "quittiert" | "bestaetigt";
    fehler?: {
        code: string;
        text: string;
        am: number;
    };
    naechsterVersuchAm?: number;
    nachgelesenAm?: number;
    eingabeGesperrt?: "aenderung" | "entfernen" | "widerrufen";
    hinweise: DirectoryNote[];
}
export interface DirectoriesView {
    agentId: string | null;
    ziele: DirectoryTargetView[];
    gesperrt: Array<{
        id: string;
        name: string;
        host: string;
        grund: string;
        quellen: string[];
    }>;
    manuell: Array<{
        name: string;
        url: string;
        hinweis: string;
        synchronisiert: false;
    }>;
}
export interface DirectoryPreviewView {
    ziel: string;
    name: string;
    zulaessig: boolean;
    fehler: string[];
    felder: Array<{
        feld: string;
        wert: string | string[];
    }>;
    nichtUebertragen: Array<{
        feld: string;
        grund: string;
    }>;
    exportRevision?: string;
    freigabeRevision: number;
    faehigkeiten: DirectoryCapabilities;
}
export type DirectoryActionResult = "erledigt" | "wartet" | "laeuft_bereits" | "nicht_unterstuetzt" | "voraussetzungen_fehlen" | "fehler" | "nichts_zu_tun" | "ueberholt";
export interface DirectoryActionView {
    ergebnis: DirectoryActionResult;
    status: DirectoryTargetView;
    wiederAb?: number;
}
export interface ProfileImportDraftView {
    id: string;
    principalId: string;
    agentId: string;
    revision: string;
    status: "pending" | "applied" | "rejected";
    before: Record<string, unknown>;
    after: Record<string, unknown>;
    faqs: {
        question: string;
        answer: string;
    }[];
    diff: {
        field: string;
        before: unknown;
        after: unknown;
    }[];
    sourceUrls: string[];
    sourceText: string;
    createdAt: number;
    decidedAt?: number;
    syncPending?: boolean;
}
export interface ProfileImportProposeInput {
    profile?: Pick<HostedAgentPatchInput, "name" | "tagline" | "description" | "websiteUrl" | "languages">;
    services?: HostedServicePatchInput[];
    card?: Omit<HostedCardPatchInput, "revision">;
    faqs?: {
        question: string;
        answer: string;
    }[];
    sourceUrls?: string[];
    sourceText?: string;
}
export interface NotificationStatusView {
    available: boolean;
    connected: boolean;
    events: "new_request"[];
    availableEvents: "new_request"[];
    pending: number;
    uncertain: number;
    failed: number;
    linkExpiresAt: number | null;
    consentAt: number | null;
    consentVersion: string | null;
}
export interface NotificationConnectView {
    deepLink: string;
    expiresAt: number;
}
