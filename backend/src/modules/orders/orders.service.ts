// services/backend/src/modules/orders/orders.service.ts
import logger from "../../config/logger.js";
import {
  AppError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "../../utils/error.util.js";
import {
  toIsoDateTime,
  toIsoDateTimeOrUndefined,
} from "../../utils/datetime.util.js";
import ordersRepository from "./orders.repository.js";

import type {
  CalculateFareRequest,
  CreateOrderRequest,
  CancelOrderResult,
  OrderDetails,
  OrderListItem,
  OrderRow,
} from "./orders.zod.js";
import type { FareBreakdown, OrderAddress } from "../../schemas/common.zod.js";
import type { CreatedOrder } from "../../types/orders.js";


class OrdersService {
  /**
   * Calculate fare estimate using real-time distance from Mapbox
   */
  async calculateFare(fareData: CalculateFareRequest): Promise<FareBreakdown> {
    const {
      deliveryTypeId,
      vehicleCategoryId,
      weightTierId,
      packageTypeId,
      pickup,
      drop,
    } = fareData;

    const addressesService =
      await import("../addresses/addresses.service.js").then((m) => m.default);

    const estimatedDistanceKm = addressesService.calculateDistance(
      pickup.latitude,
      pickup.longitude,
      drop.latitude,
      drop.longitude,
    );

    if (estimatedDistanceKm <= 0.5) {
      throw new ValidationError("Distance must be greater than 0.5");
    }

    const distanceData = await addressesService.getDistanceMatrix(
      { lat: pickup.latitude, lng: pickup.longitude },
      { lat: drop.latitude, lng: drop.longitude },
    );

    const fareResult = await ordersRepository.calculateFare(
      deliveryTypeId,
      vehicleCategoryId,
      distanceData.distanceKm,
      weightTierId,
      packageTypeId ?? undefined,
    );

    if (!fareResult.success) {
      throw new AppError(fareResult.error || "Fare calculation failed", 400);
    }

    return fareResult.fareBreakdown!;
  }

  /**
   * Create new order
   */
  async createOrder(
    clientId: number,
    orderData: CreateOrderRequest,
  ): Promise<CreatedOrder> {
    // Validate fare breakdown server-side to prevent price tampering
    const serverCalculatedFare = await ordersRepository.calculateFare(
      orderData.deliveryTypeId,
      orderData.vehicleCategoryId,
      orderData.fareBreakdown.distanceKm,
      orderData.weightTierId,
    );

    if (!serverCalculatedFare.success) {
      throw new ValidationError("Invalid pricing parameters");
    }

    const serverPricing = serverCalculatedFare.fareBreakdown!;
    const tolerance = 0.01;
    const priceDifference = Math.abs(
      serverPricing.totalPrice - orderData.fareBreakdown.totalPrice,
    );

    if (priceDifference > tolerance) {
      throw new ValidationError("Pricing mismatch - please recalculate fare");
    }

    const orderPayload = {
      clientId,
      deliveryTypeId: orderData.deliveryTypeId,
      vehicleCategoryId: orderData.vehicleCategoryId,
      weightTierId: orderData.weightTierId,
      packageTypeId: orderData.packageTypeId || null,
      paymentMethodId: orderData.paymentMethodId,
      notifyRecipientSms: orderData.notifyRecipientSms || false,
      couponCode: orderData.couponCode || null,
      pickup: {
        fullAddress: orderData.pickup.fullAddress,
        latitude: orderData.pickup.latitude,
        longitude: orderData.pickup.longitude,
        city: orderData.pickup.city,
        state: orderData.pickup.state,
        postalCode: orderData.pickup.postalCode,
        howToReach: orderData.pickup.howToReach || null,
        building: orderData.pickup.building || null,
        floor: orderData.pickup.floor || null,
        flatNumber: orderData.pickup.flatNumber || null,
        contactName: orderData.pickup.contactName,
        contactPhone: orderData.pickup.contactPhone,
      },
      delivery: {
        fullAddress: orderData.delivery.fullAddress,
        latitude: orderData.delivery.latitude,
        longitude: orderData.delivery.longitude,
        city: orderData.delivery.city,
        state: orderData.delivery.state,
        postalCode: orderData.delivery.postalCode,
        howToReach: orderData.delivery.howToReach || null,
        building: orderData.delivery.building || null,
        floor: orderData.delivery.floor || null,
        flatNumber: orderData.delivery.flatNumber || null,
        contactName: orderData.delivery.contactName,
        contactPhone: orderData.delivery.contactPhone,
      },
      packageDescription: orderData.packageDescription || null,
      specialInstructions: orderData.specialInstructions || null,
      declaredValue: orderData.declaredValue || null,
      scheduledPickupTime: orderData.scheduledPickupTime || null,
      scheduledDeliveryTime: orderData.scheduledDeliveryTime || null,
      fareBreakdown: {
        basePrice: orderData.fareBreakdown.basePrice,
        distanceKm: orderData.fareBreakdown.distanceKm,
        distancePrice: orderData.fareBreakdown.distancePrice,
        weightSurcharge: orderData.fareBreakdown.weightSurcharge,
        platformFee: orderData.fareBreakdown.platformFee || 10.0,
        specialHandlingFee: orderData.fareBreakdown.specialHandlingFee || 0.0,
        subtotalBeforeTax:
          orderData.fareBreakdown.subtotalBeforeTax ||
          orderData.fareBreakdown.basePrice +
            orderData.fareBreakdown.distancePrice +
            orderData.fareBreakdown.weightSurcharge +
            (orderData.fareBreakdown.platformFee || 10.0) +
            (orderData.fareBreakdown.specialHandlingFee || 0.0),
        gstAmount: orderData.fareBreakdown.gstAmount,
        totalPrice: orderData.fareBreakdown.totalPrice,
        currency: orderData.fareBreakdown.currency,
      },
    };

    const result = await ordersRepository.createOrder(orderPayload);

    if (!result.success) {
      throw new AppError(result.error || "Order creation failed", 400);
    }

    const orderRow = result.order;
    if (!orderRow) {
      throw new AppError(
        "Order creation succeeded but order payload is missing",
        500,
      );
    }

    const toNum = (v: unknown, fallback = 0): number => {
      if (v == null) return fallback;
      const n = typeof v === "number" ? v : Number.parseFloat(String(v));
      return Number.isFinite(n) ? n : fallback;
    };

    const pricing = orderRow.pricing;
    const fareBreakdown = pricing
      ? {
          basePrice: toNum(pricing.basePrice),
          distanceKm: toNum(pricing.distanceKm),
          distancePrice: toNum(pricing.distancePrice),
          weightSurcharge: toNum(pricing.weightSurcharge),
          platformFee: toNum(pricing.platformFee),
          specialHandlingFee: toNum(pricing.specialHandlingFee),
          subtotalBeforeTax: toNum(pricing.subtotalBeforeTax),
          gstAmount: toNum(pricing.gstAmount),
          totalPrice: toNum(pricing.totalPrice),
          currency: pricing.currency,
        }
      : orderData.fareBreakdown;

    let createdAtStr: string;
    try {
      createdAtStr = toIsoDateTime(orderRow.createdAt);
    } catch {
      throw new AppError("Invalid createdAt value from order creation", 500);
    }

    return {
      orderId: orderRow.orderId,
      orderUuid: orderRow.orderUuid,
      orderNumber: orderRow.orderNumber,
      status: orderRow.status || "pending",
      fareBreakdown,
      estimatedDistanceKm: toNum(orderRow.estimatedDistanceKm),
      estimatedDurationMins:
        orderRow.estimatedDurationMins != null
          ? toNum(orderRow.estimatedDurationMins)
          : undefined,
      createdAt: createdAtStr,
    };
  }

  /**
   * Get order details
   */
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

    return this._formatOrderDetails(order);
  }

  /**
   * List user's orders
   */
  async listOrders(
    clientId: number,
    page: number = 1,
    limit: number = 20,
    status?: string,
    dateFrom?: string,
    dateTo?: string,
    sortBy?: string,
    sortOrder?: string,
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
    );

    return {
      orders: orders.map((order) => {
        const snap = order.snapshot;
        const wt = snap?.weightTier;
        const weightTierDisplay = wt
          ? `${wt.minWeightKg}-${wt.maxWeightKg} kg`
          : null;

        return {
          orderId: order.orderId,
          orderUuid: order.orderUuid,
          orderNumber: order.orderNumber,
          status: order.status,
          deliveryTypeId: order.deliveryTypeId,
          deliveryTypeDisplay: snap?.deliveryType?.displayName,
          vehicleCategoryId: order.vehicleCategoryId,
          vehicleCategoryDisplay: snap?.vehicleCategory?.displayName,
          packageDescription: null,
          weightTierId: order.weightTierId,
          weightTierDisplay,
          estimatedDistanceKm: order.estimatedDistanceKm ?? null,
          actualDistanceKm: order.actualDistanceKm ?? null,
          actualDurationMins: null,
          totalPrice: Number(order.totalPrice ?? 0),
          createdAt: toIsoDateTime(order.createdAt),
          pickup: {
            address: order.pickup.fullAddress,
            city: order.pickup.city ?? undefined,
          },
          delivery: {
            address: order.delivery.fullAddress,
            city: order.delivery.city ?? undefined,
          },
          courier: order.courierId
            ? { name: order.courierName, photo: order.courierPhoto }
            : null,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get available orders for drivers
   */
  async getAvailableOrders(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    limit: number = 20,
  ): Promise<import("./orders.zod.js").AvailableOrderItem[]> {
    const orders = await ordersRepository.findAvailableOrders(
      latitude,
      longitude,
      radiusKm,
      limit,
    );

    return orders.map((order) => {
      const p = order.pricing;
      const snap = order.snapshot;
      return {
        orderId: order.orderId,
        orderUuid: order.orderUuid,
        orderNumber: order.orderNumber,
        deliveryTypeDisplay: snap?.deliveryType?.displayName ?? "",
        vehicleCategoryDisplay: snap?.vehicleCategory?.displayName ?? "",
        createdAt: toIsoDateTime(order.createdAt),
        pickup: {
          address: order.pickup.fullAddress,
          landmark: order.pickup.landmark,
          city: order.pickup.city ?? "",
          coordinates: {
            latitude: order.pickup.latitude,
            longitude: order.pickup.longitude,
          },
        },
        delivery: {
          address: order.delivery.fullAddress,
          landmark: order.delivery.landmark,
          city: order.delivery.city ?? "",
          coordinates: {
            latitude: order.delivery.latitude,
            longitude: order.delivery.longitude,
          },
        },
        distanceFromDriverKm: Number(order.distanceFromCourierKm),
        estimatedDistanceKm: Number(order.estimatedDistanceKm),
        fareBreakdown: {
          basePrice: Number(p?.basePrice ?? 0),
          distanceKm: Number(p?.distanceKm ?? order.estimatedDistanceKm ?? 0),
          distancePrice: Number(p?.distancePrice ?? 0),
          weightSurcharge: Number(p?.weightSurcharge ?? 0),
          platformFee: Number(p?.platformFee ?? 0),
          specialHandlingFee: Number(p?.specialHandlingFee ?? 0),
          gstAmount: Number(p?.gstAmount ?? 0),
          totalPrice: Number(order.totalPrice ?? 0),
          subtotalBeforeTax: Number(p?.subtotalBeforeTax ?? 0),
        },
        packageDescription: order.package?.description ?? null,
      };
    });
  }

  /**
   * Cancel order
   */
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

    const result = await ordersRepository.cancelOrder(
      orderId,
      cancellationReason,
      userId,
    );

    if (!result.success) {
      throw new AppError(result.error, 400);
    }

    return result;
  }

  /**
   * Driver accepts order
   */
  async acceptOrder(
    orderId: number,
    courierId: number,
  ): Promise<{
    assignmentId: number;
    orderId: number;
    courierId: number;
    assignedAt: string;
  }> {
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

    const result = await ordersRepository.acceptOrder(orderId, courierId);

    return {
      assignmentId: result.assignmentId,
      orderId: result.orderId,
      courierId: result.courierId,
      assignedAt: toIsoDateTime(result.assignedAt),
    };
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: number,
    status: string,
    courierId: number,
  ): Promise<{ orderId: number; status: string; timestamp: string }> {
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
          : status === "delivered"
            ? updated.deliveredAt
            : updated.updatedAt;
    if (!timestamp) {
      throw new AppError("Status timestamp missing after update", 500);
    }

    return {
      orderId: updated.orderId,
      status,
      timestamp: toIsoDateTime(timestamp),
    };
  }

  /**
   * Format order details from DB row to API response shape
   */
  _formatOrderDetails(order: OrderRow): OrderDetails {
    const snap = order.snapshot;
    const p = order.pricing;
    const pkg = order.package;
    const act = order.actual;

    let actualDurationMins = null;
    if (act?.pickupAt && act?.deliveryAt) {
      const pickupTime = new Date(act.pickupAt).getTime();
      const deliveryTime = new Date(act.deliveryAt).getTime();
      actualDurationMins = Math.round((deliveryTime - pickupTime) / (1000 * 60));
    } else if (act?.pickupAt && !act?.deliveryAt) {
      actualDurationMins = Math.round(
        (Date.now() - new Date(act.pickupAt).getTime()) / (1000 * 60),
      );
    }

    const wt = snap?.weightTier;
    const weightTierDisplay = wt
      ? `${wt.minWeightKg}-${wt.maxWeightKg} kg`
      : null;

    return {
      orderId: order.orderId,
      orderUuid: order.orderUuid,
      orderNumber: order.orderNumber,

      status: order.status,

      deliveryTypeId: order.deliveryTypeId,
      deliveryTypeDisplay: snap?.deliveryType?.displayName,
      vehicleCategoryId: order.vehicleCategoryId,
      vehicleCategoryDisplay: snap?.vehicleCategory?.displayName,

      packageDescription: pkg?.description ?? null,
      packageTypeId: order.packageTypeId ?? null,
      weightTierId: order.weightTierId,
      weightTierDisplay,
      specialInstructions: pkg?.specialInstructions ?? null,

      estimatedDistanceKm: order.estimatedDistanceKm
        ? Number(order.estimatedDistanceKm)
        : null,
      actualDistanceKm: order.actualDistanceKm
        ? Number(order.actualDistanceKm)
        : null,
      actualDurationMins,

      createdAt: toIsoDateTime(order.createdAt),

      timeline: {
        confirmedAt: toIsoDateTime(order.createdAt),
        assignedAt: toIsoDateTimeOrUndefined(order.acceptedAt),
        pickedUpAt: toIsoDateTimeOrUndefined(order.pickedUpAt),
        deliveredAt: toIsoDateTimeOrUndefined(order.deliveredAt),
        cancelledAt: toIsoDateTimeOrUndefined(order.cancelledAt),
      },

      pickup: {
        address: order.pickup.fullAddress || "",
        building: order.pickup.building,
        floor: order.pickup.floor,
        flat: order.pickup.flatNumber,
        landmark: order.pickup.landmark,
        city: order.pickup.city ?? undefined,
        state: order.pickup.state ?? undefined,
        postalCode: order.pickup.postalCode ?? undefined,
        latitude: order.pickup.latitude,
        longitude: order.pickup.longitude,
        contactName: order.pickup.contactName ?? undefined,
        contactPhone: order.pickup.contactPhone ?? undefined,
      },

      delivery: {
        address: order.delivery.fullAddress || "",
        building: order.delivery.building,
        floor: order.delivery.floor,
        flat: order.delivery.flatNumber,
        landmark: order.delivery.landmark,
        city: order.delivery.city ?? undefined,
        state: order.delivery.state ?? undefined,
        postalCode: order.delivery.postalCode ?? undefined,
        latitude: order.delivery.latitude,
        longitude: order.delivery.longitude,
        contactName: order.delivery.contactName ?? undefined,
        contactPhone: order.delivery.contactPhone ?? undefined,
      },

      fareBreakdown: {
        basePrice: Number(p?.basePrice ?? 0),
        distanceKm: Number(p?.distanceKm ?? order.estimatedDistanceKm ?? 0),
        distancePrice: Number(p?.distancePrice ?? 0),
        weightSurcharge: Number(p?.weightSurcharge ?? 0),
        platformFee: Number(p?.platformFee ?? 0),
        specialHandlingFee: Number(p?.specialHandlingFee ?? 0),
        gstAmount: Number(p?.gstAmount ?? 0),
        subtotalBeforeTax: Number(p?.subtotalBeforeTax ?? order.totalPrice ?? 0),
        totalPrice: Number(order.totalPrice ?? 0),
      },

      courier: order.courierId
        ? {
            userId: order.courierId,
            name: order.courierName || undefined,
            phone: order.courierPhone || undefined,
            profilePictureUrl: order.courierPhoto || undefined,
          }
        : null,

      client: {
        userId: order.clientId!,
        name: order.clientName ?? undefined,
        phone: order.clientPhone ?? undefined,
      },
    };
  }
}

export default new OrdersService();
