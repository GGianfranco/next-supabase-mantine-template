import { showNotificationError } from "@/utils/notification";
import { AppShell, Header, Text, Button } from "@mantine/core";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import Link from "next/link";
import { useRouter } from "next/router";

export function Layout({ children }: { children: JSX.Element }) {
  const supabaseClient = useSupabaseClient();
  const user = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
    } catch {
      showNotificationError("Failed to sign out.");
    }
  };

  return (
    <AppShell
      header={
        <Header height={70} p="md">
          <div
            style={{ display: "flex", alignItems: "center", height: "100%" }}
          >
            <Text size="lg" weight="bolder">
              Home
            </Text>

            {!user && router.pathname !== "/sign-in" && (
              <Link href="/sign-in" passHref>
                <Button component="a">Sign in</Button>
              </Link>
            )}
            {!user && router.pathname === "/sign-in" && (
              <Link href="/register" passHref>
                <Button component="a">Register</Button>
              </Link>
            )}
            {user && (
              <Link href={`/p/profiles/${user.id}`} passHref>
                <Button component="a">My Profile</Button>
              </Link>
            )}
            {user && (
              <Link href="/p/profiles" passHref>
                <Button component="a">Profiles</Button>
              </Link>
            )}
            {user && (
              <Button size="lg" onClick={handleSignOut}>
                Sign out
              </Button>
            )}
          </div>
        </Header>
      }
    >
      {children}
    </AppShell>
  );
}
