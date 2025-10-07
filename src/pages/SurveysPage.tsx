import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Copy,
  BarChart3,
  Users,
  Calendar,
  Archive,
  Play,
  Pause,
  Download,
  Link,
  ExternalLink,
  X
} from 'lucide-react';
import { surveyService } from '../services/surveyService';
import { Survey, SurveyType, SurveyStatus } from '../types/api';

interface SurveysPageProps {}

export const SurveysPage: React.FC<SurveysPageProps> = () => {
  const navigate = useNavigate();
  
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [filteredSurveys, setFilteredSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<SurveyType | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<SurveyStatus | 'ALL'>('ALL');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [showPublicLinkDialog, setShowPublicLinkDialog] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [duplicateTitle, setDuplicateTitle] = useState('');
  const [publicLinkData, setPublicLinkData] = useState<{ token: string; public_url: string; expires_at: string } | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  useEffect(() => {
    loadSurveys();
  }, []);

  useEffect(() => {
    filterSurveys();
  }, [surveys, searchQuery, selectedType, selectedStatus]);

  const loadSurveys = async () => {
    setIsLoading(true);
    try {
      const data = await surveyService.getAllSurveys();
      setSurveys(data);
    } catch (error) {
      console.error('Error loading surveys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterSurveys = () => {
    let filtered = surveys;

    if (searchQuery) {
      filtered = filtered.filter(survey => 
        survey.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (survey.description && survey.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedType !== 'ALL') {
      filtered = filtered.filter(survey => survey.type === selectedType);
    }

    if (selectedStatus !== 'ALL') {
      filtered = filtered.filter(survey => survey.status === selectedStatus);
    }

    setFilteredSurveys(filtered);
  };

  const handleCreateSurvey = () => {
    navigate('/surveys/create');
  };

  const handleEditSurvey = (survey: Survey) => {
    navigate(`/surveys/edit/${survey.id}`);
  };

  const handleViewSurvey = (survey: Survey) => {
    navigate(`/surveys/view/${survey.id}`);
  };

  const handleViewResponses = (survey: Survey) => {
    navigate(`/surveys/${survey.id}/responses`);
  };

  const handleDeleteSurvey = async () => {
    if (!selectedSurvey) return;

    try {
      await surveyService.deleteSurvey(selectedSurvey.id);
      setSurveys(prev => prev.filter(s => s.id !== selectedSurvey.id));
      setShowDeleteDialog(false);
      setSelectedSurvey(null);
    } catch (error) {
      console.error('Error deleting survey:', error);
      alert('Failed to delete survey. Please try again.');
    }
  };

  const handleDuplicateSurvey = async () => {
    if (!selectedSurvey || !duplicateTitle.trim()) return;

    try {
      const newSurvey = await surveyService.duplicateSurvey(selectedSurvey.id, duplicateTitle.trim());
      setSurveys(prev => [newSurvey, ...prev]);
      setShowDuplicateDialog(false);
      setSelectedSurvey(null);
      setDuplicateTitle('');
    } catch (error) {
      console.error('Error duplicating survey:', error);
      alert('Failed to duplicate survey. Please try again.');
    }
  };

  const handleToggleStatus = async (survey: Survey) => {
    try {
      const newStatus: SurveyStatus = survey.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
      const updatedSurvey = await surveyService.updateSurvey(survey.id, { status: newStatus });
      setSurveys(prev => prev.map(s => s.id === survey.id ? updatedSurvey : s));
    } catch (error) {
      console.error('Error toggling survey status:', error);
      alert('Failed to update survey status. Please try again.');
    }
  };

  const handleArchiveSurvey = async (survey: Survey) => {
    try {
      const updatedSurvey = await surveyService.archiveSurvey(survey.id);
      setSurveys(prev => prev.map(s => s.id === survey.id ? updatedSurvey : s));
    } catch (error) {
      console.error('Error archiving survey:', error);
      alert('Failed to archive survey. Please try again.');
    }
  };

  const handleExportResponses = async (survey: Survey) => {
    try {
      const blob = await surveyService.exportSurveyResponses(survey.id, 'csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${survey.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_responses.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting responses:', error);
      alert('Failed to export responses. Please try again.');
    }
  };

  const handleManagePublicLink = (survey: Survey) => {
    setSelectedSurvey(survey);
    if (survey.public_access_token && survey.allow_public_access) {
      // If survey already has a public link, show it
      const frontendUrl = import.meta.env.VITE_ADMIN_WEB_URL || 'http://localhost:3003';
      setPublicLinkData({
        token: survey.public_access_token,
        public_url: `${frontendUrl}/public/survey/${survey.public_access_token}`,
        expires_at: survey.public_access_expires_at || ''
      });
    } else {
      setPublicLinkData(null);
    }
    setShowPublicLinkDialog(true);
  };

  const handleGeneratePublicLink = async () => {
    if (!selectedSurvey) return;

    setIsGeneratingLink(true);
    try {
      const linkData = await surveyService.generatePublicLink(selectedSurvey.id);
      // Update the URL to use the correct frontend URL
      const frontendUrl = import.meta.env.VITE_ADMIN_WEB_URL || 'http://localhost:3003';
      const updatedLinkData = {
        ...linkData,
        public_url: `${frontendUrl}/public/survey/${linkData.token}`
      };
      setPublicLinkData(updatedLinkData);

      // Update the survey in the list
      setSurveys(prev => prev.map(s =>
        s.id === selectedSurvey.id
          ? { ...s, public_access_token: linkData.token, allow_public_access: true }
          : s
      ));
    } catch (error) {
      console.error('Error generating public link:', error);
      alert('Failed to generate public link. Please try again.');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleRevokePublicAccess = async () => {
    if (!selectedSurvey) return;

    try {
      await surveyService.revokePublicAccess(selectedSurvey.id);
      setPublicLinkData(null);

      // Update the survey in the list
      setSurveys(prev => prev.map(s =>
        s.id === selectedSurvey.id
          ? { ...s, public_access_token: undefined, allow_public_access: false }
          : s
      ));
    } catch (error) {
      console.error('Error revoking public access:', error);
      alert('Failed to revoke public access. Please try again.');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      alert('Failed to copy link. Please copy it manually.');
    }
  };

  const getSurveyTypeLabel = (type: SurveyType) => {
    switch (type) {
      case 'TOUR_APPLICATION': return 'Tour Application';
      case 'ACTIVITY_FEEDBACK': return 'Activity Feedback';
      case 'TOUR_COMPLETION': return 'Tour Completion';
      case 'CUSTOM': return 'Custom Survey';
      default: return type;
    }
  };

  const getSurveyStatusBadge = (status: SurveyStatus) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="secondary">Draft</Badge>;
      case 'ACTIVE':
        return <Badge variant="default">Active</Badge>;
      case 'ARCHIVED':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSurveyTypeColor = (type: SurveyType) => {
    switch (type) {
      case 'TOUR_APPLICATION': return 'bg-blue-100 text-blue-800';
      case 'ACTIVITY_FEEDBACK': return 'bg-yellow-100 text-yellow-800';
      case 'TOUR_COMPLETION': return 'bg-green-100 text-green-800';
      case 'CUSTOM': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading surveys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Surveys</h1>
          <p className="mt-2 text-gray-600">
            Manage your survey collection, view responses, and analyze results
          </p>
        </div>
        <Button onClick={handleCreateSurvey}>
          <Plus className="h-4 w-4 mr-2" />
          Create Survey
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Surveys</p>
                <p className="text-2xl font-bold text-gray-900">{surveys.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Play className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {surveys.filter(s => s.status === 'ACTIVE').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Pause className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Draft</p>
                <p className="text-2xl font-bold text-gray-900">
                  {surveys.filter(s => s.status === 'DRAFT').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Archive className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Archived</p>
                <p className="text-2xl font-bold text-gray-900">
                  {surveys.filter(s => s.status === 'ARCHIVED').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search surveys..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedType} onValueChange={(value: SurveyType | 'ALL') => setSelectedType(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="TOUR_APPLICATION">Tour Application</SelectItem>
                <SelectItem value="ACTIVITY_FEEDBACK">Activity Feedback</SelectItem>
                <SelectItem value="TOUR_COMPLETION">Tour Completion</SelectItem>
                <SelectItem value="CUSTOM">Custom Survey</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={(value: SurveyStatus | 'ALL') => setSelectedStatus(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Surveys List */}
      {filteredSurveys.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No surveys found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || selectedType !== 'ALL' || selectedStatus !== 'ALL'
                ? 'Try adjusting your filters or search terms.'
                : 'Create your first survey to get started.'
              }
            </p>
            {!searchQuery && selectedType === 'ALL' && selectedStatus === 'ALL' && (
              <Button onClick={handleCreateSurvey}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Survey
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSurveys.map((survey) => (
            <Card key={survey.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getSurveyTypeColor(survey.type)}`}>
                        {getSurveyTypeLabel(survey.type)}
                      </span>
                      {getSurveyStatusBadge(survey.status)}
                    </div>
                    <CardTitle className="text-lg leading-tight">{survey.title}</CardTitle>
                  </div>
                </div>
                {survey.description && (
                  <CardDescription className="line-clamp-2">
                    {survey.description}
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Questions:</span>
                    <span className="font-medium">{survey.questions?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Responses:</span>
                    <span className="font-medium">{survey._count?.responses || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Created:</span>
                    <span className="font-medium">
                      {new Date(survey.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewSurvey(survey)}
                      title="View Survey"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditSurvey(survey)}
                      title="Edit Survey"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSurvey(survey);
                        setDuplicateTitle(`${survey.title} (Copy)`);
                        setShowDuplicateDialog(true);
                      }}
                      title="Duplicate Survey"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex gap-1">
                    {survey.status !== 'ARCHIVED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(survey)}
                        title={survey.status === 'ACTIVE' ? 'Pause Survey' : 'Activate Survey'}
                      >
                        {survey.status === 'ACTIVE' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    )}
                    
                    {(survey._count?.responses || 0) > 0 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewResponses(survey)}
                          title="View Responses"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportResponses(survey)}
                          title="Export Responses"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}

                    {survey.status !== 'ARCHIVED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleArchiveSurvey(survey)}
                        title="Archive Survey"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}

                    {survey.type === 'TOUR_APPLICATION' && survey.status === 'ACTIVE' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManagePublicLink(survey)}
                        title="Manage Public Link"
                        className={survey.allow_public_access ? 'text-green-600 border-green-300' : ''}
                      >
                        <Link className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSurvey(survey);
                        setShowDeleteDialog(true);
                      }}
                      title="Delete Survey"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Survey</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedSurvey?.title}"? This action cannot be undone.
              All responses will also be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSurvey}>
              Delete Survey
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Duplicate Survey Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Survey</DialogTitle>
            <DialogDescription>
              Create a copy of "{selectedSurvey?.title}" with a new title.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="duplicateTitle" className="block text-sm font-medium text-gray-700 mb-2">
                New Survey Title
              </label>
              <Input
                id="duplicateTitle"
                value={duplicateTitle}
                onChange={(e) => setDuplicateTitle(e.target.value)}
                placeholder="Enter new survey title"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDuplicateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleDuplicateSurvey} disabled={!duplicateTitle.trim()}>
                Duplicate Survey
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Public Link Management Dialog */}
      <Dialog open={showPublicLinkDialog} onOpenChange={setShowPublicLinkDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Public Link Management</DialogTitle>
            <DialogDescription>
              Generate a public link for "{selectedSurvey?.title}" that allows anyone to complete this survey without logging in.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {publicLinkData ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-800">Public link is active</span>
                  </div>
                  <p className="text-sm text-green-700">
                    This survey can be accessed by anyone with the link below.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Public Survey Link
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={publicLinkData.public_url}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(publicLinkData.public_url)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(publicLinkData.public_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open
                    </Button>
                  </div>
                </div>

                {publicLinkData.expires_at && (
                  <div className="text-sm text-gray-600">
                    <strong>Expires:</strong> {new Date(publicLinkData.expires_at).toLocaleDateString()}
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Share this link to allow public access to your survey
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleRevokePublicAccess}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Revoke Access
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Enable Public Access</h4>
                  <p className="text-sm text-blue-700">
                    Generate a public link that allows anyone to complete this survey without creating an account.
                    Perfect for collecting tour applications from potential participants.
                  </p>
                </div>

                <div className="space-y-2">
                  <h5 className="font-medium">Features:</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• No login required</li>
                    <li>• Respondents provide email and name</li>
                    <li>• Responses tracked separately from authenticated users</li>
                    <li>• Link can be revoked at any time</li>
                  </ul>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowPublicLinkDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGeneratePublicLink}
                    disabled={isGeneratingLink}
                  >
                    {isGeneratingLink ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Link className="h-4 w-4 mr-2" />
                        Generate Public Link
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};