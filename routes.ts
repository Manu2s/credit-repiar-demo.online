import { z } from 'zod';
import { 
  insertDisputeSchema, 
  insertTaskSchema, 
  insertCreditProfileSchema,
  disputes,
  tasks,
  creditProfiles,
  documents,
  resources,
  CREDIT_BUREAUS,
  DISPUTE_STATUSES,
  TASK_STATUSES
} from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  // Credit Profile endpoints
  creditProfile: {
    get: {
      method: 'GET' as const,
      path: '/api/credit-profile',
      responses: {
        200: z.custom<typeof creditProfiles.$inferSelect>().nullable(),
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/credit-profile',
      input: insertCreditProfileSchema.omit({ userId: true }),
      responses: {
        200: z.custom<typeof creditProfiles.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },

  // Disputes endpoints
  disputes: {
    list: {
      method: 'GET' as const,
      path: '/api/disputes',
      responses: {
        200: z.array(z.custom<typeof disputes.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/disputes/:id',
      responses: {
        200: z.custom<typeof disputes.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/disputes',
      input: insertDisputeSchema.omit({ userId: true }),
      responses: {
        201: z.custom<typeof disputes.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/disputes/:id',
      input: insertDisputeSchema.omit({ userId: true }).partial(),
      responses: {
        200: z.custom<typeof disputes.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/disputes/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },

  // Tasks endpoints
  tasks: {
    list: {
      method: 'GET' as const,
      path: '/api/tasks',
      responses: {
        200: z.array(z.custom<typeof tasks.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/tasks',
      input: insertTaskSchema.omit({ userId: true }),
      responses: {
        201: z.custom<typeof tasks.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/tasks/:id',
      input: insertTaskSchema.omit({ userId: true }).partial(),
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/tasks/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },

  // Resources endpoints (public)
  resources: {
    list: {
      method: 'GET' as const,
      path: '/api/resources',
      responses: {
        200: z.array(z.custom<typeof resources.$inferSelect>()),
      },
    },
  },

  // Dashboard stats
  dashboard: {
    stats: {
      method: 'GET' as const,
      path: '/api/dashboard/stats',
      responses: {
        200: z.object({
          totalDisputes: z.number(),
          pendingDisputes: z.number(),
          resolvedDisputes: z.number(),
          pendingTasks: z.number(),
          averageScore: z.number().nullable(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
  },
};

// ============================================
// URL BUILDER HELPER
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPE HELPERS
// ============================================
export type DisputeInput = z.infer<typeof api.disputes.create.input>;
export type DisputeResponse = typeof disputes.$inferSelect;
export type TaskInput = z.infer<typeof api.tasks.create.input>;
export type TaskResponse = typeof tasks.$inferSelect;
export type CreditProfileResponse = typeof creditProfiles.$inferSelect;
export type DashboardStats = z.infer<typeof api.dashboard.stats.responses[200]>;
