import { Link } from 'react-router-dom';
import { Trophy, Mail, Phone, MapPin } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-hero rounded-lg">
                <Trophy className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Cricket 360
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              Connecting cricket communities through digital innovation. Manage teams, matches, and tournaments with ease.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/teams" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Browse Teams
                </Link>
              </li>
              <li>
                <Link to="/tournaments" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Tournaments
                </Link>
              </li>
              <li>
                <Link to="/players" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Player Directory
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Community Guidelines
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-muted-foreground text-sm">
                <Mail className="h-4 w-4 mt-0.5 text-primary" />
                <span>support@cricket360.com</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground text-sm">
                <Phone className="h-4 w-4 mt-0.5 text-primary" />
                <span>+92 321 1234567</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground text-sm">
                <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                <span>Karachi, Sindh, Pakistan</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Cricket 360. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
