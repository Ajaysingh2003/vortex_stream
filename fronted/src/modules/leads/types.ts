export type LeadStatus = "all" | "completed" | "skipped";
export type DeliveryStatus =
  "queued" | "retrying" | "delivering" | "delivered" | "failed";
export interface LeadField {
  id: string;
  label: string;
  type: string;
  position: number;
  archived: boolean;
}
export interface LeadAnswer {
  id: string;
  fieldId: string;
  label: string;
  type: string;
  position: number;
  value: string;
}
export interface Delivery {
  id: string;
  integrationId: string;
  submissionId: string | null;
  videoId: string;
  isTest: boolean;
  status: DeliveryStatus;
  attempts: number;
  nextAttemptAt: string;
  lastError: string;
  httpStatus: number;
  createdAt: string;
  updatedAt: string;
  deliveredAt: string | null;
}
export interface Lead {
  id: string;
  formId: string;
  videoId: string;
  sessionId: string;
  formVersion: number;
  placement: string;
  skipped: boolean;
  createdAt: string;
  answers: LeadAnswer[];
  deliveries: Delivery[];
}
export interface LeadPage {
  items: Lead[];
  fields: LeadField[];
  total: number;
  page: number;
  limit: number;
  asOf: string;
  summary: {
    completed: number;
    skipped: number;
    pending: number;
    failed: number;
  };
  videoTitle: string;
}
export interface Integration {
  id: string;
  name: string;
  kind: "webhook" | "hubspot";
  endpoint: string;
  mapping: Record<string, string>;
  enabled: boolean;
  version: number;
  secretConfigured: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface Integrations {
  items: Integration[];
  encryptionReady: boolean;
}
export interface DeliveryAttempt {
  id: string;
  deliveryId: string;
  attempt: number;
  httpStatus: number;
  error: string;
  durationMs: number;
  createdAt: string;
}
export interface LeadScope {
  workspaceId: string;
  videoId: string;
}
export interface LeadFilters {
  page: number;
  limit: number;
  search: string;
  status: LeadStatus;
  from?: string;
  to?: string;
  asOf?: string;
}
