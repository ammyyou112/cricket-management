import { useState, useMemo } from 'react';
import { MapPin, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGeolocation } from '@/hooks/useGeolocation';
import { calculateDistance, formatDistance, generateMockTeamLocations } from '@/lib/locationUtils';
import { Team } from '@/types/database.types';

interface NearbyTeamsProps {
  teams: Team[];
  onJoinRequest?: (teamId: string) => void;
  isRequesting?: boolean;
  requestingTeamId?: string | null;
}

export const NearbyTeams = ({ 
  teams, 
  onJoinRequest,
  isRequesting = false,
  requestingTeamId = null
}: NearbyTeamsProps) => {
  const { location, loading, error, requestLocation } = useGeolocation();
  const [showNearby, setShowNearby] = useState(false);

  // Generate mock locations for teams
  const teamLocations = useMemo(() => {
    return generateMockTeamLocations(teams);
  }, [teams]);

  const handleFindNearby = () => {
    requestLocation();
    setShowNearby(true);
  };

  // Calculate distances and sort teams
  const teamsWithDistance = useMemo(() => {
    if (!location) return teams;

    return teams
      .map(team => {
        const teamLoc = teamLocations[team.id];
        if (!teamLoc) return null;

        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          teamLoc.latitude,
          teamLoc.longitude
        );

        return {
          ...team,
          distance
        };
      })
      .filter((team): team is Team & { distance: number } => team !== null)
      .sort((a, b) => a.distance - b.distance);
  }, [location, teams, teamLocations]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Teams Near You</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Find teams based on your location
          </p>
        </div>
        <Button 
          onClick={handleFindNearby}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Getting Location...
            </>
          ) : (
            <>
              <MapPin className="mr-2 h-4 w-4" />
              Find Teams Near Me
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {showNearby && !location && !loading && !error && (
        <div className="text-center py-8 text-muted-foreground">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">
            Click "Find Teams Near Me" to see teams based on your location
          </p>
        </div>
      )}

      {location && teamsWithDistance.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>Showing teams sorted by distance from your location</span>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {teamsWithDistance.map((team) => (
              <Card key={team.id} className="flex flex-col hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                  <Avatar className="h-12 w-12 border">
                    <AvatarImage src={team.logo_url || undefined} alt={team.team_name} />
                    <AvatarFallback>{team.team_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{team.team_name}</CardTitle>
                      <Badge variant="secondary" className="ml-auto shrink-0">
                        <MapPin className="h-3 w-3 mr-1" />
                        {formatDistance(team.distance)}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      Created {new Date(team.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {team.description || "No description provided."}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Members: --</span>
                  </div>
                </CardContent>
                <CardFooter>
                  {onJoinRequest ? (
                    <Button
                      className="w-full"
                      variant="secondary"
                      onClick={() => onJoinRequest(team.id)}
                      disabled={requestingTeamId === team.id || isRequesting}
                    >
                      {requestingTeamId === team.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Join Team'
                      )}
                    </Button>
                  ) : (
                    <Button className="w-full" variant="secondary">
                      View Team
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {location && teamsWithDistance.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-muted-foreground">No teams found nearby</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Try expanding your search or check back later.
          </p>
        </div>
      )}
    </div>
  );
};

