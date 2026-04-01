// services/backend/src/modules/orders/orders.service.ts
import logger from "../../config/logger.js";
import {
  AppError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "../../utils/error.util.js";
import ordersRepository from "./orders.repository.js";

import type {
  CalculateFareRequest,
  CreateOrderRequest,
  CancelOrderResult,
  OrderDetails,
  OrderListItem,
} from "./orders.zod.js";
import type { FareBreakdown, OrderAddress } from "../../schemas/common.zod.js";
import type { CreatedOrder } from "../../types/orders.js";

// DB row shape for order queries (only fields used by _formatOrderDetails)
type OrderRow = {
  orderId: number;
  orderUuid: string;
  orderNumber: string;
  statusId?: number;
  statusName?: string;
  deliveryTypeId?: number;
  deliveryType?: string;
  deliveryTypeDisplay?: string;
  vehicleCategoryId?: number;
  vehicleCategoryDisplay?: string;
  packageDescription?: string | null;
  packageTypeId?: number | null;
  weightTierId?: number | null;
  weightTierName?: string | null;
  weightTierMin?: number | string | null;
  weightTierMax?: number | string | null;
  estimatedDistanceKm?: number | string | null;
  actualDistanceKm?: number | string | null;
  actualPickupTime?: string | Date | null;
  actualDeliveryTime?: string | Date | null;
  paymentMethodId?: number;
  paymentMethod?: string;
  createdAt?: Date;
  acceptedAt?: Date | null;
  pickedUpAt?: Date | null;
  deliveredAt?: Date | null;
  cancelledAt?: Date | null;
  cancellationReason?: string | null;
  pickupLocationId?: number;
  pickupBuilding?: string | null;
  pickupFloor?: string | null;
  pickupFlat?: string | null;
  pickupAddress?: string | null;
  pickupLandmark?: string | null;
  pickupCity?: string | null;
  pickupState?: string | null;
  pickupPostalCode?: string | null;
  pickupLatitude?: number | string | null;
  pickupLongitude?: number | string | null;
  pickupContactName?: string | null;
  pickupContactPhone?: string | null;
  deliveryLocationId?: number;
  deliveryBuilding?: string | null;
  deliveryFloor?: string | null;
  deliveryFlat?: string | null;
  deliveryAddress?: string | null;
  deliveryLandmark?: string | null;
  deliveryCity?: string | null;
  deliveryState?: string | null;
  deliveryPostalCode?: string | null;
  deliveryLatitude?: number | string | null;
  deliveryLongitude?: number | string | null;
  deliveryContactName?: string | null;
  deliveryContactPhone?: string | null;
  basePrice?: number | string | null;
  distancePrice?: number | string | null;
  weightSurcharge?: number | string | null;
  platformFee?: number | string | null;
  specialHandlingFee?: number | string | null;
  gstAmount?: number | string | null;
  subtotalBeforeTax?: number | string | null;
  totalPrice?: number | string | null;
  clientId?: number | null;
  clientName?: string | null;
  clientPhone?: string | null;
  specialInstructions?: string | null;
  courierId?: number | null;
  courierName?: string | null;
  courierPhone?: string | null;
  courierPhoto?: string | null;
  assignmentStatus?: string | null;
  assignedAt?: string | Date | null;
  courierAcceptedAt?: string | Date | null;
};

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
        addressId: orderData.pickup.addressId || null,
        address: orderData.pickup.fullAddress,
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
        addressId: orderData.delivery.addressId || null,
        address: orderData.delivery.fullAddress,
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

    const createdAtRaw = orderRow.createdAt;
    const createdAtStr =
      typeof createdAtRaw === "string"
        ? createdAtRaw
        : createdAtRaw instanceof Date
          ? createdAtRaw.toISOString()
          : new Date(createdAtRaw as string | number).toISOString();

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
        let actualDurationMins = null;
        if (order.actualPickupTime && order.actualDeliveryTime) {
          const pickupTime = new Date(order.actualPickupTime).getTime();
          const deliveryTime = new Date(order.actualDeliveryTime).getTime();
          actualDurationMins = Math.round(
            (deliveryTime - pickupTime) / (1000 * 60),
          );
        } else if (order.actualPickupTime && !order.actualDeliveryTime) {
          const pickupTime = new Date(order.actualPickupTime).getTime();
          actualDurationMins = Math.round(
            (Date.now() - pickupTime) / (1000 * 60),
          );
        }

        const weightTierDisplay =
          order.weightTierName ||
          (order.weightTierMin != null && order.weightTierMax != null
            ? `${order.weightTierMin}-${order.weightTierMax} kg`
            : null);

        return {
          orderId: order.orderId,
          orderUuid: order.orderUuid,
          orderNumber: order.orderNumber,
          status: order.statusName,
          statusId: order.statusId,
          deliveryTypeId: order.deliveryTypeId,
          deliveryTypeDisplay: order.deliveryTypeDisplay,
          vehicleCategoryId: order.vehicleCategoryId,
          vehicleCategoryDisplay: order.vehicleCategoryDisplay,
          packageDescription: order.packageDescription,
          weightTierId: order.weightTierId,
          weightTierDisplay,
          estimatedDistanceKm: order.estimatedDistanceKm
            ? Number.parseFloat(order.estimatedDistanceKm)
            : null,
          actualDistanceKm: order.actualDistanceKm
            ? Number.parseFloat(order.actualDistanceKm)
            : null,
          actualDurationMins,
          totalPrice: Number.parseFloat(order.totalPrice ?? "0"),
          createdAt: order.createdAt,
          pickup: {
            address: order.pickupAddress,
            city: order.pickupCity ?? undefined,
          },
          delivery: {
            address: order.deliveryAddress,
            city: order.deliveryCity ?? undefined,
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

    return orders.map((order) => ({
      orderId: order.orderId,
      orderUuid: order.orderUuid,
      orderNumber: order.orderNumber,
      deliveryTypeDisplay: order.deliveryTypeDisplay,
      vehicleCategoryDisplay: order.vehicleCategoryDisplay,
      createdAt: (order.createdAt as Date).toISOString(),
      pickup: {
        address: order.pickupAddress,
        landmark: order.pickupLandmark,
        city: order.pickupCity,
        coordinates: {
          latitude: Number.parseFloat(order.pickupLatitude),
          longitude: Number.parseFloat(order.pickupLongitude),
        },
      },
      delivery: {
        address: order.deliveryAddress,
        landmark: order.deliveryLandmark,
        city: order.deliveryCity,
        coordinates: {
          latitude: order.deliveryLatitude
            ? Number.parseFloat(order.deliveryLatitude)
            : 0,
          longitude: order.deliveryLongitude
            ? Number.parseFloat(order.deliveryLongitude)
            : 0,
        },
      },
      distanceFromDriverKm: Number.parseFloat(order.distanceFromCourierKm),
      estimatedDistanceKm: Number.parseFloat(order.estimatedDistanceKm),
      fareBreakdown: {
        basePrice: Number.parseFloat(order.basePrice || "0"),
        distanceKm: Number.parseFloat(order.estimatedDistanceKm || "0"),
        distancePrice: Number.parseFloat(order.distancePrice || "0"),
        weightSurcharge: Number.parseFloat(order.weightSurcharge || "0"),
        platformFee: Number.parseFloat(order.platformFee || "0"),
        specialHandlingFee: Number.parseFloat(order.specialHandlingFee || "0"),
        gstAmount: Number.parseFloat(order.gstAmount || "0"),
        totalPrice: Number.parseFloat(order.totalPrice || "0"),
        subtotalBeforeTax: Number.parseFloat(order.subtotalBeforeTax || "0"),
      },
    }));
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
    if (nonCancellableStatuses.includes(order.statusName)) {
      throw new ValidationError(
        `Order cannot be cancelled in ${order.statusName} status`,
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
    assignedAt: Date;
  }> {
    const order = await ordersRepository.findById(orderId);

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.statusName !== "pending") {
      throw new ValidationError(
        `Order cannot be accepted in ${order.statusName} status`,
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
      assignedAt: result.assignedAt,
    };
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: number,
    status: string,
    courierId: number,
  ): Promise<{ orderId: number; status: string; timestamp: Date }> {
    const order = await ordersRepository.findById(orderId);

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.courierId !== courierId) {
      throw new AuthorizationError(
        "You can only update orders assigned to you",
      );
    }

    if (status === "picked_up" && order.statusName !== "accepted") {
      throw new ValidationError(
        "Order must be in accepted status to be picked up",
      );
    }

    if (status === "in_transit" && order.statusName !== "picked_up") {
      throw new ValidationError(
        "Order must be picked up before marking in transit",
      );
    }

    if (status === "delivered" && order.statusName !== "in_transit") {
      throw new ValidationError(
        "Order must be in transit before marking delivered",
      );
    }

    const updated = await ordersRepository.updateOrderStatus(orderId, status);
    if (!updated) {
      throw new NotFoundError("Order not found or update failed");
    }

    const timestamp =
      status === "picked_up"
        ? updated.pickedUpAt
        : status === "delivered"
          ? updated.deliveredAt
          : updated.updatedAt;
    if (!timestamp) {
      throw new AppError("Status timestamp missing after update", 500);
    }

    return { orderId: updated.orderId, status, timestamp };
  }

  /**
   * Format order details from DB row to API response shape
   */
  _formatOrderDetails(order: OrderRow): OrderDetails {
    let actualDurationMins = null;
    if (order.actualPickupTime && order.actualDeliveryTime) {
      const pickupTime = new Date(order.actualPickupTime).getTime();
      const deliveryTime = new Date(order.actualDeliveryTime).getTime();
      actualDurationMins = Math.round(
        (deliveryTime - pickupTime) / (1000 * 60),
      );
    } else if (order.actualPickupTime && !order.actualDeliveryTime) {
      const pickupTime = new Date(order.actualPickupTime).getTime();
      actualDurationMins = Math.round((Date.now() - pickupTime) / (1000 * 60));
    }

    const weightTierDisplay =
      order.weightTierName ||
      (order.weightTierMin != null && order.weightTierMax != null
        ? `${order.weightTierMin}-${order.weightTierMax} kg`
        : null);

    return {
      orderId: order.orderId,
      orderUuid: order.orderUuid,
      orderNumber: order.orderNumber,

      status: order.statusName,
      statusId: order.statusId!,

      deliveryTypeId: order.deliveryTypeId!,
      deliveryTypeDisplay: order.deliveryTypeDisplay,
      vehicleCategoryId: order.vehicleCategoryId!,
      vehicleCategoryDisplay: order.vehicleCategoryDisplay,

      packageDescription: order.packageDescription,
      packageTypeId: order.packageTypeId || null,
      weightTierId: order.weightTierId,
      weightTierDisplay,
      specialInstructions: order.specialInstructions,

      estimatedDistanceKm: order.estimatedDistanceKm
        ? Number(order.estimatedDistanceKm)
        : null,
      actualDistanceKm: order.actualDistanceKm
        ? Number(order.actualDistanceKm)
        : null,
      actualDurationMins,

      createdAt: order.createdAt
        ? (order.createdAt as Date).toISOString()
        : new Date().toISOString(),

      timeline: {
        confirmedAt: order.createdAt
          ? (order.createdAt as Date).toISOString()
          : new Date().toISOString(),
        assignedAt: order.acceptedAt
          ? (order.acceptedAt as Date).toISOString()
          : undefined,
        pickedUpAt: order.pickedUpAt
          ? (order.pickedUpAt as Date).toISOString()
          : undefined,
        deliveredAt: order.deliveredAt
          ? (order.deliveredAt as Date).toISOString()
          : undefined,
        cancelledAt: order.cancelledAt
          ? (order.cancelledAt as Date).toISOString()
          : undefined,
      },

      pickup: {
        locationId: order.pickupLocationId,
        address: order.pickupAddress || "",
        building: order.pickupBuilding,
        floor: order.pickupFloor,
        flat: order.pickupFlat,
        landmark: order.pickupLandmark,
        city: order.pickupCity ?? undefined,
        state: order.pickupState ?? undefined,
        postalCode: order.pickupPostalCode ?? undefined,
        latitude: Number(order.pickupLatitude),
        longitude: Number(order.pickupLongitude),
        contactName: order.pickupContactName ?? undefined,
        contactPhone: order.pickupContactPhone ?? undefined,
      },

      delivery: {
        locationId: order.deliveryLocationId,
        address: order.deliveryAddress || "",
        building: order.deliveryBuilding,
        floor: order.deliveryFloor,
        flat: order.deliveryFlat,
        landmark: order.deliveryLandmark,
        city: order.deliveryCity ?? undefined,
        state: order.deliveryState ?? undefined,
        postalCode: order.deliveryPostalCode ?? undefined,
        latitude: Number(order.deliveryLatitude),
        longitude: Number(order.deliveryLongitude),
        contactName: order.deliveryContactName ?? undefined,
        contactPhone: order.deliveryContactPhone ?? undefined,
      },

      fareBreakdown: {
        basePrice: Number(order.basePrice),
        distanceKm: order.estimatedDistanceKm
          ? Number(order.estimatedDistanceKm)
          : 0,
        distancePrice: Number(order.distancePrice),
        weightSurcharge: Number(order.weightSurcharge),
        platformFee: Number(order.platformFee || 0),
        specialHandlingFee: Number(order.specialHandlingFee || 0),
        gstAmount: Number(order.gstAmount || 0),
        subtotalBeforeTax: Number(order.subtotalBeforeTax || order.totalPrice),
        totalPrice: Number(order.totalPrice),
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
