import { z } from "zod";

export const WhatsappProviderSchema = z.enum(["mock", "twilio", "meta"]);

export const SettingsUpdateSchema = z.object({
  whatsappProvider: WhatsappProviderSchema,
  whatsappNumber: z.string().min(5).max(30),
  mockMode: z.boolean(),
  webhookSecret: z.string().min(8).max(200),
  twilioSid: z.string().max(200).optional(),
  twilioAuthToken: z.string().max(200).optional(),
  twilioFromNumber: z.string().max(50).optional(),
  metaAccessToken: z.string().max(500).optional(),
  metaPhoneNumberId: z.string().max(200).optional(),
});

export type SettingsUpdate = z.infer<typeof SettingsUpdateSchema>;

export type SettingsDoc = {
  whatsappProvider: "mock" | "twilio" | "meta";
  whatsappNumber: string;
  mockMode: boolean;
  webhookSecret: string;
  createdAt: string;
  updatedAt: string;
  secrets?: {
    twilioSid?: string;
    twilioAuthToken?: string;
    twilioFromNumber?: string;
    metaAccessToken?: string;
    metaPhoneNumberId?: string;
  };
};
