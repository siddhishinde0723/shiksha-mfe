"use client";

import React, { useEffect } from "react";
import { FontSizeProvider } from "../context/FontSizeContext";
import { UnderlineLinksProvider } from "../context/UnderlineLinksContext";
import { telemetryFactory } from "@shared-lib-v2/DynamicForm/utils/telemetry";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    telemetryFactory.init();

    // Set userId in cookies for cross-port access
    const currentUserId = localStorage.getItem("userId");
    console.log("🍪 App-level cookie setting - currentUserId:", currentUserId);
    console.log("🍪 App-level cookie setting - hostname:", window.location.hostname);
    console.log("🍪 App-level cookie setting - origin:", window.location.origin);
    
    if (currentUserId) {
      const domain = window.location.hostname;
      const cookieValue = `userId=${currentUserId}; path=/; domain=${domain}; SameSite=Lax; Secure=false`;
      document.cookie = cookieValue;
      console.log("🍪 App-level cookie setting:", cookieValue);
      console.log("🍪 App-level cookies after setting:", document.cookie);
      
      // Also try setting without domain restriction
      const cookieValueNoDomain = `userId=${currentUserId}; path=/; SameSite=Lax; Secure=false`;
      document.cookie = cookieValueNoDomain;
      console.log("🍪 App-level cookie setting (no domain):", cookieValueNoDomain);
      console.log("🍪 App-level cookies after no-domain setting:", document.cookie);
    } else {
      console.warn("🍪 No userId found in localStorage for cookie setting");
    }

    // Listen for force logout events from other tabs
    const handleForceLogout = (event: CustomEvent) => {
      console.log("Force logout event received:", event.detail);

      // Clear all storage
      try {
        localStorage.clear();
        sessionStorage.clear();

        // Clear all cookies
        document.cookie.split(";").forEach(function (c) {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(
              /=.*/,
              "=;expires=" + new Date().toUTCString() + ";path=/"
            );
        });

        console.log("All sessions cleared due to force logout event");

        // Redirect to login page
        window.location.href = "/login";
      } catch (error) {
        console.error("Error during force logout:", error);
        // Fallback redirect
        window.location.href = "/login";
      }
    };

    // Add event listener for force logout
    window.addEventListener("forceLogout", handleForceLogout as EventListener);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener(
        "forceLogout",
        handleForceLogout as EventListener
      );
    };
  }, []);

  return (
    <FontSizeProvider>
      <UnderlineLinksProvider>{children}</UnderlineLinksProvider>
    </FontSizeProvider>
  );
}
