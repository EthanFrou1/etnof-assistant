import { useState } from 'react';
import { useClients } from '@/hooks/useApi';
import { Input } from '@/components/ui/input';
import { Search, User } from 'lucide-react';
import type { Client } from '@/types';

export function ClientsPage() {
  const [search, setSearch] = useState('');
  const { data: clients, isLoading } = useClients(search || undefined);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clients</h1>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Rechercher un client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Chargement...</div>
      ) : (
        <div className="rounded-lg border bg-card divide-y">
          {!clients?.length ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Aucun client trouvé</div>
          ) : (
            (clients as Client[]).map((client) => (
              <div key={client.id} className="flex items-center gap-4 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {client.firstName} {client.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {client.phone ?? client.email ?? 'Aucun contact'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
