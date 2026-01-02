import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { teamService } from '../../services/team.service';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useToast } from '../../components/ui/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function CreateTeam() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    city: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Team name is required');
      return;
    }

    if (formData.name.trim().length < 3) {
      setError('Team name must be at least 3 characters');
      return;
    }

    if (!formData.city.trim()) {
      setError('City is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔵 Creating team:', formData);
      
      const newTeam = await teamService.create({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        city: formData.city.trim(),
      });
      
      console.log('✅ Team created successfully:', newTeam);
      
      toast({
        title: 'Success!',
        description: 'Team created successfully!',
      });
      
      // Redirect to team management
      navigate('/captain/team-management');
      
    } catch (err: any) {
      console.error('❌ Failed to create team:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create team';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if user can create teams
  if (!user || (user.role !== 'CAPTAIN' && user.role !== 'ADMIN' && user.role !== 'captain' && user.role !== 'admin')) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600">Only captains and admins can create teams.</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Create New Team</h1>
        <p className="text-gray-600">Start your cricket team journey</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Information</CardTitle>
          <CardDescription>
            Fill in the details to create your cricket team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* Team Name */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">
                Team Name <span className="text-red-600">*</span>
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter team name (e.g., Mumbai Challengers)"
                required
                disabled={loading}
                minLength={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 3 characters required
              </p>
            </div>

            {/* City */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">
                City <span className="text-red-600">*</span>
              </label>
              <Input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Enter city (e.g., Mumbai, Delhi, Karachi)"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                City where your team is based
              </p>
            </div>

            {/* Team Description */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">
                Team Description <span className="text-gray-400">(Optional)</span>
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell us about your team, playing style, achievements, etc..."
                rows={4}
                disabled={loading}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Team'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

