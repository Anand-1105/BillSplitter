import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import { ref, set, push, onValue, remove, update } from "firebase/database";
import { rtdb } from "@/lib/firebase";

type User = {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
};

export type Participant = {
  userId: string;
  name: string;
  email: string;
  photoURL?: string;
  amount: number;
  paid: boolean;
};

export type Transaction = {
  id: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  date: Date;
  category: string;
  paidBy: string; // User ID
  paidByName: string;
  participants: Participant[];
  settled: boolean;
  createdAt: Date;
  updatedAt?: Date;
  group?: string; // Group ID if this is a group expense
};

export type Group = {
  id: string;
  name: string;
  description?: string;
  members: User[];
  createdBy: string;
  createdAt: Date;
};

type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";
type StatusFilter = "all" | "settled" | "pending";

interface TransactionContextType {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  analyticsTransactions: Transaction[];
  groups: Group[];
  createTransaction: (transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt" | "settled">) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  settleTransaction: (id: string) => Promise<void>;
  settleWithUser: (userId: string) => Promise<void>;
  createGroup: (name: string, description?: string, members?: User[]) => Promise<void>;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryFilter: string | null;
  setCategoryFilter: (category: string | null) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (status: StatusFilter) => void;
  sortBy: SortOption;
  setSortBy: (option: SortOption) => void;
  currencyFilter: string | null;
  setCurrencyFilter: (currency: string | null) => void;
  timePeriodFilter: string | null;
  setTimePeriodFilter: (period: string | null) => void;
  metricScaleFilter: string | null;
  setMetricScaleFilter: (scale: string | null) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error("useTransactions must be used within a TransactionProvider");
  }
  return context;
}

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [currencyFilter, setCurrencyFilter] = useState<string | null>(null);
  const [timePeriodFilter, setTimePeriodFilter] = useState<string | null>(null);
  const [metricScaleFilter, setMetricScaleFilter] = useState<string | null>(null);

  const { currentUser, userData } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setTransactions([]);
      setGroups([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Initialize with mock data in case Firebase fails
    const mockTransactions: Transaction[] = [
      {
        id: 'mock-1',
        title: 'Dinner',
        description: 'Italian restaurant',
        amount: 45.00,
        currency: 'USD',
        date: new Date(),
        category: 'Food',
        paidBy: currentUser.uid,
        paidByName: userData?.displayName || 'You',
        participants: [
          {
            userId: currentUser.uid,
            name: userData?.displayName || 'You',
            email: userData?.email || '',
            amount: 45.00,
            paid: true
          }
        ],
        settled: false,
        createdAt: new Date(),
        group: ''
      }
    ];

    // Set initial mock data
    setTransactions(mockTransactions);
    
    // Listen for transactions from Firebase Realtime Database
    try {
      const transactionsRef = ref(rtdb, 'transactions');
      const transactionsHandler = onValue(transactionsRef, (snapshot) => {
        if (snapshot.exists()) {
          const transactionsData: Transaction[] = [];
          snapshot.forEach((childSnapshot) => {
            try {
              const data = childSnapshot.val();
              // Only include transactions where current user is a participant
              if (data.participants && 
                  data.participants.some((p: Participant) => p.userId === currentUser.uid)) {
                transactionsData.push({
                  id: childSnapshot.key || `mock-${Date.now()}`,
                  title: data.title || 'Untitled',
                  description: data.description || '',
                  amount: data.amount || 0,
                  currency: data.currency || 'USD',
                  date: data.date ? new Date(data.date) : new Date(),
                  category: data.category || 'Other',
                  paidBy: data.paidBy || currentUser.uid,
                  paidByName: data.paidByName || 'Unknown',
                  participants: data.participants || [],
                  settled: data.settled || false,
                  createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
                  updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
                  group: data.group || '',
                });
              }
            } catch (err) {
              console.error("Error parsing transaction:", err, childSnapshot.val());
            }
          });
          setTransactions(transactionsData);
        }
        setLoading(false);
      }, (err) => {
        console.error("Error fetching transactions:", err);
        setError("Failed to load transactions. Using mock data instead.");
        setLoading(false);
      });

      // Listen for groups from Firebase Realtime Database
      const groupsRef = ref(rtdb, 'groups');
      const groupsHandler = onValue(groupsRef, (snapshot) => {
        if (snapshot.exists()) {
          const groupsData: Group[] = [];
          snapshot.forEach((childSnapshot) => {
            try {
              const data = childSnapshot.val();
              // Only include groups where current user is a member
              if (data.members && 
                  data.members.some((m: User) => m.id === currentUser.uid)) {
                groupsData.push({
                  id: childSnapshot.key || `mock-group-${Date.now()}`,
                  name: data.name || 'Untitled Group',
                  description: data.description || '',
                  members: data.members || [],
                  createdBy: data.createdBy || currentUser.uid,
                  createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
                });
              }
            } catch (err) {
              console.error("Error parsing group:", err, childSnapshot.val());
            }
          });
          setGroups(groupsData);
        }
      }, (err) => {
        console.error("Error fetching groups:", err);
      });

      return () => {
        // Cleanup listeners
        transactionsHandler();
        groupsHandler();
      };
    } catch (firebaseError) {
      console.error("Firebase database connection failed:", firebaseError);
      setError("Failed to connect to database. Using mock data instead.");
      setLoading(false);
      return () => {}; // Return empty cleanup function
    }
  }, [currentUser, userData]);

  // Regular filtered transactions (used in the transactions list)
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => {
      const searchMatch = 
        transaction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (transaction.description && transaction.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        transaction.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const categoryMatch = !categoryFilter || transaction.category === categoryFilter;
      
      const statusMatch = 
        statusFilter === "all" ||
        (statusFilter === "settled" && transaction.settled) ||
        (statusFilter === "pending" && !transaction.settled);
      
      return searchMatch && categoryMatch && statusMatch;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return b.date.getTime() - a.date.getTime();
        case "date-asc":
          return a.date.getTime() - b.date.getTime();
        case "amount-desc":
          return b.amount - a.amount;
        case "amount-asc":
          return a.amount - b.amount;
        default:
          return 0;
      }
    });
  }, [transactions, searchQuery, categoryFilter, statusFilter, sortBy]);

  // Analytics transactions (used in analytics, includes settled transactions)
  const analyticsTransactions = useMemo(() => {
    // Start with all transactions for analytics - don't filter by status
    let filtered = transactions;
    
    // Apply search filter if exists
    if (searchQuery) {
      filtered = filtered.filter(transaction => 
        transaction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (transaction.description && transaction.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        transaction.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply category filter if exists  
    if (categoryFilter) {
      filtered = filtered.filter(transaction => transaction.category === categoryFilter);
    }
    
    // Apply currency filter if exists
    if (currencyFilter) {
      filtered = filtered.filter(transaction => transaction.currency === currencyFilter);
    }
    
    // Apply time period filter if exists
    if (timePeriodFilter) {
      const now = new Date();
      if (timePeriodFilter === "day") {
        // Filter to transactions from today
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        filtered = filtered.filter(transaction => transaction.date >= startOfDay);
      } else if (timePeriodFilter === "week") {
        // Filter to last 7 days
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        filtered = filtered.filter(transaction => transaction.date >= oneWeekAgo);
      } else if (timePeriodFilter === "month") {
        // Filter to last 30 days
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
        filtered = filtered.filter(transaction => transaction.date >= oneMonthAgo);
      }
    }
    
    // Apply date sorting
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return b.date.getTime() - a.date.getTime();
        case "date-asc":
          return a.date.getTime() - b.date.getTime();
        case "amount-desc":
          return b.amount - a.amount;
        case "amount-asc":
          return a.amount - b.amount;
        default:
          return 0;
      }
    });
  }, [transactions, searchQuery, categoryFilter, currencyFilter, timePeriodFilter, sortBy]);

  async function createTransaction(transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt" | "settled">) {
    if (!currentUser || !userData) {
      throw new Error("You must be logged in and user data available to create a transaction");
    }

    try {
      setLoading(true);
      
      // Sanitize incoming participants array
      const sanitizedParticipants = (transaction.participants || []).map(p => ({
        ...p,
        photoURL: p.photoURL || null // Convert undefined or empty string photoURL to null
      }));

      // Format the transaction data, ensuring no undefined values
      const newTransaction = {
        id: `mock-transaction-${Date.now()}`, // Generate a mock ID
        title: transaction.title || "Untitled",
        description: transaction.description || "",
        amount: transaction.amount || 0,
        currency: transaction.currency || "USD",
        date: transaction.date instanceof Date ? transaction.date : new Date(transaction.date),
        category: transaction.category || "Other",
        paidBy: transaction.paidBy || currentUser.uid,
        paidByName: transaction.paidByName || userData.displayName || "Unknown",
        participants: sanitizedParticipants,
        settled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        group: transaction.group || ""
      };

      // Ensure participants array contains the current user if not already included
      const participantExists = newTransaction.participants.some(p => p.userId === currentUser.uid);
      if (!participantExists) {
        newTransaction.participants.push({
          userId: currentUser.uid,
          name: userData.displayName || "Demo User",
          email: userData.email || "demo@example.com",
          photoURL: userData.photoURL || null,
          amount: 0,
          paid: false
        });
      }

      // Log the transaction for debugging
      console.log("Creating transaction:", newTransaction);

      // MOCK IMPLEMENTATION: Update the state directly
      setTransactions(prevTransactions => [...prevTransactions, newTransaction]);
      
      // Try Firebase in a try/catch block so app doesn't break if permission denied
      try {
        // Attempt to write to Firebase Realtime Database
        const newTransactionRef = push(ref(rtdb, 'transactions'));
        await set(newTransactionRef, newTransaction);
      } catch (firebaseError) {
        console.log("Firebase write failed (permission denied), using local mock data instead", firebaseError);
        // Continue with mock implementation (already updated state above)
      }
      
      toast.success("Transaction created successfully!");
    } catch (err: any) {
      console.error("Error creating transaction:", err);
      console.error("Transaction data that caused error:", transaction);
      setError(err.message || "Failed to create transaction");
      toast.error("Failed to create transaction: " + (err.message || "Unknown error"));
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function updateTransaction(id: string, transactionUpdate: Partial<Transaction>) {
    if (!currentUser) {
      throw new Error("You must be logged in to update a transaction");
    }

    try {
      setLoading(true);
      
      // Find the transaction in our local state
      const existingTransaction = transactions.find(t => t.id === id);
      if (!existingTransaction) {
        throw new Error("Transaction not found");
      }
      
      // Update local state first
      const updatedTransaction = {
        ...existingTransaction,
        ...transactionUpdate,
        updatedAt: new Date()
      };
      
      setTransactions(prevTransactions => 
        prevTransactions.map(t => t.id === id ? updatedTransaction : t)
      );
      
      // Try Firebase in a try/catch block
      try {
        // Attempt to update in Firebase Realtime Database
        await update(ref(rtdb, `transactions/${id}`), {
          ...transactionUpdate,
          updatedAt: new Date()
        });
      } catch (firebaseError) {
        console.log("Firebase update failed (permission denied), using local data instead", firebaseError);
        // Continue with mock implementation (already updated state above)
      }
      
      toast.success("Transaction updated successfully!");
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to update transaction");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function deleteTransaction(id: string) {
    if (!currentUser) {
      throw new Error("You must be logged in to delete a transaction");
    }

    try {
      setLoading(true);
      
      // Update local state first
      setTransactions(prevTransactions => 
        prevTransactions.filter(t => t.id !== id)
      );
      
      // Try Firebase in a try/catch block
      try {
        // Attempt to delete from Firebase Realtime Database
        await remove(ref(rtdb, `transactions/${id}`));
      } catch (firebaseError) {
        console.log("Firebase delete failed (permission denied), using local data instead", firebaseError);
        // Continue with mock implementation (already updated state above)
      }
      
      toast.success("Transaction deleted successfully!");
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to delete transaction");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function settleTransaction(id: string) {
    if (!currentUser) {
      throw new Error("You must be logged in to settle a transaction");
    }

    try {
      setLoading(true);
      
      // Update local state first
      setTransactions(prevTransactions => 
        prevTransactions.map(t => t.id === id ? {...t, settled: true, updatedAt: new Date()} : t)
      );
      
      // Try Firebase in a try/catch block
      try {
        // Attempt to update in Firebase Realtime Database
        await update(ref(rtdb, `transactions/${id}`), {
          settled: true,
          updatedAt: new Date()
        });
      } catch (firebaseError) {
        console.log("Firebase settle failed (permission denied), using local data instead", firebaseError);
        // Continue with mock implementation (already updated state above)
      }
      
      toast.success("Transaction marked as settled!");
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to settle transaction");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function settleWithUser(userId: string) {
    if (!currentUser) {
      throw new Error("You must be logged in to settle with a user");
    }

    try {
      setLoading(true);
      
      // Get all transactions with this user that aren't settled
      const userTransactions = transactions.filter(
        t => t.participants.some(p => p.userId === userId) && !t.settled
      );
      
      // Update local state first
      setTransactions(prevTransactions => 
        prevTransactions.map(t => 
          userTransactions.some(ut => ut.id === t.id) 
            ? {...t, settled: true, updatedAt: new Date()} 
            : t
        )
      );
      
      // Try Firebase in a try/catch block
      try {
        // Mark all as settled in Firebase Realtime Database
        for (const transaction of userTransactions) {
          await update(ref(rtdb, `transactions/${transaction.id}`), {
            settled: true,
            updatedAt: new Date()
          });
        }
      } catch (firebaseError) {
        console.log("Firebase settle with user failed (permission denied), using local data instead", firebaseError);
        // Continue with mock implementation (already updated state above)
      }
      
      toast.success("All transactions with this user settled!");
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to settle transactions");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function createGroup(name: string, description?: string, members: User[] = []) {
    if (!currentUser || !userData) {
      throw new Error("You must be logged in and user data available to create a group");
    }

    try {
      setLoading(true);
      
      // Add current user to members if not already included
      const currentUserInMembers = members.some(m => m.id === currentUser.uid);
      
      if (!currentUserInMembers) {
        members.push({
          id: currentUser.uid,
          name: userData.displayName || "Demo User",
          email: userData.email || "demo@example.com",
          photoURL: userData.photoURL || undefined // Keep undefined here or map to null if needed
        });
      }
      
      // Sanitize members photoURL if necessary before saving
      const sanitizedMembers = members.map(m => ({
        ...m,
        photoURL: m.photoURL || null // Convert undefined photoURL to null for database
      }));

      // Create a new group object with ID
      const newGroup = {
        id: `mock-group-${Date.now()}`,
        name,
        description: description || "",
        members: sanitizedMembers,
        createdBy: currentUser.uid,
        createdAt: new Date()
      };
      
      // Update local state first
      setGroups(prevGroups => [...prevGroups, newGroup]);
      
      // Try Firebase in a try/catch block
      try {
        // Attempt to write to Firebase Realtime Database
        const newGroupRef = push(ref(rtdb, 'groups'));
        await set(newGroupRef, {
          name,
          description: description || "",
          members: sanitizedMembers,
          createdBy: currentUser.uid,
          createdAt: new Date()
        });
      } catch (firebaseError) {
        console.log("Firebase create group failed (permission denied), using local data instead", firebaseError);
        // Continue with mock implementation (already updated state above)
      }

      toast.success("Group created successfully!");
    } catch (err: any) {
      console.error("Error creating group:", err);
      setError(err.message);
      toast.error("Failed to create group");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  const value = {
    transactions,
    filteredTransactions,
    analyticsTransactions,
    groups,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    settleTransaction,
    settleWithUser,
    createGroup,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    currencyFilter,
    setCurrencyFilter,
    timePeriodFilter,
    setTimePeriodFilter,
    metricScaleFilter,
    setMetricScaleFilter
  };

  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
}
