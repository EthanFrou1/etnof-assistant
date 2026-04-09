import { useAppointments, useCancelAppointment } from '@/hooks/useApi';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import type { Appointment } from '@/types';

export function AppointmentsPage() {
  const { data: appointments, isLoading } = useAppointments();
  const cancelMutation = useCancelAppointment();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Rendez-vous</h1>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Chargement...</div>
      ) : (
        <div className="rounded-lg border bg-card divide-y">
          {!appointments?.length ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Aucun rendez-vous</div>
          ) : (
            (appointments as Appointment[]).map((apt) => (
              <div key={apt.id} className="flex items-center gap-4 p-4">
                <div className="flex-1">
                  <p className="font-medium">
                    {apt.client?.firstName} {apt.client?.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(apt.startsAt), 'dd/MM/yyyy HH:mm')} •{' '}
                    {apt.services?.map((s) => s.service.name).join(', ')} •{' '}
                    {apt.staff?.firstName} {apt.staff?.lastName}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{apt.status}</span>
                {apt.status !== 'CANCELLED' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => cancelMutation.mutate(apt.id)}
                    disabled={cancelMutation.isPending}
                  >
                    Annuler
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
