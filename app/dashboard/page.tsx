import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import LogoutButton from "./LogoutButton";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <LogoutButton />
        </div>

        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Logged in as</p>
          <p className="mt-1 font-medium text-gray-900">{session.email}</p>
          <p className="mt-1 font-mono text-xs text-gray-400">
            ID: {session.userId}
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-4 text-center">
          <p className="text-sm text-gray-500">
            Passkey features will be added here
          </p>
        </div>
      </div>
    </div>
  );
}
