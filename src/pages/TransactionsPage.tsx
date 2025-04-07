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
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Check, 
  Trash,
  Calendar,
  DollarSign
} from "lucide-react";
import { useTransactions, Transaction } from "@/contexts/TransactionContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const TransactionsPage = () => {
  const { 
    transactions,
    filteredTransactions,
    settleTransaction,
    deleteTransaction,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy
  } = useTransactions();
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSettleDialog, setShowSettleDialog] = useState(false);

  const categories = Array.from(new Set(transactions.map(t => t.category)));

  const handleDeleteTransaction = async () => {
    if (selectedTransaction) {
      await deleteTransaction(selectedTransaction.id);
      setShowDeleteDialog(false);
      setSelectedTransaction(null);
    }
  };

  const handleSettleTransaction = async () => {
    if (selectedTransaction) {
      await settleTransaction(selectedTransaction.id);
      setShowSettleDialog(false);
      setSelectedTransaction(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <Button 
          className="bg-splitwise hover:bg-splitwise-hover w-full sm:w-auto"
          onClick={() => navigate("/transactions/new")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select
              value={categoryFilter || "all"}
              onValueChange={(value) => setCategoryFilter(value === "all" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={statusFilter}
              onValueChange={(value: "all" | "settled" | "pending") => setStatusFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="settled">Settled</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    Sort by ({ 
                      sortBy === 'date-desc' ? 'Newest' :
                      sortBy === 'date-asc' ? 'Oldest' :
                      sortBy === 'amount-desc' ? 'Highest $' : 'Lowest $'
                    })
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setSortBy("date-desc")}>
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Date (Newest first)</span>
                    {sortBy === "date-desc" && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("date-asc")}>
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Date (Oldest first)</span>
                    {sortBy === "date-asc" && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("amount-desc")}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    <span>Amount (High to low)</span>
                    {sortBy === "amount-desc" && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("amount-asc")}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    <span>Amount (Low to high)</span>
                    {sortBy === "amount-asc" && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            {filteredTransactions.length} transactions found
            {searchQuery && ` matching "${searchQuery}"`}
            {categoryFilter && ` in "${categoryFilter}"`}
            {statusFilter !== "all" && ` with status "${statusFilter}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length > 0 ? (
            <div className="space-y-4">
              {filteredTransactions.map(transaction => (
                <div 
                  key={transaction.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/transactions/${transaction.id}`)}
                >
                  <div className="flex items-center mb-3 sm:mb-0">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${transaction.settled ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                      {transaction.settled ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <CreditCard className="h-5 w-5" />
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-base font-medium">{transaction.title}</p>
                        <Badge 
                          variant={transaction.settled ? "outline" : "default"}
                          className={`ml-2 ${transaction.settled ? 'border-green-500 text-green-600' : 'bg-blue-500'}`}
                        >
                          {transaction.settled ? 'Settled' : 'Pending'}
                        </Badge>
                      </div>
                      <div className="flex items-center mt-1">
                        <p className="text-sm text-muted-foreground mr-2">
                          {transaction.date.toLocaleDateString()}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {transaction.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end">
                    <p className="text-base font-medium">
                      {transaction.currency === "USD" ? "$" : 
                       transaction.currency === "EUR" ? "€" : 
                       transaction.currency === "GBP" ? "£" : 
                       transaction.currency === "INR" ? "₹" : ""} 
                      {transaction.amount.toFixed(2)} {transaction.currency}
                    </p>
                    <div className="flex items-center mt-1">
                      <p className="text-sm text-muted-foreground mr-2">
                        {transaction.paidBy === currentUser?.uid ? 'You paid' : `${transaction.paidByName} paid`}
                      </p>
                      <div className="flex -space-x-2">
                        {transaction.participants.slice(0, 3).map((participant, i) => (
                          <Avatar key={i} className="h-6 w-6 border-2 border-background">
                            {participant.photoURL && <AvatarImage src={participant.photoURL} alt={participant.name} />}
                            <AvatarFallback className="text-xs">
                              {participant.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {transaction.participants.length > 3 && (
                          <Avatar className="h-6 w-6 border-2 border-background">
                            <AvatarFallback className="text-xs bg-muted">
                              +{transaction.participants.length - 3}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center mt-3 sm:mt-0 sm:ml-4">
                    {!transaction.settled && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTransaction(transaction);
                          setShowSettleDialog(true);
                        }}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Settle
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTransaction(transaction);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Filter className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No transactions found</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-4">
                {transactions.length > 0 
                  ? "Try adjusting your filters or search query to see more results."
                  : "You haven't created any transactions yet. Get started by adding your first expense."}
              </p>
              {transactions.length === 0 && (
                <Button 
                  onClick={() => navigate("/transactions/new")}
                  className="bg-splitwise hover:bg-splitwise-hover"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Expense
                </Button>
              )}
            </div>
          )}
        </CardContent>
        {filteredTransactions.length > 10 && (
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Back to Top
            </Button>
          </CardFooter>
        )}
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="py-4">
              <div className="flex items-center mb-2">
                <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
                <p className="font-medium">{selectedTransaction.title}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedTransaction.currency === "USD" ? "$" : 
                 selectedTransaction.currency === "EUR" ? "€" : 
                 selectedTransaction.currency === "GBP" ? "£" : 
                 selectedTransaction.currency === "INR" ? "₹" : ""} 
                {selectedTransaction.amount.toFixed(2)} · {selectedTransaction.date.toLocaleDateString()}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteTransaction}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSettleDialog} onOpenChange={setShowSettleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settle Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this transaction as settled? This will indicate that all participants have paid their share.
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="py-4">
              <div className="flex items-center mb-2">
                <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
                <p className="font-medium">{selectedTransaction.title}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedTransaction.currency === "USD" ? "$" : 
                 selectedTransaction.currency === "EUR" ? "€" : 
                 selectedTransaction.currency === "GBP" ? "£" : 
                 selectedTransaction.currency === "INR" ? "₹" : ""} 
                {selectedTransaction.amount.toFixed(2)} · {selectedTransaction.date.toLocaleDateString()}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowSettleDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleSettleTransaction}
            >
              Mark as Settled
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionsPage;
