import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { CompaniesPage } from '@/pages/CompaniesPage';
import { ToursPage } from '@/pages/ToursPage';
import { TourDetailsPage } from '@/pages/TourDetailsPage';
import { TourItineraryPage } from '@/pages/TourItineraryPage';
import { TourParticipantsPage } from '@/pages/TourParticipantsPage';
import { UsersPage } from '@/pages/UsersPage';
import { ReviewsPage } from '@/pages/ReviewsPage';
import { SurveysPage } from '@/pages/SurveysPage';
import { SurveyBuilderPage } from '@/pages/SurveyBuilderPage';
import { SurveyViewPage } from '@/pages/SurveyViewPage';
import { SurveyResponsesPage } from '@/pages/SurveyResponsesPage';
import { PublicSurveyPage } from '@/pages/PublicSurveyPage';
import { PasswordResetRequestsPage } from '@/pages/PasswordResetRequestsPage';
import { AdminSetupPage } from '@/pages/AdminSetupPage';
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage';
import { TermsOfServicePage } from '@/pages/TermsOfServicePage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin-setup" element={<AdminSetupPage />} />
          <Route path="/public/survey/:token" element={<PublicSurveyPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute requireAdmin>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="companies" element={<CompaniesPage />} />
            <Route path="tours" element={<ToursPage />} />
            <Route path="tours/:tourId" element={<TourDetailsPage />} />
            <Route path="tours/:tourId/itinerary" element={<TourItineraryPage />} />
            <Route path="tours/:tourId/participants" element={<TourParticipantsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="password-resets" element={<PasswordResetRequestsPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="surveys" element={<SurveysPage />} />
            <Route path="surveys/create" element={<SurveyBuilderPage />} />
            <Route path="surveys/edit/:id" element={<SurveyBuilderPage />} />
            <Route path="surveys/view/:id" element={<SurveyViewPage />} />
            <Route path="surveys/:id/responses" element={<SurveyResponsesPage />} />
            <Route path="" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;