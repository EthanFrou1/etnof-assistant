import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { appointmentsApi } from '@/api/appointments.api';
import { clientsApi } from '@/api/clients.api';
import { servicesApi } from '@/api/services.api';
import { staffApi } from '@/api/staff.api';

export function useSalonId() {
  return useAuthStore((s) => s.user?.salonId ?? '');
}

export function useAppointments(date?: string, staffId?: string) {
  const salonId = useSalonId();
  return useQuery({
    queryKey: ['appointments', salonId, date, staffId],
    queryFn: () => appointmentsApi.list({ salonId, date, staffId }),
    enabled: !!salonId,
  });
}

export function useClients(search?: string) {
  const salonId = useSalonId();
  return useQuery({
    queryKey: ['clients', salonId, search],
    queryFn: () => clientsApi.list({ salonId, search }),
    enabled: !!salonId,
  });
}

export function useServices() {
  const salonId = useSalonId();
  return useQuery({
    queryKey: ['services', salonId],
    queryFn: () => servicesApi.list(salonId),
    enabled: !!salonId,
  });
}

export function useStaff() {
  const salonId = useSalonId();
  return useQuery({
    queryKey: ['staff', salonId],
    queryFn: () => staffApi.list(salonId),
    enabled: !!salonId,
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentsApi.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });
}
