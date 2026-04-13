import {
  AppError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "../../utils/error.util.js";
import { toIsoDateTime } from "../../utils/datetime.util.js";
import ordersRepository from "./orders.repository.js";

import type {
  AcceptOrderResult,
  AssignmentStatus,
  AvailableOrderItem,
  AvailableOrderRow,
  BaseOrder,
  CalculateFareRequest,
  CalculateFareResponse,
  CancelOrderResult,
  CreateOrderRequest,
  CreateOrderResponse,
  OrderDetails,
  OrderListItem,
  OrderListRow,
  OrderRow,
  UpdateOrderStatusResponse,
} from "./orders.zod.js";

class OrdersService {
  private toNumber(value: unknown, fallback = 0): number {
    if (value == null) return fallback;
    const n =
      typeof value === "number" ? value : Number.parseFloat(String(value));
    return Number.isFinite(n) ? n : fallback;
  }

  private toBaseOrderFromRow(
    row: OrderRow | OrderListRow | AvailableOrderRow,
  ): BaseOrder {
    const pricing = row.pricing;
    const totalPrice = this.toNumber(row.totalPrice, 0);

    return {
      identifiers: {
        orderId: row.orderId,
        orderUuid: row.orderUuid,
        orderNumber: row.orderNumber ?? null,
      },
      status: row.status,
      fulfillment: {
        deliveryTypeId: row.deliveryTypeId,
        vehicleCategoryId: row.vehicleCategoryId,
        weightTierId: row.weightTierId ?? null,
        packageTypeId: row.packageTypeId ?? null,
        paymentMethodId: row.paymentMethodId ?? null,
      },
      locations: {
        pickup: row.pickup,
        delivery: row.delivery,
      },
      package: row.package ?? { notifyRecipientSms: false },
      schedule: "schedule" in row ? (row.schedule ?? {}) : {},
      pricing: {
        basePrice: this.toNumber(pricing?.basePrice),
        distanceKm: this.toNumber(
          pricing?.distanceKm,
          this.toNumber(row.estimatedDistanceKm, 0),
        ),
        distancePrice: this.toNumber(pricing?.distancePrice),
        weightSurcharge: this.toNumber(pricing?.weightSurcharge),
        platformFee: this.toNumber(pricing?.platformFee),
        specialHandlingFee: this.toNumber(pricing?.specialHandlingFee),
        subtotalBeforeTax: this.toNumber(pricing?.subtotalBeforeTax),
        gstAmount: this.toNumber(pricing?.gstAmount),
        totalPrice,
        currency: pricing?.currency ?? "INR",
      },
      couponCode: "couponCode" in row ? (row.couponCode ?? null) : null,
      items:
        "orderItems" in row && Array.isArray(row.orderItems)
          ? (row.orderItems as BaseOrder["items"])
          : [],
      metrics: {
        estimatedDistanceKm:
          row.estimatedDistanceKm != null
            ? this.toNumber(row.estimatedDistanceKm)
            : null,
        actualDistanceKm:
          "actualDistanceKm" in row && row.actualDistanceKm != null
            ? this.toNumber(row.actualDistanceKm)
            : null,
        actualDurationMins:
          "actual" in row && row.actual?.pickupAt && row.actual?.deliveryAt
            ? Math.round(
                (new Date(row.actual.deliveryAt).getTime() -
                  new Date(row.actual.pickupAt).getTime()) /
                  60000,
              )
            : null,
        totalPrice,
      },
      timeline: {
        createdAt: toIsoDateTime(row.createdAt),
        acceptedAt:
          "acceptedAt" in row && row.acceptedAt
            ? toIsoDateTime(row.acceptedAt)
            : null,
        pickedUpAt:
          "pickedUpAt" in row && row.pickedUpAt
            ? toIsoDateTime(row.pickedUpAt)
            : null,
        inTransitAt:
          "inTransitAt" in row && row.inTransitAt
            ? toIsoDateTime(row.inTransitAt)
            : null,
        deliveredAt:
          "deliveredAt" in row && row.deliveredAt
            ? toIsoDateTime(row.deliveredAt)
            : null,
        cancelledAt:
          "cancelledAt" in row && row.cancelledAt
            ? toIsoDateTime(row.cancelledAt)
            : null,
      },
      snapshot: row.snapshot ?? undefined,
      actual: "actual" in row ? (row.actual ?? undefined) : undefined,
    };
  }

  async calculateFare(
    fareData: CalculateFareRequest,
  ): Promise<CalculateFareResponse> {
    const {
      fulfillment: {
        deliveryTypeId,
        vehicleCategoryId,
        weightTierId,
        packageTypeId,
      },
      locations: { pickup, delivery },
    } = fareData;

    const addressesService =
      await import("../addresses/addresses.service.js").then((m) => m.default);

    const estimatedDistanceKm = addressesService.calculateDistance(
      pickup.latitude,
      pickup.longitude,
      delivery.latitude,
      delivery.longitude,
    );

    if (estimatedDistanceKm <= 0.5) {
      throw new ValidationError("Distance must be greater than 0.5");
    }

    const distanceData = await addressesService.getDistanceMatrix(
      { lat: pickup.latitude, lng: pickup.longitude },
      { lat: delivery.latitude, lng: delivery.longitude },
    );

    const fareResult = await ordersRepository.calculateFare(
      deliveryTypeId,
      vehicleCategoryId,
      distanceData.distanceKm,
      weightTierId,
      packageTypeId ?? undefined,
    );

    if (!fareResult.success || !fareResult.pricing) {
      throw new AppError(fareResult.error || "Fare calculation failed", 400);
    }

    return {
      pricing: fareResult.pricing,
    };
  }

  async createOrder(
    clientId: number,
    orderData: CreateOrderRequest,
  ): Promise<CreateOrderResponse> {
    const serverCalculatedFare = await ordersRepository.calculateFare(
      orderData.fulfillment.deliveryTypeId,
      orderData.fulfillment.vehicleCategoryId,
      orderData.pricing.distanceKm,
      orderData.fulfillment.weightTierId,
      orderData.fulfillment.packageTypeId ?? undefined,
    );

    if (!serverCalculatedFare.success || !serverCalculatedFare.pricing) {
      throw new ValidationError("Invalid pricing parameters");
    }

    const tolerance = 0.01;
    const priceDifference = Math.abs(
      serverCalculatedFare.pricing.totalPrice - orderData.pricing.totalPrice,
    );

    if (priceDifference > tolerance) {
      throw new ValidationError("Pricing mismatch - please recalculate fare");
    }

    const schedule = orderData.schedule || {};
    let isScheduled = false;
    if (schedule.pickupAt) {
      const pickupDate = new Date(schedule.pickupAt);
      if (pickupDate.getTime() > Date.now() + 30 * 60 * 1000) {
        isScheduled = true;
      } else if (pickupDate.getTime() < Date.now()) {
        throw new ValidationError("Scheduled pickup time must be in the future");
      }
    }

    const discountInfo = await ordersRepository.getVolumeDiscount(clientId);
    if (discountInfo.discountPct !== undefined && orderData.pricing) {
        const discountAmount = Number(((orderData.pricing.totalPrice * discountInfo.discountPct) / 100).toFixed(2));
        orderData.pricing.discountPct = discountInfo.discountPct;
        orderData.pricing.discountAmount = discountAmount;
        orderData.pricing.totalPrice = Math.max(0, orderData.pricing.totalPrice - discountAmount);
    }

    const result = await ordersRepository.createOrder({
      clientId,
      ...orderData,
    });

    if (!result.success) {
      throw new AppError(result.error || "Order creation failed", 400);
    }

    if (!result.order) {
      throw new AppError(
        "Order creation succeeded but order payload is missing",
        500,
      );
    }

    if (isScheduled && result.order.identifiers.orderId) {
       await ordersRepository.markOrderAsScheduled(result.order.identifiers.orderId);
       result.order.status = "scheduled";
       await ordersRepository.recordStatusHistory(result.order.identifiers.orderId, "scheduled", null, clientId, "Order scheduled at creation");
    }

    return {
      order: result.order,
    };
  }

  async releaseScheduledOrders() {
    const releasedOrders = await ordersRepository.releaseScheduledOrders();
    for (const orderId of releasedOrders) {
      await ordersRepository.recordStatusHistory(
        orderId,
        "pending",
        "scheduled",
        null,
        "Auto-released by scheduler"
      );
    }
  }

  async getOrderById(
    orderId: number,
    userId: number,
    userRole: string,
  ): Promise<OrderDetails> {
    const order = await ordersRepository.findById(orderId);

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (userRole === "client" && order.clientId !== userId) {
      throw new AuthorizationError("You can only view your own orders");
    }

    if (
      userRole === "courier" &&
      order.courierId !== userId &&
      order.courierId !== null
    ) {
      throw new AuthorizationError("You can only view orders assigned to you");
    }

    const baseOrder = this.toBaseOrderFromRow(order);

    return {
      order: {
        ...baseOrder,
        assignment: order.assignmentId
          ? {
              assignmentId: order.assignmentId,
              status: (order.assignmentStatus ??
                "assigned") as AssignmentStatus,
              assignedAt: order.assignedAt
                ? toIsoDateTime(order.assignedAt)
                : null,
              timeline: order.assignmentTimeline ?? null,
            }
          : null,
        cancellation: {
          reason: order.cancellationReason ?? null,
        },
      },
      actors: {
        client: {
          userId: order.clientId!,
          name: order.clientName ?? null,
          phone: order.clientPhone ?? null,
        },
        courier: order.courierId
          ? {
              userId: order.courierId,
              name: order.courierName ?? null,
              phone: order.courierPhone ?? null,
              profilePictureUrl: order.courierPhoto ?? null,
            }
          : null,
      },
    };
  }

  async listOrders(
    clientId: number,
    page: number = 1,
    limit: number = 20,
    status?: string,
    dateFrom?: string,
    dateTo?: string,
    sortBy?: string,
    sortOrder?: string,
    search?: string,
    deliveryTypeId?: number,
    minPrice?: number,
    maxPrice?: number,
  ): Promise<{
    orders: OrderListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const offset = (page - 1) * limit;

    const { orders, total } = await ordersRepository.findByClient(
      clientId,
      limit,
      offset,
      status,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder as "asc" | "desc" | undefined,
      search,
      deliveryTypeId,
      minPrice,
      maxPrice,
    );

    return {
      orders: orders.map((order) => ({
        order: this.toBaseOrderFromRow(order),
        courier: order.courierId
          ? {
              userId: order.courierId,
              name: order.courierName ?? null,
              phone: order.courierPhone ?? null,
              profilePictureUrl: order.courierPhoto ?? null,
            }
          : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAvailableOrders(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    limit: number = 20,
  ): Promise<AvailableOrderItem[]> {
    const orders = await ordersRepository.findAvailableOrders(
      latitude,
      longitude,
      radiusKm,
      limit,
    );

    return orders.map((order) => ({
      order: this.toBaseOrderFromRow(order),
      distanceFromDriverKm: this.toNumber(order.distanceFromCourierKm),
    }));
  }

  async cancelOrder(
    orderId: number,
    userId: number,
    userRole: string,
    cancellationReason: string,
  ): Promise<CancelOrderResult> {
    const order = await ordersRepository.findById(orderId);

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (userRole === "client" && order.clientId !== userId) {
      throw new AuthorizationError("You can only cancel your own orders");
    }

    const nonCancellableStatuses = ["delivered", "cancelled"];
    if (nonCancellableStatuses.includes(order.status)) {
      throw new ValidationError(
        `Order cannot be cancelled in ${order.status} status`,
      );
    }

    return await ordersRepository.cancelOrder(
      orderId,
      cancellationReason,
      userId,
    );
  }

  async acceptOrder(
    orderId: number,
    courierId: number,
  ): Promise<AcceptOrderResult> {
    const order = await ordersRepository.findById(orderId);

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.status !== "pending") {
      throw new ValidationError(
        `Order cannot be accepted in ${order.status} status`,
      );
    }

    if (order.courierId && order.courierId !== courierId) {
      throw new ValidationError("Order already assigned to another driver");
    }

    return await ordersRepository.acceptOrder(orderId, courierId);
  }

  async updateOrderStatus(
    orderId: number,
    status: string,
    courierId: number,
  ): Promise<UpdateOrderStatusResponse> {
    const order = await ordersRepository.findById(orderId);

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.courierId !== courierId) {
      throw new AuthorizationError(
        "You can only update orders assigned to you",
      );
    }

    if (status === "picked_up" && order.status !== "accepted") {
      throw new ValidationError(
        "Order must be in accepted status to be picked up",
      );
    }

    if (status === "in_transit" && order.status !== "picked_up") {
      throw new ValidationError(
        "Order must be picked up before marking in transit",
      );
    }

    if (status === "delivered" && order.status !== "in_transit") {
      throw new ValidationError(
        "Order must be in transit before marking delivered",
      );
    }

    if (status === "delivered") {
      const delivered = await ordersRepository.deliverOrder(orderId, courierId);
      return {
        order: {
          orderId: delivered.orderId,
          status: "delivered" as const,
          timestamp: delivered.deliveredAt,
        },
      };
    }

    const updated = await ordersRepository.updateOrderStatus(orderId, status);
    if (!updated) {
      throw new NotFoundError("Order not found or update failed");
    }

    await ordersRepository.recordStatusHistory(
      orderId,
      status,
      order.status,
      courierId,
    );

    const timestamp =
      status === "picked_up"
        ? updated.pickedUpAt
        : status === "in_transit"
          ? updated.inTransitAt
          : updated.updatedAt;

    if (!timestamp) {
      throw new AppError("Status timestamp missing after update", 500);
    }

    return {
      order: {
        orderId: updated.orderId,
        status: status as "picked_up" | "in_transit",
        timestamp: toIsoDateTime(timestamp),
      },
    };
  }

  async bulkCancelOrders(
    userId: number,
    orderIds: number[],
    reason: string,
  ): Promise<{
    bulk: {
      requested: number;
      cancelled: number;
      failed: number;
      results: { orderId: number; success: boolean; error?: string }[];
    };
  }> {
    const result = await ordersRepository.bulkCancelOrders(
      orderIds,
      userId,
      reason,
    );
    return { bulk: result };
  }
}

export default new OrdersService();
