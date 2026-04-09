import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  Users,
  Scissors,
  UserCog,
  Settings,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/agenda', icon: Calendar, label: 'Agenda' },
  { to: '/appointments', icon: CalendarCheck, label: 'Rendez-vous' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/services', icon: Scissors, label: 'Services' },
  { to: '/staff', icon: UserCog, label: 'Staff' },
  { to: '/assistant', icon: Bot, label: 'Assistant IA' },
  { to: '/settings', icon: Settings, label: 'Paramètres' },
];

export function Sidebar() {
  return (
    <aside className="flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex h-14 items-center px-4 border-b border-sidebar-border">
        <span className="text-lg font-semibold text-sidebar-primary">Etnof Assistant</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
