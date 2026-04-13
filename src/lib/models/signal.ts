import { z } from "zod";

export const SignalTypeSchema = z.enum(["BUY", "SELL"]);

export const IncomingSignalSchema = z.object({
  symbol: z.string().min(1).max(40),
  signal: SignalTypeSchema,
  timeframe: z.string().min(1).max(20),
  price: z.string().min(1).max(40),
  timestamp: z.string().datetime(),
  note: z.string().max(300).optional(),
  source: z.string().max(40).optional(),
});

export type IncomingSignal = z.infer<typeof IncomingSignalSchema>;

export type SignalDoc = IncomingSignal & {
  source: string;
  whatsappStatus: "pending" | "success" | "failed" | "mock_success";
  whatsappMessageId?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
};
