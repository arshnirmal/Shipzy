// services/backend/src/modules/orders/orders.service.ts
import logger from "../../config/logger.js";
import {
  AppError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "../../utils/error.util.js";
import {
  validateOrThrow,
  validateCoordinates,
  validatePositiveInt,
} from "../../utils/validation.util.js";
import ordersRepository from "./orders.repository.js";

import type { CalculateFareRequest, CreateOrderRequest } from "./orders.zod.js";
import { CalculateFareRequestZ } from "./orders.zod.js";
import type { FareBreakdown, OrderAddress } from "../../schemas/common.zod.js";

type FareData = CalculateFareRequest;
export type OrderData = CreateOrderRequest;

type Location = OrderAddress;

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

// Use exported type for created-order DTO
type CreatedOrder = import("../../types/orders.js").CreatedOrder;
type OrderDetails = import("./orders.zod.js").OrderDetails;
type OrderListItem = import("./orders.zod.js").OrderListItem;

class OrdersService {
  /**
   * Calculate fare estimate using real-time distance from Mapbox
   */
  async calculateFare(fareData: FareData): Promise<FareBreakdown> {
    try {
      // Validate input using Zod schema
      const validatedData = validateOrThrow(
        CalculateFareRequestZ,
        fareData,
        "calculateFare",
      );

      const {
        deliveryTypeId,
        vehicleCategoryId,
        weightTierId,
        packageTypeId,
        pickup,
        drop,
      } = validatedData;

      // Validate coordinates
      validateCoordinates(pickup.latitude, pickup.longitude, "pickup location");
      validateCoordinates(drop.latitude, drop.longitude, "drop location");

      // Validate positive integers
      validatePositiveInt(deliveryTypeId, "delivery type ID");
      validatePositiveInt(vehicleCategoryId, "vehicle category ID");
      validatePositiveInt(weightTierId, "weight tier ID");

      // Lazy import addresses service to avoid circular dependencies
      const addressesService =
        await import("../addresses/addresses.service.js").then(
          (m) => m.default,
        );

      const estimatedDistanceKm = addressesService.calculateDistance(
        pickup.latitude,
        pickup.longitude,
        drop.latitude,
        drop.longitude,
      );

      if (estimatedDistanceKm <= 0.5) {
        throw new ValidationError("Distance must be greater than 0.5");
      }

      // Get distance from Mapbox Matrix API
      logger.info({
        msg: "Calculating distance using Mapbox Matrix API",
        deliveryTypeId,
        vehicleCategoryId,
        weightTierId,
        pickup,
        drop,
      });

      const distanceData = await addressesService.getDistanceMatrix(
        { lat: pickup.latitude, lng: pickup.longitude },
        { lat: drop.latitude, lng: drop.longitude },
      );

      const distanceKm = distanceData.distanceKm;

      logger.info({
        msg: "Distance calculation successful",
        distanceKm,
      });

      // Calculate fare using the distance, weight tier, and package type
      const fareResult = await ordersRepository.calculateFare(
        deliveryTypeId,
        vehicleCategoryId,
        distanceKm,
        weightTierId,
        packageTypeId ?? undefined,
      );

      if (!fareResult.success) {
        throw new AppError(fareResult.error || "Fare calculation failed", 400);
      }

      // Return the fare breakdown with camelCase keys
      return fareResult.fareBreakdown!;
    } catch (error) {
      logger.error({
        msg: "Error calculating fare",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Create new order
   */
  async createOrder(
    clientId: number,
    orderData: OrderData,
  ): Promise<CreatedOrder> {
    const operationId = `create-order-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    try {
      logger.info({
        msg: "[CREATE-ORDER-SERVICE] Starting order creation",
        operationId,
        clientId,
        timestamp: new Date().toISOString(),
      });

      // Step 1: Validate required fields
      logger.info({
        msg: "[CREATE-ORDER-SERVICE] Step 1: Validating required fields",
        operationId,
        clientId,
      });

      const requiredFields = [
        "deliveryTypeId",
        "vehicleCategoryId",
        "weightTierId",
        "paymentMethodId",
        "pickup",
        "delivery",
        "fareBreakdown",
      ];

      const missingFields = requiredFields.filter(
        (field) => !(orderData as any)[field],
      );

      if (missingFields.length > 0) {
        logger.error({
          msg: "[CREATE-ORDER-SERVICE] Validation failed: Missing required fields",
          operationId,
          clientId,
          missingFields,
        });
        throw new ValidationError(
          `Missing required fields: ${missingFields.join(", ")}`,
        );
      }

      logger.info({
        msg: "[CREATE-ORDER-SERVICE] Required fields validation passed",
        operationId,
        clientId,
      });

      // Step 2: Validate pickup and delivery locations
      logger.info({
        msg: "[CREATE-ORDER-SERVICE] Step 2: Validating pickup and delivery locations",
        operationId,
        clientId,
        pickup: {
          address: orderData.pickup.fullAddress,
          city: orderData.pickup.city,
          latitude: orderData.pickup.latitude,
          longitude: orderData.pickup.longitude,
        },
        delivery: {
          address: orderData.delivery.fullAddress,
          city: orderData.delivery.city,
          latitude: orderData.delivery.latitude,
          longitude: orderData.delivery.longitude,
        },
      });

      const validateLocation = (location: Location, type: string) => {
        const required = [
          "address",
          "latitude",
          "longitude",
          "city",
          "state",
          "postalCode",
          "contactName",
          "contactPhone",
        ];
        const missing = required.filter(
          (field: string) => !(location as any)[field],
        );
        if (missing.length > 0) {
          logger.error({
            msg: `[CREATE-ORDER-SERVICE] ${type} location validation failed`,
            operationId,
            clientId,
            locationType: type,
            missingFields: missing,
          });
          throw new ValidationError(
            `Missing ${type} location fields: ${missing.join(", ")}`,
          );
        }
      };

      validateLocation(orderData.pickup, "pickup");
      validateLocation(orderData.delivery, "delivery");

      logger.info({
        msg: "[CREATE-ORDER-SERVICE] Location validation passed",
        operationId,
        clientId,
      });

      // Step 3: Validate fare breakdown - prevent price tampering
      logger.info({
        msg: "[CREATE-ORDER-SERVICE] Step 3: Validating fare breakdown",
        operationId,
        clientId,
        providedFare: orderData.fareBreakdown,
      });

      const serverCalculatedFare = await ordersRepository.calculateFare(
        orderData.deliveryTypeId,
        orderData.vehicleCategoryId,
        orderData.fareBreakdown.distanceKm,
        orderData.weightTierId,
      );

      logger.info({
        msg: "[CREATE-ORDER-SERVICE] Server fare calculation completed",
        operationId,
        clientId,
        serverCalculatedFare: serverCalculatedFare.fareBreakdown,
      });

      if (!serverCalculatedFare.success) {
        logger.error({
          msg: "[CREATE-ORDER-SERVICE] Invalid pricing parameters",
          operationId,
          clientId,
          error: serverCalculatedFare.error,
        });
        throw new ValidationError("Invalid pricing parameters");
      }

      const serverPricing = serverCalculatedFare.fareBreakdown!; // asserted - success checked above

      // Allow small tolerance for rounding differences
      const tolerance = 0.01;
      const priceDifference = Math.abs(
        serverPricing.totalPrice - orderData.fareBreakdown.totalPrice,
      );

      if (priceDifference > tolerance) {
        logger.warn({
          msg: "[CREATE-ORDER-SERVICE] Pricing mismatch detected",
          operationId,
          clientId,
          serverPrice: serverPricing.totalPrice,
          clientPrice: orderData.fareBreakdown.totalPrice,
          difference:
            serverPricing.totalPrice - orderData.fareBreakdown.totalPrice,
          tolerance,
          priceDifference,
        });
        throw new ValidationError("Pricing mismatch - please recalculate fare");
      }

      logger.info({
        msg: "[CREATE-ORDER-SERVICE] Fare validation successful",
        operationId,
        clientId,
        totalPrice: orderData.fareBreakdown.totalPrice,
        basePrice: orderData.fareBreakdown.basePrice,
        distanceKm: orderData.fareBreakdown.distanceKm,
        distancePrice: orderData.fareBreakdown.distancePrice,
        weightSurcharge: orderData.fareBreakdown.weightSurcharge,
      });

      // Step 4: Prepare order data for stored function
      logger.info({
        msg: "[CREATE-ORDER-SERVICE] Step 4: Preparing order payload",
        operationId,
        clientId,
      });

      const orderPayload = {
        clientId: clientId,
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

      logger.info({
        msg: "[CREATE-ORDER-SERVICE] Order payload prepared",
        operationId,
        clientId,
        payload: orderPayload,
      });

      // Step 5: Call repository to create order in database
      logger.info({
        msg: "[CREATE-ORDER-SERVICE] Step 5: Creating order in database",
        operationId,
        clientId,
      });

      const result = await ordersRepository.createOrder(orderPayload);

      logger.info({
        msg: "[CREATE-ORDER-SERVICE] Repository response received",
        operationId,
        clientId,
        success: result.success,
        hasOrder: !!result.order,
      });

      if (!result.success) {
        logger.error({
          msg: "[CREATE-ORDER-SERVICE] Order creation failed in repository",
          operationId,
          clientId,
          error: result.error,
        });
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

      // Step 6: Return successful result
      logger.info({
        msg: "[CREATE-ORDER-SERVICE] Order created successfully",
        operationId,
        clientId,
        orderId: orderRow.orderId,
        orderUuid: orderRow.orderUuid,
        orderNumber: orderRow.orderNumber,
        totalPrice: orderRow.pricing?.totalPrice,
        response: orderRow,
      });

      // Normalize DB response -> API DTO (map `pricing` -> `fareBreakdown`)
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

      const createdOrder: CreatedOrder = {
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

      return createdOrder;
    } catch (error) {
      logger.error({
        msg: "[CREATE-ORDER-SERVICE] Error creating order",
        operationId: operationId,
        clientId,
        error: (error as Error).message,
        errorStack: (error as Error).stack,
        errorType: (error as Error).constructor.name,
      });
      throw error;
    }
  }

  /**
   * Get order details
   */
  async getOrderById(
    orderId: number,
    userId: number,
    userRole: string,
  ): Promise<OrderDetails> {
    try {
      const order = await ordersRepository.findById(orderId);

      if (!order) {
        throw new NotFoundError("Order not found");
      }

      // Authorization check
      if (userRole === "client" && order.clientId !== userId) {
        throw new AuthorizationError("You can only view your own orders");
      }

      if (
        userRole === "courier" &&
        order.courierId !== userId &&
        order.courierId !== null
      ) {
        throw new AuthorizationError(
          "You can only view orders assigned to you",
        );
      }

      return this._formatOrderDetails(order);
    } catch (error) {
      logger.error({
        msg: "Error getting order details",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * List user's orders
   */
  async listOrders(
    clientId: number,
    page: number = 1,
    limit: number = 20,
    status?: string,
  ): Promise<{
    orders: import("./orders.zod.js").OrderListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const offset = (page - 1) * limit;

      const { orders, total } = await ordersRepository.findByClient(
        clientId,
        limit,
        offset,
        status,
      );

      return {
        orders: orders.map((order) => {
          // Compute actual delivery duration (only if picked up)
          let actualDurationMins = null;
          if (order.actualPickupTime && order.actualDeliveryTime) {
            const pickupTime = new Date(order.actualPickupTime).getTime();
            const deliveryTime = new Date(order.actualDeliveryTime).getTime();
            actualDurationMins = Math.round(
              (deliveryTime - pickupTime) / (1000 * 60),
            );
          } else if (order.actualPickupTime && !order.actualDeliveryTime) {
            // Order in progress - show elapsed time since pickup
            const pickupTime = new Date(order.actualPickupTime).getTime();
            actualDurationMins = Math.round(
              (Date.now() - pickupTime) / (1000 * 60),
            );
          }

          // Compute status-specific timestamp for "X mins ago" display
          let statusTimestamp = order.createdAt;
          if (order.deliveredAt) statusTimestamp = order.deliveredAt;
          else if (order.pickedUpAt) statusTimestamp = order.pickedUpAt;
          else if (order.acceptedAt) statusTimestamp = order.acceptedAt;

          // Format weight tier display (e.g., "1-5 kg", "5-10 kg")
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
            totalPrice: Number.parseFloat(order.totalPrice),
            createdAt: order.createdAt,
            pickup: {
              address: order.pickupAddress,
            },
            delivery: {
              address: order.deliveryAddress,
            },
            courier: order.courierId
              ? {
                  name: order.courierName,
                  photo: order.courierPhoto,
                }
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
    } catch (error) {
      logger.error({
        msg: "Error listing orders",
        error: (error as Error).message,
      });
      throw error;
    }
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
    try {
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
        createdAt: (order.createdAt as Date).toISOString(), // Ensure date to string
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
          specialHandlingFee: Number.parseFloat(
            order.specialHandlingFee || "0",
          ),
          gstAmount: Number.parseFloat(order.gstAmount || "0"),
          totalPrice: Number.parseFloat(order.totalPrice || "0"),
          subtotalBeforeTax: Number.parseFloat(order.subtotalBeforeTax || "0"),
        },
      }));
    } catch (error) {
      logger.error({
        msg: "Error getting available orders",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(
    orderId: number,
    userId: number,
    userRole: string,
    cancellationReason: string,
  ): Promise<any> {
    try {
      // Get order details for authorization
      const order = await ordersRepository.findById(orderId);

      if (!order) {
        throw new NotFoundError("Order not found");
      }

      // Authorization check
      if (userRole === "client" && order.clientId !== userId) {
        throw new AuthorizationError("You can only cancel your own orders");
      }

      // Check if order can be cancelled
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
    } catch (error) {
      logger.error({
        msg: "Error cancelling order",
        error: (error as Error).message,
      });
      throw error;
    }
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
    try {
      // Get order details
      const order = await ordersRepository.findById(orderId);

      if (!order) {
        throw new NotFoundError("Order not found");
      }

      // Check if order is still pending
      if (order.statusName !== "pending") {
        throw new ValidationError(
          `Order cannot be accepted in ${order.statusName} status`,
        );
      }

      // Check if already assigned to someone else
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
    } catch (error) {
      logger.error({
        msg: "Error accepting order",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: number,
    status: string,
    courierId: number,
  ): Promise<{ orderId: number; status: string; timestamp: Date }> {
    try {
      // Validate status
      const validStatuses = ["picked_up", "delivered"];
      if (!validStatuses.includes(status)) {
        throw new ValidationError(`Invalid status: ${status}`);
      }

      // Get order details for authorization
      const order = await ordersRepository.findById(orderId);

      if (!order) {
        throw new NotFoundError("Order not found");
      }

      // Check if courier is assigned to this order
      if (order.courierId !== courierId) {
        throw new AuthorizationError(
          "You can only update orders assigned to you",
        );
      }

      // Validate status transition
      if (status === "picked_up" && order.statusName !== "assigned") {
        throw new ValidationError(
          "Order must be in assigned status to be picked up",
        );
      }

      if (status === "delivered" && order.statusName !== "picked_up") {
        throw new ValidationError("Order must be picked up before delivery");
      }

      const updated = await ordersRepository.updateOrderStatus(orderId, status);
      if (!updated) {
        throw new NotFoundError("Order not found or update failed");
      }

      const timestamp =
        status === "picked_up" ? updated.pickedUpAt : updated.deliveredAt;
      if (!timestamp) {
        throw new AppError("Status timestamp missing after update", 500);
      }

      return {
        orderId: updated.orderId,
        status,
        timestamp,
      };
    } catch (error) {
      logger.error({
        msg: "Error updating order status",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Format order details
   */
  _formatOrderDetails(order: OrderRow): OrderDetails {
    // Compute actual delivery duration (only if picked up)
    let actualDurationMins = null;
    if (order.actualPickupTime && order.actualDeliveryTime) {
      const pickupTime = new Date(order.actualPickupTime).getTime();
      const deliveryTime = new Date(order.actualDeliveryTime).getTime();
      actualDurationMins = Math.round(
        (deliveryTime - pickupTime) / (1000 * 60),
      );
    } else if (order.actualPickupTime && !order.actualDeliveryTime) {
      // Order in progress - show elapsed time since pickup
      const pickupTime = new Date(order.actualPickupTime).getTime();
      actualDurationMins = Math.round((Date.now() - pickupTime) / (1000 * 60));
    }

    // Compute status-specific timestamp for "X mins ago" display
    let statusTimestamp = order.createdAt;
    if (order.deliveredAt) statusTimestamp = order.deliveredAt;
    else if (order.pickedUpAt) statusTimestamp = order.pickedUpAt;
    else if (order.acceptedAt) statusTimestamp = order.acceptedAt;

    // Format weight tier display (e.g., "1-5 kg", "5-10 kg")
    const weightTierDisplay =
      order.weightTierName ||
      (order.weightTierMin != null && order.weightTierMax != null
        ? `${order.weightTierMin}-${order.weightTierMax} kg`
        : null);

    return {
      // Base identifiers
      orderId: order.orderId,
      orderUuid: order.orderUuid,
      orderNumber: order.orderNumber,

      // Status fields
      status: order.statusName,
      statusId: order.statusId!,

      // Delivery configuration
      deliveryTypeId: order.deliveryTypeId!,
      deliveryTypeDisplay: order.deliveryTypeDisplay,
      vehicleCategoryId: order.vehicleCategoryId!,
      vehicleCategoryDisplay: order.vehicleCategoryDisplay,

      // Package details
      packageDescription: order.packageDescription,
      packageTypeId: order.packageTypeId || null,
      weightTierId: order.weightTierId,
      weightTierDisplay,
      specialInstructions: order.specialInstructions,

      // Distance and duration
      estimatedDistanceKm: order.estimatedDistanceKm
        ? Number(order.estimatedDistanceKm)
        : null,
      actualDistanceKm: order.actualDistanceKm
        ? Number(order.actualDistanceKm)
        : null,
      actualDurationMins,

      // Timestamps
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

      // Pickup location
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

      // Delivery location
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

      // Payment & Pricing
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

      // Courier details
      courier: order.courierId
        ? {
            userId: order.courierId,
            name: order.courierName || undefined,
            phone: order.courierPhone || undefined,
            profilePictureUrl: order.courierPhoto || undefined,
          }
        : null,
    };
  }
}

export default new OrdersService();
