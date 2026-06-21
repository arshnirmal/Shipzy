import logger from "../../config/logger.js";
import driversRepository from "../drivers/drivers.repository.js";
import fcmService from "../../services/fcm.service.js";

class OrderDispatchService {
  /** Notify online, idle couriers within radius about an order now ready for pickup. */
  async broadcastNewOrder(params: {
    orderId: number;
    orderNumber: string;
    pickupLat: number;
    pickupLng: number;
    totalPrice: number;
  }): Promise<void> {
    try {
      const courierIds = await driversRepository.findNearbyCouriers(
        params.pickupLat,
        params.pickupLng,
        10,
        25,
      );
      if (courierIds.length === 0) return;
      await fcmService.sendToUsers(courierIds, {
        title: "New delivery nearby",
        body: `₹${params.totalPrice} · Tap to view pickup`,
        data: {
          type: "order.available",
          orderId: String(params.orderId),
          orderNumber: params.orderNumber,
        },
      });
    } catch (error) {
      logger.warn({
        msg: "Error broadcasting new order to nearby couriers",
        error: (error as Error).message,
      });
    }
  }
}

export default new OrderDispatchService();
