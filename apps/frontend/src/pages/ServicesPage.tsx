import { useServices } from '@/hooks/useApi';
import { Clock, Euro } from 'lucide-react';
import type { Service } from '@/types';

export function ServicesPage() {
  const { data: services, isLoading } = useServices();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Services</h1>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {!services?.length ? (
            <div className="col-span-full p-8 text-center text-sm text-muted-foreground">
              Aucun service configuré
            </div>
          ) : (
            (services as Service[]).map((svc) => (
              <div key={svc.id} className="rounded-lg border bg-card p-4 space-y-2">
                <p className="font-medium">{svc.name}</p>
                {svc.description && (
                  <p className="text-sm text-muted-foreground">{svc.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {svc.durationMin} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Euro className="h-3 w-3" />
                    {Number(svc.price)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
