import { Bell, Search, Command } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useRole } from "@/context/RoleContext";
import { ROLE_LABEL } from "@/lib/roles";
import { Link } from "react-router-dom";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export function TopBar() {
  const { role, user: currentUser, logout } = useRole();
  if (!currentUser) return null;
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur-xl flex items-center gap-3 px-4 md:px-6">
      <SidebarTrigger />

      <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search people, docs, requests…"
            className="pl-9 pr-12 bg-muted/50 border-transparent focus-visible:bg-background"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 text-[10px] text-muted-foreground bg-background border border-border px-1.5 py-0.5 rounded">
            <Command className="h-2.5 w-2.5" /> K
          </kbd>
        </div>
      </div>

      <div className="flex-1 md:hidden" />

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden sm:flex gap-2 font-medium">
              <span className="h-2 w-2 rounded-full bg-accent" />
              {ROLE_LABEL[role]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Signed in as {ROLE_LABEL[role]}</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] bg-accent text-accent-foreground border-0">3</Badge>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg hover:bg-muted px-2 py-1 transition-colors">
              <Avatar className="h-8 w-8 ring-2 ring-accent/20">
                <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                <AvatarFallback>{currentUser.name.split(" ").map(part => part[0]).join("").slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-medium leading-tight">{currentUser.name}</div>
                <div className="text-[10px] text-muted-foreground leading-tight">{currentUser.designation}</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{currentUser.name}</DropdownMenuLabel>
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal -mt-2">{currentUser.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link to="/profile">My profile</Link></DropdownMenuItem>
            <DropdownMenuItem>Preferences</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void logout()}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}