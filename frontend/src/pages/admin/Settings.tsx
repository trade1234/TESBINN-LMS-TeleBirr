import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Settings, ShieldCheck, Bell, Plug } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useToast } from "@/hooks/use-toast";

const AdminSettings = () => {
  const { toast } = useToast();
  const [generalSettings, setGeneralSettings] = useState({
    platformName: "TESBINN Academy",
    primaryColor: "#0ea5e9",
    language: "en",
  });
  const [securitySettings, setSecuritySettings] = useState({
    requireAdminMfa: true,
    requireInstructorMfa: false,
    sessionTimeout: "60",
    auditExportFormat: "csv",
  });
  const [lastKeyRotation, setLastKeyRotation] = useState("Never");
  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    smsAlerts: false,
    slackAlerts: true,
    digestFrequency: "daily",
    alertEmail: "ops@tesbinn.com",
  });
  const [integrationSettings, setIntegrationSettings] = useState({
    analyticsProvider: "internal",
    crmProvider: "none",
    webhookEnabled: false,
    webhookUrl: "",
  });

  const languageLabels: Record<string, string> = {
    en: "English",
    es: "Spanish",
    fr: "French",
  };
  const digestLabels: Record<string, string> = {
    realtime: "Real-time",
    daily: "Daily",
    weekly: "Weekly",
  };
  const analyticsLabels: Record<string, string> = {
    internal: "Internal",
    ga: "Google Analytics",
    mixpanel: "Mixpanel",
  };
  const crmLabels: Record<string, string> = {
    none: "None",
    hubspot: "HubSpot",
    salesforce: "Salesforce",
  };

  const handleGeneralSave = () => {
    toast({
      title: "Branding updated",
      description: `Platform: ${generalSettings.platformName} - Language: ${languageLabels[generalSettings.language]}`,
    });
  };

  const handleRotateKeys = () => {
    const rotatedAt = new Date().toISOString();
    setLastKeyRotation(rotatedAt);
    toast({
      title: "API keys rotated",
      description: `New keys issued at ${rotatedAt}.`,
    });
  };

  const handleSecuritySave = () => {
    toast({
      title: "Security settings saved",
      description: `Admin MFA: ${securitySettings.requireAdminMfa ? "On" : "Off"} - Session timeout: ${securitySettings.sessionTimeout} mins.`,
    });
  };

  const handleAuditExport = () => {
    toast({
      title: "Audit log exported",
      description: `Exported audit log as ${securitySettings.auditExportFormat.toUpperCase()}.`,
    });
  };

  const handleNotificationSave = () => {
    toast({
      title: "Notification preferences saved",
      description: `Digest: ${digestLabels[notificationSettings.digestFrequency]} - Email: ${notificationSettings.alertEmail}.`,
    });
  };

  const handleIntegrationSave = () => {
    toast({
      title: "Integrations updated",
      description: `Analytics: ${analyticsLabels[integrationSettings.analyticsProvider]} - CRM: ${crmLabels[integrationSettings.crmProvider]}.`,
    });
  };

  const handleWebhookTest = () => {
    if (!integrationSettings.webhookEnabled || !integrationSettings.webhookUrl.trim()) {
      toast({
        title: "Webhook not ready",
        description: "Enable webhooks and add a URL before sending a test event.",
      });
      return;
    }
    toast({
      title: "Webhook test queued",
      description: `Test payload will post to ${integrationSettings.webhookUrl}.`,
    });
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 max-w-5xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Settings</p>
            <h1 className="text-2xl font-semibold">Platform controls</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Adjust permissions, notifications, and security defaults.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="glass-card rounded-xl border border-border/70 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-foreground" />
              <h2 className="text-lg font-semibold">General</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Control platform name, brand colors, and default language for your academy.
            </p>
            <p className="text-xs text-muted-foreground">
              Platform: {generalSettings.platformName} - Language: {languageLabels[generalSettings.language]}
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Edit branding
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Branding controls</DialogTitle>
                  <DialogDescription>Update the platform identity shown across learner experiences.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="platform-name">Platform name</Label>
                    <Input
                      id="platform-name"
                      value={generalSettings.platformName}
                      onChange={(event) =>
                        setGeneralSettings((prev) => ({ ...prev, platformName: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">Primary brand color</Label>
                    <Input
                      id="primary-color"
                      type="color"
                      value={generalSettings.primaryColor}
                      onChange={(event) =>
                        setGeneralSettings((prev) => ({ ...prev, primaryColor: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Default language</Label>
                    <Select
                      value={generalSettings.language}
                      onValueChange={(value) => setGeneralSettings((prev) => ({ ...prev, language: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button onClick={handleGeneralSave}>Save changes</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="glass-card rounded-xl border border-border/70 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-success" />
              <h2 className="text-lg font-semibold">Security</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Require MFA, rotate API keys, and review audit logs for admin actions.
            </p>
            <p className="text-xs text-muted-foreground">
              Admin MFA: {securitySettings.requireAdminMfa ? "On" : "Off"} - Keys last rotated: {lastKeyRotation}
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Configure security
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Security controls</DialogTitle>
                  <DialogDescription>Enforce MFA and manage security-sensitive admin settings.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
                    <div>
                      <p className="text-sm font-medium">Require admin MFA</p>
                      <p className="text-xs text-muted-foreground">Enforce MFA for all admin accounts.</p>
                    </div>
                    <Switch
                      checked={securitySettings.requireAdminMfa}
                      onCheckedChange={(checked) =>
                        setSecuritySettings((prev) => ({ ...prev, requireAdminMfa: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
                    <div>
                      <p className="text-sm font-medium">Require instructor MFA</p>
                      <p className="text-xs text-muted-foreground">Apply MFA to instructors with authoring access.</p>
                    </div>
                    <Switch
                      checked={securitySettings.requireInstructorMfa}
                      onCheckedChange={(checked) =>
                        setSecuritySettings((prev) => ({ ...prev, requireInstructorMfa: checked }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Session timeout</Label>
                    <Select
                      value={securitySettings.sessionTimeout}
                      onValueChange={(value) => setSecuritySettings((prev) => ({ ...prev, sessionTimeout: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeout" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                        <SelectItem value="240">4 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Audit log export</Label>
                    <div className="flex flex-wrap gap-2">
                      <Select
                        value={securitySettings.auditExportFormat}
                        onValueChange={(value) =>
                          setSecuritySettings((prev) => ({ ...prev, auditExportFormat: value }))
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" onClick={handleAuditExport}>
                        Export audit log
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/70 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">API key rotation</p>
                        <p className="text-xs text-muted-foreground">Last rotation: {lastKeyRotation}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleRotateKeys}>
                        Rotate keys
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button onClick={handleSecuritySave}>Save changes</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="glass-card rounded-xl border border-border/70 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-warning" />
              <h2 className="text-lg font-semibold">Notifications</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Choose what alerts the admin team receives by email, SMS, or Slack.
            </p>
            <p className="text-xs text-muted-foreground">
              Digest: {digestLabels[notificationSettings.digestFrequency]} - Email: {notificationSettings.alertEmail}
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Update preferences
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Notification preferences</DialogTitle>
                  <DialogDescription>Control how the admin team is alerted across channels.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
                    <div>
                      <p className="text-sm font-medium">Email alerts</p>
                      <p className="text-xs text-muted-foreground">Critical system and billing notifications.</p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailAlerts}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({ ...prev, emailAlerts: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
                    <div>
                      <p className="text-sm font-medium">SMS alerts</p>
                      <p className="text-xs text-muted-foreground">Escalations for urgent outages only.</p>
                    </div>
                    <Switch
                      checked={notificationSettings.smsAlerts}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({ ...prev, smsAlerts: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
                    <div>
                      <p className="text-sm font-medium">Slack alerts</p>
                      <p className="text-xs text-muted-foreground">Send updates to the admin Slack channel.</p>
                    </div>
                    <Switch
                      checked={notificationSettings.slackAlerts}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({ ...prev, slackAlerts: checked }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alert-email">Alert inbox</Label>
                    <Input
                      id="alert-email"
                      type="email"
                      value={notificationSettings.alertEmail}
                      onChange={(event) =>
                        setNotificationSettings((prev) => ({ ...prev, alertEmail: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Digest frequency</Label>
                    <Select
                      value={notificationSettings.digestFrequency}
                      onValueChange={(value) =>
                        setNotificationSettings((prev) => ({ ...prev, digestFrequency: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Real-time</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button onClick={handleNotificationSave}>Save changes</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="glass-card rounded-xl border border-border/70 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Plug className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Integrations</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Connect analytics, CRM, or custom webhooks for richer insights.
            </p>
            <p className="text-xs text-muted-foreground">
              Analytics: {analyticsLabels[integrationSettings.analyticsProvider]} - CRM: {crmLabels[integrationSettings.crmProvider]}
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Manage integrations
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Integration controls</DialogTitle>
                  <DialogDescription>Pick connected services and manage outbound webhooks.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Analytics provider</Label>
                    <Select
                      value={integrationSettings.analyticsProvider}
                      onValueChange={(value) =>
                        setIntegrationSettings((prev) => ({ ...prev, analyticsProvider: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">Internal</SelectItem>
                        <SelectItem value="ga">Google Analytics</SelectItem>
                        <SelectItem value="mixpanel">Mixpanel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>CRM provider</Label>
                    <Select
                      value={integrationSettings.crmProvider}
                      onValueChange={(value) =>
                        setIntegrationSettings((prev) => ({ ...prev, crmProvider: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select CRM" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="hubspot">HubSpot</SelectItem>
                        <SelectItem value="salesforce">Salesforce</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
                    <div>
                      <p className="text-sm font-medium">Enable webhooks</p>
                      <p className="text-xs text-muted-foreground">Push events to external systems.</p>
                    </div>
                    <Switch
                      checked={integrationSettings.webhookEnabled}
                      onCheckedChange={(checked) =>
                        setIntegrationSettings((prev) => ({ ...prev, webhookEnabled: checked }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="webhook-url">Webhook URL</Label>
                    <Input
                      id="webhook-url"
                      placeholder="https://hooks.example.com/tesbinn"
                      value={integrationSettings.webhookUrl}
                      onChange={(event) =>
                        setIntegrationSettings((prev) => ({ ...prev, webhookUrl: event.target.value }))
                      }
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={handleWebhookTest}>
                    Send test webhook
                  </Button>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button onClick={handleIntegrationSave}>Save changes</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
