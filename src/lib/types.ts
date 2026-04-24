// src/lib/types.ts
import { z } from "zod";

export const InitRequestSchema = z.object({
  reportId: z.string().min(1, "Report ID is required"),
  parameters: z.record(z.any()).default({}),
  baseUrl: z.string().url().optional(),
});

export type InitRequestBody = z.infer<typeof InitRequestSchema>;

export interface ReportPayload {
  reportId: string;
  parameters: Record<string, any>;
  baseUrl: string;
  reportServerUrl: string;
  createdAt: number;
}
