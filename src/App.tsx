import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { TransactionProvider } from "@/contexts/TransactionContext";
import Dashboard from "@/pages/Dashboard";
import TransactionsPage from "@/pages/TransactionsPage";
import AddTransactionPage from "@/pages/AddTransactionPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import ProfilePage from "@/pages/ProfilePage";
import ChatbotPage from "@/pages/ChatbotPage";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, CreditCard, BarChart, User, MessageSquare, Settings, Sun, Moon } from 'lucide-react';

const queryClient = new QueryClient();

// Private Route Component
function PrivateRoute({ children }: { children: JSX.Element }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return currentUser ? children : <Navigate to="/login" />;
}

// FIX: Create Inner Layout Component that uses the context
function AppLayout() {
  const auth = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) => 
    `flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive 
        ? 'bg-primary text-primary-foreground' 
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`;

  return (
    <div className={`flex h-screen bg-background text-foreground ${theme}`}>
      {/* Sidebar */}
      {auth.currentUser && (
        <aside className="w-64 flex flex-col border-r bg-card p-4">
          <Link to="/dashboard" className="flex items-center mb-8 hover:opacity-80 transition">
            <div className="w-8 h-8 bg-primary rounded-full mr-2"></div>
            <h1 className="text-xl font-semibold tracking-tight">ExpenseFlow</h1>
          </Link>
          <nav className="flex-1 space-y-2">
            <NavLink to="/dashboard" className={navLinkClasses}><LayoutDashboard className="mr-3 h-5 w-5" /> Dashboard</NavLink>
            <NavLink to="/transactions/new" className={navLinkClasses}><CreditCard className="mr-3 h-5 w-5" /> Transactions</NavLink>
            <NavLink to="/analytics" className={navLinkClasses}><BarChart className="mr-3 h-5 w-5" /> Analytics</NavLink>
            <NavLink to="/profile" className={navLinkClasses}><User className="mr-3 h-5 w-5" /> Profile</NavLink>
            <NavLink to="/chatbot" className={navLinkClasses}><MessageSquare className="mr-3 h-5 w-5" /> Assistant</NavLink>
          </nav>
          <div className="mt-auto space-y-2">
             <Button variant="ghost" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="w-full justify-start text-muted-foreground hover:text-foreground">
               {theme === 'light' ? <Moon className="mr-3 h-5 w-5" /> : <Sun className="mr-3 h-5 w-5" />}
               Toggle Theme
             </Button>
             <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-muted-foreground hover:text-foreground">
               <LogOut className="mr-3 h-5 w-5" /> Log Out
             </Button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <Routes>
          {/* Public routes rendered within the layout if user is not logged in, 
              or handle redirection within the routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/transactions" element={<PrivateRoute><TransactionsPage /></PrivateRoute>} />
          <Route path="/transactions/new" element={<PrivateRoute><AddTransactionPage /></PrivateRoute>} />
          <Route path="/transactions/:id" element={<PrivateRoute><NotFound /></PrivateRoute>} />
          <Route path="/analytics" element={<PrivateRoute><AnalyticsPage /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/chatbot" element={<PrivateRoute><ChatbotPage /></PrivateRoute>} />

          {/* Redirect root based on login status */}
          <Route 
            path="/" 
            element={
              auth.currentUser ? <Navigate replace to="/dashboard" /> : <Navigate replace to="/login" />
            } 
          />

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

// App component now only sets up providers and renders the layout
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TransactionProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                 {/* Render the inner layout component which uses the contexts */}
                 <AppLayout />
              </BrowserRouter>
            </TooltipProvider>
          </TransactionProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
