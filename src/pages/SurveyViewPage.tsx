import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { 
  ArrowLeft, 
  Edit, 
  Copy, 
  BarChart3, 
  Users, 
  Calendar,
  CheckCircle,
  Circle,
  Star,
  Download
} from 'lucide-react';
import { surveyService } from '../services/surveyService';
import { Survey, SurveyType, SurveyStatus, QuestionType } from '../types/api';

interface SurveyViewPageProps {}

export const SurveyViewPage: React.FC<SurveyViewPageProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [surveyStats, setSurveyStats] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadSurvey(parseInt(id));
      loadSurveyStats(parseInt(id));
    }
  }, [id]);

  const loadSurvey = async (surveyId: number) => {
    setIsLoading(true);
    try {
      const surveyData = await surveyService.getSurveyById(surveyId);
      setSurvey(surveyData);
    } catch (error) {
      console.error('Error loading survey:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSurveyStats = async (surveyId: number) => {
    try {
      const stats = await surveyService.getSurveyStats(surveyId);
      setSurveyStats(stats);
    } catch (error) {
      console.error('Error loading survey stats:', error);
    }
  };

  const handleEdit = () => {
    navigate(`/surveys/edit/${id}`);
  };

  const handleDuplicate = async () => {
    if (!survey) return;
    
    const newTitle = prompt('Enter a title for the duplicated survey:', `${survey.title} (Copy)`);
    if (!newTitle) return;

    try {
      const duplicatedSurvey = await surveyService.duplicateSurvey(survey.id, newTitle);
      navigate(`/surveys/edit/${duplicatedSurvey.id}`);
    } catch (error) {
      console.error('Error duplicating survey:', error);
      alert('Failed to duplicate survey. Please try again.');
    }
  };

  const handleViewResponses = () => {
    navigate(`/surveys/${id}/responses`);
  };

  const handleExportResponses = async () => {
    if (!survey) return;
    
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

  const getQuestionTypeIcon = (type: QuestionType) => {
    switch (type) {
      case 'TEXT': return '📝';
      case 'TEXTAREA': return '📄';
      case 'MULTIPLE_CHOICE': return '🔘';
      case 'CHECKBOX': return '☑️';
      case 'RATING': return '⭐';
      case 'YES_NO': return '❓';
      case 'NUMBER': return '🔢';
      case 'DATE': return '📅';
      default: return '❔';
    }
  };

  const formatQuestionType = (type: QuestionType) => {
    switch (type) {
      case 'TEXT': return 'Short Text';
      case 'TEXTAREA': return 'Long Text';
      case 'MULTIPLE_CHOICE': return 'Multiple Choice';
      case 'CHECKBOX': return 'Checkbox';
      case 'RATING': return 'Rating (1-5 stars)';
      case 'YES_NO': return 'Yes/No';
      case 'NUMBER': return 'Number';
      case 'DATE': return 'Date';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading survey...</p>
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
          <Button variant="outline" onClick={() => navigate('/surveys')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Surveys
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{survey.title}</h1>
            <div className="flex items-center space-x-2 mt-2">
              <span className={`text-xs px-2 py-1 rounded-full ${getSurveyTypeColor(survey.type)}`}>
                {getSurveyTypeLabel(survey.type)}
              </span>
              {getSurveyStatusBadge(survey.status)}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" onClick={handleDuplicate}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
          {surveyStats && surveyStats.total_responses > 0 && (
            <>
              <Button variant="outline" onClick={handleViewResponses}>
                <BarChart3 className="h-4 w-4 mr-2" />
                View Responses ({surveyStats.total_responses})
              </Button>
              <Button variant="outline" onClick={handleExportResponses}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Survey Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Survey Details</CardTitle>
              <CardDescription>
                Basic information about this survey
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {survey.description && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Description</Label>
                  <p className="mt-1 text-gray-900">{survey.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Created</Label>
                  <p className="mt-1 text-gray-900">
                    {new Date(survey.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Last Updated</Label>
                  <p className="mt-1 text-gray-900">
                    {new Date(survey.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {survey.published_at && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Published</Label>
                  <p className="mt-1 text-gray-900">
                    {new Date(survey.published_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Card */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Response Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {surveyStats ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Responses</span>
                    <span className="font-medium">{surveyStats.total_responses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Complete</span>
                    <span className="font-medium text-green-600">{surveyStats.completed_responses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">In Progress</span>
                    <span className="font-medium text-yellow-600">{surveyStats.partial_responses}</span>
                  </div>
                  {surveyStats.completion_rate !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Completion Rate</span>
                      <span className="font-medium">{Math.round(surveyStats.completion_rate * 100)}%</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No responses yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Questions ({survey.questions?.length || 0})</CardTitle>
          <CardDescription>
            Preview of all questions in this survey
          </CardDescription>
        </CardHeader>
        <CardContent>
          {survey.questions && survey.questions.length > 0 ? (
            <div className="space-y-6">
              {survey.questions
                .sort((a, b) => a.order_index - b.order_index)
                .map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getQuestionTypeIcon(question.question_type)}</span>
                        <div>
                          <h3 className="font-medium text-gray-900 flex items-center">
                            Question {index + 1}
                            {question.is_required && (
                              <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                Required
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-gray-500">{formatQuestionType(question.question_type)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <p className="font-medium mb-2">{question.question_text}</p>
                    
                    {question.description && (
                      <p className="text-sm text-gray-600 mb-3">{question.description}</p>
                    )}
                    
                    {question.options && question.options.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-700 mb-2">Options:</p>
                        <div className="space-y-1">
                          {question.options
                            .sort((a, b) => a.order_index - b.order_index)
                            .map((option, optIndex) => (
                              <div key={option.id} className="flex items-center text-sm text-gray-600">
                                {question.question_type === 'MULTIPLE_CHOICE' ? (
                                  <Circle className="h-3 w-3 mr-2" />
                                ) : (
                                  <CheckCircle className="h-3 w-3 mr-2" />
                                )}
                                {option.option_text}
                                {option.is_other && (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                                    Other
                                  </span>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {question.question_type === 'RATING' && (
                      <div className="mt-3 flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-4 w-4 text-gray-300" />
                        ))}
                        <span className="text-xs text-gray-500 ml-2">1-5 star rating</span>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No questions added to this survey yet.</p>
              <Button className="mt-4" onClick={handleEdit}>
                Add Questions
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};