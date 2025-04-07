
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      // Auto-redirect to dashboard since we're using mock authentication
      navigate("/");
    }
  }, [loading, navigate]);

  // Show loading spinner while checking auth status
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-splitwise"></div>
    </div>
  );
};

export default Index;
