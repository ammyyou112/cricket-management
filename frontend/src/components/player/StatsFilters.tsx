import { useState } from 'react';
import { Calendar, Filter, RotateCcw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface StatsFilterCriteria {
  tournamentId?: string;
  startDate?: Date;
  endDate?: Date;
  matchType?: string;
}

interface StatsFiltersProps {
  tournaments: any[];
  onFilterChange: (filters: StatsFilterCriteria) => void;
  onExport?: () => void;
  isFilterActive?: boolean;
}

export const StatsFilters = ({ 
  tournaments, 
  onFilterChange,
  onExport,
  isFilterActive: externalIsActive = false
}: StatsFiltersProps) => {
  const [filters, setFilters] = useState<StatsFilterCriteria>({});
  const [isActive, setIsActive] = useState(false);
  
  // Use external isActive if provided, otherwise use internal state
  const displayIsActive = externalIsActive || isActive;

  const handleApplyFilters = () => {
    onFilterChange(filters);
    setIsActive(true);
  };

  const handleResetFilters = () => {
    const emptyFilters: StatsFilterCriteria = {};
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
    setIsActive(false);
  };

  const hasFilters = filters.tournamentId || filters.startDate || filters.endDate || filters.matchType;

  return (
    <Card className="p-4 mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle className="text-lg font-semibold">Filter Statistics</CardTitle>
          </div>
          {displayIsActive && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              Filters Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Tournament Filter */}
          <div className="space-y-2">
            <Label>Tournament</Label>
            <Select
              value={filters.tournamentId || 'all'}
              onValueChange={(value) => 
                setFilters({ ...filters, tournamentId: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Tournaments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tournaments</SelectItem>
                {tournaments.map(tournament => (
                  <SelectItem key={tournament.id} value={tournament.id}>
                    {tournament.tournament_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label>From Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.startDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {filters.startDate ? format(filters.startDate, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={filters.startDate}
                  onSelect={(date) => setFilters({ ...filters, startDate: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label>To Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.endDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {filters.endDate ? format(filters.endDate, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={filters.endDate}
                  onSelect={(date) => setFilters({ ...filters, endDate: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Match Type */}
          <div className="space-y-2">
            <Label>Match Type</Label>
            <Select
              value={filters.matchType || 'all'}
              onValueChange={(value) => 
                setFilters({ ...filters, matchType: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Matches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Matches</SelectItem>
                <SelectItem value="league">League</SelectItem>
                <SelectItem value="knockout">Knockout</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={handleApplyFilters} className="flex-1" disabled={!hasFilters}>
            <Filter className="mr-2 h-4 w-4" />
            Apply Filters
          </Button>
          <Button onClick={handleResetFilters} variant="outline" disabled={!isActive}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          {onExport && displayIsActive && (
            <Button onClick={onExport} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

