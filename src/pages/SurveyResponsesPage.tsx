import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  ArrowLeft, 
  Download, 
  Search,
  Filter,
  Calendar,
  User,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { surveyService } from '../services/surveyService';
import { Survey, SurveyResponse, SurveyResponseStats } from '../types/api';

interface SurveyResponsesPageProps {}

export const SurveyResponsesPage: React.FC<SurveyResponsesPageProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<SurveyResponse[]>([]);
  const [stats, setStats] = useState<SurveyResponseStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);

  useEffect(() => {
    if (id) {
      const surveyId = parseInt(id);
      loadSurvey(surveyId);
      loadResponses(surveyId);
      loadStats(surveyId);
    }
  }, [id]);

  useEffect(() => {
    filterResponses();
  }, [responses, searchQuery, statusFilter]);

  const loadSurvey = async (surveyId: number) => {
    try {
      const surveyData = await surveyService.getSurveyById(surveyId);
      setSurvey(surveyData);
    } catch (error) {
      console.error('Error loading survey:', error);
    }
  };

  const loadResponses = async (surveyId: number) => {
    setIsLoading(true);
    try {
      console.log('Loading responses for survey:', surveyId);
      const responsesData = await surveyService.getSurveyResponses(surveyId, true);
      console.log('Responses data received:', responsesData);
      setResponses(responsesData);
    } catch (error) {
      console.error('Error loading responses:', error);
      alert(`Failed to load responses: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async (surveyId: number) => {
    try {
      const statsData = await surveyService.getSurveyStats(surveyId);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const filterResponses = () => {
    let filtered = responses;

    if (searchQuery) {
      filtered = filtered.filter(response => 
        response.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        response.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(response => {
        if (statusFilter === 'completed') return response.is_complete;
        if (statusFilter === 'partial') return !response.is_complete;
        return true;
      });
    }

    setFilteredResponses(filtered);
  };

  const handleExport = async (format: 'csv' | 'json' = 'csv') => {
    if (!survey) return;
    
    try {
      const blob = await surveyService.exportSurveyResponses(survey.id, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${survey.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_responses.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting responses:', error);
      alert('Failed to export responses. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getResponseValue = (response: any, questionId: number) => {
    if (!response.responses) return '-';
    
    const questionResponse = response.responses.find((r: any) => r.question_id === questionId);
    if (!questionResponse) return '-';

    if (questionResponse.text_response) return questionResponse.text_response;
    if (questionResponse.number_response !== null) return questionResponse.number_response;
    if (questionResponse.rating_response !== null) return `${questionResponse.rating_response}/5 ⭐`;
    if (questionResponse.date_response) return new Date(questionResponse.date_response).toLocaleDateString();
    if (questionResponse.selected_option_ids && questionResponse.selected_option_ids.length > 0) {
      // Find the option texts for selected IDs
      const question = survey?.questions?.find(q => q.id === questionId);
      if (question?.options) {
        const selectedOptions = question.options
          .filter(opt => questionResponse.selected_option_ids.includes(opt.id))
          .map(opt => opt.option_text);
        return selectedOptions.join(', ');
      }
      return questionResponse.selected_option_ids.join(', ');
    }

    return '-';
  };

  const getFullResponseValue = (response: any, question: any) => {
    if (!response.responses) return 'No answer';
    
    const questionResponse = response.responses.find((r: any) => r.question_id === question.id);
    if (!questionResponse) return 'No answer';

    if (questionResponse.text_response) return questionResponse.text_response;
    if (questionResponse.number_response !== null) return questionResponse.number_response.toString();
    if (questionResponse.rating_response !== null) return `${questionResponse.rating_response} out of 5 stars`;
    if (questionResponse.date_response) return new Date(questionResponse.date_response).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (questionResponse.selected_option_ids && questionResponse.selected_option_ids.length > 0) {
      if (question?.options) {
        const selectedOptions = question.options
          .filter(opt => questionResponse.selected_option_ids.includes(opt.id))
          .map(opt => opt.option_text);
        return selectedOptions.join(', ');
      }
      return questionResponse.selected_option_ids.join(', ');
    }

    return 'No answer';
  };

  const handleRowClick = (response: SurveyResponse) => {
    setSelectedResponse(response);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading responses...</p>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Survey Not Found</h2>
        <p className="text-gray-600 mb-4">The survey you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => navigate('/surveys')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Surveys
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate(`/surveys/view/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Survey
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Survey Responses</h1>
            <p className="text-gray-600">{survey.title}</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('json')}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Responses</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_responses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completed_responses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.partial_responses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <User className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.completion_rate ? `${Math.round(stats.completion_rate * 100)}%` : '0%'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by user name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Responses</SelectItem>
                <SelectItem value="completed">Completed Only</SelectItem>
                <SelectItem value="partial">In Progress Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Responses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Responses ({filteredResponses.length})</CardTitle>
          <CardDescription>
            Click on any response to view detailed answers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredResponses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Started
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed
                    </th>
                    {survey.questions?.slice(0, 3).map((question, index) => (
                      <th key={question.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-48 truncate">
                        Q{index + 1}: {question.question_text}
                      </th>
                    ))}
                    {survey.questions && survey.questions.length > 3 && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        + {survey.questions.length - 3} more
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredResponses.map((response) => (
                    <tr 
                      key={response.id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(response)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {response.user_name || 'Anonymous User'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {response.user_email || 'No email'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {response.is_complete ? (
                          <Badge className="bg-green-100 text-green-800">Completed</Badge>
                        ) : (
                          <Badge variant="secondary">In Progress</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(response.started_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {response.completed_at ? formatDate(response.completed_at) : '-'}
                      </td>
                      {survey.questions?.slice(0, 3).map((question) => (
                        <td key={question.id} className="px-6 py-4 text-sm text-gray-900 max-w-48 truncate">
                          {getResponseValue(response, question.id)}
                        </td>
                      ))}
                      {survey.questions && survey.questions.length > 3 && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ...
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No responses found</h3>
              <p className="text-gray-500">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your filters or search terms.'
                  : 'No one has responded to this survey yet.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response Detail Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Response Details</h2>
                <p className="text-sm text-gray-600">
                  {selectedResponse.user_name || 'Anonymous User'} • {formatDate(selectedResponse.started_at)}
                </p>
              </div>
              <Button variant="outline" onClick={() => setSelectedResponse(null)}>
                <User className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Response Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-600">Participant</label>
                  <p className="text-sm text-gray-900">{selectedResponse.user_name || 'Anonymous User'}</p>
                  <p className="text-sm text-gray-500">{selectedResponse.user_email || 'No email'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <p className="text-sm">
                    {selectedResponse.is_complete ? (
                      <Badge className="bg-green-100 text-green-800">Completed</Badge>
                    ) : (
                      <Badge variant="secondary">In Progress</Badge>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Completed</label>
                  <p className="text-sm text-gray-900">
                    {selectedResponse.completed_at ? formatDate(selectedResponse.completed_at) : 'Not completed'}
                  </p>
                </div>
              </div>

              {/* Detailed Answers */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Answers</h3>
                {survey.questions?.map((question, index) => (
                  <Card key={question.id}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              Q{index + 1}: {question.question_text}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {question.question_type} {question.is_required && '(Required)'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-900">
                            {getFullResponseValue(selectedResponse, question)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
