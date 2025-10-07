import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, List } from 'lucide-react';
import { tourService } from '@/services/tourService';
import { companyService } from '@/services/companyService';
import { Tour, Activity, Company, CreateActivityData } from '@/types/api';
import { CalendarItinerary } from '@/components/ui/calendar-itinerary';

export const TourItineraryPage: React.FC = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  useEffect(() => {
    if (tourId) {
      fetchTourData();
      fetchCompanies();
    }
  }, [tourId]);

  const fetchTourData = async () => {
    if (!tourId) return;
    
    try {
      const [tourResponse, activitiesResponse] = await Promise.all([
        tourService.getById(parseInt(tourId)),
        tourService.getActivities(parseInt(tourId))
      ]);
      
      setTour(tourResponse.tour);
      setActivities(activitiesResponse.activities);
    } catch (error) {
      console.error('Failed to fetch tour data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await companyService.getAll();
      setCompanies(response.companies);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  };

  const handleActivityCreate = async (activityData: CreateActivityData) => {
    if (!tourId) return;
    
    await tourService.createActivity(parseInt(tourId), activityData);
    fetchTourData(); // Refresh activities
  };

  const handleActivityUpdate = async (activityId: number, activityData: Partial<CreateActivityData>) => {
    if (!tourId) return;
    
    await tourService.updateActivity(parseInt(tourId), activityId, activityData);
    fetchTourData(); // Refresh activities
  };

  const handleActivityDelete = async (activityId: number) => {
    if (!tourId) return;
    
    await tourService.deleteActivity(parseInt(tourId), activityId);
    fetchTourData(); // Refresh activities
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!tour) {
    return <div>Tour not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to={`/tours/${tourId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tour Details
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{tour.name} - Itinerary</h1>
          <p className="text-gray-600">Manage activities and schedule for this tour</p>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendar View
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 mr-2" />
            List View
          </Button>
        </div>
      </div>

{viewMode === 'calendar' && (
        <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
          💡 <strong>Tip:</strong> Click and drag on the calendar to create new activities, drag existing activities to reschedule them
        </div>
      )}

      {viewMode === 'calendar' ? (
        <CalendarItinerary
          activities={activities}
          companies={companies}
          tourStartDate={tour.start_date}
          tourEndDate={tour.end_date}
          onActivityCreate={handleActivityCreate}
          onActivityUpdate={handleActivityUpdate}
          onActivityDelete={handleActivityDelete}
        />
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>List view is not implemented yet. Please use Calendar view.</p>
          <Button 
            onClick={() => setViewMode('calendar')} 
            className="mt-4"
          >
            Switch to Calendar View
          </Button>
        </div>
      )}

      {activities.length === 0 && viewMode === 'calendar' && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No activities yet</h3>
          <p className="mt-2 text-gray-500">Click and drag on the calendar to create your first activity!</p>
        </div>
      )}
    </div>
  );
};