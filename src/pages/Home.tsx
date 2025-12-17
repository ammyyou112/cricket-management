import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Calendar, BarChart3, Target, Shield } from 'lucide-react';
import heroImage from '@/assets/cricket-hero.jpg';

export const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: 'Team Management',
      description: 'Create and manage cricket teams, add players, and coordinate match schedules effortlessly.',
    },
    {
      icon: Calendar,
      title: 'Match Scheduling',
      description: 'Schedule matches, set venues, track availability, and send notifications to all participants.',
    },
    {
      icon: Trophy,
      title: 'Tournament Organization',
      description: 'Host local tournaments with automated fixtures, live scoring, and real-time leaderboards.',
    },
    {
      icon: BarChart3,
      title: 'Performance Analytics',
      description: 'Track player statistics, batting averages, bowling figures, and career milestones.',
    },
    {
      icon: Target,
      title: 'Player Profiles',
      description: 'Showcase your cricket journey with verified stats, match history, and achievements.',
    },
    {
      icon: Shield,
      title: 'Verified Statistics',
      description: 'All match data is recorded and verified to maintain authentic performance records.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/95" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            Cricket 360
          </h1>
          <p className="text-xl md:text-2xl text-foreground mb-8 max-w-3xl mx-auto">
            Your Complete Cricket Management Platform
          </p>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Connect with local cricket communities, manage teams, organize tournaments, and track your cricket journey all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/register')}
              className="text-lg px-8 py-6 bg-gradient-hero hover:opacity-90 transition-all hover:scale-105 shadow-card-hover"
            >
              Join Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/teams')}
              className="text-lg px-8 py-6 hover:bg-muted transition-all hover:scale-105"
            >
              Explore Teams
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-foreground">
            Everything You Need
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A comprehensive platform designed for local cricket communities to thrive and grow together.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="border-border hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 bg-gradient-card"
            >
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-foreground">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-hero py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6 text-primary-foreground">
            Ready to Elevate Your Cricket Game?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join thousands of cricket enthusiasts already using Cricket 360 to manage their cricket activities.
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate('/register')}
            className="text-lg px-8 py-6 hover:scale-105 transition-transform shadow-lg"
          >
            Get Started Free
          </Button>
        </div>
      </section>
    </div>
  );
};
