import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { tourService } from '../services/tourService';
import { reviewService } from '../services/reviewService';
import { Tour, ActivityReview, ActivityReviewStats } from '../types/api';
import { formatDateTimeJST } from '../utils/time';

interface StarRatingProps {
  rating: number;
  size?: number;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, size = 16 }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span
        key={i}
        style={{
          color: i <= rating ? '#FFD700' : '#DDD',
          fontSize: `${size}px`,
          marginRight: '2px',
        }}
      >
        ★
      </span>
    );
  }
  return <div>{stars}</div>;
};

interface RatingDistributionProps {
  distribution: { [key: number]: number };
  totalReviews: number;
}

const RatingDistribution: React.FC<RatingDistributionProps> = ({
  distribution,
  totalReviews,
}) => {
  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((rating) => {
        const count = distribution[rating] || 0;
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
        
        return (
          <div key={rating} className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 w-12">
              <span className="text-sm">{rating}</span>
              <span className="text-yellow-500">★</span>
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-sm text-gray-600 w-8">{count}</span>
          </div>
        );
      })}
    </div>
  );
};

export const ReviewsPage: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [selectedTourId, setSelectedTourId] = useState<number | null>(null);
  const [reviews, setReviews] = useState<ActivityReview[]>([]);
  const [tourStats, setTourStats] = useState<{ activities: ActivityReviewStats[], overall: { average_rating: number, total_reviews: number } } | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'reviews'>('overview');

  // Load tours on component mount
  useEffect(() => {
    const loadTours = async () => {
      try {
        const toursData = await tourService.getAll();
        setTours(toursData.tours);
        if (toursData.tours.length > 0) {
          setSelectedTourId(toursData.tours[0].id);
        }
      } catch (error) {
        console.error('Error loading tours:', error);
      }
    };
    loadTours();
  }, []);

  // Load review data when tour is selected
  useEffect(() => {
    if (selectedTourId) {
      loadReviewData();
    }
  }, [selectedTourId]);

  const loadReviewData = async () => {
    if (!selectedTourId) return;

    setLoading(true);
    try {
      const [reviewsData, statsData] = await Promise.all([
        reviewService.getTourReviews(selectedTourId),
        reviewService.getTourReviewStats(selectedTourId),
      ]);
      setReviews(reviewsData);
      setTourStats(statsData);
    } catch (error) {
      console.error('Error loading review data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return formatDateTimeJST(dateString);
  };

  const selectedTour = tours.find(tour => tour.id === selectedTourId);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reviews Dashboard</h1>
        <div className="flex items-center space-x-4">
          <Select
            value={selectedTourId?.toString() || ''}
            onValueChange={(value) => setSelectedTourId(parseInt(value))}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a tour" />
            </SelectTrigger>
            <SelectContent>
              {tours.map((tour) => (
                <SelectItem key={tour.id} value={tour.id.toString()}>
                  {tour.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'overview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('overview')}
            >
              Overview
            </Button>
            <Button
              variant={viewMode === 'reviews' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('reviews')}
            >
              Reviews
            </Button>
          </div>
        </div>
      </div>

      {selectedTour && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {selectedTour.name}
          </h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : (
            <>
              {viewMode === 'overview' && tourStats && (
                <div className="space-y-6">
                  {/* Overall Stats */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Overall Rating</h3>
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl font-bold text-gray-900">
                        {tourStats.overall.average_rating.toFixed(1)}
                      </div>
                      <StarRating rating={Math.round(tourStats.overall.average_rating)} size={24} />
                      <div className="text-gray-600">
                        ({tourStats.overall.total_reviews} review{tourStats.overall.total_reviews !== 1 ? 's' : ''})
                      </div>
                    </div>
                  </div>

                  {/* Activity Breakdown */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Ratings</h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {tourStats.activities.map((activity) => (
                        <Card key={activity.activity_id} className="p-4">
                          <h4 className="font-medium text-gray-900 mb-2">{activity.activity_title}</h4>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <StarRating rating={Math.round(activity.average_rating)} />
                              <span className="text-sm text-gray-600">
                                {activity.average_rating.toFixed(1)} ({activity.total_reviews})
                              </span>
                            </div>
                            <RatingDistribution 
                              distribution={activity.rating_distribution} 
                              totalReviews={activity.total_reviews}
                            />
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {viewMode === 'reviews' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Recent Reviews ({reviews.length})
                  </h3>
                  
                  {reviews.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-500">No reviews found for this tour.</div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <Card key={review.id} className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <StarRating rating={review.rating} />
                                <span className="text-sm text-gray-600">
                                  {formatDate(review.created_at)}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">
                                Activity: {review.activity_title}
                              </div>
                            </div>
                          </div>
                          
                          {review.comment && (
                            <div className="text-gray-700 mt-3">
                              "{review.comment}"
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {!selectedTour && tours.length === 0 && !loading && (
        <Card className="p-12">
          <div className="text-center text-gray-500">
            No tours found. Create a tour first to view reviews.
          </div>
        </Card>
      )}
    </div>
  );
};
