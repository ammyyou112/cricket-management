import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Trophy, Users, Activity, BarChart2, Calendar, Shield } from 'lucide-react';

const Home = () => {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative py-20 lg:py-32 bg-gradient-to-b from-primary/10 to-background overflow-hidden">
                <div className="container px-4 md:px-6 mx-auto text-center z-10 relative">
                    <div className="space-y-4 max-w-3xl mx-auto">
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                            Elevate Your <span className="text-primary">Cricket</span> <br /> Management Game
                        </h1>
                        <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                            The all-in-one platform for managing tournaments, teams, and live scoring. Experience cricket like never before with Cricket 360.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
                        <Button size="lg" className="px-8 text-lg" asChild>
                            <Link to="/register">Get Started</Link>
                        </Button>
                        <Button size="lg" variant="outline" className="px-8 text-lg" asChild>
                            <Link to="/login">Login</Link>
                        </Button>
                    </div>
                </div>

                {/* Abstract Background Element */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10" />
            </section>

            {/* Features Section */}
            <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
                <div className="container px-4 md:px-6 mx-auto">
                    <div className="text-center mb-16 space-y-2">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Everything You Need</h2>
                        <p className="text-muted-foreground md:text-lg max-w-[800px] mx-auto">
                            From local clubs to professional leagues, we've got the tools to handle it all.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <Card className="bg-background border-none shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <Trophy className="h-12 w-12 text-primary mb-4" />
                                <CardTitle className="text-xl">Tournament Management</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Create and manage tournaments with ease. Automated scheduling, points tables, and knockout brackets.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-background border-none shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <Activity className="h-12 w-12 text-primary mb-4" />
                                <CardTitle className="text-xl">Live Scoring</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Real-time ball-by-ball updates. Let fans follow the action from anywhere in the world.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-background border-none shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <BarChart2 className="h-12 w-12 text-primary mb-4" />
                                <CardTitle className="text-xl">Detailed Statistics</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    In-depth player and team analytics. Track form, averages, and strike rates automatically.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20">
                <div className="container px-4 md:px-6 mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">How It Works</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: Users, title: "Register", desc: "Sign up as a Player, Captain, or Organizer." },
                            { icon: Shield, title: "Create Teams", desc: "Captains build their squads and manage rosters." },
                            { icon: Calendar, title: "Schedule", desc: "Organizers set up tournaments and fixtures." },
                            { icon: Activity, title: "Play & Score", desc: "Play matches and score them live on the app." }
                        ].map((item, index) => (
                            <div key={index} className="flex flex-col items-center text-center space-y-4">
                                <div className="p-4 bg-primary/10 rounded-full">
                                    <item.icon className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold">{item.title}</h3>
                                <p className="text-muted-foreground">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-primary text-primary-foreground">
                <div className="container px-4 md:px-6 mx-auto text-center space-y-6">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                        Ready to start your innings?
                    </h2>
                    <p className="text-lg opacity-90 max-w-[600px] mx-auto">
                        Join thousands of cricketers and organizers managing their game efficiently.
                    </p>
                    <Button size="lg" variant="secondary" className="px-8 mt-4 text-primary font-bold" asChild>
                        <Link to="/register">Create Free Account</Link>
                    </Button>
                </div>
            </section>
        </div>
    );
};

export default Home;
