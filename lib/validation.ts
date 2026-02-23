// Validation schemas for API requests
import { z } from 'zod'

export const AccessRequestSchema = z.object({
  userId: z.string().min(3, 'User ID required'),
  resourceId: z.string().min(3, 'Resource ID required'),
  action: z.enum(['READ', 'WRITE', 'DELETE', 'ADMIN']),
  context: z.object({
    ipAddress: z.string().optional(),
    deviceId: z.string().optional(),
    location: z.string().optional(),
    userAgent: z.string().optional(),
  }).optional(),
})

export const MLClassificationSchema = z.object({
  userId: z.string().min(3),
  resourceId: z.string().optional(),
  action: z.string().optional(),
  context: z.object({
    ipAddress: z.string().optional(),
    deviceId: z.string().optional(),
    location: z.string().optional(),
    userAgent: z.string().optional(),
  }).optional(),
})

export type AccessRequestInput = z.infer<typeof AccessRequestSchema>
export type MLClassificationInput = z.infer<typeof MLClassificationSchema>
