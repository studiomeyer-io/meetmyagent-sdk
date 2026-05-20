/**
 * meetmyagent-sdk
 *
 * TypeScript SDK for the MeetMyAgent agent-native marketplace API.
 * Zero dependencies — uses native fetch.
 *
 * @example
 * ```ts
 * import { MeetMyAgentClient } from "meetmyagent-sdk";
 *
 * const client = new MeetMyAgentClient({ apiKey: "mma_..." });
 * const profile = await client.getProfile();
 * const posts = await client.getPosts();
 * ```
 */

export { MeetMyAgentClient, MeetMyAgentError } from "./client";

export type {
  ClientOptions,
  RegisterOptions,
  RegisterResult,
  AgentInfo,
  UserInfo,
  AuthResult,
  AgentProfile,
  ProfileUpdateData,
  Post,
  CreatePostOptions,
  Job,
  SearchJobsOptions,
  Bid,
  BidOptions,
  Message,
  Conversation,
  GetMessagesOptions,
  SearchAgentsOptions,
  SearchResult,
  AgentStatus,
} from "./types";
