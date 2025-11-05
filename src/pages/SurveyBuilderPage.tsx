import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus, Save, Eye, Trash2, GripVertical, X, Copy } from 'lucide-react';
import { surveyService } from '../services/surveyService';
import { tourService } from '../services/tourService';
import { activityService } from '../services/activityService';
import { Survey, SurveyQuestion, CreateQuestionData, SurveyType, QuestionType, Tour, SurveyTemplate, Activity } from '../types/api';

interface SurveyBuilderPageProps {}

export const SurveyBuilderPage: React.FC<SurveyBuilderPageProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<SurveyType>('CUSTOM');
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templates, setTemplates] = useState<SurveyTemplate[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [selectedTourId, setSelectedTourId] = useState<number | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [isLoadingSurvey, setIsLoadingSurvey] = useState(false);

  // Track previous tour ID to detect actual changes (not initial loads)
  const prevTourIdRef = useRef<number | null>(null);

  // Question form state
  const [questionForm, setQuestionForm] = useState<CreateQuestionData>({
    question_text: '',
    question_type: 'TEXT',
    is_required: false,
    order_index: 0,
    description: '',
    options: [],
  });

  useEffect(() => {
    if (isEditing && id) {
      loadSurvey(parseInt(id));
    }
    loadTemplates();
    loadTours();
    loadActivities();
  }, [id, isEditing]);

  // Clear activity selection when tour changes for ACTIVITY_FEEDBACK type
  // Only clear when tour actually changes (not during initial load)
  useEffect(() => {
    if (type === 'ACTIVITY_FEEDBACK' && !isLoadingSurvey) {
      // Only clear if tour ID actually changed (not just set during load)
      if (prevTourIdRef.current !== null && prevTourIdRef.current !== selectedTourId) {
        setSelectedActivityId(null);
      }
    }
    // Update ref to track current value for next change
    prevTourIdRef.current = selectedTourId;
  }, [selectedTourId, type, isLoadingSurvey]);

  const loadSurvey = async (surveyId: number) => {
    setIsLoading(true);
    setIsLoadingSurvey(true);
    try {
      const surveyData = await surveyService.getSurveyById(surveyId);
      setSurvey(surveyData);
      setTitle(surveyData.title);
      setDescription(surveyData.description || '');
      setType(surveyData.type);
      setQuestions(surveyData.questions || []);
      setSelectedTourId(surveyData.tour_id || null);
      setSelectedActivityId(surveyData.activity_id || null);

      // For ACTIVITY_FEEDBACK surveys, if we have an activity_id but no tour_id,
      // we need to find the tour from the activity
      if (surveyData.type === 'ACTIVITY_FEEDBACK' && surveyData.activity_id && !surveyData.tour_id) {
        const response = await activityService.getAllActivities();
        const activity = response.activities.find((a: any) => a.id === surveyData.activity_id);
        if (activity) {
          setSelectedTourId(activity.tour_id);
        }
      }
    } catch (error) {
      console.error('Error loading survey:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingSurvey(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const templatesData = await surveyService.getSurveyTemplates();
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadTours = async () => {
    try {
      const response = await tourService.getAll();
      setTours(response.tours);
    } catch (error) {
      console.error('Error loading tours:', error);
    }
  };

  const loadActivities = async () => {
    try {
      const response = await activityService.getAllActivities();
      setActivities(response.activities);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const handleSave = async () => {
    console.log('=== HANDLE SAVE STARTED ===');
    console.log('Title:', title);
    console.log('Type:', type);
    console.log('Selected Tour ID:', selectedTourId);
    console.log('Selected Activity ID:', selectedActivityId);

    if (!title.trim()) {
      console.log('VALIDATION FAILED: No title');
      alert('Please enter a survey title');
      return;
    }

    // Validate mandatory tour connection for TOUR_COMPLETION
    if (type === 'TOUR_COMPLETION' && !selectedTourId) {
      console.log('VALIDATION FAILED: TOUR_COMPLETION needs tour');
      alert('Please select a tour for Tour Completion surveys');
      return;
    }

    // Validate mandatory connections for ACTIVITY_FEEDBACK
    if (type === 'ACTIVITY_FEEDBACK') {
      if (!selectedTourId) {
        console.log('VALIDATION FAILED: ACTIVITY_FEEDBACK needs tour');
        alert('Please select a tour first for Activity Feedback surveys');
        return;
      }
      if (!selectedActivityId) {
        console.log('VALIDATION FAILED: ACTIVITY_FEEDBACK needs activity');
        alert('Please select an activity for Activity Feedback surveys');
        return;
      }
    }

    console.log('Validation passed, preparing survey data...');

    setIsSaving(true);
    try {
      // Build survey data based on type to respect database constraint
      // (survey can have tour_id OR activity_id, but not both)
      const surveyData: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        questions: questions.map((q, index) => ({
          question_text: q.question_text,
          question_type: q.question_type,
          is_required: q.is_required,
          order_index: index,
          description: q.description,
          validation_rules: q.validation_rules,
          options: q.options?.map((opt, optIndex) => ({
            option_text: opt.option_text,
            order_index: optIndex,
            is_other: opt.is_other,
          })),
        })),
      };

      // Add appropriate link based on survey type
      // Database constraint: survey can have tour_id OR activity_id, but not both
      if (type === 'ACTIVITY_FEEDBACK') {
        // For activity feedback, only save activity_id and explicitly clear tour_id
        surveyData.activity_id = selectedActivityId || undefined;
        surveyData.tour_id = null;
        console.log('ACTIVITY_FEEDBACK: Set activity_id =', surveyData.activity_id, ', tour_id = null');
      } else if (type === 'TOUR_COMPLETION' || type === 'TOUR_APPLICATION') {
        // For tour-related surveys, only save tour_id and explicitly clear activity_id
        surveyData.tour_id = selectedTourId || undefined;
        surveyData.activity_id = null;
        console.log('TOUR survey: Set tour_id =', surveyData.tour_id, ', activity_id = null');
      } else {
        // For CUSTOM surveys, clear both links
        surveyData.tour_id = null;
        surveyData.activity_id = null;
        console.log('CUSTOM: Both tour_id and activity_id = null');
      }

      console.log('Final surveyData:', surveyData);

      if (isEditing && survey) {
        console.log('Updating survey ID:', survey.id);
        await surveyService.updateSurvey(survey.id, surveyData);
        console.log('Update successful');
      } else {
        console.log('Creating new survey');
        await surveyService.createSurvey(surveyData);
        console.log('Create successful');
      }

      console.log('Navigating to /surveys');
      navigate('/surveys');
    } catch (error) {
      console.error('Error saving survey:', error);
      alert('Failed to save survey. Please try again.');
    } finally {
      setIsSaving(false);
      console.log('=== HANDLE SAVE ENDED ===');
    }
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionForm({
      question_text: '',
      question_type: 'TEXT',
      is_required: false,
      order_index: questions.length,
      description: '',
      options: [],
    });
    setShowQuestionDialog(true);
  };

  const handleEditQuestion = (question: SurveyQuestion) => {
    setEditingQuestion(question);
    setQuestionForm({
      question_text: question.question_text,
      question_type: question.question_type,
      is_required: question.is_required,
      order_index: question.order_index,
      description: question.description || '',
      options: question.options?.map(opt => ({
        option_text: opt.option_text,
        order_index: opt.order_index,
        is_other: opt.is_other,
      })) || [],
    });
    setShowQuestionDialog(true);
  };

  const handleSaveQuestion = () => {
    if (!questionForm.question_text.trim()) {
      alert('Please enter a question');
      return;
    }

    const newQuestion: SurveyQuestion = {
      id: editingQuestion?.id || Date.now(), // Temporary ID for new questions
      survey_id: survey?.id || 0,
      question_text: questionForm.question_text.trim(),
      question_type: questionForm.question_type,
      is_required: questionForm.is_required,
      order_index: questionForm.order_index,
      description: questionForm.description?.trim(),
      validation_rules: questionForm.validation_rules,
      options: questionForm.options,
    };

    if (editingQuestion) {
      setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? newQuestion : q));
    } else {
      setQuestions(prev => [...prev, newQuestion]);
    }

    setShowQuestionDialog(false);
  };

  const handleDeleteQuestion = (questionId: number) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const handleMoveQuestion = (questionId: number, direction: 'up' | 'down') => {
    const currentIndex = questions.findIndex(q => q.id === questionId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    const newQuestions = [...questions];
    [newQuestions[currentIndex], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[currentIndex]];
    
    // Update order_index
    newQuestions.forEach((q, index) => {
      q.order_index = index;
    });
    
    setQuestions(newQuestions);
  };

  const handleAddOption = () => {
    setQuestionForm(prev => ({
      ...prev,
      options: [
        ...(prev.options || []),
        {
          option_text: '',
          order_index: (prev.options?.length || 0),
          is_other: false,
        },
      ],
    }));
  };

  const handleUpdateOption = (index: number, field: string, value: any) => {
    setQuestionForm(prev => ({
      ...prev,
      options: prev.options?.map((opt, i) => 
        i === index ? { ...opt, [field]: value } : opt
      ) || [],
    }));
  };

  const handleRemoveOption = (index: number) => {
    setQuestionForm(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleUseTemplate = async (template: SurveyTemplate) => {
    try {
      const templateData = template.template_data;
      setType(template.type);
      
      if (templateData.questions) {
        const templateQuestions: SurveyQuestion[] = templateData.questions.map((q: any, index: number) => ({
          id: Date.now() + index,
          survey_id: 0,
          question_text: q.text || q.question_text,
          question_type: q.type || q.question_type,
          is_required: q.required || q.is_required || false,
          order_index: index,
          description: q.description,
          validation_rules: q.validation || q.validation_rules,
          options: q.options?.map((opt: any, optIndex: number) => ({
            id: Date.now() + index + optIndex,
            question_id: 0,
            option_text: typeof opt === 'string' ? opt : opt.option_text,
            order_index: optIndex,
            is_other: typeof opt === 'object' ? opt.is_other || false : false,
          })),
        }));
        
        setQuestions(templateQuestions);
      }
      
      setShowTemplateDialog(false);
    } catch (error) {
      console.error('Error applying template:', error);
      alert('Failed to apply template');
    }
  };

  const renderQuestionTypeSelector = () => (
    <div className="space-y-2">
      <Label htmlFor="questionType">Question Type</Label>
      <Select
        value={questionForm.question_type}
        onValueChange={(value: QuestionType) => setQuestionForm(prev => ({ ...prev, question_type: value }))}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TEXT">Short Text</SelectItem>
          <SelectItem value="TEXTAREA">Long Text</SelectItem>
          <SelectItem value="MULTIPLE_CHOICE">Multiple Choice</SelectItem>
          <SelectItem value="CHECKBOX">Checkbox</SelectItem>
          <SelectItem value="RATING">Rating (1-5 stars)</SelectItem>
          <SelectItem value="YES_NO">Yes/No</SelectItem>
          <SelectItem value="NUMBER">Number</SelectItem>
          <SelectItem value="DATE">Date</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const renderOptionsEditor = () => {
    if (!['MULTIPLE_CHOICE', 'CHECKBOX'].includes(questionForm.question_type)) {
      return null;
    }

    return (
      <div className="space-y-2">
        <Label>Options</Label>
        {questionForm.options?.map((option, index) => (
          <div key={index} className="flex gap-2 items-center">
            <Input
              value={option.option_text}
              onChange={(e) => handleUpdateOption(index, 'option_text', e.target.value)}
              placeholder={`Option ${index + 1}`}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleRemoveOption(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={handleAddOption}>
          <Plus className="h-4 w-4 mr-2" />
          Add Option
        </Button>
      </div>
    );
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Survey' : 'Create New Survey'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isEditing ? 'Update your survey details and questions' : 'Build a custom survey or start from a template'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/surveys')}>
            Cancel
          </Button>
          {!isEditing && (
            <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Use Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Choose a Template</DialogTitle>
                  <DialogDescription>
                    Start with a pre-built survey template
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  {templates.map((template) => (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <CardContent className="p-4">
                        <h3 className="font-medium">{template.name}</h3>
                        <p className="text-sm text-gray-600">{template.description}</p>
                        <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          {template.type.replace('_', ' ')}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Survey'}
          </Button>
        </div>
      </div>

      {/* Survey Details */}
      <Card>
        <CardHeader>
          <CardTitle>Survey Details</CardTitle>
          <CardDescription>
            Basic information about your survey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Survey Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter survey title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Survey Type</Label>
              <Select value={type} onValueChange={(value: SurveyType) => setType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TOUR_APPLICATION">Tour Application</SelectItem>
                  <SelectItem value="ACTIVITY_FEEDBACK">Activity Feedback</SelectItem>
                  <SelectItem value="TOUR_COMPLETION">Tour Completion</SelectItem>
                  <SelectItem value="CUSTOM">Custom Survey</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter survey description"
              rows={3}
            />
          </div>

          {(type === 'TOUR_APPLICATION' || type === 'TOUR_COMPLETION') && (
            <div className="space-y-2">
              <Label htmlFor="tourId">
                Link to Tour {type === 'TOUR_COMPLETION' ? '*' : '(Optional)'}
              </Label>
              <Select
                value={selectedTourId?.toString() || ''}
                onValueChange={(value) => setSelectedTourId(value && value !== 'none' ? parseInt(value) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a tour" />
                </SelectTrigger>
                <SelectContent>
                  {type === 'TOUR_APPLICATION' && <SelectItem value="none">No specific tour</SelectItem>}
                  {tours.map((tour) => (
                    <SelectItem key={tour.id} value={tour.id.toString()}>
                      {tour.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === 'ACTIVITY_FEEDBACK' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="tourId">Link to Tour *</Label>
                <Select
                  value={selectedTourId?.toString() || ''}
                  onValueChange={(value) => setSelectedTourId(value ? parseInt(value) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tour first" />
                  </SelectTrigger>
                  <SelectContent>
                    {tours.map((tour) => (
                      <SelectItem key={tour.id} value={tour.id.toString()}>
                        {tour.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="activityId">Link to Activity *</Label>
                <Select
                  value={selectedActivityId?.toString() || ''}
                  onValueChange={(value) => setSelectedActivityId(value ? parseInt(value) : null)}
                  disabled={!selectedTourId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedTourId ? "Select an activity" : "Select a tour first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {activities
                      .filter((activity) => activity.tour_id === selectedTourId)
                      .map((activity) => (
                        <SelectItem key={activity.id} value={activity.id.toString()}>
                          {activity.title} {activity.company_name && `- ${activity.company_name}`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Questions</CardTitle>
              <CardDescription>
                Add and organize your survey questions
              </CardDescription>
            </div>
            <Button onClick={handleAddQuestion}>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No questions added yet.</p>
              <Button className="mt-4" onClick={handleAddQuestion}>
                Add Your First Question
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-500">
                          Question {index + 1}
                        </span>
                        {question.is_required && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            Required
                          </span>
                        )}
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {question.question_type.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="font-medium mb-1">{question.question_text}</h3>
                      {question.description && (
                        <p className="text-sm text-gray-600 mb-2">{question.description}</p>
                      )}
                      {question.options && question.options.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">Options:</p>
                          <ul className="text-sm text-gray-600">
                            {question.options.map((option, optIndex) => (
                              <li key={optIndex}>• {option.option_text}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveQuestion(question.id, 'up')}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveQuestion(question.id, 'down')}
                        disabled={index === questions.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditQuestion(question)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteQuestion(question.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Dialog */}
      <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? 'Edit Question' : 'Add New Question'}
            </DialogTitle>
            <DialogDescription>
              Configure your survey question
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="questionText">Question Text *</Label>
              <Textarea
                id="questionText"
                value={questionForm.question_text}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, question_text: e.target.value }))}
                placeholder="Enter your question"
                rows={2}
              />
            </div>

            {renderQuestionTypeSelector()}

            <div className="space-y-2">
              <Label htmlFor="questionDescription">Description (Optional)</Label>
              <Input
                id="questionDescription"
                value={questionForm.description}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Additional context or instructions"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isRequired"
                checked={questionForm.is_required}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, is_required: e.target.checked }))}
              />
              <Label htmlFor="isRequired">Required question</Label>
            </div>

            {renderOptionsEditor()}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowQuestionDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveQuestion}>
                {editingQuestion ? 'Update Question' : 'Add Question'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};