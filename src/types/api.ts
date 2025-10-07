export interface Company {
  id: number;
  name: string;
  address?: string;
  website?: string;
  description?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export type TourStatus = 'Draft' | 'Pending' | 'Completed';

export interface Tour {
  id: number;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: TourStatus;
  survey_url?: string;
  theme_primary_color?: string;
  theme_logo_url?: string;
  created_at: string;
  updated_at: string;
}

export type ActivityType = 'CompanyVisit' | 'Hotel' | 'Restaurant' | 'Travel';

export interface Activity {
  id: number;
  tour_id: number;
  company_id?: number;
  company_name?: string;
  type: ActivityType;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location_details?: string;
  survey_url?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  // Rating fields
  average_rating?: number;
  total_reviews?: number;
}

export interface ActivityReview {
  id: number;
  user_id: string;
  activity_id: number;
  rating: number;
  review_text?: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  activity_title?: string;
}

export interface ActivityReviewStats {
  activity_id: number;
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    [key: number]: number;
  };
}

// Survey Types
export type SurveyType = 'TOUR_APPLICATION' | 'ACTIVITY_FEEDBACK' | 'TOUR_COMPLETION' | 'CUSTOM';
export type SurveyStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type QuestionType = 'TEXT' | 'TEXTAREA' | 'MULTIPLE_CHOICE' | 'CHECKBOX' | 'RATING' | 'DATE' | 'NUMBER' | 'YES_NO';

export interface Survey {
  id: number;
  title: string;
  description?: string;
  type: SurveyType;
  status: SurveyStatus;
  tour_id?: number;
  activity_id?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  archived_at?: string;
  public_access_token?: string;
  allow_public_access?: boolean;
  public_access_created_at?: string;
  public_access_expires_at?: string;
  questions?: SurveyQuestion[];
}

export interface SurveyQuestion {
  id: number;
  survey_id: number;
  question_text: string;
  question_type: QuestionType;
  is_required: boolean;
  order_index: number;
  description?: string;
  validation_rules?: any;
  options?: QuestionOption[];
}

export interface QuestionOption {
  id: number;
  question_id: number;
  option_text: string;
  order_index: number;
  is_other: boolean;
}

export interface CreateSurveyData {
  title: string;
  description?: string;
  type: SurveyType;
  tour_id?: number;
  activity_id?: number;
  questions?: CreateQuestionData[];
}

export interface CreateQuestionData {
  question_text: string;
  question_type: QuestionType;
  is_required: boolean;
  order_index: number;
  description?: string;
  validation_rules?: any;
  options?: CreateOptionData[];
}

export interface CreateOptionData {
  option_text: string;
  order_index: number;
  is_other?: boolean;
}

export interface SurveyTemplate {
  id: number;
  name: string;
  description?: string;
  type: SurveyType;
  template_data: any;
  is_system: boolean;
}

export interface SurveyResponse {
  id: number;
  survey_id: number;
  user_id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  started_at: string;
  submitted_at?: string;
  is_complete: boolean;
  responses?: QuestionResponse[];
}

export interface QuestionResponse {
  id: number;
  response_id: number;
  question_id: number;
  text_response?: string;
  number_response?: number;
  date_response?: string;
  selected_option_ids?: number[];
  rating_response?: number;
}

export interface SurveyResponseStats {
  survey_id: number;
  total_responses: number;
  completed_responses: number;
  completion_rate: number;
  average_completion_time?: number;
  question_stats: QuestionStats[];
}

export interface QuestionStats {
  question_id: number;
  question_text: string;
  question_type: string;
  response_count: number;
  average_rating?: number;
  rating_distribution?: { [key: number]: number };
  option_counts?: { [optionId: number]: { text: string; count: number; percentage: number } };
  sample_responses?: string[];
  yes_count?: number;
  no_count?: number;
}

export interface CreateActivityData {
  company_id?: number;
  type: ActivityType;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location_details?: string;
  survey_url?: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'Admin' | 'User' | 'Guide';
}

export interface TourParticipant {
  id: number;
  tour_id: number;
  user_id: string;
  assigned_at: string;
  user: User;
}