'use client';
import Link from 'next/link';
import {
  Search,
  PanelLeft,
  UserCircle,
  LogOut,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { SidebarNav } from './sidebar-nav';
import { useProducts } from '@/hooks/use-products';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import type { User } from '@/lib/placeholder-data';


type HeaderProps = {
  onLogout: () => void;
  user: User | null;
};


export function Header({ onLogout, user }: HeaderProps) {
  const { searchTerm, setSearchTerm } = useProducts();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <SheetHeader>
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SheetDescription className="sr-only">Main navigation menu</SheetDescription>
          </SheetHeader>
          <nav className="grid gap-6 text-lg font-medium">
             <Link
              href="/dashboard"
              className="group flex h-10 shrink-0 items-center justify-start gap-2 text-lg font-semibold text-primary md:text-base"
            >
              <span className="font-bold">prasamz</span>
            </Link>
            <SidebarNav isMobile={true} />
          </nav>
        </SheetContent>
      </Sheet>

      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search products..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
       <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
          >
            <UserCircle className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{user?.name || 'User'}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout}><LogOut className="mr-2 h-4 w-4" /> Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
