import { eq, and, isNull, desc } from "drizzle-orm";
import drizzleDb from "../../database/drizzle.js";
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
    state?: string,
  ) {
    let query = drizzleDb
      .select()
      .from(orderDrafts)
      .where(
        and(eq(orderDrafts.clientId, clientId), isNull(orderDrafts.deletedAt)),
      );

    const rows = await query
      .orderBy(desc(orderDrafts.createdAt))
      .limit(limit)
      .offset(offset);
    const countResult = await drizzleDb.$count(
      orderDrafts,
      and(eq(orderDrafts.clientId, clientId), isNull(orderDrafts.deletedAt)),
    );

    return { drafts: rows, total: countResult };
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
    const template = await drizzleDb
      .select({ useCount: orderTemplates.useCount })
      .from(orderTemplates)
      .where(eq(orderTemplates.templateId, templateId))
      .limit(1);

    const currentCount = template[0]?.useCount ?? 0;

    await drizzleDb
      .update(orderTemplates)
      .set({ useCount: currentCount + 1 })
      .where(eq(orderTemplates.templateId, templateId));
  }
}

export default new BusinessRepository();
