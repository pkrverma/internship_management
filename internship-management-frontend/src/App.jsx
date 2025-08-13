// src/App.jsx
import React from "react";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import ScrollToTop from "./components/layout/ScrollToTop";

function App() {
  return (
    // Provide authentication context to the whole app
    <AuthProvider>
      {/* Scrolls to top on route change */}
      <ScrollToTop />
      {/* Render all application routes */}
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
