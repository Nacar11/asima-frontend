import { z } from 'zod';
import { ApiClient, apiClient } from '@/lib/api-client';
import {
  CompensationSchema,
  CompensationAuditSchema,
  CreateCompensationSchema,
  BulkCreateCompensationSchema,
  UpdateCompensationSchema,
  type Compensation,
  type CompensationAudit,
  type CreateCompensationInput,
  type UpdateCompensationInput,
} from './schemas';

const CompensationArraySchema = z.array(CompensationSchema);
const CompensationAuditArraySchema = z.array(CompensationAuditSchema);

/**
 * Admin compensation management. Gated server-side by COMPENSATION:{ViewAll,
 * Create,Update,Delete}; the page also wraps in <RequirePermission> for
 * friendly UX. The client trusts the server to enforce.
 */
export const adminCompensationApi = {
  /** Full history for one employee, newest effective_from first. */
  historyForEmployee(employeeId: number, client: ApiClient = apiClient()): Promise<Compensation[]> {
    return client
      .get<unknown>(`/admin/compensation/employees/${employeeId}`)
      .then((res) => CompensationArraySchema.parse(res));
  },

  /** The before→after audit trail for one compensation row, newest first. */
  auditTrail(id: number, client: ApiClient = apiClient()): Promise<CompensationAudit[]> {
    return client
      .get<unknown>(`/admin/compensation/${id}/audit`)
      .then((res) => CompensationAuditArraySchema.parse(res));
  },

  /** Set / change pay (effective-dated; ends the prior active row server-side). */
  create(input: CreateCompensationInput, client: ApiClient = apiClient()): Promise<Compensation> {
    const body = CreateCompensationSchema.parse(input);
    return client
      .post<unknown>('/admin/compensation', body)
      .then((res) => CompensationSchema.parse(res));
  },

  /** Set pay for several employees in one all-or-nothing request. */
  createBulk(
    items: CreateCompensationInput[],
    client: ApiClient = apiClient(),
  ): Promise<Compensation[]> {
    const body = BulkCreateCompensationSchema.parse({ items });
    return client
      .post<unknown>('/admin/compensation/bulk', body)
      .then((res) => CompensationArraySchema.parse(res));
  },

  /** Correct an erroneous row in place. */
  update(
    id: number,
    patch: UpdateCompensationInput,
    client: ApiClient = apiClient(),
  ): Promise<Compensation> {
    const body = UpdateCompensationSchema.parse(patch);
    return client
      .patch<unknown>(`/admin/compensation/${id}`, body)
      .then((res) => CompensationSchema.parse(res));
  },

  /** Soft-delete the active row (reactivates the prior row server-side). */
  remove(id: number, client: ApiClient = apiClient()): Promise<void> {
    return client.delete<unknown>(`/admin/compensation/${id}`).then(() => undefined);
  },
};
