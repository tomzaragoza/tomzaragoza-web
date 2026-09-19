import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; returnPath?: string }>;
}) {
  const { error, returnPath } = await searchParams;
  const params = new URLSearchParams();

  if (error) params.set("error", error);
  if (returnPath) params.set("returnPath", returnPath);

  redirect(`/sign-in${params.size ? `?${params.toString()}` : ""}`);
}
