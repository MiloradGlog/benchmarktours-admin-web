import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, MapPin, Users, Calendar, MessageSquare, Briefcase } from 'lucide-react';
import { getDashboardStats, getRecentActivity, DashboardStats, RecentActivity } from '@/services/dashboardService';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsData, activityData] = await Promise.all([
          getDashboardStats(),
          getRecentActivity()
        ]);
        setStats(statsData);
        setRecentActivity(activityData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleNavigateToCompanies = () => navigate('/companies');
  const handleNavigateToTours = () => navigate('/tours');
  const handleNavigateToUsers = () => navigate('/users');

  // Helper function to get icon and color for activity type
  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user':
        return { icon: Users, color: 'bg-green-500' };
      case 'tour':
        return { icon: MapPin, color: 'bg-blue-500' };
      case 'company':
        return { icon: Building2, color: 'bg-yellow-500' };
      case 'activity':
        return { icon: Briefcase, color: 'bg-purple-500' };
      case 'message':
        return { icon: MessageSquare, color: 'bg-pink-500' };
      default:
        return { icon: Calendar, color: 'bg-gray-500' };
    }
  };

  // Helper function to format relative time
  const getRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return past.toLocaleDateString();
  };

  const statCards = stats ? [
    {
      title: 'Total Companies',
      value: stats.totalCompanies.toString(),
      description: 'Companies in database',
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Tours',
      value: stats.activeTours.toString(),
      description: 'Currently running tours',
      icon: MapPin,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers.toString(),
      description: 'Registered participants',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Upcoming Tours',
      value: stats.upcomingTours.toString(),
      description: 'Tours starting soon',
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to the Benchmarking Tours Admin Panel. Here's an overview of your system.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 ${stat.bgColor} rounded-md`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions in your system</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => {
                  const { color } = getActivityIcon(activity.type);
                  return (
                    <div key={index} className="flex items-center space-x-4">
                      <div className={`w-2 h-2 ${color} rounded-full`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-gray-500">{getRelativeTime(activity.timestamp)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={handleNavigateToCompanies}
                className="flex items-center space-x-2 p-3 text-left hover:bg-gray-50 rounded-md transition-colors"
              >
                <Building2 className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Add New Company</span>
              </button>
              <button
                onClick={handleNavigateToTours}
                className="flex items-center space-x-2 p-3 text-left hover:bg-gray-50 rounded-md transition-colors"
              >
                <MapPin className="h-5 w-5 text-green-600" />
                <span className="font-medium">Create New Tour</span>
              </button>
              <button
                onClick={handleNavigateToUsers}
                className="flex items-center space-x-2 p-3 text-left hover:bg-gray-50 rounded-md transition-colors"
              >
                <Users className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Manage Users</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};