import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getLocalSession } from "@/lib/local-db";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: () => {
    const user = getLocalSession();
    if (!user) throw redirect({ to: "/auth" });
    return { user };
  },
  component: () => <Outlet />,
});
