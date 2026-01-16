
import { auth, signOut } from "../../auth"
import UserMenuClient from "./UserMenuClient"

export default async function UserMenu() {
  const session = await auth()
  
  if (!session?.user) return null

  async function handleLogout() {
    "use server"
    await signOut({ redirectTo: "/login" })
  }

  return <UserMenuClient user={session.user} logoutAction={handleLogout} />
}
