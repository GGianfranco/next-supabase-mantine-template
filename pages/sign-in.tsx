import type { NextPage } from "next";
import { SignInForm } from "@/components/SignInForm/SignInForm";
import { useUser } from "@supabase/auth-helpers-react";

const SignIn: NextPage = () => {
  const user = useUser();

  console.log(user);

  return <SignInForm />;
};

export default SignIn;
