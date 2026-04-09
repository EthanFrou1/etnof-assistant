import { useStaff } from '@/hooks/useApi';
import { UserCog } from 'lucide-react';
import type { Staff } from '@/types';

export function StaffPage() {
  const { data: staff, isLoading } = useStaff();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Staff</h1>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {!staff?.length ? (
            <div className="col-span-full p-8 text-center text-sm text-muted-foreground">
              Aucun membre du staff configuré
            </div>
          ) : (
            (staff as Staff[]).map((member) => (
              <div key={member.id} className="rounded-lg border bg-card p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div
                    className="h-9 w-9 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: member.color ?? '#8B5CF6' }}
                  >
                    <UserCog className="h-4 w-4 text-white" />
                  </div>
                  <p className="font-medium">
                    {member.firstName} {member.lastName}
                  </p>
                </div>
                {member.services && member.services.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {member.services.map((s) => s.service.name).join(', ')}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
