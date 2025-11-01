// services/backend/src/modules/orders/orders.service.ts
import logger from "../../config/logger";
import {
  AppError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "../../utils/error.util";
import ordersRepository from "./orders.repository";

interface FareData {
  deliveryTypeId: number;
  distanceKm: number;
  weightKg?: number;
}

interface OrderData {
  deliveryTypeId: number;
  paymentMethodId: number;
  pickup: {
    addressId: number;
    address: string;
    latitude: number;
    longitude: number;
    city: string;
    state: string;
    postalCode: string;
    landmark?: string;
    building?: string;
    floor?: string;
    flatNumber?: string;
    contactName?: string;
    contactPhone?: string;
  };
  delivery: {
    addressId: number;
    address: string;
    latitude: number;
    longitude: number;
    city: string;
    state: string;
    postalCode: string;
    landmark?: string;
    building?: string;
    floor?: string;
    flatNumber?: string;
    contactName?: string;
    contactPhone?: string;
  };
  estimatedDistanceKm: number;
  estimatedDurationMin?: number;
  packageDescription?: string;
  weightKg?: number;
  packageWeightKg?: number;
  packageDimensions?: string;
  scheduledPickupTime?: string;
  specialInstructions?: string;
}

interface Location {
  addressId?: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  postalCode?: string;
  contactName?: string;
  contactPhone?: string;
}

class OrdersService {
  /**
   * Calculate fare estimate
   */
  async calculateFare(fareData: FareData): Promise<any> {
    try {
      const { deliveryTypeId, distanceKm, weightKg } = fareData;

      // Validate inputs
      if (!deliveryTypeId || !distanceKm) {
        throw new ValidationError("Delivery type and distance are required");
      }

      if (distanceKm <= 0) {
        throw new ValidationError("Distance must be greater than 0");
      }

      const fareResult = await ordersRepository.calculateFare(
        deliveryTypeId,
        distanceKm,
        weightKg || 0,
      );

      if (!fareResult.success) {
        throw new AppError(fareResult.error, 400);
      }

      return fareResult.fare_breakdown;
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
  async createOrder(clientId: number, orderData: OrderData): Promise<any> {
    try {
      // Validate required fields
      const requiredFields = [
        "deliveryTypeId",
        "paymentMethodId",
        "pickup",
        "delivery",
        "estimatedDistanceKm",
      ];

      const missingFields = requiredFields.filter(
        (field) => !(orderData as any)[field],
      );

      if (missingFields.length > 0) {
        throw new ValidationError(
          `Missing required fields: ${missingFields.join(", ")}`,
        );
      }

      // Validate pickup and delivery locations
      const validateLocation = (location: any, type: string) => {
        const required = [
          "addressId",
          "address",
          "latitude",
          "longitude",
          "city",
          "state",
          "postalCode",
          "contactName",
          "contactPhone",
        ];
        const missing = required.filter((field: string) => !location[field]);
        if (missing.length > 0) {
          throw new ValidationError(
            `Missing ${type} location fields: ${missing.join(", ")}`,
          );
        }
      };

      validateLocation(orderData.pickup, "pickup");
      validateLocation(orderData.delivery, "delivery");

      // Prepare order data for stored function
      const orderPayload = {
        client_id: clientId,
        delivery_type_id: orderData.deliveryTypeId,
        payment_method_id: orderData.paymentMethodId,
        pickup: {
          address: orderData.pickup.address,
          latitude: orderData.pickup.latitude,
          longitude: orderData.pickup.longitude,
          city: orderData.pickup.city,
          state: orderData.pickup.state,
          postal_code: orderData.pickup.postalCode,
          landmark: orderData.pickup.landmark || null,
          building: orderData.pickup.building || null,
          floor: orderData.pickup.floor || null,
          flat_number: orderData.pickup.flatNumber || null,
          contact_name: orderData.pickup.contactName,
          contact_phone: orderData.pickup.contactPhone,
        },
        delivery: {
          address: orderData.delivery.address,
          latitude: orderData.delivery.latitude,
          longitude: orderData.delivery.longitude,
          city: orderData.delivery.city,
          state: orderData.delivery.state,
          postal_code: orderData.delivery.postalCode,
          landmark: orderData.delivery.landmark || null,
          building: orderData.delivery.building || null,
          floor: orderData.delivery.floor || null,
          flat_number: orderData.delivery.flatNumber || null,
          contact_name: orderData.delivery.contactName,
          contact_phone: orderData.delivery.contactPhone,
        },
        package_description: orderData.packageDescription || null,
        package_weight_kg: orderData.packageWeightKg || 0,
        package_dimensions: orderData.packageDimensions || null,
        special_instructions: orderData.specialInstructions || null,
        estimated_distance_km: orderData.estimatedDistanceKm,
        scheduled_pickup_time: orderData.scheduledPickupTime || null,
      };

      const result = await ordersRepository.createOrder(orderPayload);

      if (!result.success) {
        throw new AppError(result.error, 400);
      }

      return result.order;
    } catch (error) {
      logger.error({
        msg: "Error creating order",
        error: (error as Error).message,
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
  ): Promise<any> {
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
  ): Promise<any> {
    try {
      const offset = (page - 1) * limit;

      const { orders, total } = await ordersRepository.findByClient(
        clientId,
        limit,
        offset,
      );

      return {
        orders: orders.map((order) => ({
          orderId: order.order_id,
          orderUuid: order.order_uuid,
          orderNumber: order.order_number,
          status: order.status_name,
          deliveryType: order.delivery_type,
          packageDescription: order.package_description,
          totalPrice: parseFloat(order.total_price),
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
        })),
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
  ): Promise<any[]> {
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
        deliveryType: order.delivery_type,
        totalPrice: parseFloat(order.total_price),
        packageDescription: order.package_description,
        packageWeightKg: parseFloat(order.package_weight_kg),
        createdAt: order.created_at,
        pickup: {
          address: order.pickup_address,
          landmark: order.pickup_landmark,
          latitude: parseFloat(order.pickup_latitude),
          longitude: parseFloat(order.pickup_longitude),
        },
        delivery: {
          address: order.delivery_address,
        },
        distanceFromCourierKm: parseFloat(order.distance_from_courier_km),
        estimatedDistanceKm: parseFloat(order.estimated_distance_km),
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
  async acceptOrder(orderId: number, courierId: number): Promise<any> {
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
  ): Promise<any> {
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

      const result = await ordersRepository.updateOrderStatus(orderId, status);

      return {
        orderId: result.order_id,
        status,
        timestamp:
          status === "picked_up" ? result.picked_up_at : result.delivered_at,
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
  _formatOrderDetails(order: any): any {
    return {
      orderId: order.order_id,
      orderUuid: order.order_uuid,
      orderNumber: order.order_number,
      status: order.status_name,
      deliveryType: order.delivery_type,
      client: {
        name: order.client_name,
        phone: order.client_phone,
      },
      pickup: {
        locationId: order.pickup_location_id,
        address: order.pickup_address,
        building: order.pickup_building,
        floor: order.pickup_floor,
        flat: order.pickup_flat,
        landmark: order.pickup_landmark,
        city: order.pickup_city,
        state: order.pickup_state,
        postalCode: order.pickup_postal_code,
        latitude: parseFloat(order.pickup_latitude),
        longitude: parseFloat(order.pickup_longitude),
        contactName: order.pickup_contact_name,
        contactPhone: order.pickup_contact_phone,
      },
      delivery: {
        locationId: order.delivery_location_id,
        address: order.delivery_address,
        building: order.delivery_building,
        floor: order.delivery_floor,
        flat: order.delivery_flat,
        landmark: order.delivery_landmark,
        city: order.delivery_city,
        state: order.delivery_state,
        postalCode: order.delivery_postal_code,
        latitude: parseFloat(order.delivery_latitude),
        longitude: parseFloat(order.delivery_longitude),
        contactName: order.delivery_contact_name,
        contactPhone: order.delivery_contact_phone,
      },
      package: {
        description: order.package_description,
        weightKg: parseFloat(order.package_weight_kg),
        dimensions: order.package_dimensions,
        declaredValue: parseFloat(order.declared_value),
      },
      specialInstructions: order.special_instructions,
      pricing: {
        basePrice: parseFloat(order.base_price),
        distancePrice: parseFloat(order.distance_price),
        weightSurcharge: parseFloat(order.weight_surcharge),
        totalPrice: parseFloat(order.total_price),
      },
      paymentMethod: order.payment_method,
      courier: order.courier_id
        ? {
            id: order.courier_id,
            name: order.courier_name,
            phone: order.courier_phone,
            photo: order.courier_photo,
            assignmentStatus: order.assignment_status,
            assignedAt: order.assigned_at,
            acceptedAt: order.courier_accepted_at,
            currentLocation:
              order.courier_current_latitude && order.courier_current_longitude
                ? {
                    latitude: parseFloat(order.courier_current_latitude),
                    longitude: parseFloat(order.courier_current_longitude),
                  }
                : null,
          }
        : null,
      timestamps: {
        createdAt: order.created_at,
        acceptedAt: order.accepted_at,
        pickedUpAt: order.picked_up_at,
        deliveredAt: order.delivered_at,
        cancelledAt: order.cancelled_at,
      },
      cancellationReason: order.cancellation_reason,
    };
  }
}

export default new OrdersService();
