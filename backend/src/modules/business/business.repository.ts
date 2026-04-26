import { eq, and, isNull, isNotNull, desc, sql } from "drizzle-orm";
import drizzleDb, { drizzlePool } from "../../database/drizzle.js";
import { orderDrafts, orderTemplates } from "../../database/schema/orders.js";

class BusinessRepository {
  // =========================================================================
  // DRAFTS
  // =========================================================================

  async createDraft(clientId: number, data: any) {
    const result = await drizzleDb
      .insert(orderDrafts)
      .values({
        clientId,
        ...data,
      })
      .returning();
    return result[0];
  }

  async getDraftById(draftId: number) {
    const result = await drizzleDb
      .select()
      .from(orderDrafts)
      .where(
        and(
          eq(orderDrafts.draftId, draftId),
          isNull(orderDrafts.deletedAt),
        ),
      )
      .limit(1);
    return result[0] || null;
  }

  async getDraftsByClient(
    clientId: number,
    limit: number,
    offset: number,
    submitted?: boolean, // true = submitted only, false = non-submitted only, undefined = all
    fetchAll?: boolean,  // true = ignore limit/offset (for in-memory state filtering)
  ) {
    const conditions = [
      eq(orderDrafts.clientId, clientId),
      isNull(orderDrafts.deletedAt),
    ];

    if (submitted === true) {
      conditions.push(isNotNull(orderDrafts.submittedAt));
    } else if (submitted === false) {
      conditions.push(isNull(orderDrafts.submittedAt));
    }

    const where = and(...conditions);
    const baseQuery = drizzleDb
      .select()
      .from(orderDrafts)
      .where(where)
      .orderBy(desc(orderDrafts.createdAt));

    if (fetchAll) {
      const rows = await baseQuery;
      return { drafts: rows, total: rows.length };
    }

    const rows = await baseQuery.limit(limit).offset(offset);
    const total = await drizzleDb.$count(orderDrafts, where);
    return { drafts: rows, total };
  }

  async updateDraft(draftId: number, data: any) {
    const result = await drizzleDb
      .update(orderDrafts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(orderDrafts.draftId, draftId))
      .returning();
    return result[0];
  }

  async softDeleteDraft(draftId: number) {
    await drizzleDb
      .update(orderDrafts)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(orderDrafts.draftId, draftId));
  }

  // =========================================================================
  // TEMPLATES
  // =========================================================================

  async createTemplate(clientId: number, data: any) {
    const result = await drizzleDb
      .insert(orderTemplates)
      .values({
        clientId,
        ...data,
      })
      .returning();
    return result[0];
  }

  async getTemplateById(templateId: number) {
    const result = await drizzleDb
      .select()
      .from(orderTemplates)
      .where(
        and(
          eq(orderTemplates.templateId, templateId),
          isNull(orderTemplates.deletedAt),
        ),
      )
      .limit(1);
    return result[0] || null;
  }

  async getTemplatesByClient(
    clientId: number,
    limit: number,
    offset: number,
    isActive: boolean,
  ) {
    const query = drizzleDb
      .select()
      .from(orderTemplates)
      .where(
        and(
          eq(orderTemplates.clientId, clientId),
          eq(orderTemplates.isActive, isActive),
          isNull(orderTemplates.deletedAt),
        ),
      );

    const rows = await query
      .orderBy(desc(orderTemplates.createdAt))
      .limit(limit)
      .offset(offset);
    const countResult = await drizzleDb.$count(
      orderTemplates,
      and(
        eq(orderTemplates.clientId, clientId),
        eq(orderTemplates.isActive, isActive),
        isNull(orderTemplates.deletedAt),
      ),
    );

    return { templates: rows, total: countResult };
  }

  async updateTemplate(templateId: number, data: any) {
    const result = await drizzleDb
      .update(orderTemplates)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(orderTemplates.templateId, templateId))
      .returning();
    return result[0];
  }

  async softDeleteTemplate(templateId: number) {
    await drizzleDb
      .update(orderTemplates)
      .set({ isActive: false, deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(orderTemplates.templateId, templateId));
  }

  async incrementTemplateUseCount(templateId: number) {
    await drizzleDb
      .update(orderTemplates)
      .set({ useCount: sql`${orderTemplates.useCount} + 1`, updatedAt: new Date() })
      .where(eq(orderTemplates.templateId, templateId));
  }

  // =========================================================================
  // ANALYTICS
  // =========================================================================

  async getBusinessAnalytics(clientId: number, dateFrom: Date, dateTo: Date) {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
        COUNT(*) FILTER (WHERE status IN ('cancelled', 'undeliverable', 'returned')) as cancelled,
        COUNT(*) FILTER (WHERE status IN ('scheduled', 'pending', 'accepted', 'picked_up', 'in_transit')) as active,
        SUM(total_price) as spend_total,
        AVG(total_price) as spend_average,
        AVG(actual_duration_mins) FILTER (WHERE status = 'delivered') as avg_duration
      FROM orders.requests
      WHERE client_id = $1
        AND created_at >= $2
        AND created_at <= $3
        AND deleted_at IS NULL
    `;
    const result = await drizzlePool.query(query, [clientId, dateFrom, dateTo]);
    return result.rows[0] || {};
  }
}

export default new BusinessRepository();
