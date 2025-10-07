import api from './api';
import { Survey, SurveyTemplate, CreateSurveyData, SurveyResponse, SurveyResponseStats, CreateQuestionData, SurveyType, SurveyStatus } from '../types/api';

export const surveyService = {
  // Survey CRUD operations
  createSurvey: async (surveyData: CreateSurveyData): Promise<Survey> => {
    const response = await api.post('/surveys', surveyData);
    return response.data;
  },

  getAllSurveys: async (filters?: { type?: SurveyType; status?: SurveyStatus; tour_id?: number; activity_id?: number }): Promise<Survey[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    const response = await api.get(`/surveys?${params.toString()}`);
    return response.data;
  },

  getSurveyById: async (id: number): Promise<Survey> => {
    const response = await api.get(`/surveys/${id}`);
    return response.data;
  },

  updateSurvey: async (id: number, updateData: Partial<Survey>): Promise<Survey> => {
    const response = await api.put(`/surveys/${id}`, updateData);
    return response.data;
  },

  deleteSurvey: async (id: number): Promise<void> => {
    await api.delete(`/surveys/${id}`);
  },

  // Question management
  addQuestion: async (surveyId: number, questionData: CreateQuestionData): Promise<any> => {
    const response = await api.post(`/surveys/${surveyId}/questions`, questionData);
    return response.data;
  },

  updateQuestion: async (questionId: number, updateData: Partial<CreateQuestionData>): Promise<any> => {
    const response = await api.put(`/questions/${questionId}`, updateData);
    return response.data;
  },

  deleteQuestion: async (questionId: number): Promise<void> => {
    await api.delete(`/questions/${questionId}`);
  },

  // Survey templates
  getSurveyTemplates: async (type?: SurveyType): Promise<SurveyTemplate[]> => {
    const params = type ? `?type=${type}` : '';
    const response = await api.get(`/survey-templates${params}`);
    return response.data;
  },

  createSurveyFromTemplate: async (templateId: number, title: string, tourId?: number, activityId?: number): Promise<Survey> => {
    const response = await api.post('/survey-templates/create', {
      templateId,
      title,
      tourId,
      activityId,
    });
    return response.data;
  },

  // Survey responses and analytics
  getSurveyResponses: async (surveyId: number, includeDetails: boolean = false): Promise<SurveyResponse[]> => {
    const params = includeDetails ? '?includeDetails=true' : '';
    const response = await api.get(`/surveys/${surveyId}/responses${params}`);
    return response.data;
  },

  getSurveyStats: async (surveyId: number): Promise<SurveyResponseStats> => {
    const response = await api.get(`/surveys/${surveyId}/stats`);
    return response.data;
  },

  // Tour and activity specific surveys
  getTourSurveys: async (tourId: number): Promise<Survey[]> => {
    const response = await api.get(`/tours/${tourId}/surveys`);
    return response.data;
  },

  getActivitySurveys: async (activityId: number): Promise<Survey[]> => {
    const response = await api.get(`/activities/${activityId}/surveys`);
    return response.data;
  },

  // Export functionality
  exportSurveyResponses: async (surveyId: number, format: 'csv' | 'json' = 'csv'): Promise<Blob> => {
    const response = await api.get(`/surveys/${surveyId}/export?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Survey publishing and status management
  publishSurvey: async (surveyId: number): Promise<Survey> => {
    const response = await api.put(`/surveys/${surveyId}`, { status: 'ACTIVE' });
    return response.data;
  },

  archiveSurvey: async (surveyId: number): Promise<Survey> => {
    const response = await api.put(`/surveys/${surveyId}`, { status: 'ARCHIVED' });
    return response.data;
  },

  // Survey assignment
  assignSurveyToTour: async (surveyId: number, tourId: number, type: 'application' | 'completion'): Promise<void> => {
    const fieldName = type === 'application' ? 'application_survey_id' : 'completion_survey_id';
    await api.put(`/tours/${tourId}`, { [fieldName]: surveyId });
  },

  assignSurveyToActivity: async (surveyId: number, activityId: number): Promise<void> => {
    await api.put(`/activities/${activityId}`, { feedback_survey_id: surveyId });
  },

  // Bulk operations
  duplicateSurvey: async (surveyId: number, newTitle: string): Promise<Survey> => {
    const response = await api.post(`/surveys/${surveyId}/duplicate`, { title: newTitle });
    return response.data;
  },

  // Public access management
  generatePublicLink: async (surveyId: number): Promise<{ token: string; public_url: string; expires_at: string }> => {
    const response = await api.post(`/surveys/${surveyId}/generate-public-link`);
    return response.data;
  },

  revokePublicAccess: async (surveyId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/surveys/${surveyId}/revoke-public-link`);
    return response.data;
  },
};