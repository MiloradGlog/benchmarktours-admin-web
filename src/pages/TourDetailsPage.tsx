import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CalendarItinerary } from '@/components/ui/calendar-itinerary';
import { ArrowLeft, Calendar, Users, Palette, FileText, Plus, Trash2, Search, Download, Upload, X } from 'lucide-react';
import { tourService, userService } from '@/services/tourService';
import { companyService } from '@/services/companyService';
import { Tour, Activity, Company, CreateActivityData, User, TourParticipant, TourStatus } from '@/types/api';

export const TourDetailsPage: React.FC = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const navigate = useNavigate();

  const [tour, setTour] = useState<Tour | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [participants, setParticipants] = useState<TourParticipant[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'Draft' as TourStatus,
    survey_url: '',
  });

  const [themeMode, setThemeMode] = useState<'default' | 'custom'>('default');
  const [themePrimaryColor, setThemePrimaryColor] = useState('#497CED');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (tourId) {
      fetchAllData();
    }
  }, [tourId]);

  useEffect(() => {
    updateAvailableUsers();
  }, [allUsers, participants]);

  const fetchAllData = async () => {
    if (!tourId) return;

    try {
      const [tourResponse, activitiesResponse, companiesResponse, participantsResponse, usersResponse] = await Promise.all([
        tourService.getById(parseInt(tourId)),
        tourService.getActivities(parseInt(tourId)),
        companyService.getAll(),
        tourService.getParticipants(parseInt(tourId)),
        userService.getAll()
      ]);

      const tourData = tourResponse.tour;
      setTour(tourData);
      setActivities(activitiesResponse.activities);
      setCompanies(companiesResponse.companies);
      setParticipants(participantsResponse.participants);
      setAllUsers(usersResponse.users);

      setFormData({
        name: tourData.name,
        description: tourData.description || '',
        start_date: tourData.start_date.split('T')[0],
        end_date: tourData.end_date.split('T')[0],
        status: tourData.status,
        survey_url: tourData.survey_url || '',
      });

      if (tourData.theme_primary_color && tourData.theme_primary_color !== '#497CED') {
        setThemeMode('custom');
        setThemePrimaryColor(tourData.theme_primary_color);
      }
      if (tourData.theme_logo_url) {
        setLogoPreview(tourData.theme_logo_url);
      }
    } catch (error) {
      console.error('Failed to fetch tour data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateAvailableUsers = () => {
    const participantIds = new Set(participants.map(p => p.user_id));
    const available = allUsers.filter(user => !participantIds.has(user.id));
    setAvailableUsers(available);
  };

  const handleUpdateTour = async () => {
    if (!tourId) return;

    setIsSaving(true);
    try {
      const updateData: any = {
        ...formData,
        theme_primary_color: themeMode === 'custom' ? themePrimaryColor : '#497CED',
      };

      if (themeMode === 'default') {
        updateData.theme_logo_url = null;
      }

      await tourService.update(parseInt(tourId), updateData);

      if (themeMode === 'custom' && logoFile) {
        setIsUploading(true);
        try {
          await tourService.uploadLogo(parseInt(tourId), logoFile);
        } catch (error) {
          console.error('Failed to upload logo:', error);
          alert('Tour updated but logo upload failed. Please try uploading the logo again.');
        } finally {
          setIsUploading(false);
        }
      }

      await fetchAllData();
      alert('Tour updated successfully!');
    } catch (error) {
      console.error('Failed to update tour:', error);
      alert('Failed to update tour. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivityCreate = async (activityData: CreateActivityData) => {
    if (!tourId) return;
    await tourService.createActivity(parseInt(tourId), activityData);
    const activitiesResponse = await tourService.getActivities(parseInt(tourId));
    setActivities(activitiesResponse.activities);
  };

  const handleActivityUpdate = async (activityId: number, activityData: Partial<CreateActivityData>) => {
    if (!tourId) return;
    await tourService.updateActivity(parseInt(tourId), activityId, activityData);
    const activitiesResponse = await tourService.getActivities(parseInt(tourId));
    setActivities(activitiesResponse.activities);
  };

  const handleActivityDelete = async (activityId: number) => {
    if (!tourId) return;
    await tourService.deleteActivity(parseInt(tourId), activityId);
    const activitiesResponse = await tourService.getActivities(parseInt(tourId));
    setActivities(activitiesResponse.activities);
  };

  const handleAssignUser = async (userId: string) => {
    if (!tourId) return;

    try {
      await tourService.assignUser(parseInt(tourId), userId);
      const participantsResponse = await tourService.getParticipants(parseInt(tourId));
      setParticipants(participantsResponse.participants);
    } catch (error) {
      console.error('Failed to assign user:', error);
    }
  };

  const handleUnassignUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this participant from the tour?')) return;
    if (!tourId) return;

    try {
      await tourService.unassignUser(parseInt(tourId), userId);
      const participantsResponse = await tourService.getParticipants(parseInt(tourId));
      setParticipants(participantsResponse.participants);
    } catch (error) {
      console.error('Failed to unassign user:', error);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const exportToCSV = () => {
    if (!tour || participants.length === 0) {
      alert('No participants to export');
      return;
    }

    const headers = [
      'Tour Name',
      'Tour Description',
      'Tour Start Date',
      'Tour End Date',
      'Participant First Name',
      'Participant Last Name',
      'Participant Email',
      'Assignment Date',
      'Survey URL'
    ];

    const rows = participants.map(participant => [
      tour.name,
      tour.description || '',
      new Date(tour.start_date).toLocaleDateString(),
      new Date(tour.end_date).toLocaleDateString(),
      participant.user.first_name,
      participant.user.last_name,
      participant.user.email,
      new Date(participant.assigned_at).toLocaleDateString(),
      tour.survey_url || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        row.map(cell =>
          typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))
            ? `"${cell.replace(/"/g, '""')}"`
            : cell
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${tour.name}_participants_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAvailableUsers = availableUsers.filter(user =>
    user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/tours">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tours
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{tour.name}</h1>
            <p className="text-gray-600">Manage all aspects of this tour</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="itinerary" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Itinerary
          </TabsTrigger>
          <TabsTrigger value="participants" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Participants ({participants.length})
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Theme
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tour Details</CardTitle>
              <CardDescription>Edit basic information about this tour</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Tour Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter tour name"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: TourStatus) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter tour description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="survey_url">Survey URL</Label>
                <Input
                  id="survey_url"
                  value={formData.survey_url}
                  onChange={(e) => setFormData({ ...formData, survey_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleUpdateTour} disabled={isSaving || isUploading}>
                  {isSaving ? 'Saving...' : isUploading ? 'Uploading logo...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="itinerary" className="space-y-6">
          <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
            💡 <strong>Tip:</strong> Click and drag on the calendar to create new activities, drag existing activities to reschedule them
          </div>

          <CalendarItinerary
            activities={activities}
            companies={companies}
            tourStartDate={tour.start_date}
            tourEndDate={tour.end_date}
            onActivityCreate={handleActivityCreate}
            onActivityUpdate={handleActivityUpdate}
            onActivityDelete={handleActivityDelete}
          />

          {activities.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No activities yet</h3>
              <p className="mt-2 text-gray-500">Click and drag on the calendar to create your first activity!</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="participants" className="space-y-6">
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={exportToCSV}
              disabled={participants.length === 0}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Assigned Participants</span>
                </CardTitle>
                <CardDescription>
                  Users currently assigned to this tour
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          {participant.user.first_name} {participant.user.last_name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {participant.user.email}
                        </div>
                        <div className="text-xs text-gray-500">
                          Assigned on {new Date(participant.assigned_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnassignUser(participant.user_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {participants.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      No participants assigned yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Available Users</span>
                </CardTitle>
                <CardDescription>
                  Users who can be assigned to this tour
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredAvailableUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <div className="font-medium">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {user.email}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAssignUser(user.id)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Assign
                        </Button>
                      </div>
                    ))}
                    {filteredAvailableUsers.length === 0 && availableUsers.length > 0 && (
                      <div className="text-center py-6 text-gray-500">
                        No users match your search
                      </div>
                    )}
                    {availableUsers.length === 0 && (
                      <div className="text-center py-6 text-gray-500">
                        All users are assigned to this tour
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="theme" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme Settings</CardTitle>
              <CardDescription>Customize the appearance of this tour in the mobile app</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Theme Mode</Label>
                <RadioGroup value={themeMode} onValueChange={(value: 'default' | 'custom') => setThemeMode(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="default" id="default" />
                    <Label htmlFor="default" className="font-normal">Default Theme (Blue)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom" className="font-normal">Custom Theme</Label>
                  </div>
                </RadioGroup>
              </div>

              {themeMode === 'custom' && (
                <>
                  <div>
                    <Label htmlFor="theme_primary_color">Primary Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="theme_primary_color"
                        type="color"
                        value={themePrimaryColor}
                        onChange={(e) => setThemePrimaryColor(e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={themePrimaryColor}
                        onChange={(e) => setThemePrimaryColor(e.target.value)}
                        placeholder="#497CED"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="logo">Tour Logo</Label>
                    {logoPreview ? (
                      <div className="mt-2 relative">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="max-h-32 rounded border"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeLogo}
                          className="absolute top-0 right-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <label
                          htmlFor="logo"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50"
                        >
                          <Upload className="h-8 w-8 text-gray-400" />
                          <span className="mt-2 text-sm text-gray-500">Click to upload logo</span>
                          <input
                            id="logo"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="flex justify-end">
                <Button onClick={handleUpdateTour} disabled={isSaving || isUploading}>
                  {isSaving ? 'Saving...' : isUploading ? 'Uploading logo...' : 'Save Theme'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};