import api from './api';
import { ActivityReview, ActivityReviewStats } from '../types/api';

export const reviewService = {
  // Get all reviews for an activity
  getActivityReviews: async (activityId: number): Promise<ActivityReview[]> => {
    const response = await api.get(`/activities/${activityId}/reviews`);
    return response.data;
  },

  // Get review statistics for an activity
  getActivityReviewStats: async (activityId: number): Promise<ActivityReviewStats> => {
    const response = await api.get(`/activities/${activityId}/reviews/stats`);
    return response.data;
  },

  // Get all reviews for a tour
  getTourReviews: async (tourId: number): Promise<ActivityReview[]> => {
    const response = await api.get(`/tours/${tourId}/reviews`);
    return response.data;
  },

  // Get review statistics for a tour
  getTourReviewStats: async (tourId: number): Promise<{ activities: ActivityReviewStats[], overall: { average_rating: number, total_reviews: number } }> => {
    const response = await api.get(`/tours/${tourId}/reviews/stats`);
    return response.data;
  },
};