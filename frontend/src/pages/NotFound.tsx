import React from "react";
import { Link } from "react-router-dom";
import { School, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const NotFound: React.FC = () => {
  const { user, getDefaultRoute } = useAuth();
  const returnPath = user ? getDefaultRoute(user.role) : "/login";

  return (
    <div className="min-h-screen bg-campus-light flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-campus-border text-center shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-campus-blue/10 text-campus-blue mx-auto flex items-center justify-center mb-4">
          <School className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-black text-campus-navy">404</h1>
        <h2 className="text-base font-bold text-campus-navy mt-1">Page Not Found</h2>
        <p className="text-xs text-campus-muted mt-2">
          The requested CampusOne resource or dashboard page does not exist or has been relocated.
        </p>

        <Link
          to={returnPath}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-campus-blue hover:bg-campus-dark text-white text-xs font-bold rounded-xl shadow-md shadow-campus-blue/20 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
