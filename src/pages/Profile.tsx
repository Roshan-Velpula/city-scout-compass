
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Calendar, User, Loader2, Hash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface PersonalityTiles {
  "Lifestyle Vibes": string[];
  "Lifestyle Vibes Reason": string;
  "Food & Drink Favorites": string[];
  "Food & Drink Favorites Reason": string;
  "Go-to Activities": string[];
  "Go-to Activities Reason": string;
  "Favorite Neighborhoods or Place Types": string[];
  "Favorite Neighborhoods or Place Types Reason": string;
  "Travel & Exploration": string[];
  "Travel & Exploration Reason": string;
  "Other": string[];
  "Other Reason": string;
}

const Profile = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [personalityReport, setPersonalityReport] = useState<string | null>(null);
  const [personalityTiles, setPersonalityTiles] = useState<PersonalityTiles | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    const fetchPersonalityData = async () => {
      try {
        setLoading(true);
        
        // First get the tiles from the profile if available
        if (profile?.personality_tiles) {
          setPersonalityTiles(profile.personality_tiles as unknown as PersonalityTiles);
        }
        
        // Try to get the report from storage
        const userFolder = `user_data/${user.id}`;
        const { data, error } = await supabase.storage
          .from('user_files')
          .download(`${userFolder}/personality_report.txt`);
        
        if (error) {
          console.error('Error downloading personality report:', error);
          // Not showing error to user as it's not critical
        } else {
          const reportText = await data.text();
          setPersonalityReport(reportText);
        }
      } catch (error) {
        console.error('Error fetching personality data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPersonalityData();
  }, [user, profile, navigate]);
  
  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out. Please try again.');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header onLogout={handleLogout} />
        
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-scout-500 animate-spin mb-4" />
            <p className="text-lg font-medium">Loading your profile...</p>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onLogout={handleLogout} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Your Personality Profile
            </h1>
            <p className="text-lg text-muted-foreground">
              Based on your activity data, we've generated insights about your preferences
            </p>
          </div>
          
          {!personalityTiles ? (
            <Card className="mb-8 bg-muted/30">
              <CardContent className="p-8 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-scout-100 rounded-full flex items-center justify-center mb-4">
                  <User className="h-8 w-8 text-scout-500" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No Insights Available</h2>
                <p className="text-muted-foreground text-center max-w-md">
                  You haven't generated personality insights yet. Go back to the home page and upload your activity data to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 rounded-full bg-scout-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-scout-500" />
                      </div>
                      <div>
                        <CardTitle>Lifestyle Vibes</CardTitle>
                        <CardDescription>Your overall personality and interests</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {personalityTiles["Lifestyle Vibes"].map((vibe, index) => (
                        <Badge key={index} variant="outline" className="px-3 py-1 bg-scout-50 text-scout-900">
                          {vibe}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {personalityTiles["Lifestyle Vibes Reason"]}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 rounded-full bg-scout-100 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-scout-500" />
                      </div>
                      <div>
                        <CardTitle>Food & Drink Favorites</CardTitle>
                        <CardDescription>Your culinary preferences</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {personalityTiles["Food & Drink Favorites"].map((food, index) => (
                        <Badge key={index} variant="outline" className="px-3 py-1 bg-scout-50 text-scout-900">
                          {food}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {personalityTiles["Food & Drink Favorites Reason"]}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 rounded-full bg-scout-100 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-scout-500" />
                      </div>
                      <div>
                        <CardTitle>Go-to Activities</CardTitle>
                        <CardDescription>Activities you frequently engage in</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {personalityTiles["Go-to Activities"].map((activity, index) => (
                        <Badge key={index} variant="outline" className="px-3 py-1 bg-scout-50 text-scout-900">
                          {activity}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {personalityTiles["Go-to Activities Reason"]}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 rounded-full bg-scout-100 flex items-center justify-center">
                        <Hash className="h-5 w-5 text-scout-500" />
                      </div>
                      <div>
                        <CardTitle>Favorite Places</CardTitle>
                        <CardDescription>Neighborhoods and places you love</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {personalityTiles["Favorite Neighborhoods or Place Types"].map((place, index) => (
                        <Badge key={index} variant="outline" className="px-3 py-1 bg-scout-50 text-scout-900">
                          {place}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {personalityTiles["Favorite Neighborhoods or Place Types Reason"]}
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* More personality tiles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 rounded-full bg-scout-100 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-scout-500" />
                      </div>
                      <div>
                        <CardTitle>Travel & Exploration</CardTitle>
                        <CardDescription>Your travel style and preferences</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {personalityTiles["Travel & Exploration"].map((travel, index) => (
                        <Badge key={index} variant="outline" className="px-3 py-1 bg-scout-50 text-scout-900">
                          {travel}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {personalityTiles["Travel & Exploration Reason"]}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 rounded-full bg-scout-100 flex items-center justify-center">
                        <Hash className="h-5 w-5 text-scout-500" />
                      </div>
                      <div>
                        <CardTitle>Other Interests</CardTitle>
                        <CardDescription>Additional things you enjoy</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {personalityTiles["Other"].map((other, index) => (
                        <Badge key={index} variant="outline" className="px-3 py-1 bg-scout-50 text-scout-900">
                          {other}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {personalityTiles["Other Reason"]}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
          
          {personalityReport && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Detailed Personality Report</CardTitle>
                <CardDescription>
                  A comprehensive analysis of your preferences and habits
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Use a pre tag to preserve formatting from the report */}
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans">{personalityReport}</pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
