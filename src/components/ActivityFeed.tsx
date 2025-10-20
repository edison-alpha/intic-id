import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Clock,
  Users,
  TrendingUp,
  Calendar,
  Ticket,
  Award,
  ShoppingCart,
  RefreshCw,
  Filter,
  ArrowRight,
  ExternalLink,
  Share2,
  Heart,
  MessageCircle,
  Eye,
  Rocket
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { getGlobalActivity, getUserActivity } from '@/services/activityService';
import { useNavigate } from 'react-router-dom';

interface ActivityItem {
  id: string;
  type: 'purchase' | 'sale' | 'transfer' | 'event_attend' | 'badge_earned' | 'stake' | 'reward' | 'referral' | 'social' | 'deploy';
  timestamp: string;
  user: {
    address: string;
    avatar?: string;
    displayName?: string;
    tier: string;
  };
  data: {
    title: string;
    description: string;
    amount?: string;
    currency?: string;
    event?: {
      name: string;
      image: string;
      date: string;
      contractId?: string;
    };
    ticket?: {
      id: string;
      section: string;
      tier: string;
    };
    badge?: {
      name: string;
      tier: number;
      rarity: string;
      image: string;
    };
    transaction?: {
      hash: string;
      block: number;
    };
    social?: {
      likes: number;
      comments: number;
      shares: number;
      isLiked: boolean;
    };
    deployment?: {
      contractId: string;
      contractName: string;
    };
  };
  metadata: {
    network: string;
    platform: string;
    category: string;
    isVerified: boolean;
    isPublic: boolean;
  };
}

