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
  Eye
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface ActivityItem {
  id: string;
  type: 'purchase' | 'sale' | 'transfer' | 'event_attend' | 'badge_earned' | 'stake' | 'reward' | 'referral' | 'social';
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
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'purchase' | 'event' | 'badge' | 'social'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, [userId, showUserActivity, showGlobalActivity, filter]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual activity feed fetching
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'purchase',
          timestamp: '2025-06-15T14:30:00Z',
          user: {
            address: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
            displayName: 'CryptoFan123',
            tier: 'Gold'
          },
          data: {
            title: 'Purchased VIP Ticket',
            description: 'Bought 2x VIP tickets for Summer Music Festival',
            amount: '0.15',
            currency: 'sBTC',
            event: {
              name: 'Summer Music Festival 2025',
              image: '/src/img/banner (1).png',
              date: '2025-07-15'
            },
            ticket: {
              id: 'PRT-001234',
              section: 'VIP-A',
              tier: 'VIP'
            },
            transaction: {
              hash: '0x1234567890abcdef',
              block: 145692
            },
            social: {
              likes: 12,
              comments: 3,
              shares: 2,
              isLiked: false
            }
          },
          metadata: {
            network: 'Stacks',
            platform: 'Pulse Robot',
            category: 'NFT',
            isVerified: true,
            isPublic: true
          }
        },
        {
          id: '2',
          type: 'badge_earned',
          timestamp: '2025-06-15T13:45:00Z',
          user: {
            address: 'SP1HTBVD3JG9C05J7HBJTHGR0GGW7KX17ECNXF1DK',
            displayName: 'EventCollector',
            tier: 'Silver'
          },
          data: {
            title: 'Badge Unlocked',
            description: 'Earned "Music Enthusiast" Level 3 badge',
            badge: {
              name: 'Music Enthusiast',
              tier: 3,
              rarity: 'Rare',
              image: '/src/img/badges/music-enthusiast.png'
            },
            social: {
              likes: 25,
              comments: 8,
              shares: 5,
              isLiked: true
            }
          },
          metadata: {
            network: 'Stacks',
            platform: 'Pulse Robot',
            category: 'Achievement',
            isVerified: true,
            isPublic: true
          }
        },
        {
          id: '3',
          type: 'event_attend',
          timestamp: '2025-06-14T20:00:00Z',
          user: {
            address: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6NKMKW6T7',
            displayName: 'MusicLover99',
            tier: 'Platinum'
          },
          data: {
            title: 'Event Attended',
            description: 'Checked in at Jazz Night Live',
            event: {
              name: 'Jazz Night Live',
              image: '/background-section1.png',
              date: '2025-06-14'
            },
            social: {
              likes: 8,
              comments: 2,
              shares: 1,
              isLiked: false
            }
          },
          metadata: {
            network: 'Stacks',
            platform: 'Pulse Robot',
            category: 'Event',
            isVerified: true,
            isPublic: true
          }
        },
        {
          id: '4',
          type: 'sale',
          timestamp: '2025-06-14T16:22:00Z',
          user: {
            address: 'SP2XKZ2S2S5TY2PR8K7Y9NPQK3W4QJHX5D9MT8QR',
            displayName: 'TicketTrader',
            tier: 'Gold'
          },
          data: {
            title: 'Ticket Sold',
            description: 'Sold General Admission ticket on secondary market',
            amount: '0.08',
            currency: 'sBTC',
            event: {
              name: 'Web3 Conference 2025',
              image: '/background-section3.png',
              date: '2025-08-10'
            },
            transaction: {
              hash: '0xabcdef1234567890',
              block: 145680
            },
            social: {
              likes: 5,
              comments: 1,
              shares: 0,
              isLiked: false
            }
          },
          metadata: {
            network: 'Stacks',
            platform: 'Pulse Robot',
            category: 'Trade',
            isVerified: true,
            isPublic: true
          }
        },
        {
          id: '5',
          type: 'reward',
          timestamp: '2025-06-14T10:00:00Z',
          user: {
            address: 'SP1ABC123DEF456GHI789JKL012MNO345PQR678ST',
            displayName: 'StakingPro',
            tier: 'Platinum'
          },
          data: {
            title: 'Staking Reward',
            description: 'Received monthly staking rewards',
            amount: '2.5',
            currency: 'sBTC',
            social: {
              likes: 15,
              comments: 4,
              shares: 3,
              isLiked: true
            }
          },
          metadata: {
            network: 'Stacks',
            platform: 'Pulse Robot',
            category: 'DeFi',
            isVerified: true,
            isPublic: false
          }
        },
        {
          id: '6',
          type: 'referral',
          timestamp: '2025-06-13T14:30:00Z',
          user: {
            address: 'SP3XYZ789ABC123DEF456GHI789JKL012MNO345PQ',
            displayName: 'Ambassador1',
            tier: 'Gold'
          },
          data: {
            title: 'Referral Bonus',
            description: 'Earned referral bonus for bringing new user',
            amount: '0.01',
            currency: 'sBTC',
            social: {
              likes: 6,
              comments: 1,
              shares: 2,
              isLiked: false
            }
          },
          metadata: {
            network: 'Stacks',
            platform: 'Pulse Robot',
            category: 'Social',
            isVerified: true,
            isPublic: true
          }
        }
      ];

      const filteredActivities = filter === 'all'
        ? mockActivities
        : mockActivities.filter(activity => {
            switch (filter) {
              case 'purchase':
                return ['purchase', 'sale'].includes(activity.type);
              case 'event':
                return activity.type === 'event_attend';
              case 'badge':
                return activity.type === 'badge_earned';
              case 'social':
                return ['referral', 'social'].includes(activity.type);
              default:
                return true;
            }
          });

      setActivities(filteredActivities.slice(0, maxItems));
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activity feed');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchActivities();
    setRefreshing(false);
    toast.success('Activity feed refreshed');
  };

  const handleLike = async (activityId: string) => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity?.data.social) return;

    const updatedActivities = activities.map(a => {
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

    setActivities(updatedActivities);
    toast.success(activity.data.social.isLiked ? 'Unliked' : 'Liked!');
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
      case 'event_attend':
        return Calendar;
      case 'badge_earned':
        return Award;
      case 'stake':
      case 'reward':
        return TrendingUp;
      case 'referral':
        return Users;
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
      case 'event_attend':
        return 'from-purple-500 to-purple-600';
      case 'badge_earned':
        return 'from-yellow-500 to-yellow-600';
      case 'reward':
      case 'stake':
        return 'from-emerald-500 to-emerald-600';
      case 'referral':
        return 'from-pink-500 to-pink-600';
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
        {activities.map((activity) => {
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
                              onClick={() => window.open(`https://explorer.stacks.co/txid/${activity.data.transaction?.hash}`, '_blank')}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Event/Badge Details */}
                    {activity.data.event && (
                      <div className="flex items-center gap-3 p-3 bg-[#0A0A0A] rounded-lg mb-3">
                        <img
                          src={activity.data.event.image}
                          alt={activity.data.event.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-white font-medium text-sm">{activity.data.event.name}</p>
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

      {/* Load More */}
      {activities.length >= maxItems && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={fetchActivities}
            className="flex items-center gap-2"
          >
            Load More Activities
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Empty State */}
      {activities.length === 0 && !loading && (
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