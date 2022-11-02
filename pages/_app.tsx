import type { AppProps } from "next/app";
import { useState } from "react";
import Head from "next/head";
import { MantineProvider } from "@mantine/core";
import { NotificationsProvider } from "@mantine/notifications";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import {
  SessionContextProvider,
  Session,
  // useSessionContext,
} from "@supabase/auth-helpers-react";
// import { useRouter } from "next/router";
import { Layout } from "@/components/Layout";
import { Database } from "lib/database.types";

function App({
  Component,
  pageProps,
}: AppProps<{
  initialSession: Session;
}>) {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());
  // const router = useRouter();

  return (
    <>
      <Head>
        <title>Next Supabase Mantine Template</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </Head>

      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{
          /** Put your mantine theme override here */
          colorScheme: "light",
        }}
      >
        <NotificationsProvider limit={4}>
          <SessionContextProvider
            supabaseClient={supabaseClient}
            initialSession={pageProps.initialSession}
          >
            <Layout>
              {/* {router.pathname.includes("/p") ? (
                <Auth>
                  <Component {...pageProps} />
                </Auth>
              ) : (
                <Component {...pageProps} />
              )} */}
              <Component {...pageProps} />
            </Layout>
          </SessionContextProvider>
        </NotificationsProvider>
      </MantineProvider>
    </>
  );
}

// Commented client-side protection implementation.

// function Auth({ children }: { children: JSX.Element }) {
// const router = useRouter();
// const { isLoading, session } = useSessionContext();

// if (!router.isReady) return null;
// if (isLoading) return null;

// if (!session?.user) {
//   router.push("/sign-in");
//   return null;
// }

//   return children;
// }

export default App;
