import Link from "next/link";
import { upperFirst } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import {
  TextInput,
  PasswordInput,
  Text,
  Paper,
  Group,
  PaperProps,
  Button,
  Divider,
  Anchor,
  Stack,
} from "@mantine/core";
import {
  FacebookButton,
  GoogleButton,
} from "@/components/SocialButtons/SocialButtons";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { Provider } from "@supabase/supabase-js";
import {
  showNotificationError,
  showNotificationInfo,
} from "@/utils/notification";

export function SignInForm(props: PaperProps) {
  const supabaseClient = useSupabaseClient();
  const [loading, setLoading] = useState(false);

  const emailForm = useForm({
    initialValues: {
      email: "",
    },

    validate: {
      email: (val) => (/^\S+@\S+$/.test(val) ? null : "Invalid email"),
    },
  });

  const emailAndPasswordForm = useForm({
    initialValues: {
      email: "",
      password: "",
    },

    validate: {
      email: (val) => (/^\S+@\S+$/.test(val) ? null : "Invalid email"),
      password: (val) =>
        val.length <= 6
          ? "Password should include at least 6 characters"
          : null,
    },
  });

  const handleSignInWithOtp = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabaseClient.auth.signInWithOtp({
        email,
      });
      if (error) throw error;
      showNotificationInfo("Check your email for the sign in link!");

      // Save to anaylitics.
    } catch {
      showNotificationError("Failed to send sign in link to your email.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignInWithOauth = async (provider: Provider) => {
    try {
      setLoading(true);
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider,
      });
      if (error) throw error;

      // Save to anaylitics here.
    } catch {
      showNotificationError("Failed to sign in with OAuth");
    } finally {
      setLoading(false);
    }
  };

  const handleSignInWithEmailAndPassword = async (
    email: string,
    password: string
  ) => {
    try {
      setLoading(true);
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // Save to anaylitics here.
    } catch {
      showNotificationError("Failed to sign in with email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper radius="md" p="xl" withBorder {...props}>
      <Text size="lg" weight={500}>
        Welcome to Mantine, sign in with
      </Text>

      <Group grow mb="md" mt="md">
        <GoogleButton
          disabled={loading}
          radius="xl"
          onClick={() => handleSignInWithOauth("google")}
        >
          Google
        </GoogleButton>
        <FacebookButton
          disabled={loading}
          radius="xl"
          onClick={() => handleSignInWithOauth("facebook")}
        >
          Facebook
        </FacebookButton>
      </Group>

      <Divider
        label="Or continue with email link"
        labelPosition="center"
        my="lg"
      />

      <form
        onSubmit={emailForm.onSubmit((values) => {
          handleSignInWithOtp(values.email);
        })}
      >
        <Stack>
          <TextInput
            required
            label="Email"
            placeholder="hello@mantine.dev"
            value={emailForm.values.email}
            onChange={(event) =>
              emailForm.setFieldValue("email", event.currentTarget.value)
            }
            error={emailForm.errors.email && "Invalid email"}
          />
        </Stack>

        <Group position="right" mt="xl">
          <Button disabled={loading} type="submit">
            {upperFirst("send sign in link")}
          </Button>
        </Group>
      </form>

      <Divider
        label="Or continue with email and password"
        labelPosition="center"
        my="lg"
      />

      <form
        onSubmit={emailAndPasswordForm.onSubmit((values) =>
          handleSignInWithEmailAndPassword(values.email, values.password)
        )}
      >
        <Stack>
          <TextInput
            required
            label="Email"
            placeholder="hello@mantine.dev"
            value={emailAndPasswordForm.values.email}
            onChange={(event) =>
              emailAndPasswordForm.setFieldValue(
                "email",
                event.currentTarget.value
              )
            }
            error={emailAndPasswordForm.errors.email && "Invalid email"}
          />

          <PasswordInput
            required
            label="Password"
            placeholder="Your password"
            value={emailAndPasswordForm.values.password}
            onChange={(event) =>
              emailAndPasswordForm.setFieldValue(
                "password",
                event.currentTarget.value
              )
            }
            error={
              emailAndPasswordForm.errors.password &&
              "Password should include at least 6 characters"
            }
          />
        </Stack>

        <Group position="apart" mt="xl">
          <Link href="/register" passHref>
            <Anchor component="a" type="button" color="dimmed" size="xs">
              Don&apos;t have an account? Register
            </Anchor>
          </Link>
          <Button disabled={loading} type="submit">
            {upperFirst("sign in")}
          </Button>
        </Group>
      </form>
    </Paper>
  );
}
