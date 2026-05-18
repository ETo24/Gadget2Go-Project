import React from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, ShoppingBag, Plus, MessageCircle, User, Sparkles, Settings as SettingsIcon, Bell, LayoutDashboard, Wallet, ShieldCheck, LogOut, Sun, Moon, Search, Scan, BadgeCheck, Store } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';

const sideItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/buy', label: 'Buy', icon: ShoppingBag },
  { to: '/sell', label: 'Sell', icon: Plus },
  { to: '/match', label: 'Smart Match', icon: Scan },
  { to: '/valuation', label: 'AI Valuation', icon: Sparkles },
  { to: '/chat', label: 'Chat', icon: MessageCircle },
  { to: '/wallet', label: 'Wallet & Orders', icon: Wallet },
  { to: '/validation', label: 'Device Validation', icon: BadgeCheck },
  { to: '/verification', label: 'Verify ID', icon: ShieldCheck },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

const mobileTabs = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/buy', label: 'Buy', icon: ShoppingBag },
  { to: '/sell', label: 'Sell', icon: Plus },
  { to: '/chat', label: 'Chat', icon: MessageCircle },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function Layout({ children }) {
  const { user, theme, toggleTheme, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 glass-strong border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2" data-testid="brand-logo">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-navy text-white">
              <span className="font-heading text-base font-bold tracking-tight">G2</span>
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="font-heading text-base font-bold text-foreground">Gadget2Go</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-teal-600 dark:text-teal-400">Cybridge Co.</p>
            </div>
          </Link>

          <div className="ml-2 hidden flex-1 max-w-xl md:flex">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                data-testid="global-search-input"
                placeholder="Search gadgets, brands, models…"
                className="h-10 rounded-full border-border/60 bg-muted/40 pl-9"
                onKeyDown={(e) => { if (e.key === 'Enter') navigate('/buy?q=' + encodeURIComponent(e.currentTarget.value)); }}
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button data-testid="theme-toggle" variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button data-testid="header-notifications-btn" variant="ghost" size="icon" onClick={() => navigate('/notifications')} className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-teal-500" />
            </Button>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button data-testid="header-user-menu" className="flex items-center gap-2 rounded-full border border-border/60 bg-card pr-3 pl-1 py-1 hover:bg-muted">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
                    {user.role === 'dealer' && <Store className="hidden h-3 w-3 text-teal-600 sm:inline" />}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')} data-testid="menu-profile"><User className="mr-2 h-4 w-4" />Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard')} data-testid="menu-dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/wallet')} data-testid="menu-wallet"><Wallet className="mr-2 h-4 w-4" />Wallet</DropdownMenuItem>
                  {user.role === 'admin' && <DropdownMenuItem onClick={() => navigate('/admin')} data-testid="menu-admin"><ShieldCheck className="mr-2 h-4 w-4" />Admin</DropdownMenuItem>}
                  <DropdownMenuItem onClick={() => navigate('/settings')} data-testid="menu-settings"><SettingsIcon className="mr-2 h-4 w-4" />Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { logout(); navigate('/'); }} data-testid="menu-logout"><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button data-testid="header-signin-btn" onClick={() => navigate('/login')} className="rounded-full bg-navy text-white hover:bg-navy-700">Sign in</Button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6 sm:px-6">
        <aside className="hidden w-60 shrink-0 lg:block">
          <nav className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto space-y-1 pr-2">
            {sideItems.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                data-testid={`sidebar-${it.to.replace('/', '')}`}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all ${
                    isActive ? 'bg-navy text-white shadow-[0_8px_24px_rgba(11,31,58,0.18)]' : 'text-foreground/80 hover:bg-muted'
                  }`
                }
              >
                <it.icon className="h-5 w-5" strokeWidth={1.7} />
                <span>{it.label}</span>
              </NavLink>
            ))}
            <div className="mt-6 rounded-3xl border border-teal-500/20 bg-teal-50/60 p-4 dark:border-teal-500/20 dark:bg-teal-500/5">
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400">
                <Wallet className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-wider">Wallet</p>
              </div>
              <p className="mt-2 font-heading text-2xl font-bold text-foreground">${user?.walletBalance ?? 0}</p>
              <p className="text-xs text-muted-foreground">Available to withdraw</p>
            </div>
            <div className="rounded-3xl bg-navy p-4 text-white">
              <div className="flex items-center gap-2 text-teal-300">
                <ShieldCheck className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-wider">Trust Score</p>
              </div>
              <p className="mt-2 font-heading text-2xl font-bold">{user?.trustScore ?? 50}/100</p>
              <p className="text-xs text-white/60">{user?.trustLabel || 'Verified by Cybridge'}</p>
            </div>
          </nav>
        </aside>

        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          className="flex-1 min-w-0 pb-24 lg:pb-6"
        >
          {children}
        </motion.main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden glass-strong border-t border-border/60">
        <div className="mx-auto flex max-w-[1400px] items-stretch justify-around px-2 py-2">
          {mobileTabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              data-testid={`mobnav-${t.to.replace('/', '')}`}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium ${
                  isActive ? 'text-teal-600 dark:text-teal-400' : 'text-foreground/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`grid h-9 w-9 place-items-center rounded-full transition-colors ${isActive ? 'bg-navy text-white' : ''}`}>
                    <t.icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <span>{t.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
