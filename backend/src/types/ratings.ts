// services/backend/src/types/ratings.ts

export interface RatingRow {
  ratingId: number;
  orderId: number;
  driverId: number;
  customerId: number;
  rating: number;
  comment?: string | null;
  createdAt: Date;
  orderNumber?: string;
  deliveredAt?: Date | null;
}
