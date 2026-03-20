// services/backend/src/modules/orders/orders.service.ts
import logger from "../../config/logger.js";
import {
  AppError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "../../utils/error.util.js";
import { validateOrThrow, validateCoordinates, validatePositiveInt } from "../../utils/validation.util.js";
import ordersRepository from "./orders.repository.js";

import type { CalculateFare, CreateOrder } from "./orders.zod.js";
import { CalculateFareZ, CreateOrderRequestZ } from "./orders.zod.js";
import type { FareBreakdown, OrderAddress } from "../../schemas/common.zod.js";

type FareData = CalculateFare;
export type OrderData = CreateOrder;

type Location = OrderAddress;

// DB row shape for order queries (only fields used by _formatOrderDetails)
type OrderRow = {
  order_id: number;
  order_uuid: string;
  order_number: string;
  status_id?: number;
  status_name?: string;
  delivery_type_id?: number;
  delivery_type?: string;
  delivery_type_display?: string;
  vehicle_category_id?: number;
  vehicle_category_display?: string;
  package_description?: string | null;
  package_type_id?: number | null;
  weight_tier_id?: number | null;
  weight_tier_name?: string | null;
  weight_tier_min?: number | string | null;
  weight_tier_max?: number | string | null;
  estimated_distance_km?: number | string | null;
  actual_distance_km?: number | string | null;
  actual_pickup_time?: string | Date | null;
  actual_delivery_time?: string | Date | null;
  payment_method_id?: number;
  payment_method?: string;
  created_at?: Date;
  accepted_at?: Date | null;
  picked_up_at?: Date | null;
  delivered_at?: Date | null;
  cancelled_at?: Date | null;
  cancellation_reason?: string | null;
  pickup_location_id?: number;
  pickup_building?: string | null;
  pickup_floor?: string | null;
  pickup_flat?: string | null;
  pickup_address?: string | null;
  pickup_landmark?: string | null;
  pickup_city?: string | null;
  pickup_state?: string | null;
  pickup_postal_code?: string | null;
  pickup_latitude?: number | string | null;
  pickup_longitude?: number | string | null;
  pickup_contact_name?: string | null;
  pickup_contact_phone?: string | null;
  delivery_location_id?: number;
  delivery_building?: string | null;
  delivery_floor?: string | null;
  delivery_flat?: string | null;
  delivery_address?: string | null;
  delivery_landmark?: string | null;
  delivery_city?: string | null;
  delivery_state?: string | null;
  delivery_postal_code?: string | null;
  delivery_latitude?: number | string | null;
  delivery_longitude?: number | string | null;
  delivery_contact_name?: string | null;
  delivery_contact_phone?: string | null;
  base_price?: number | string | null;
  distance_price?: number | string | null;
  weight_surcharge?: number | string | null;
  platform_fee?: number | string | null;
  special_handling_fee?: number | string | null;
  gst_amount?: number | string | null;
  subtotal_before_tax?: number | string | null;
  total_price?: number | string | null;
  client_name?: string | null;
  client_phone?: string | null;
  special_instructions?: string | null;
  courier_id?: number | null;
  courier_name?: string | null;
  courier_phone?: string | null;
  courier_photo?: string | null;
  assignment_status?: string | null;
  assigned_at?: string | Date | null;
  courier_accepted_at?: string | Date | null;
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
      const validatedData = validateOrThrow(CalculateFareZ, fareData, "calculateFare");

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
      const addressesService = await import(
        "../addresses/addresses.service.js"
      ).then((m) => m.default);

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
      return fareResult.fare_breakdown!;
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
        serverCalculatedFare: serverCalculatedFare.fare_breakdown,
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

      const serverPricing = serverCalculatedFare.fare_breakdown!; // asserted - success checked above

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
      if (userRole === "client" && order.client_id !== userId) {
        throw new AuthorizationError("You can only view your own orders");
      }

      if (
        userRole === "courier" &&
        order.courier_id !== userId &&
        order.courier_id !== null
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
          if (order.actual_pickup_time && order.actual_delivery_time) {
            const pickupTime = new Date(order.actual_pickup_time).getTime();
            const deliveryTime = new Date(order.actual_delivery_time).getTime();
            actualDurationMins = Math.round(
              (deliveryTime - pickupTime) / (1000 * 60),
            );
          } else if (order.actual_pickup_time && !order.actual_delivery_time) {
            // Order in progress - show elapsed time since pickup
            const pickupTime = new Date(order.actual_pickup_time).getTime();
            actualDurationMins = Math.round(
              (Date.now() - pickupTime) / (1000 * 60),
            );
          }

          // Compute status-specific timestamp for "X mins ago" display
          let statusTimestamp = order.created_at;
          if (order.delivered_at) statusTimestamp = order.delivered_at;
          else if (order.picked_up_at) statusTimestamp = order.picked_up_at;
          else if (order.accepted_at) statusTimestamp = order.accepted_at;

          // Format weight tier display (e.g., "1-5 kg", "5-10 kg")
          const weightTierDisplay =
            order.weight_tier_name ||
            (order.weight_tier_min != null && order.weight_tier_max != null
              ? `${order.weight_tier_min}-${order.weight_tier_max} kg`
              : null);

          return {
            orderId: order.order_id,
            orderUuid: order.order_uuid,
            orderNumber: order.order_number,
            status: order.status_name,
            statusId: order.status_id,
            deliveryTypeId: order.delivery_type_id,
            deliveryTypeDisplay: order.delivery_type_display,
            vehicleCategoryId: order.vehicle_category_id,
            vehicleCategoryDisplay: order.vehicle_category_display,
            packageDescription: order.package_description,
            weightTierId: order.weight_tier_id,
            weightTierDisplay,
            estimatedDistanceKm: order.estimated_distance_km
              ? Number.parseFloat(order.estimated_distance_km)
              : null,
            actualDistanceKm: order.actual_distance_km
              ? Number.parseFloat(order.actual_distance_km)
              : null,
            actualDurationMins,
            totalPrice: Number.parseFloat(order.total_price),
            createdAt: order.created_at,
            pickup: {
              address: order.pickup_address,
            },
            delivery: {
              address: order.delivery_address,
            },
            courier: order.courier_id
              ? {
                  name: order.courier_name,
                  photo: order.courier_photo,
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
        orderId: order.order_id,
        orderUuid: order.order_uuid,
        orderNumber: order.order_number,
        deliveryTypeDisplay: order.delivery_type_display,
        vehicleCategoryDisplay: order.vehicle_category_display,
        createdAt: (order.created_at as Date).toISOString(), // Ensure date to string
        pickup: {
          address: order.pickup_address,
          landmark: order.pickup_landmark,
          city: order.pickup_city,
          coordinates: {
            latitude: Number.parseFloat(order.pickup_latitude),
            longitude: Number.parseFloat(order.pickup_longitude),
          },
        },
        delivery: {
          address: order.delivery_address,
          landmark: order.delivery_landmark,
          city: order.delivery_city,
          coordinates: {
            latitude: order.delivery_latitude
              ? Number.parseFloat(order.delivery_latitude)
              : 0,
            longitude: order.delivery_longitude
              ? Number.parseFloat(order.delivery_longitude)
              : 0,
          },
        },
        distanceFromDriverKm: Number.parseFloat(order.distance_from_courier_km),
        estimatedDistanceKm: Number.parseFloat(order.estimated_distance_km),
        fareBreakdown: {
          basePrice: Number.parseFloat(order.base_price || "0"),
          distanceKm: Number.parseFloat(order.estimated_distance_km || "0"),
          distancePrice: Number.parseFloat(order.distance_price || "0"),
          weightSurcharge: Number.parseFloat(order.weight_surcharge || "0"),
          platformFee: Number.parseFloat(order.platform_fee || "0"),
          specialHandlingFee: Number.parseFloat(
            order.special_handling_fee || "0",
          ),
          gstAmount: Number.parseFloat(order.gst_amount || "0"),
          totalPrice: Number.parseFloat(order.total_price || "0"),
          subtotalBeforeTax: Number.parseFloat(
            order.subtotal_before_tax || "0",
          ),
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
      if (userRole === "client" && order.client_id !== userId) {
        throw new AuthorizationError("You can only cancel your own orders");
      }

      // Check if order can be cancelled
      const nonCancellableStatuses = ["delivered", "cancelled"];
      if (nonCancellableStatuses.includes(order.status_name)) {
        throw new ValidationError(
          `Order cannot be cancelled in ${order.status_name} status`,
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
      if (order.status_name !== "pending") {
        throw new ValidationError(
          `Order cannot be accepted in ${order.status_name} status`,
        );
      }

      // Check if already assigned to someone else
      if (order.courier_id && order.courier_id !== courierId) {
        throw new ValidationError("Order already assigned to another driver");
      }

      const result = await ordersRepository.acceptOrder(orderId, courierId);

      return {
        assignmentId: result.assignment_id,
        orderId: result.order_id,
        courierId: result.courier_id,
        assignedAt: result.assigned_at,
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
      if (order.courier_id !== courierId) {
        throw new AuthorizationError(
          "You can only update orders assigned to you",
        );
      }

      // Validate status transition
      if (status === "picked_up" && order.status_name !== "assigned") {
        throw new ValidationError(
          "Order must be in assigned status to be picked up",
        );
      }

      if (status === "delivered" && order.status_name !== "picked_up") {
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
    if (order.actual_pickup_time && order.actual_delivery_time) {
      const pickupTime = new Date(order.actual_pickup_time).getTime();
      const deliveryTime = new Date(order.actual_delivery_time).getTime();
      actualDurationMins = Math.round(
        (deliveryTime - pickupTime) / (1000 * 60),
      );
    } else if (order.actual_pickup_time && !order.actual_delivery_time) {
      // Order in progress - show elapsed time since pickup
      const pickupTime = new Date(order.actual_pickup_time).getTime();
      actualDurationMins = Math.round((Date.now() - pickupTime) / (1000 * 60));
    }

    // Compute status-specific timestamp for "X mins ago" display
    let statusTimestamp = order.created_at;
    if (order.delivered_at) statusTimestamp = order.delivered_at;
    else if (order.picked_up_at) statusTimestamp = order.picked_up_at;
    else if (order.accepted_at) statusTimestamp = order.accepted_at;

    // Format weight tier display (e.g., "1-5 kg", "5-10 kg")
    const weightTierDisplay =
      order.weight_tier_name ||
      (order.weight_tier_min != null && order.weight_tier_max != null
        ? `${order.weight_tier_min}-${order.weight_tier_max} kg`
        : null);

    return {
      // Base identifiers
      orderId: order.order_id,
      orderUuid: order.order_uuid,
      orderNumber: order.order_number,

      // Status fields
      status: order.status_name,
      statusId: order.status_id!,

      // Delivery configuration
      deliveryTypeId: order.delivery_type_id!,
      deliveryTypeDisplay: order.delivery_type_display,
      vehicleCategoryId: order.vehicle_category_id!,
      vehicleCategoryDisplay: order.vehicle_category_display,

      // Package details
      packageDescription: order.package_description,
      packageTypeId: order.package_type_id || null,
      weightTierId: order.weight_tier_id,
      weightTierDisplay,
      specialInstructions: order.special_instructions,

      // Distance and duration
      estimatedDistanceKm: order.estimated_distance_km
        ? Number(order.estimated_distance_km)
        : null,
      actualDistanceKm: order.actual_distance_km
        ? Number(order.actual_distance_km)
        : null,
      actualDurationMins,

      // Timestamps
      createdAt: order.created_at
        ? (order.created_at as Date).toISOString()
        : new Date().toISOString(),

      timeline: {
        confirmedAt: order.created_at
          ? (order.created_at as Date).toISOString()
          : new Date().toISOString(),
        assignedAt: order.accepted_at
          ? (order.accepted_at as Date).toISOString()
          : undefined,
        pickedUpAt: order.picked_up_at
          ? (order.picked_up_at as Date).toISOString()
          : undefined,
        deliveredAt: order.delivered_at
          ? (order.delivered_at as Date).toISOString()
          : undefined,
        cancelledAt: order.cancelled_at
          ? (order.cancelled_at as Date).toISOString()
          : undefined,
      },

      // Pickup location
      pickup: {
        locationId: order.pickup_location_id,
        address: order.pickup_address || "",
        building: order.pickup_building,
        floor: order.pickup_floor,
        flat: order.pickup_flat,
        landmark: order.pickup_landmark,
        city: order.pickup_city ?? undefined,
        state: order.pickup_state ?? undefined,
        postalCode: order.pickup_postal_code ?? undefined,
        latitude: Number(order.pickup_latitude),
        longitude: Number(order.pickup_longitude),
        contactName: order.pickup_contact_name ?? undefined,
        contactPhone: order.pickup_contact_phone ?? undefined,
      },

      // Delivery location
      delivery: {
        locationId: order.delivery_location_id,
        address: order.delivery_address || "",
        building: order.delivery_building,
        floor: order.delivery_floor,
        flat: order.delivery_flat,
        landmark: order.delivery_landmark,
        city: order.delivery_city ?? undefined,
        state: order.delivery_state ?? undefined,
        postalCode: order.delivery_postal_code ?? undefined,
        latitude: Number(order.delivery_latitude),
        longitude: Number(order.delivery_longitude),
        contactName: order.delivery_contact_name ?? undefined,
        contactPhone: order.delivery_contact_phone ?? undefined,
      },

      // Payment & Pricing
      fareBreakdown: {
        basePrice: Number(order.base_price),
        distanceKm: order.estimated_distance_km
          ? Number(order.estimated_distance_km)
          : 0,
        distancePrice: Number(order.distance_price),
        weightSurcharge: Number(order.weight_surcharge),
        platformFee: Number(order.platform_fee || 0),
        specialHandlingFee: Number(order.special_handling_fee || 0),
        gstAmount: Number(order.gst_amount || 0),
        subtotalBeforeTax: Number(
          order.subtotal_before_tax || order.total_price,
        ),
        totalPrice: Number(order.total_price),
      },

      // Courier details
      courier: order.courier_id
        ? {
            userId: order.courier_id,
            name: order.courier_name || undefined,
            phone: order.courier_phone || undefined,
            profilePictureUrl: order.courier_photo || undefined,
          }
        : null,
    };
  }
}

export default new OrdersService();
