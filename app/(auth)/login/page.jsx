import React from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Personal Dashboard",
  description: "Secure login for your personal dashboard.",
};

export default async function LoginPage(props) {
  const session = await getServerSession(authOptions);
  
  const params = await props.searchParams;
  const isExpired = params?.expired === "1";

  if (session && !isExpired) {
    redirect("/app");
  }

  // The LoginForm component handles the full bleed background styling to sync with its slider
  return (
    <LoginForm />
  );
}
