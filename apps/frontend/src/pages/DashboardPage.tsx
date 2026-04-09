import { useAuthStore } from '@/store/auth.store';
import { useAppointments, useClients, useStaff } from '@/hooks/useApi';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarCheck, Users, UserCog, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function DashboardPage() {
  const { user } = useAuthStore();
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: appointments } = useAppointments(today);
  const { data: clients } = useClients();
  const { data: staff } = useStaff();

  const stats = [
    { label: 'RDV aujourd\'hui', value: appointments?.length ?? 0, icon: CalendarCheck, to: '/appointments' },
    { label: 'Clients', value: clients?.length ?? 0, icon: Users, to: '/clients' },
    { label: 'Staff actif', value: staff?.length ?? 0, icon: UserCog, to: '/staff' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Bonjour, {user?.firstName} 👋
        </h1>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, to }) => (
          <Link
            key={label}
            to={to}
            className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-accent"
          >
            <div className="rounded-md bg-primary/10 p-2">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bot className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Assistant IA</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Posez une question à votre assistant : disponibilités, rendez-vous, clients...
        </p>
        <Button asChild>
          <Link to="/assistant">Ouvrir l'assistant</Link>
        </Button>
      </div>
    </div>
  );
}
