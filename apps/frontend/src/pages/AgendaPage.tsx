import { useState } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppointments } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import type { Appointment } from '@/types';

export function AgendaPage() {
  const [date, setDate] = useState(new Date());
  const dateStr = format(date, 'yyyy-MM-dd');
  const { data: appointments, isLoading } = useAppointments(dateStr);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Agenda</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setDate(subDays(date, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-48 text-center text-sm font-medium">
            {format(date, 'EEEE d MMMM yyyy', { locale: fr })}
          </span>
          <Button variant="outline" size="icon" onClick={() => setDate(addDays(date, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDate(new Date())}>
            Aujourd'hui
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Chargement...</div>
      ) : (
        <div className="rounded-lg border bg-card">
          {!appointments?.length ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Aucun rendez-vous ce jour
            </div>
          ) : (
            <div className="divide-y">
              {(appointments as Appointment[]).map((apt) => (
                <div key={apt.id} className="flex items-start gap-4 p-4">
                  <div className="min-w-20 text-sm font-medium">
                    {format(new Date(apt.startsAt), 'HH:mm')} – {format(new Date(apt.endsAt), 'HH:mm')}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {apt.client?.firstName} {apt.client?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {apt.services?.map((s) => s.service.name).join(', ')}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {apt.staff?.firstName} {apt.staff?.lastName}
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