interface ActivityFeedProps {
  userId?: string;
  showUserActivity?: boolean;
  showGlobalActivity?: boolean;
  maxItems?: number;
  className?: string;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  userId,
  showUserActivity = false,
  showGlobalActivity = true,
  maxItems = 20,
  className = ''
}) => {
  const navigate = useNavigate();
  const [allActivities, setAllActivities] = useState<ActivityItem[]>([]); // Store all fetched activities
  const [displayedActivities, setDisplayedActivities] = useState<ActivityItem[]>([]); // Activities currently shown
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<'all' | 'purchase' | 'event' | 'badge' | 'social' | 'deploy'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchActivities();
  }, [userId, showUserActivity, showGlobalActivity]);

  useEffect(() => {
    // Apply filter and pagination when filter changes
    applyFilterAndPagination();
  }, [filter, allActivities, page]);

  const fetchActivities = async () => {
    setLoading(true);
    setPage(1); // Reset to page 1 on new fetch
    try {
      // Fetch real blockchain activities
      let fetchedActivities: ActivityItem[] = [];

      if (showUserActivity && userId) {
        // Fetch user-specific activity (optimized)
        fetchedActivities = await getUserActivity(userId, 30);
      } else if (showGlobalActivity) {
        // Fetch global activity (optimized for fast initial load)
        fetchedActivities = await getGlobalActivity(30);
      }

      setAllActivities(fetchedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activity feed');
      setAllActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilterAndPagination = () => {
    // Apply filter
    const filteredActivities = filter === 'all'
      ? allActivities
      : allActivities.filter(activity => {
          switch (filter) {
            case 'purchase':
              return ['purchase', 'sale'].includes(activity.type);
            case 'event':
              return activity.type === 'event_attend';
            case 'badge':
              return activity.type === 'badge_earned';
            case 'social':
              return ['referral', 'social'].includes(activity.type);
            case 'deploy':
              return activity.type === 'deploy';
            default:
              return true;
          }
        });

    // Apply pagination
    const startIndex = 0;
    const endIndex = page * ITEMS_PER_PAGE;
    setDisplayedActivities(filteredActivities.slice(startIndex, endIndex));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchActivities();
    setRefreshing(false);
    toast.success('Activity feed refreshed');
  };

  const handleLike = async (activityId: string) => {
    const activity = displayedActivities.find((a: ActivityItem) => a.id === activityId);
    if (!activity?.data.social) return;

    const updatedActivities = allActivities.map((a: ActivityItem) => {
      if (a.id === activityId && a.data.social) {
        return {
          ...a,
          data: {
            ...a.data,
            social: {
              ...a.data.social,
              likes: a.data.social.isLiked
                ? a.data.social.likes - 1
                : a.data.social.likes + 1,
              isLiked: !a.data.social.isLiked
            }
          }
        };
      }
      return a;
    });

    setAllActivities(updatedActivities);
    toast.success(activity.data.social.isLiked ? 'Unliked' : 'Liked!');
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    setPage(prevPage => prevPage + 1);
    setTimeout(() => setLoadingMore(false), 500); // Small delay for visual feedback
  };

  const handleShare = (activity: ActivityItem) => {
    const shareText = `Check out this activity: ${activity.data.title} on Pulse Robot Platform`;
    const shareUrl = `https://pulse-robot.com/activity/${activity.id}`;

    if (navigator.share) {
      navigator.share({
        title: activity.data.title,
        text: shareText,
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      toast.success('Activity link copied to clipboard');
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'purchase':
      case 'sale':
        return ShoppingCart;
      case 'transfer':
        return ArrowRight;
      case 'event_attend':
        return Calendar;
      case 'badge_earned':
        return Award;
      case 'stake':
      case 'reward':
        return TrendingUp;
      case 'referral':
        return Users;
      case 'deploy':
        return Rocket;
      default:
        return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'from-blue-500 to-blue-600';
      case 'sale':
        return 'from-green-500 to-green-600';
      case 'transfer':
        return 'from-indigo-500 to-indigo-600';
      case 'event_attend':
        return 'from-purple-500 to-purple-600';
      case 'badge_earned':
        return 'from-yellow-500 to-yellow-600';
      case 'reward':
      case 'stake':
        return 'from-emerald-500 to-emerald-600';
      case 'referral':
        return 'from-pink-500 to-pink-600';
      case 'deploy':
        return 'from-orange-500 to-orange-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'platinum':
        return 'text-gray-300';
      case 'gold':
        return 'text-yellow-400';
      case 'silver':
        return 'text-gray-400';
      default:
        return 'text-orange-400';
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 p-4 bg-gray-700 rounded-lg">
            <div className="w-12 h-12 bg-gray-600 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-600 rounded w-3/4"></div>
              <div className="h-3 bg-gray-600 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Activity Feed</h2>
          <p className="text-gray-400 text-sm">Latest platform activities and updates</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'all', label: 'All Activity', icon: Activity },
          { id: 'purchase', label: 'Trading', icon: ShoppingCart },
          { id: 'deploy', label: 'Deployments', icon: Rocket },
          { id: 'event', label: 'Events', icon: Calendar },
          { id: 'badge', label: 'Badges', icon: Award },
          { id: 'social', label: 'Social', icon: Users }
        ].map((filterOption) => (
          <Button
            key={filterOption.id}
            variant={filter === filterOption.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(filterOption.id as any)}
            className={`flex items-center gap-2 whitespace-nowrap ${
              filter === filterOption.id ? 'bg-[#FE5C02]' : ''
            }`}
          >
            <filterOption.icon className="w-4 h-4" />
            {filterOption.label}
          </Button>
        ))}
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {displayedActivities.map((activity) => {
          const Icon = getActivityIcon(activity.type);
          return (
            <Card key={activity.id} className="bg-[#1A1A1A] border-gray-800">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getActivityColor(activity.type)} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{activity.data.title}</p>
                          {activity.metadata.isVerified && (
                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mb-1">{activity.data.description}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </span>
                          <span className={`font-medium ${getTierColor(activity.user.tier)}`}>
                            {activity.user.tier}
                          </span>
                          <span className="font-mono">
                            {activity.user.displayName ||
                             `${activity.user.address.slice(0, 6)}...${activity.user.address.slice(-4)}`}
                          </span>
                        </div>
                      </div>

                      {/* Amount/Value */}
                      {activity.data.amount && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-white font-bold">
                            {activity.data.amount} {activity.data.currency}
                          </p>
                          {activity.data.transaction && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`https://explorer.hiro.so/txid/${activity.data.transaction?.hash}?chain=testnet`, '_blank')}
                              title="View on Explorer"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Deployment link */}
                      {activity.type === 'deploy' && activity.data.deployment && (
                        <div className="text-right flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`https://explorer.hiro.so/txid/${activity.data.transaction?.hash}?chain=testnet`, '_blank')}
                            title="View Deployment"
                            className="text-orange-500 hover:text-orange-400"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Event/Badge Details (skip for deploy type as it has its own card) */}
                    {activity.data.event && activity.type !== 'deploy' && (
                      <div
                        className="flex items-center gap-3 p-3 bg-[#0A0A0A] rounded-lg mb-3 cursor-pointer hover:bg-[#1A1A1A] transition-colors"
                        onClick={() => {
                          if (activity.data.event?.contractId) {
                            navigate(`/app/event/${activity.data.event.contractId}`);
                          }
                        }}
                      >
                        <img
                          src={activity.data.event.image}
                          alt={activity.data.event.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-white font-medium text-sm flex items-center gap-2">
                            {activity.data.event.name}
                            {activity.data.event.contractId && (
                              <ExternalLink className="w-3 h-3 text-gray-400" />
                            )}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {new Date(activity.data.event.date).toLocaleDateString()}
                          </p>
                        </div>
                        {activity.data.ticket && (
                          <div className="text-right">
                            <Badge className="bg-[#FE5C02]">{activity.data.ticket.tier}</Badge>
                            <p className="text-gray-400 text-xs mt-1">{activity.data.ticket.section}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Deployment Details */}
                    {activity.data.deployment && (
                      <div
                        className="flex items-center gap-3 p-3 bg-[#0A0A0A] rounded-lg mb-3 border border-orange-500/20 cursor-pointer hover:bg-[#1A1A1A] transition-colors"
                        onClick={() => {
                          if (activity.data.event?.contractId) {
                            navigate(`/app/event/${activity.data.event.contractId}`);
                          }
                        }}
                      >
                        {/* Event Image or Rocket Icon */}
                        {activity.data.event?.image ? (
                          <img
                            src={activity.data.event.image}
                            alt={activity.data.deployment.contractName}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center">
                            <Rocket className="w-6 h-6 text-white" />
                          </div>
                        )}

                        <div className="flex-1">
                          <p className="text-white font-medium text-sm flex items-center gap-2">
                            {activity.data.deployment.contractName}
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-gray-400 text-xs font-mono">
                              {activity.data.deployment.contractId?.split('.')[0]?.slice(0, 8)}...
                            </p>
                            {activity.data.event?.date && (
                              <>
                                <span className="text-gray-600">•</span>
                                <p className="text-gray-400 text-xs">
                                  {new Date(activity.data.event.date).toLocaleDateString()}
                                </p>
                              </>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://explorer.hiro.so/txid/${activity.data.transaction?.hash}?chain=testnet`, '_blank');
                          }}
                          className="text-orange-500 hover:text-orange-400"
                          title="View on Explorer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {activity.data.badge && (
                      <div className="flex items-center gap-3 p-3 bg-[#0A0A0A] rounded-lg mb-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                          <Award className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium text-sm">{activity.data.badge.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-gray-400 text-xs">Level {activity.data.badge.tier}</p>
                            <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                              {activity.data.badge.rarity}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Social Actions */}
                    {activity.data.social && activity.metadata.isPublic && (
                      <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleLike(activity.id)}
                            className={`flex items-center gap-1 text-sm transition-colors ${
                              activity.data.social.isLiked
                                ? 'text-red-500'
                                : 'text-gray-400 hover:text-red-500'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${activity.data.social.isLiked ? 'fill-current' : ''}`} />
                            {activity.data.social.likes}
                          </button>
                          <button className="flex items-center gap-1 text-sm text-gray-400 hover:text-blue-500 transition-colors">
                            <MessageCircle className="w-4 h-4" />
                            {activity.data.social.comments}
                          </button>
                          <button
                            onClick={() => handleShare(activity)}
                            className="flex items-center gap-1 text-sm text-gray-400 hover:text-green-500 transition-colors"
                          >
                            <Share2 className="w-4 h-4" />
                            {activity.data.social.shares}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                          <Eye className="w-4 h-4" />
                          <span className="text-xs">{activity.metadata.network}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination Info and Load More */}
      {!loading && displayedActivities.length > 0 && (
        <div className="space-y-3">
          {/* Pagination Info */}
          <div className="text-center text-sm text-gray-400">
            Showing {displayedActivities.length} of {
              filter === 'all'
                ? allActivities.length
                : allActivities.filter(activity => {
                    switch (filter) {
                      case 'purchase':
                        return ['purchase', 'sale'].includes(activity.type);
                      case 'event':
                        return activity.type === 'event_attend';
                      case 'badge':
                        return activity.type === 'badge_earned';
                      case 'social':
                        return ['referral', 'social'].includes(activity.type);
                      case 'deploy':
                        return activity.type === 'deploy';
                      default:
                        return true;
                    }
                  }).length
            } activities
            {page > 1 && ` (Page ${page})`}
          </div>

          {/* Load More Button */}
          {displayedActivities.length < (filter === 'all' ? allActivities.length : allActivities.filter(activity => {
            switch (filter) {
              case 'purchase':
                return ['purchase', 'sale'].includes(activity.type);
              case 'event':
                return activity.type === 'event_attend';
              case 'badge':
                return activity.type === 'badge_earned';
              case 'social':
                return ['referral', 'social'].includes(activity.type);
              case 'deploy':
                return activity.type === 'deploy';
              default:
                return true;
            }
          }).length) && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More Activities
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {displayedActivities.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Activity Found</h3>
          <p className="text-gray-400 mb-4">No activities match your current filter.</p>
          <Button onClick={() => setFilter('all')} variant="outline">
            Show All Activities
          </Button>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;