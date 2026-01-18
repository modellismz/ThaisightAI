import { TRPCProvider } from "./lib/providers";
import "./globals.css";
import UserMenu from "./components/UserMenu";

import { auth } from "../auth";
import { UserProvider } from "./context/UserContext";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en">
      <body>
        <TRPCProvider user={session?.user}>
          <UserProvider user={session?.user}>
            <UserMenu />
            {children}
          </UserProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
