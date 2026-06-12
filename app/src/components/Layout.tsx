import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  MessageCircle,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const userNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/assessment', label: 'Assessment', icon: ClipboardList },
  { path: '/chatbot', label: 'Companion', icon: MessageCircle },
];

const adminNavItem = { path: '/admin', label: 'Admin', icon: ShieldCheck };

export default function Layout({ children }: LayoutProps) {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = isAdmin ? [...userNavItems, adminNavItem] : userNavItems;

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen relative z-10">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg"
        style={{ background: 'rgba(20,20,20,0.9)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40 flex flex-col
          transition-all duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-16' : 'lg:w-60'}
        `}
        style={{
          background: 'rgba(8, 8, 8, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          width: isCollapsed ? undefined : '240px',
        }}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 h-16 border-b border-white/5 ${isCollapsed ? 'lg:justify-center' : ''}`}>
          <BrainCircuit size={24} style={{ color: '#6366f1' }} />
          <span className={`font-semibold text-lg tracking-tight ${isCollapsed ? 'lg:hidden' : ''}`}>
            InsightPulse
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150
                  ${active
                    ? 'text-white'
                    : 'text-[#5a5a5a] hover:text-[#e2e2e2] hover:bg-white/5'
                  }
                  ${isCollapsed ? 'lg:justify-center' : ''}
                `}
                style={active ? { background: 'rgba(99, 102, 241, 0.15)' } : {}}
              >
                <Icon size={18} />
                <span className={`${isCollapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                {active && !isCollapsed && (
                  <div className="ml-auto w-1 h-1 rounded-full" style={{ background: '#6366f1' }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="px-2 py-4 border-t border-white/5">
          <div className={`flex items-center gap-3 px-3 py-2 mb-2 ${isCollapsed ? 'lg:justify-center' : ''}`}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
              style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1' }}
            >
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className={`${isCollapsed ? 'lg:hidden' : ''}`}>
              <p className="text-sm font-medium truncate max-w-[140px]">{user?.full_name}</p>
              <p className="text-xs text-[#5a5a5a] truncate max-w-[140px]">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className={`
              ip-btn-ghost w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[#5a5a5a] hover:text-red-400
              ${isCollapsed ? 'lg:justify-center' : ''}
            `}
          >
            <LogOut size={16} />
            <span className={`${isCollapsed ? 'lg:hidden' : ''}`}>Sign Out</span>
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex items-center justify-center py-2 border-t border-white/5 text-[#5a5a5a] hover:text-[#e2e2e2] transition-colors"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="p-6 lg:p-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
