'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  History,
  Upload,
  LineChart,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user.tsx';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', role: ['admin', 'staff'] },
  { href: '/pos', icon: ShoppingCart, label: 'POS / Cart', role: ['admin', 'staff'] },
  { href: '/products', icon: Package, label: 'Products', role: ['admin', 'staff'] },
  { href: '/sales', icon: History, label: 'Sales History', role: ['admin'] },
  { href: '/reports', icon: LineChart, label: 'Reports', role: ['admin'] },
  { href: '/upload', icon: Upload, label: 'Upload Stock', role: ['admin'] },
];

const bottomNavItems: any[] = [];

type SidebarNavProps = {
  isMobile?: boolean;
};

export function SidebarNav({ isMobile = false }: SidebarNavProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const currentUserRole = user?.role;

  const renderNavItem = (item: typeof navItems[0]) => {
    if (!currentUserRole || !item.role.includes(currentUserRole)) {
      return null;
    }
    const isActive = pathname === item.href;
    const linkClasses = cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
      isActive && "bg-accent text-primary",
      isMobile && "text-lg"
    );

    const linkContent = (
      <>
        <item.icon className="h-4 w-4" />
        {item.label}
      </>
    );

    if (isMobile) {
      return (
        <Link key={item.href} href={item.href} className={linkClasses}>
          {linkContent}
        </Link>
      );
    }

    return (
      <Tooltip key={item.href}>
        <TooltipTrigger asChild>
          <Link href={item.href} className={linkClasses}>
            {linkContent}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <>
      <div className={isMobile ? "grid gap-2" : "flex-1"}>
        {navItems.map(renderNavItem)}
      </div>
      {!isMobile && <div className="mt-auto">
        {bottomNavItems.map(renderNavItem)}
      </div>}
    </>
  );
}
