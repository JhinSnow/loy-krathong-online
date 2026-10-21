// src/types/index.ts
export type UserType = 'student' | 'staff' | 'general';

export interface KrathongItem {
  id: string;
  user_type: UserType;
  owner_name: string;
  wish_message: string;
  base_type: string;
  flower_type: string;
  candle_color: string;
  created_at?: string;
  x?: number;
  y?: number;
  speed?: number;
  opacity?: number;
  age?: number;
  maxLife?: number;
  isMine?: boolean;
}

export interface EvaluationItem {
  id?: string;
  krathongId?: string;
  userType: UserType;
  rating: number;
  feedback?: string;
}

export interface StatsResponse {
  userStats: { user_type: string; count: number }[];
  statusStats: { status: string; count: number }[];
  ratingSummary: { total_reviews: number; average_rating: number } | null;
  ratingDistribution: { rating: number; count: number }[];
  recentFeedbacks: { user_type: string; rating: number; feedback: string; created_at: string }[];
  requireApproval: boolean;
}
