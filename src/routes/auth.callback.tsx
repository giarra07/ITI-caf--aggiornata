import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("// exchanging oauth token…");

  useEffect(() => {
    const sb = supabase();
    if (!sb) {
      navigate({ to: "/" });
      return;
    }

    sb.auth.getSession().then(({ data, error }) => {
      if (error) {
        setMsg(`[err] ${error.message}`);
        setTimeout(() => navigate({ to: "/" }), 2500);
        return;
      }
      if (data.session) {
        navigate({ to: "/dashboard" });
      } else {
        setMsg("// sessione non trovata — riprova login");
        setTimeout(() => navigate({ to: "/" }), 2500);
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-silicon-black flex items-center justify-center font-mono text-primary">
      <p className="text-sm text-glow animate-pulse">{msg}</p>
    </div>
  );
}
