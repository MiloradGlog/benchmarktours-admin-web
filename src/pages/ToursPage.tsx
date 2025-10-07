import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Plus, Edit, Trash2, Calendar, Users, Settings, ExternalLink, ArrowRight, Star, Upload, X, Palette } from 'lucide-react';
import { tourService } from '@/services/tourService';
import { reviewService } from '@/services/reviewService';
import { Tour, TourStatus } from '@/types/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toDateValue, fromDateValue, formatDateJST } from '@/utils/time';

export const ToursPage: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [filteredTours, setFilteredTours] = useState<Tour[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [tourRatings, setTourRatings] = useState<{[tourId: number]: { average_rating: number, total_reviews: number }}>({});
  const [themeMode, setThemeMode] = useState<'default' | 'custom'>('default');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'Draft' as TourStatus,
    survey_url: '',
    theme_primary_color: '#2563eb',
    theme_logo_url: '',
    theme_company_id: '',
  });

  useEffect(() => {
    fetchTours();
  }, []);

  useEffect(() => {
    handleStatusFilter(statusFilter);
  }, [tours]);

  const fetchTours = async () => {
    try {
      const response = await tourService.getAll();
      setTours(response.tours);
      setFilteredTours(response.tours);
      
      // Load ratings for each tour
      const ratings: {[tourId: number]: { average_rating: number, total_reviews: number }} = {};
      await Promise.all(
        response.tours.map(async (tour) => {
          try {
            const tourStats = await reviewService.getTourReviewStats(tour.id);
            ratings[tour.id] = tourStats.overall;
          } catch (error) {
            console.error(`Failed to fetch ratings for tour ${tour.id}:`, error);
            ratings[tour.id] = { average_rating: 0, total_reviews: 0 };
          }
        })
      );
      setTourRatings(ratings);
    } catch (error) {
      console.error('Failed to fetch tours:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    if (status === 'all') {
      setFilteredTours(tours);
    } else {
      setFilteredTours(tours.filter(tour => tour.status === status));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const { theme_company_id, start_date, end_date, ...restData } = formData;

      // Convert JST dates to UTC ISO strings for API
      const tourData = {
        ...restData,
        start_date: fromDateValue(start_date),
        end_date: fromDateValue(end_date),
      };

      let tourId: number;
      if (editingTour) {
        await tourService.update(editingTour.id, tourData);
        tourId = editingTour.id;
      } else {
        const response = await tourService.create(tourData);
        tourId = response.tour.id;
      }

      if (logoFile) {
        try {
          await tourService.uploadLogo(tourId, logoFile);
        } catch (uploadError) {
          console.error('Failed to upload logo:', uploadError);
        }
      }

      setIsDialogOpen(false);
      setEditingTour(null);
      resetForm();
      fetchTours();
    } catch (error) {
      console.error('Failed to save tour:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (tour: Tour) => {
    setEditingTour(tour);
    setFormData({
      name: tour.name,
      description: tour.description || '',
      start_date: toDateValue(tour.start_date),
      end_date: toDateValue(tour.end_date),
      status: tour.status,
      survey_url: tour.survey_url || '',
      theme_primary_color: tour.theme_primary_color || '#2563eb',
      theme_logo_url: tour.theme_logo_url || '',
      theme_company_id: tour.theme_company_id?.toString() || '',
    });
    setLogoPreview(tour.theme_logo_url || null);
    setLogoFile(null);
    if (tour.theme_logo_url || tour.theme_primary_color !== '#2563eb') {
      setThemeMode('custom');
    } else {
      setThemeMode('default');
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tour? This will also delete all associated activities and participant assignments.')) return;
    
    try {
      await tourService.delete(id);
      fetchTours();
    } catch (error) {
      console.error('Failed to delete tour:', error);
    }
  };

  const handleStatusTransition = async (tour: Tour, newStatus: TourStatus) => {
    const confirmMessages = {
      'Draft': 'Move this tour to Draft status?',
      'Pending': 'Move this tour to Pending status? Participants can be managed and reports are available.',
      'Completed': 'Move this tour to Completed status? Tour will become visible to participants in mobile app.',
    };

    if (!confirm(confirmMessages[newStatus])) return;

    try {
      await tourService.updateStatus(tour.id, newStatus);
      fetchTours();
    } catch (error) {
      console.error('Failed to update tour status:', error);
      alert('Failed to update status. Please check the transition is valid.');
    }
  };

  const getNextStatus = (currentStatus: TourStatus): TourStatus | null => {
    switch (currentStatus) {
      case 'Draft': return 'Pending';
      case 'Pending': return 'Completed';
      case 'Completed': return null;
      default: return null;
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size must be less than 10MB');
        return;
      }
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
    setLogoPreview(editingTour?.theme_logo_url || null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      status: 'Draft' as TourStatus,
      survey_url: '',
      theme_primary_color: '#2563eb',
      theme_logo_url: '',
      theme_company_id: '',
    });
    setThemeMode('default');
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingTour(null);
    resetForm();
  };

  const formatDate = (dateString: string) => {
    return formatDateJST(dateString);
  };

  const getStatusColor = (status: TourStatus) => {
    switch (status) {
      case 'Draft': return 'text-yellow-600 bg-yellow-50';
      case 'Pending': return 'text-blue-600 bg-blue-50';
      case 'Completed': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const StarRating: React.FC<{ rating: number; reviewCount?: number }> = ({ rating, reviewCount }) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${i <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        />
      );
    }
    return (
      <div className="flex items-center space-x-1">
        <div className="flex">{stars}</div>
        <span className="text-sm text-gray-600">
          {rating.toFixed(1)} {reviewCount !== undefined && `(${reviewCount})`}
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tours</h1>
          <p className="mt-2 text-gray-600">
            Manage benchmarking tours and their schedules.
          </p>
          
          <div className="mt-4 flex space-x-4">
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tours</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tour
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingTour ? 'Edit Tour' : 'Add New Tour'}
              </DialogTitle>
              <DialogDescription>
                {editingTour 
                  ? 'Update the tour information below.' 
                  : 'Fill in the details to create a new tour.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tour Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date (JST) *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date (JST) *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                    min={formData.start_date}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as TourStatus })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
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
                  Optional link to external survey for tour feedback
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Palette className="h-5 w-5 text-gray-600" />
                  <Label className="text-base font-semibold">Theme Settings</Label>
                </div>

                <div className="space-y-2">
                  <Label>Theme Mode</Label>
                  <Select value={themeMode} onValueChange={(value: 'default' | 'custom') => {
                    setThemeMode(value);
                    if (value === 'default') {
                      setFormData({ ...formData, theme_primary_color: '#2563eb', theme_company_id: '', theme_logo_url: '' });
                      setLogoPreview(null);
                      setLogoFile(null);
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Theme</SelectItem>
                      <SelectItem value="custom">Custom Theme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {themeMode === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="theme_primary_color">Primary Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="theme_primary_color"
                        type="color"
                        value={formData.theme_primary_color}
                        onChange={(e) => setFormData({ ...formData, theme_primary_color: e.target.value })}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={formData.theme_primary_color}
                        onChange={(e) => setFormData({ ...formData, theme_primary_color: e.target.value })}
                        className="flex-1"
                        placeholder="#2563eb"
                      />
                    </div>
                  </div>
                )}

                {themeMode === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="logo">Custom Logo</Label>
                    {logoPreview ? (
                      <div className="space-y-2">
                        <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="w-full h-full object-contain"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={removeLogo}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {logoFile && (
                          <p className="text-sm text-gray-600">
                            New logo selected: {logoFile.name}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                        <input
                          type="file"
                          id="logo"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="logo"
                          className="flex flex-col items-center cursor-pointer"
                        >
                          <Upload className="h-6 w-6 text-gray-400 mb-1" />
                          <span className="text-sm text-gray-600">
                            Click to upload logo
                          </span>
                          <span className="text-xs text-gray-500 mt-1">
                            JPG, PNG, WebP or GIF (max 10MB)
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? 'Saving...' : editingTour ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTours.map((tour) => {
          const statusColor = getStatusColor(tour.status);
          const rating = tourRatings[tour.id];
          return (
            <Card key={tour.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{tour.name}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>
                      {tour.status}
                    </span>
                  </div>
                </div>
                <CardDescription className="flex items-center space-x-1 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(tour.start_date)} - {formatDate(tour.end_date)}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rating && rating.total_reviews > 0 && (
                  <div className="mb-4">
                    <StarRating
                      rating={rating.average_rating}
                      reviewCount={rating.total_reviews}
                    />
                  </div>
                )}

                {tour.description && (
                  <p className="text-sm text-gray-700 mb-4">{tour.description}</p>
                )}
                
                {tour.survey_url && (
                  <div className="flex items-center space-x-2 mb-4 p-2 bg-blue-50 rounded">
                    <ExternalLink className="h-4 w-4 text-blue-600" />
                    <a 
                      href={tour.survey_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Survey available
                    </a>
                  </div>
                )}
                
                <div className="space-y-3">
                  {/* Status transition button */}
                  {getNextStatus(tour.status) && (
                    <div className="flex justify-center">
                      <Button
                        size="sm"
                        onClick={() => handleStatusTransition(tour, getNextStatus(tour.status)!)}
                        className="w-full"
                      >
                        <ArrowRight className="h-4 w-4 mr-1" />
                        Move to {getNextStatus(tour.status)}
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(tour)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(tour.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Link to={`/tours/${tour.id}`}>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-1" />
                        View/Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {tours.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No tours yet</h3>
          <p className="mt-2 text-gray-500">Get started by creating your first tour.</p>
        </div>
      )}
    </div>
  );
};