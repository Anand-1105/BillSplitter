
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTransactions, Participant } from "@/contexts/TransactionContext";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar as CalendarIcon, Plus, CreditCard, User, X, Loader2, Check } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, startOfDay } from "date-fns";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

type FriendUser = {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
};

const EXPENSE_CATEGORIES = [
  "Food & Drinks",
  "Groceries",
  "Transportation",
  "Entertainment",
  "Shopping",
  "Utilities",
  "Rent",
  "Travel",
  "Health",
  "Education",
  "Other"
];

const CURRENCIES = [
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "INR", label: "Indian Rupee (₹)" },
];

const SPLIT_METHODS = [
  { value: "equal", label: "Split Equally" },
  { value: "percentage", label: "Split by Percentage" },
  { value: "amount", label: "Split by Exact Amount" },
];

const AddTransactionPage = () => {
  const { currentUser, userData } = useAuth();
  const { createTransaction, loading } = useTransactions();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [paidBy, setPaidBy] = useState("");
  const [splitMethod, setSplitMethod] = useState("equal");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [friendEmail, setFriendEmail] = useState("");
  const [isFriendLoading, setIsFriendLoading] = useState(false);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  
  // Fetch friends when component mounts
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchFriends = async () => {
      try {
        // Get unique users from transactions
        const transactionsQuery = query(
          collection(db, "transactions"),
          where("participants", "array-contains", { userId: currentUser.uid })
        );
        
        const querySnapshot = await getDocs(transactionsQuery);
        const uniqueUsers = new Map<string, FriendUser>();
        
        querySnapshot.forEach(doc => {
          const transaction = doc.data();
          
          transaction.participants.forEach((participant: any) => {
            if (participant.userId !== currentUser.uid && !uniqueUsers.has(participant.userId)) {
              uniqueUsers.set(participant.userId, {
                id: participant.userId,
                name: participant.name,
                email: participant.email,
                photoURL: participant.photoURL
              });
            }
          });
          
          // Also add the payer if it's not the current user
          if (transaction.paidBy !== currentUser.uid && !uniqueUsers.has(transaction.paidBy)) {
            uniqueUsers.set(transaction.paidBy, {
              id: transaction.paidBy,
              name: transaction.paidByName,
              email: "", // We might not have the email
              photoURL: undefined
            });
          }
        });
        
        setFriends(Array.from(uniqueUsers.values()));
      } catch (error) {
        console.error("Error fetching friends:", error);
      }
    };
    
    fetchFriends();
    
    // Add current user to participants if they're not already there
    if (userData && !participants.some(p => p.userId === currentUser.uid)) {
      setParticipants([
        {
          userId: currentUser.uid,
          name: userData.displayName || "You",
          email: userData.email || "",
          photoURL: userData.photoURL || undefined,
          amount: 0,
          paid: false
        }
      ]);
      
      // Set current user as payer by default
      setPaidBy(currentUser.uid);
    }
  }, [currentUser, userData]);
  
  // Update participant amounts when split method or total amount changes
  useEffect(() => {
    if (!participants.length || !amount) return;
    
    const totalAmount = parseFloat(amount);
    if (isNaN(totalAmount)) return;
    
    if (splitMethod === "equal") {
      const perPersonAmount = totalAmount / participants.length;
      
      setParticipants(prev => prev.map(p => ({
        ...p,
        amount: parseFloat(perPersonAmount.toFixed(2)),
        paid: p.userId === paidBy
      })));
    }
  }, [splitMethod, amount, participants.length, paidBy]);

  const handleAmountChange = (value: string) => {
    // Only allow numeric input with up to 2 decimal places
    const regex = /^\d*\.?\d{0,2}$/;
    if (regex.test(value) || value === "") {
      setAmount(value);
    }
  };

  const handleAddFriend = async () => {
    if (!friendEmail.trim() || !currentUser) return;
    
    setIsFriendLoading(true);
    
    try {
      // Check if this email is already a participant
      if (participants.some(p => p.email.toLowerCase() === friendEmail.toLowerCase())) {
        toast.error("This person is already added to the transaction");
        return;
      }
      
      // Query Firestore to find user with this email
      const usersQuery = query(
        collection(db, "users"),
        where("email", "==", friendEmail.toLowerCase())
      );
      
      const querySnapshot = await getDocs(usersQuery);
      
      if (querySnapshot.empty) {
        // User not found, create a placeholder
        const newParticipant: Participant = {
          userId: `temp-${Date.now()}`,
          name: friendEmail.split('@')[0],
          email: friendEmail,
          amount: 0,
          paid: false
        };
        
        setParticipants(prev => [...prev, newParticipant]);
        setFriends(prev => [...prev, {
          id: newParticipant.userId,
          name: newParticipant.name,
          email: newParticipant.email
        }]);
        
        toast.success("Friend added to transaction");
      } else {
        // User found
        const userData = querySnapshot.docs[0].data();
        const newParticipant: Participant = {
          userId: querySnapshot.docs[0].id,
          name: userData.displayName || userData.email.split('@')[0],
          email: userData.email,
          photoURL: userData.photoURL,
          amount: 0,
          paid: false
        };
        
        setParticipants(prev => [...prev, newParticipant]);
        
        // Add to friends list if not already there
        if (!friends.some(f => f.id === newParticipant.userId)) {
          setFriends(prev => [...prev, {
            id: newParticipant.userId,
            name: newParticipant.name,
            email: newParticipant.email,
            photoURL: newParticipant.photoURL
          }]);
        }
        
        toast.success("Friend added to transaction");
      }
      
      setFriendEmail("");
      setIsAddFriendOpen(false);
    } catch (error) {
      console.error("Error adding friend:", error);
      toast.error("Failed to add friend");
    } finally {
      setIsFriendLoading(false);
    }
  };

  const handleAddExistingFriend = (friend: FriendUser) => {
    // Check if friend is already a participant
    if (participants.some(p => p.userId === friend.id)) {
      toast.error("This person is already added to the transaction");
      return;
    }
    
    const newParticipant: Participant = {
      userId: friend.id,
      name: friend.name,
      email: friend.email,
      photoURL: friend.photoURL,
      amount: 0,
      paid: friend.id === paidBy
    };
    
    setParticipants(prev => [...prev, newParticipant]);
    toast.success("Friend added to transaction");
  };

  const handleRemoveParticipant = (userId: string) => {
    // Don't allow removing current user
    if (userId === currentUser?.uid) {
      toast.error("You cannot remove yourself from the transaction");
      return;
    }
    
    setParticipants(prev => prev.filter(p => p.userId !== userId));
    
    // If removed user was the payer, set current user as payer
    if (userId === paidBy) {
      setPaidBy(currentUser?.uid || "");
    }
    
    toast.success("Participant removed");
  };

  const handleParticipantAmountChange = (userId: string, value: string) => {
    // Only allow numeric input with up to 2 decimal places
    const regex = /^\d*\.?\d{0,2}$/;
    if (!regex.test(value) && value !== "") return;
    
    const newAmount = value === "" ? 0 : parseFloat(value);
    
    setParticipants(prev => prev.map(p => 
      p.userId === userId 
        ? { ...p, amount: newAmount } 
        : p
    ));
  };

  const validateTransaction = () => {
    if (!title.trim()) {
      toast.error("Please enter a title for the transaction");
      return false;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return false;
    }
    
    if (!category) {
      toast.error("Please select a category");
      return false;
    }
    
    if (!paidBy) {
      toast.error("Please select who paid");
      return false;
    }
    
    if (participants.length < 2) {
      toast.error("Please add at least one more person to split with");
      return false;
    }
    
    // For amount-based or percentage-based splits, check that the sum matches
    if (splitMethod === "amount") {
      const totalShares = participants.reduce((sum, p) => sum + p.amount, 0);
      const totalAmount = parseFloat(amount);
      
      if (Math.abs(totalShares - totalAmount) > 0.01) {
        toast.error(`The sum of individual amounts (${totalShares.toFixed(2)}) doesn't match the total (${totalAmount.toFixed(2)})`);
        return false;
      }
    } else if (splitMethod === "percentage") {
      const totalPercentage = participants.reduce((sum, p) => sum + p.amount, 0);
      
      if (Math.abs(totalPercentage - 100) > 0.01) {
        toast.error(`The sum of percentages (${totalPercentage.toFixed(2)}%) should equal 100%`);
        return false;
      }
      
      // Convert percentages to actual amounts
      const totalAmount = parseFloat(amount);
      setParticipants(prev => prev.map(p => ({
        ...p,
        amount: parseFloat(((p.amount / 100) * totalAmount).toFixed(2))
      })));
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateTransaction()) return;
    
    // If someone other than the user paid, show payment confirmation
    if (paidBy !== currentUser?.uid) {
      setShowPaymentConfirmation(true);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const payer = participants.find(p => p.userId === paidBy);
      
      if (!payer) {
        toast.error("Selected payer not found in participants");
        return;
      }
      
      // Create transaction object
      const newTransaction = {
        title,
        description,
        amount: parseFloat(amount),
        currency,
        date: startOfDay(date),
        category,
        paidBy,
        paidByName: payer.name,
        participants
      };
      
      await createTransaction(newTransaction);
      
      toast.success("Transaction created successfully!");
      navigate("/transactions");
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast.error("Failed to create transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentConfirm = async () => {
    setIsPaymentProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const payer = participants.find(p => p.userId === paidBy);
      
      if (!payer) {
        toast.error("Selected payer not found in participants");
        return;
      }
      
      // Create transaction object
      const newTransaction = {
        title,
        description,
        amount: parseFloat(amount),
        currency,
        date: startOfDay(date),
        category,
        paidBy,
        paidByName: payer.name,
        participants
      };
      
      await createTransaction(newTransaction);
      
      toast.success("Payment processed and transaction created successfully!");
      setShowPaymentConfirmation(false);
      navigate("/transactions");
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Failed to process payment");
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Add Expense</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Expense Details</CardTitle>
              <CardDescription>
                Add information about this expense
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title"
                  placeholder="e.g., Dinner at Restaurant"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea 
                  id="description"
                  placeholder="Any additional details about this expense"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-muted-foreground">
                      {currency === "USD" ? "$" : 
                       currency === "EUR" ? "€" : 
                       currency === "GBP" ? "£" : "₹"}
                    </span>
                    <Input 
                      id="amount"
                      className="pl-8"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((curr) => (
                        <SelectItem key={curr.value} value={curr.value}>
                          {curr.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(date) => date && setDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Split Details</CardTitle>
                <CardDescription>
                  Specify who paid and how to split the expense
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paidBy">Paid by</Label>
                  <Select 
                    value={paidBy} 
                    onValueChange={setPaidBy}
                    disabled={!participants.length}
                  >
                    <SelectTrigger id="paidBy">
                      <SelectValue placeholder="Select who paid" />
                    </SelectTrigger>
                    <SelectContent>
                      {participants.map((p) => (
                        <SelectItem key={p.userId} value={p.userId}>
                          {p.userId === currentUser?.uid ? "You" : p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="splitMethod">Split method</Label>
                  <Select value={splitMethod} onValueChange={setSplitMethod}>
                    <SelectTrigger id="splitMethod">
                      <SelectValue placeholder="Select split method" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPLIT_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Participants</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAddFriendOpen(true)}
                      className="h-8 text-splitwise hover:text-splitwise-hover"
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add Friend
                    </Button>
                  </div>
                  
                  <div className="space-y-3 mt-2">
                    {participants.map((participant) => (
                      <div key={participant.userId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src={participant.photoURL || undefined} />
                            <AvatarFallback>
                              {participant.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {participant.userId === currentUser?.uid ? "You" : participant.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {participant.userId === paidBy && "Paid the bill"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          {splitMethod !== "equal" && (
                            <div className="mr-2">
                              <div className="relative">
                                {splitMethod === "percentage" && (
                                  <span className="absolute right-3 top-3 text-muted-foreground text-xs">
                                    %
                                  </span>
                                )}
                                {splitMethod === "amount" && (
                                  <span className="absolute left-3 top-3 text-muted-foreground text-xs">
                                    {currency === "USD" ? "$" : 
                                    currency === "EUR" ? "€" : 
                                    currency === "GBP" ? "£" : "₹"}
                                  </span>
                                )}
                                <Input 
                                  value={participant.amount}
                                  onChange={(e) => handleParticipantAmountChange(participant.userId, e.target.value)}
                                  className={`w-24 h-9 text-right text-sm ${splitMethod === "amount" ? "pl-7" : ""}`}
                                />
                              </div>
                            </div>
                          )}
                          
                          {/* Only show remove button for users other than current user */}
                          {participant.userId !== currentUser?.uid && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveParticipant(participant.userId)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {participants.length === 0 && (
                      <div className="text-center p-4 border border-dashed rounded-lg">
                        <User className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No participants added yet
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Button 
              type="submit" 
              className="w-full bg-splitwise hover:bg-splitwise-hover"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Create Expense
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Add Friend Dialog */}
      <Dialog open={isAddFriendOpen} onOpenChange={setIsAddFriendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Friend</DialogTitle>
            <DialogDescription>
              Add someone to split this expense with
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="friendEmail">Enter email address</Label>
              <div className="flex space-x-2">
                <Input 
                  id="friendEmail"
                  placeholder="friend@example.com"
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                />
                <Button 
                  type="button" 
                  onClick={handleAddFriend}
                  disabled={!friendEmail.trim() || isFriendLoading}
                  className="shrink-0"
                >
                  {isFriendLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                </Button>
              </div>
            </div>
            
            {friends.length > 0 && (
              <div className="space-y-2">
                <Label>Or select from existing friends</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {friends
                    .filter(friend => !participants.some(p => p.userId === friend.id))
                    .map((friend) => (
                      <Button 
                        key={friend.id}
                        variant="outline"
                        className="flex items-center justify-start"
                        onClick={() => handleAddExistingFriend(friend)}
                      >
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={friend.photoURL || undefined} />
                          <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="truncate">{friend.name}</span>
                      </Button>
                    ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddFriendOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Confirmation Dialog */}
      <Dialog open={showPaymentConfirmation} onOpenChange={setShowPaymentConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Confirmation</DialogTitle>
            <DialogDescription>
              You need to pay your share of this expense to {participants.find(p => p.userId === paidBy)?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="rounded-lg border p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">{title}</h3>
                <span className="font-medium">
                  {currency === "USD" ? "$" : 
                  currency === "EUR" ? "€" : 
                  currency === "GBP" ? "£" : "₹"}
                  {amount}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{description}</p>
              <div className="flex justify-between text-sm">
                <span>Your share:</span>
                <span className="font-medium">
                  {currency === "USD" ? "$" : 
                  currency === "EUR" ? "€" : 
                  currency === "GBP" ? "£" : "₹"}
                  {participants.find(p => p.userId === currentUser?.uid)?.amount.toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="rounded-lg border border-muted p-4 bg-muted/50">
              <h3 className="font-medium mb-2">Mock Payment</h3>
              <p className="text-sm text-muted-foreground mb-4">
                In a real app, this would integrate with a payment gateway. For this demo, we'll just simulate the payment process.
              </p>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span className="text-sm">••••  ••••  ••••  4242</span>
                </div>
                <Button variant="outline" size="sm" className="h-8">
                  Change
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowPaymentConfirmation(false)}
              disabled={isPaymentProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePaymentConfirm}
              disabled={isPaymentProcessing}
              className="bg-splitwise hover:bg-splitwise-hover"
            >
              {isPaymentProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Confirm Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddTransactionPage;
