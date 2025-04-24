import { useEffect } from "react";
import { useLocation } from "wouter";

export default function HomePage() {
  const [, navigate] = useLocation();

  useEffect(() => {
    // Redirecionamento automático para o dashboard
    navigate("/dashboard");
  }, [navigate]);

  return null;
}
