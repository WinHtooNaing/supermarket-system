"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import {
  clearSession,
  readSession,
  SESSION_UPDATED_EVENT,
  type SessionUser,
} from "@/lib/auth-session";

const AppTopBar = () => {
  const router = useRouter();
  const [session, setSession] = useState<SessionUser | null>(null);

  useEffect(() => {
    function syncSession() {
      setSession(readSession());
    }

    syncSession();
    window.addEventListener(SESSION_UPDATED_EVENT, syncSession);
    window.addEventListener("storage", syncSession);

    return () => {
      window.removeEventListener(SESSION_UPDATED_EVENT, syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, []);

  function handleLogout() {
    clearSession();
    router.push("/auth");
  }

  return (
    <div className="flex justify-end border-b px-5 py-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>
              {session?.name?.slice(0, 2).toUpperCase() || "US"}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/admin/settings" className="bg-transparent">
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              // asChild
              variant="destructive"
              onClick={handleLogout}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default AppTopBar;
