// services/backend/src/types/ratings.ts

export interface RatingRow {
  rating_id: number;
  order_id: number;
  driver_id: number;
  customer_id: number;
  rating: number;
  comment?: string | null;
  created_at: Date;
}
