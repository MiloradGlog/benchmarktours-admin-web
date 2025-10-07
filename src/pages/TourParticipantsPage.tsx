import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Trash2, Users, Search, Download } from 'lucide-react';
import { tourService, userService } from '@/services/tourService';
import { Tour, User, TourParticipant } from '@/types/api';

export const TourParticipantsPage: React.FC = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [participants, setParticipants] = useState<TourParticipant[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (tourId) {
      fetchData();
    }
  }, [tourId]);

  useEffect(() => {
    updateAvailableUsers();
  }, [allUsers, participants]);

  const fetchData = async () => {
    if (!tourId) return;
    
    try {
      const [tourResponse, participantsResponse, usersResponse] = await Promise.all([
        tourService.getById(parseInt(tourId)),
        tourService.getParticipants(parseInt(tourId)),
        userService.getAll()
      ]);
      
      setTour(tourResponse.tour);
      setParticipants(participantsResponse.participants);
      setAllUsers(usersResponse.users);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateAvailableUsers = () => {
    const participantIds = new Set(participants.map(p => p.user_id));
    const available = allUsers.filter(user => !participantIds.has(user.id));
    setAvailableUsers(available);
  };

  const handleAssignUser = async (userId: string) => {
    if (!tourId) return;
    
    try {
      await tourService.assignUser(parseInt(tourId), userId);
      fetchData();
    } catch (error) {
      console.error('Failed to assign user:', error);
    }
  };

  const handleUnassignUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this participant from the tour?')) return;
    if (!tourId) return;
    
    try {
      await tourService.unassignUser(parseInt(tourId), userId);
      fetchData();
    } catch (error) {
      console.error('Failed to unassign user:', error);
    }
  };

  const filteredAvailableUsers = availableUsers.filter(user =>
    user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    if (!tour || participants.length === 0) {
      alert('No participants to export');
      return;
    }

    // Prepare CSV headers
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

    // Prepare CSV rows
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

    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => 
          // Escape cells containing commas, quotes, or newlines
          typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))
            ? `"${cell.replace(/"/g, '""')}"` 
            : cell
        ).join(',')
      )
    ].join('\n');

    // Create and download file
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{tour.name} - Participants</h1>
          <p className="text-gray-600">Manage tour participants and assignments</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={exportToCSV}
          disabled={participants.length === 0}
          className="flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </Button>
        <div className="text-sm text-gray-600">
          {participants.length} participants assigned
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Participants */}
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

        {/* Available Users */}
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
    </div>
  );
};