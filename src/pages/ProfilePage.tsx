import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Mail, 
  Moon, 
  Sun, 
  Download, 
  Edit,
  Loader2,
  LogOut,
  Image,
  Calendar
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Switch } from "@/components/ui/switch";
import { useTransactions } from "@/contexts/TransactionContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const { currentUser, userData, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { transactions } = useTransactions();
  const navigate = useNavigate();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [displayName, setDisplayName] = useState(userData?.displayName || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleUpdateProfile = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        displayName
      });
      
      toast.success("Profile updated successfully!");
      setIsEditMode(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
    }
  };

  const generateTransactionPDF = async () => {
    if (!transactions.length || !userData) return;
    
    setIsGeneratingPdf(true);
    
    try {
      const pdf = new jsPDF();
      
      pdf.setFontSize(20);
      pdf.text("Transaction Report", 14, 22);
      
      pdf.setFontSize(12);
      pdf.text(`Generated for: ${userData.displayName || "User"}`, 14, 32);
      pdf.text(`Email: ${userData.email || ""}`, 14, 38);
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, 14, 44);
      
      const tableData = transactions.map(transaction => [
        transaction.title,
        transaction.category,
        transaction.date.toLocaleDateString(),
        `$${transaction.amount.toFixed(2)}`,
        transaction.currency,
        transaction.paidByName,
        transaction.settled ? "Settled" : "Pending"
      ]);
      
      (pdf as any).autoTable({
        startY: 50,
        head: [["Title", "Category", "Date", "Amount", "Currency", "Paid By", "Status"]],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [1, 195, 159],
          textColor: [255, 255, 255]
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        }
      });
      
      const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
      const settledAmount = transactions.filter(t => t.settled).reduce((sum, t) => sum + t.amount, 0);
      const pendingAmount = totalAmount - settledAmount;
      
      const currentY = (pdf as any).lastAutoTable.finalY + 10;
      
      pdf.text("Summary", 14, currentY);
      pdf.text(`Total Transactions: ${transactions.length}`, 14, currentY + 6);
      pdf.text(`Total Amount: $${totalAmount.toFixed(2)}`, 14, currentY + 12);
      pdf.text(`Settled Amount: $${settledAmount.toFixed(2)}`, 14, currentY + 18);
      pdf.text(`Pending Amount: $${pendingAmount.toFixed(2)}`, 14, currentY + 24);
      
      pdf.save(`transaction-report-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success("Transaction report generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate transaction report");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Profile</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Manage your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={userData?.photoURL || undefined} />
                <AvatarFallback className="text-2xl">
                  {userData?.displayName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              
              {!isEditMode && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="flex items-center"
                  onClick={() => setIsEditMode(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
            
            {isEditMode ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="displayName" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setIsEditMode(false);
                      setDisplayName(userData?.displayName || "");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 bg-splitwise hover:bg-splitwise-hover"
                    onClick={handleUpdateProfile}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-sm">Display Name</Label>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">{userData?.displayName || "User"}</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-sm">Email</Label>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">{userData?.email || "No email provided"}</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-sm">Member Since</Label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">
                      {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : "Unknown"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Manage your app appearance settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {theme === "light" ? (
                    <Sun className="h-5 w-5 text-amber-500" />
                  ) : (
                    <Moon className="h-5 w-5 text-blue-500" />
                  )}
                  <div>
                    <p className="font-medium">Theme</p>
                    <p className="text-sm text-muted-foreground">
                      Switch between light and dark mode
                    </p>
                  </div>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Export</CardTitle>
              <CardDescription>Export your transaction data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Transaction Report</p>
                  <p className="text-sm text-muted-foreground">
                    Download a comprehensive report of all your transactions
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={generateTransactionPDF}
                  disabled={isGeneratingPdf || transactions.length === 0}
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>Manage your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="destructive"
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
