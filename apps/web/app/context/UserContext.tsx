"use client";
"use client";

import { createContext, useContext, ReactNode } from 'react';

interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
  orgId?: string | null;
}

const UserContext = createContext<User | undefined>(undefined);

export function UserProvider({ user, children }: { user?: User, children: ReactNode }) {
  return (
    <UserContext.Provider value={user}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
