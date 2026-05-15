"use client";

import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import AppDashboard from "@/components/app/app-dashboard";

function AppPage() {
  return <AppDashboard />;
}

export default withPageRequiredAuth(AppPage);
