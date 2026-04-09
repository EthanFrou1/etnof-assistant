import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';

export function SettingsPage() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkGoogleStatus();
    if (searchParams.get('google') === 'connected') {
      setGoogleConnected(true);
      setSearchParams({});
    }
  }, []);

  const checkGoogleStatus = async () => {
    try {
      const res = await apiClient.get('/google-calendar/status');
      setGoogleConnected(res.data.data.connected);
    } catch {
      setGoogleConnected(false);
    }
  };

  const connectGoogle = () => {
    const salonId = user?.salonId;
    if (!salonId) return;
    // Redirect to backend OAuth flow, passing salonId as state
    window.location.href = `http://localhost:3001/api/v1/google-calendar/auth?state=${salonId}`;
  };

  const disconnectGoogle = async () => {
    setLoading(true);
    try {
      await apiClient.get('/google-calendar/disconnect');
      setGoogleConnected(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Paramètres</h1>

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="font-medium">Mon profil</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Nom</span>
            <p>{user?.firstName} {user?.lastName}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Email</span>
            <p>{user?.email}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Rôle</span>
            <p>{user?.role}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Salon ID</span>
            <p className="font-mono text-xs">{user?.salonId ?? '—'}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="font-medium">Intégrations</h2>

        <div className="flex items-center justify-between py-3 border-b last:border-0">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Google Calendar</p>
              <p className="text-xs text-muted-foreground">
                Synchronise automatiquement les rendez-vous avec votre agenda Google
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {googleConnected === true && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="h-3.5 w-3.5" />
                Connecté
              </span>
            )}
            {googleConnected === false && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <XCircle className="h-3.5 w-3.5" />
                Non connecté
              </span>
            )}
            {googleConnected ? (
              <Button variant="outline" size="sm" onClick={disconnectGoogle} disabled={loading}>
                Déconnecter
              </Button>
            ) : (
              <Button size="sm" onClick={connectGoogle} disabled={googleConnected === null}>
                Connecter
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
