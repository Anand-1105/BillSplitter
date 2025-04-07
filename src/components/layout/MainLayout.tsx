import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { User, LogOut, BarChart3, CreditCard, UserCircle, MessageSquare, Moon, Sun, Home, CircleDollarSign } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, userData, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { 
      name: "Dashboard", 
      path: "/", 
      icon: <Home size={20} /> 
    },
    { 
      name: "Transactions", 
      path: "/transactions", 
      icon: <CreditCard size={20} /> 
    },
    { 
      name: "Analytics", 
      path: "/analytics", 
      icon: <BarChart3 size={20} /> 
    },
    { 
      name: "Profile", 
      path: "/profile", 
      icon: <UserCircle size={20} /> 
    },
    { 
      name: "Chatbot", 
      path: "/chatbot", 
      icon: <MessageSquare size={20} /> 
    },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r">
          <SidebarHeader className="p-4 flex flex-col items-center">
            <Link to="/" className="flex items-center justify-center p-2 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center mr-2">
                <CircleDollarSign size={16} />
              </div>
              <h1 className="text-xl font-bold text-splitwise">ExpenseFlow</h1>
            </Link>
          </SidebarHeader>
          <SidebarContent className="flex flex-col p-4">
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link 
                  key={item.path} 
                  to={item.path}
                  className={`flex items-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === item.path 
                      ? "bg-splitwise text-white" 
                      : "hover:bg-muted"
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </Link>
              ))}
            </div>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userData?.photoURL || undefined} />
                  <AvatarFallback>
                    {userData?.displayName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-2">
                  <p className="text-sm font-medium">
                    {userData?.displayName || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {userData?.email || ""}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="h-8 w-8"
              >
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              </Button>
            </div>
            <Button 
              variant="outline" 
              className="w-full flex items-center"
              onClick={handleLogout}
            >
              <LogOut size={16} className="mr-2" />
              Logout
            </Button>
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1 flex flex-col">
          <div className="h-16 border-b flex items-center px-6">
            <SidebarTrigger />
            <Link to="/" className="flex items-center ml-4 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center mr-2">
                <CircleDollarSign size={18} />
              </div>
              <h1 className="text-lg font-bold">ExpenseFlow</h1>
            </Link>
            <div className="ml-auto">
              <h2 className="text-sm font-medium text-muted-foreground">
                {navItems.find(item => item.path === location.pathname)?.name || "Dashboard"}
              </h2>
            </div>
          </div>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;
