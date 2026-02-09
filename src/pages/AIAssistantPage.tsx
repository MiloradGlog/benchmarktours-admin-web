import React, { useState, useEffect } from 'react';
import { AIChat } from '../components/AIChat/AIChat';
import { tourService } from '../services/tourService';
import { aiService } from '../services/aiService';
import { Bot, Calendar, Info, AlertCircle } from 'lucide-react';
import { Tour } from '../types/api';

export const AIAssistantPage: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [selectedTourId, setSelectedTourId] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [aiStatus, setAIStatus] = useState<any>(null);

  useEffect(() => {
    fetchTours();
    fetchAIStatus();
  }, []);

  const fetchTours = async () => {
    try {
      const response = await tourService.getAll();
      setTours(response.tours || []);
      // Auto-select the first active tour
      const activeTour = response.tours?.find((t: Tour) => t.status === 'Pending' || t.status === 'Completed');
      if (activeTour) {
        setSelectedTourId(activeTour.id);
      }
    } catch (error) {
      console.error('Failed to fetch tours:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAIStatus = async () => {
    try {
      const response = await aiService.getStatus();
      setAIStatus(response);
    } catch (error) {
      console.error('Failed to fetch AI status:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Bot className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">AI Schedule Assistant</h1>
          </div>
          {aiStatus && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    aiStatus.status === 'operational' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="text-sm text-gray-600">
                  {aiStatus.status === 'operational' ? 'Operational' : 'Unavailable'}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {aiStatus.provider === 'gemini' ? '🤖 Gemini' : '🤖 OpenAI'} | {aiStatus.model}
              </span>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-900">
                The AI Assistant helps you manage tour schedules using natural language. You can:
              </p>
              <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                <li>Adjust multiple activity times at once</li>
                <li>Handle delays and schedule shifts</li>
                <li>Check for conflicts automatically</li>
                <li>Get smart suggestions for schedule optimization</li>
              </ul>
            </div>
          </div>
        </div>

        {false && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-yellow-900 font-semibold">Configuration Required</p>
                <p className="text-sm text-yellow-800 mt-1">
                  The OpenAI API key is not configured. Please add your API key to the backend
                  environment variables to enable the AI assistant.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tour Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Select Tour
            </h2>
            <select
              value={selectedTourId || ''}
              onChange={(e) => setSelectedTourId(Number(e.target.value) || undefined)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No specific tour</option>
              {tours.map((tour) => (
                <option key={tour.id} value={tour.id}>
                  {tour.name} ({tour.status})
                </option>
              ))}
            </select>

            {selectedTourId && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-medium mb-2">Tour Details</h3>
                {tours
                  .filter((t) => t.id === selectedTourId)
                  .map((tour) => (
                    <div key={tour.id} className="text-sm text-gray-600 space-y-1">
                      <p>Start: {new Date(tour.start_date).toLocaleDateString()}</p>
                      <p>End: {new Date(tour.end_date).toLocaleDateString()}</p>
                      <p>Status: {tour.status}</p>
                    </div>
                  ))}
              </div>
            )}

            {aiStatus?.metrics?.last30Days && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-medium mb-2">Usage Stats (30 days)</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Sessions: {aiStatus.metrics.last30Days.totalSessions}</p>
                  <p>Messages: {aiStatus.metrics.last30Days.totalMessages}</p>
                  <p>Approved: {aiStatus.metrics.last30Days.approvedChanges}</p>
                  <p>Rejected: {aiStatus.metrics.last30Days.rejectedChanges}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mt-4">
            <h3 className="text-sm font-medium mb-2">Example Prompts</h3>
            <div className="space-y-2">
              <div className="text-xs text-gray-600 p-2 bg-white rounded border border-gray-200">
                "Delay all activities by 30 minutes starting from 2 PM today"
              </div>
              <div className="text-xs text-gray-600 p-2 bg-white rounded border border-gray-200">
                "We're running one hour late for everything today"
              </div>
              <div className="text-xs text-gray-600 p-2 bg-white rounded border border-gray-200">
                "Move the afternoon activities 45 minutes earlier"
              </div>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <AIChat tourId={selectedTourId} />
        </div>
      </div>
    </div>
  );
};