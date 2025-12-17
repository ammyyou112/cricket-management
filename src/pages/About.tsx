import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Target, Users, Zap } from 'lucide-react';

export const About = () => {
  const values = [
    {
      icon: Trophy,
      title: 'Excellence',
      description: 'We strive to provide the best platform for cricket enthusiasts to showcase their talent.',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Building strong cricket communities through digital connectivity and collaboration.',
    },
    {
      icon: Target,
      title: 'Innovation',
      description: 'Leveraging technology to revolutionize local cricket management and organization.',
    },
    {
      icon: Zap,
      title: 'Growth',
      description: 'Empowering players and teams to grow, improve, and achieve their cricket aspirations.',
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
              About Cricket 360
            </h1>
            <p className="text-xl text-muted-foreground">
              Revolutionizing local cricket management through digital innovation
            </p>
          </div>

          <Card className="mb-8 shadow-card bg-gradient-card">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-4 text-foreground">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Cricket 360 was born from a simple observation: local cricket communities needed a better way to
                organize, manage, and celebrate their love for the game. We recognized that while cricket is Pakistan's
                most beloved sport, the grassroots level often lacked the tools and infrastructure to properly manage
                teams, tournaments, and player development.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our mission is to empower every cricket enthusiast—from weekend warriors to aspiring professionals—with
                a comprehensive platform that makes cricket management simple, transparent, and accessible to all.
              </p>
            </CardContent>
          </Card>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-center text-foreground">Our Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {values.map((value, index) => (
                <Card key={index} className="shadow-card hover:shadow-card-hover transition-all bg-gradient-card">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-hero rounded-lg flex-shrink-0">
                        <value.icon className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-foreground">{value.title}</h3>
                        <p className="text-muted-foreground text-sm">{value.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="shadow-card bg-gradient-card">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-4 text-foreground">What We Offer</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>
                    <strong className="text-foreground">Team Management:</strong> Create and manage your cricket team
                    with ease, handle player registrations, and coordinate team activities.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>
                    <strong className="text-foreground">Match Organization:</strong> Schedule matches, set venues,
                    manage availability, and keep everyone informed with automated notifications.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>
                    <strong className="text-foreground">Tournament Platform:</strong> Host and participate in local
                    tournaments with automated fixture generation and live scoring capabilities.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>
                    <strong className="text-foreground">Performance Tracking:</strong> Maintain verified statistics,
                    track career progress, and build a credible cricket profile.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>
                    <strong className="text-foreground">Community Building:</strong> Connect with fellow cricket
                    enthusiasts, discover new teams, and grow your cricket network.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="mt-12 text-center">
            <Card className="shadow-card bg-gradient-hero text-primary-foreground">
              <CardContent className="py-8">
                <h2 className="text-2xl font-bold mb-4">Join Our Growing Community</h2>
                <p className="text-lg text-primary-foreground/90 mb-6">
                  Whether you're a player, team captain, or tournament organizer, Cricket 360 is here to support your
                  cricket journey.
                </p>
                <p className="text-primary-foreground/80">
                  Together, let's build a stronger, more connected cricket community across Pakistan.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
