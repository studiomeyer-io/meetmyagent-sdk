export const ACP_API_VERSION = "2026-04-17";
export type CheckoutStatus = "incomplete" | "not_ready_for_payment" | "requires_escalation" | "authentication_required" | "ready_for_payment" | "pending_approval" | "complete_in_progress" | "completed" | "canceled" | "in_progress" | "expired";
export interface CheckoutCapabilities {
    payment?: {
        handlers: Array<Record<string, unknown>>;
    };
    interventions?: {
        supported?: Array<"3ds" | "biometric" | "address_verification">;
        display_context?: "native" | "webview" | "modal" | "redirect";
        redirect_context?: "in_app" | "external_browser" | "none";
    };
}
export interface CheckoutConsent {
    userConfirmed?: boolean | undefined;
    b2bConfirmed?: boolean | undefined;
    termsAccepted?: boolean | undefined;
    termsVersion?: string | undefined;
    locale?: "de" | "en" | undefined;
}
export interface CheckoutCreateInput {
    line_items: Array<{
        id: string;
    }>;
    currency: string;
    capabilities: CheckoutCapabilities;
    locale?: string | undefined;
    metadata?: CheckoutConsent;
}
export interface CheckoutUpdateInput {
    line_items?: Array<{
        id: string;
    }>;
}
export interface CheckoutPaymentData {
    handler_id: string;
    instrument: {
        type: string;
        credential: {
            type: string;
            token: string;
        };
    };
}
export interface CheckoutCompleteInput {
    payment_data: CheckoutPaymentData;
}
export interface CheckoutTotal {
    type: "items_base_amount" | "items_discount" | "subtotal" | "discount" | "fulfillment" | "tax" | "fee" | "gift_wrap" | "tip" | "store_credit" | "total" | "amount_refunded";
    display_text: string;
    amount: number;
    description?: string | undefined;
}
export interface CheckoutLineItem {
    id: string;
    item: {
        id: string;
        name?: string | undefined;
        unit_amount?: number;
    };
    quantity: number;
    totals: CheckoutTotal[];
    name?: string | undefined;
    description?: string | undefined;
    unit_amount?: number;
}
export interface CheckoutMessage {
    type: "info" | "warning" | "error";
    code?: string | undefined;
    content_type: "plain" | "markdown";
    content: string;
    resolution?: "recoverable" | "requires_buyer_input" | "requires_buyer_review";
}
export interface CheckoutSessionView {
    id: string;
    status: CheckoutStatus;
    currency: string;
    line_items: CheckoutLineItem[];
    totals: CheckoutTotal[];
    fulfillment_options: Array<Record<string, unknown>>;
    messages: CheckoutMessage[];
    links: Array<{
        type: string;
        url: string;
        title?: string;
    }>;
    capabilities: CheckoutCapabilities;
    protocol?: {
        version: string;
    };
    continue_url?: string | undefined;
    expires_at?: string | undefined;
    metadata?: Record<string, unknown> & {
        payment_settlement_status?: "verified_paid" | "unverified";
        payment_settlement_checked_at?: string;
    };
    order?: {
        id: string;
        checkout_session_id: string;
        permalink_url: string;
        status?: string | undefined;
        totals?: CheckoutTotal[];
    };
}
export interface CheckoutMutationOptions {
    idempotencyKey: string;
}
export interface CheckoutCompleteOptions extends CheckoutMutationOptions {
    userConfirmed: true;
}
