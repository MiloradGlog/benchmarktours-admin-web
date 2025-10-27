import React, { useRef, useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventApi, EventInput, EventDropArg, EventResizeArg, DateSelectArg, EventClickArg } from '@fullcalendar/core';

// FullCalendar CSS is handled by the library automatically in newer versions
import { Activity, ActivityType, CreateActivityData, Company } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Building2, Hotel, Utensils, Car, MapPin, Clock, MessageSquare } from 'lucide-react';
import { toDateTimeLocalValue, fromDateTimeLocalValue, utcToJSTString, jstDateToUTC } from '@/utils/time';

interface CalendarItineraryProps {
  activities: Activity[];
  companies: Company[];
  tourStartDate: string;
  tourEndDate: string;
  onActivityCreate: (activityData: CreateActivityData) => Promise<void>;
  onActivityUpdate: (activityId: number, activityData: Partial<CreateActivityData>) => Promise<void>;
  onActivityDelete: (activityId: number) => Promise<void>;
}

export const CalendarItinerary: React.FC<CalendarItineraryProps> = ({
  activities,
  companies,
  tourStartDate,
  tourEndDate,
  onActivityCreate,
  onActivityUpdate,
  onActivityDelete,
}) => {
  const calendarRef = useRef<FullCalendar>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date; end: Date } | null>(null);
  
  const [formData, setFormData] = useState({
    type: '' as ActivityType,
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location_details: '',
    company_id: '',
    survey_url: '',
    linked_activity_id: '',
  });

  // Convert activities to calendar events
  // Convert UTC times to JST strings for FullCalendar to display correctly
  const calendarEvents: EventInput[] = activities.map((activity) => ({
    id: activity.id.toString(),
    title: activity.title,
    start: utcToJSTString(activity.start_time),
    end: utcToJSTString(activity.end_time),
    backgroundColor: getActivityColor(activity.type),
    borderColor: getActivityColor(activity.type),
    extendedProps: {
      activity: activity,
      type: activity.type,
      description: activity.description,
      location_details: activity.location_details,
      company_name: activity.company_name,
      survey_url: activity.survey_url,
    },
  }));

  // Color coding for different activity types
  function getActivityColor(type: ActivityType): string {
    switch (type) {
      case 'CompanyVisit': return '#3b82f6'; // Blue
      case 'Hotel': return '#10b981'; // Green
      case 'Restaurant': return '#f59e0b'; // Yellow
      case 'Travel': return '#8b5cf6'; // Purple
      case 'Discussion': return '#ec4899'; // Pink
      default: return '#6b7280'; // Gray
    }
  }

  function getActivityIcon(type: ActivityType) {
    switch (type) {
      case 'CompanyVisit': return Building2;
      case 'Hotel': return Hotel;
      case 'Restaurant': return Utensils;
      case 'Travel': return Car;
      case 'Discussion': return MessageSquare;
      default: return Clock;
    }
  }

  // Handle date selection for creating new activities
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedDateRange({
      start: selectInfo.start,
      end: selectInfo.end,
    });
    setEditingActivity(null);
    setFormData({
      type: '' as ActivityType,
      title: '',
      description: '',
      start_time: jstDateToUTC(selectInfo.start),
      end_time: jstDateToUTC(selectInfo.end),
      location_details: '',
      company_id: '',
      survey_url: '',
      linked_activity_id: '',
    });
    setIsDialogOpen(true);

    // Clear the selection
    selectInfo.view.calendar.unselect();
  };

  // Handle event click for editing
  const handleEventClick = (clickInfo: EventClickArg) => {
    const activity = clickInfo.event.extendedProps.activity as Activity;
    setEditingActivity(activity);
    setSelectedDateRange(null);
    setFormData({
      type: activity.type,
      title: activity.title,
      description: activity.description || '',
      start_time: activity.start_time,
      end_time: activity.end_time,
      location_details: activity.location_details || '',
      company_id: activity.company_id?.toString() || '',
      survey_url: activity.survey_url || '',
      linked_activity_id: activity.linked_activity_id?.toString() || '',
    });
    setIsDialogOpen(true);
  };

  // Handle drag and drop
  const handleEventDrop = async (dropInfo: EventDropArg) => {
    const activityId = parseInt(dropInfo.event.id);
    const newStart = dropInfo.event.start;
    const newEnd = dropInfo.event.end;

    if (!newStart || !newEnd) return;

    try {
      await onActivityUpdate(activityId, {
        start_time: jstDateToUTC(newStart),
        end_time: jstDateToUTC(newEnd),
      });
    } catch (error) {
      console.error('Failed to update activity:', error);
      // Revert the event
      dropInfo.revert();
    }
  };

  // Handle resize
  const handleEventResize = async (resizeInfo: EventResizeArg) => {
    const activityId = parseInt(resizeInfo.event.id);
    const newStart = resizeInfo.event.start;
    const newEnd = resizeInfo.event.end;

    if (!newStart || !newEnd) return;

    try {
      await onActivityUpdate(activityId, {
        start_time: jstDateToUTC(newStart),
        end_time: jstDateToUTC(newEnd),
      });
    } catch (error) {
      console.error('Failed to update activity:', error);
      // Revert the event
      resizeInfo.revert();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const activityData: CreateActivityData = {
        ...formData,
        company_id: formData.company_id ? parseInt(formData.company_id) : undefined,
        linked_activity_id: formData.linked_activity_id ? parseInt(formData.linked_activity_id) : undefined,
      };

      if (editingActivity) {
        await onActivityUpdate(editingActivity.id, activityData);
      } else {
        await onActivityCreate(activityData);
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save activity:', error);
    }
  };

  const handleDelete = async () => {
    if (!editingActivity) return;
    
    if (!confirm('Are you sure you want to delete this activity?')) return;

    try {
      await onActivityDelete(editingActivity.id);
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to delete activity:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      type: '' as ActivityType,
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      location_details: '',
      company_id: '',
      survey_url: '',
      linked_activity_id: '',
    });
    setEditingActivity(null);
    setSelectedDateRange(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <Card>
        <CardContent className="p-6">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            initialView="timeGridWeek"
            validRange={{
              start: tourStartDate,
              end: tourEndDate,
            }}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            events={calendarEvents}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            height="auto"
            slotMinTime="06:00:00"
            slotMaxTime="24:00:00"
            slotDuration="00:30:00"
            eventDisplay="block"
            eventContent={(eventInfo) => {
              const Icon = getActivityIcon(eventInfo.event.extendedProps.type);
              return (
                <div className="flex items-center space-x-2 p-1 text-white text-sm">
                  <Icon className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{eventInfo.event.title}</span>
                </div>
              );
            }}
          />
        </CardContent>
      </Card>

      {/* Activity Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingActivity ? 'Edit Activity' : 'Create New Activity'}
            </DialogTitle>
            <DialogDescription>
              {editingActivity 
                ? 'Update the activity details below.' 
                : 'Fill in the details to create a new activity.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Activity Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as ActivityType })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CompanyVisit">Company Visit</SelectItem>
                  <SelectItem value="Discussion">Discussion</SelectItem>
                  <SelectItem value="Hotel">Hotel</SelectItem>
                  <SelectItem value="Restaurant">Restaurant</SelectItem>
                  <SelectItem value="Travel">Travel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type === 'CompanyVisit' && (
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Select
                  value={formData.company_id}
                  onValueChange={(value) => setFormData({ ...formData, company_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.type === 'Discussion' && (
              <div className="space-y-2">
                <Label htmlFor="linked_activity">Linked Activity (Optional)</Label>
                <Select
                  value={formData.linked_activity_id || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, linked_activity_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity to link (e.g., Company Visit)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Standalone)</SelectItem>
                    {activities
                      .filter(a => a.type === 'CompanyVisit')
                      .map((activity) => (
                        <SelectItem key={activity.id} value={activity.id.toString()}>
                          {activity.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Link this discussion to a company visit for Daily Discussions, or leave as None for Orientation/Wrap-up sessions.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time (JST) *</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={formData.start_time ? toDateTimeLocalValue(formData.start_time) : ''}
                  onChange={(e) => setFormData({ ...formData, start_time: fromDateTimeLocalValue(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">End Time (JST) *</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={formData.end_time ? toDateTimeLocalValue(formData.end_time) : ''}
                  onChange={(e) => setFormData({ ...formData, end_time: fromDateTimeLocalValue(e.target.value) })}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location_details">Location Details</Label>
              <Input
                id="location_details"
                value={formData.location_details}
                onChange={(e) => setFormData({ ...formData, location_details: e.target.value })}
                placeholder="Address, room details, etc."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="survey_url">Survey URL</Label>
              <Input
                id="survey_url"
                type="url"
                placeholder="https://forms.google.com/..."
                value={formData.survey_url}
                onChange={(e) => setFormData({ ...formData, survey_url: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                Optional link to external survey for this activity
              </p>
            </div>
            
            <div className="flex justify-between space-x-2">
              <div>
                {editingActivity && (
                  <Button type="button" variant="destructive" onClick={handleDelete}>
                    Delete
                  </Button>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingActivity ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};