import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService, type CaptainSettings, type UpdateSettingsInput } from '@/services/settings.service';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, Loader2, Settings as SettingsIcon, Clock, Bell } from 'lucide-react';

export default function CaptainSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState<UpdateSettingsInput>({
    autoApproveEnabled: true,
    timeoutMinutes: 5,
    notifyOnAutoApprove: true,
  });

  // Fetch current settings
  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ['captain-settings'],
    queryFn: async () => {
      return settingsService.getSettings();
    },
  });

  // Update settings when loaded
  useEffect(() => {
    if (currentSettings) {
      setSettings({
        autoApproveEnabled: currentSettings.autoApproveEnabled,
        timeoutMinutes: currentSettings.timeoutMinutes,
        notifyOnAutoApprove: currentSettings.notifyOnAutoApprove,
      });
    }
  }, [currentSettings]);

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (newSettings: UpdateSettingsInput) => {
      return settingsService.updateSettings(newSettings);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Settings updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['captain-settings'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update settings',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    // Validate timeout minutes
    if (settings.timeoutMinutes !== undefined) {
      if (settings.timeoutMinutes < 1 || settings.timeoutMinutes > 60) {
        toast({
          title: 'Validation Error',
          description: 'Timeout minutes must be between 1 and 60',
          variant: 'destructive',
        });
        return;
      }
    }
    updateMutation.mutate(settings);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-2xl space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          Captain Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure your approval preferences and timeout settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Auto-Approval Settings</CardTitle>
          <CardDescription>
            Control how approval requests are handled when opponents don't respond
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto-approval toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoApprove" className="text-base">
                Enable Auto-Approval
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatically approve requests after timeout period
              </p>
            </div>
            <Switch
              id="autoApprove"
              checked={settings.autoApproveEnabled ?? true}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, autoApproveEnabled: checked })
              }
            />
          </div>

          {/* Timeout minutes */}
          {settings.autoApproveEnabled && (
            <div className="space-y-2">
              <Label htmlFor="timeoutMinutes" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timeout (minutes)
              </Label>
              <Input
                id="timeoutMinutes"
                type="number"
                min={1}
                max={60}
                value={settings.timeoutMinutes ?? 5}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    timeoutMinutes: parseInt(e.target.value) || 5,
                  })
                }
                className="max-w-xs"
              />
              <p className="text-sm text-muted-foreground">
                Requests will be auto-approved after this many minutes (1-60)
              </p>
            </div>
          )}

          {/* Notification toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifyOnAutoApprove" className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notify on Auto-Approval
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications when requests are auto-approved
              </p>
            </div>
            <Switch
              id="notifyOnAutoApprove"
              checked={settings.notifyOnAutoApprove ?? true}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, notifyOnAutoApprove: checked })
              }
            />
          </div>

          {!settings.autoApproveEnabled && (
            <Alert>
              <AlertDescription>
                With auto-approval disabled, all approval requests must be manually reviewed.
                This may delay match progression if opponents don't respond promptly.
              </AlertDescription>
            </Alert>
          )}

          {/* Save button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="min-w-32"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • When you request approval for a match action, the opponent captain receives a notification
          </p>
          <p>
            • If they don't respond within the timeout period, the request is automatically approved
          </p>
          <p>
            • You can adjust the timeout period from 1 to 60 minutes based on your preferences
          </p>
          <p>
            • Auto-approval helps keep matches moving forward even if captains are temporarily unavailable
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

