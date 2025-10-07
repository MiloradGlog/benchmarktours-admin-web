import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import {
  CheckCircle,
  AlertCircle,
  Star,
  Calendar,
  User,
  Mail,
  FileText,
  Clock
} from 'lucide-react';
import { Survey, SurveyQuestion, QuestionType } from '../types/api';

interface PublicSurveyPageProps {}

interface QuestionResponse {
  question_id: number;
  text_response?: string;
  number_response?: number;
  date_response?: string;
  selected_option_ids?: number[];
  rating_response?: number;
}

export const PublicSurveyPage: React.FC<PublicSurveyPageProps> = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<number, QuestionResponse>>({});
  const [respondentName, setRespondentName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    if (token) {
      loadSurvey();
    }
  }, [token]);

  const loadSurvey = async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/public/surveys/${token}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Survey not found or access has expired');
        } else {
          setError('Failed to load survey');
        }
        return;
      }

      const data = await response.json();
      setSurvey(data.survey);

      // Initialize responses
      const initialResponses: Record<number, QuestionResponse> = {};
      data.survey.questions?.forEach((question: SurveyQuestion) => {
        initialResponses[question.id] = {
          question_id: question.id,
        };
      });
      setResponses(initialResponses);
    } catch (err) {
      console.error('Error loading survey:', err);
      setError('Failed to load survey. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateResponse = (questionId: number, field: keyof QuestionResponse, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
      }
    }));

    // Clear validation error for this question
    if (validationErrors[questionId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const validateResponses = (): boolean => {
    if (!survey?.questions) return false;

    const errors: Record<number, string> = {};

    // Validate respondent info
    if (!respondentName.trim()) {
      setError('Please provide your name');
      return false;
    }

    if (!respondentEmail.trim()) {
      setError('Please provide your email address');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(respondentEmail)) {
      setError('Please provide a valid email address');
      return false;
    }

    // Validate required questions
    survey.questions.forEach((question) => {
      if (question.is_required) {
        const response = responses[question.id];
        let hasResponse = false;

        switch (question.question_type) {
          case 'TEXT':
          case 'TEXTAREA':
            hasResponse = !!response?.text_response?.trim();
            break;
          case 'NUMBER':
            hasResponse = response?.number_response !== undefined && response?.number_response !== null;
            break;
          case 'DATE':
            hasResponse = !!response?.date_response;
            break;
          case 'MULTIPLE_CHOICE':
          case 'CHECKBOX':
            hasResponse = !!response?.selected_option_ids?.length;
            break;
          case 'RATING':
            hasResponse = !!response?.rating_response;
            break;
          case 'YES_NO':
            hasResponse = !!response?.selected_option_ids?.length;
            break;
        }

        if (!hasResponse) {
          errors[question.id] = 'This field is required';
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!survey || !token) return;

    setError(null);

    if (!validateResponses()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const responseData = {
        respondent_email: respondentEmail,
        respondent_name: respondentName,
        responses: Object.values(responses).filter(r => {
          // Only include responses that have actual data
          return r.text_response ||
                 r.number_response !== undefined ||
                 r.date_response ||
                 r.rating_response ||
                 (r.selected_option_ids && r.selected_option_ids.length > 0);
        }),
      };

      const response = await fetch(`/api/public/surveys/${token}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(responseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit survey');
      }

      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Error submitting survey:', err);
      setError(err.message || 'Failed to submit survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = (question: SurveyQuestion) => {
    const currentRating = responses[question.id]?.rating_response || 0;

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => updateResponse(question.id, 'rating_response', star)}
            className={`p-1 transition-colors ${
              star <= currentRating ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'
            }`}
          >
            <Star className={`h-6 w-6 ${star <= currentRating ? 'fill-current' : ''}`} />
          </button>
        ))}
      </div>
    );
  };

  const renderQuestion = (question: SurveyQuestion) => {
    const hasError = validationErrors[question.id];

    return (
      <div key={question.id} className="space-y-3">
        <div>
          <Label className="text-base font-medium">
            {question.question_text}
            {question.is_required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {question.description && (
            <p className="text-sm text-gray-600 mt-1">{question.description}</p>
          )}
        </div>

        {hasError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{hasError}</AlertDescription>
          </Alert>
        )}

        <div>
          {question.question_type === 'TEXT' && (
            <Input
              value={responses[question.id]?.text_response || ''}
              onChange={(e) => updateResponse(question.id, 'text_response', e.target.value)}
              placeholder="Enter your response"
              className={hasError ? 'border-red-500' : ''}
            />
          )}

          {question.question_type === 'TEXTAREA' && (
            <Textarea
              value={responses[question.id]?.text_response || ''}
              onChange={(e) => updateResponse(question.id, 'text_response', e.target.value)}
              placeholder="Enter your response"
              rows={4}
              className={hasError ? 'border-red-500' : ''}
            />
          )}

          {question.question_type === 'NUMBER' && (
            <Input
              type="number"
              value={responses[question.id]?.number_response || ''}
              onChange={(e) => updateResponse(question.id, 'number_response', parseFloat(e.target.value) || undefined)}
              placeholder="Enter a number"
              className={hasError ? 'border-red-500' : ''}
            />
          )}

          {question.question_type === 'DATE' && (
            <Input
              type="date"
              value={responses[question.id]?.date_response || ''}
              onChange={(e) => updateResponse(question.id, 'date_response', e.target.value)}
              className={hasError ? 'border-red-500' : ''}
            />
          )}

          {question.question_type === 'RATING' && (
            <div>
              {renderStarRating(question)}
              <p className="text-sm text-gray-500 mt-1">Click to rate (1-5 stars)</p>
            </div>
          )}

          {question.question_type === 'MULTIPLE_CHOICE' && question.options && (
            <RadioGroup
              value={responses[question.id]?.selected_option_ids?.[0]?.toString() || ''}
              onValueChange={(value) => updateResponse(question.id, 'selected_option_ids', [parseInt(value)])}
            >
              {question.options.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.id.toString()} />
                  <Label>{option.option_text}</Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {question.question_type === 'CHECKBOX' && question.options && (
            <div className="space-y-2">
              {question.options.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    checked={responses[question.id]?.selected_option_ids?.includes(option.id) || false}
                    onCheckedChange={(checked) => {
                      const currentIds = responses[question.id]?.selected_option_ids || [];
                      if (checked) {
                        updateResponse(question.id, 'selected_option_ids', [...currentIds, option.id]);
                      } else {
                        updateResponse(question.id, 'selected_option_ids', currentIds.filter(id => id !== option.id));
                      }
                    }}
                  />
                  <Label>{option.option_text}</Label>
                </div>
              ))}
            </div>
          )}

          {question.question_type === 'YES_NO' && (
            <RadioGroup
              value={responses[question.id]?.selected_option_ids?.[0]?.toString() || ''}
              onValueChange={(value) => updateResponse(question.id, 'selected_option_ids', [parseInt(value)])}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1" />
                <Label>Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="0" />
                <Label>No</Label>
              </div>
            </RadioGroup>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading survey...</p>
        </div>
      </div>
    );
  }

  if (error && !survey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Survey</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={() => navigate('/')}>Go to Homepage</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Thank You!</h3>
            <p className="text-gray-500 mb-4">
              Your survey response has been submitted successfully. We appreciate your participation.
            </p>
            <Button onClick={() => navigate('/')}>Go to Homepage</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!survey) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <Badge variant="outline" className="mb-2">Tour Application</Badge>
                <CardTitle className="text-2xl">{survey.title}</CardTitle>
              </div>
            </div>
            {survey.description && (
              <CardDescription className="text-base">{survey.description}</CardDescription>
            )}
          </CardHeader>
        </Card>

        {/* Respondent Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Your Information
            </CardTitle>
            <CardDescription>
              Please provide your contact information to complete this survey.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <Label htmlFor="email">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={respondentEmail}
                onChange={(e) => setRespondentEmail(e.target.value)}
                placeholder="Enter your email address"
              />
            </div>
          </CardContent>
        </Card>

        {/* Survey Questions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Survey Questions</CardTitle>
            <CardDescription>
              Please answer all questions marked with an asterisk (*).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {survey.questions?.map(renderQuestion)}
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Submit Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Ready to submit?</h3>
                <p className="text-sm text-gray-600">
                  Please review your responses before submitting.
                </p>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Survey'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};