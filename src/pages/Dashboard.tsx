
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { useTransactions, Transaction } from "@/contexts/TransactionContext";
import { useAuth } from "@/contexts/AuthContext";
import { CreditCard, ArrowRightLeft, Users, TrendingUp, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { transactions } = useTransactions();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [totalOwed, setTotalOwed] = useState(0);
  const [totalOwe, setTotalOwe] = useState(0);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!transactions.length || !currentUser) return;

    // Calculate total owed and owe
    let owed = 0;
    let owe = 0;

    transactions.forEach(transaction => {
      if (transaction.settled) return;

      if (transaction.paidBy === currentUser.uid) {
        // You paid, others owe you
        const totalSharedAmount = transaction.participants.reduce((sum, p) => {
          if (p.userId !== currentUser.uid && !p.paid) {
            return sum + p.amount;
          }
          return sum;
        }, 0);
        owed += totalSharedAmount;
      } else {
        // Someone else paid, you owe them
        const yourShare = transaction.participants.find(p => p.userId === currentUser.uid);
        if (yourShare && !yourShare.paid) {
          owe += yourShare.amount;
        }
      }
    });

    setTotalOwed(owed);
    setTotalOwe(owe);

    // Prepare category data for pie chart
    const categories: Record<string, number> = {};
    transactions.forEach(transaction => {
      const category = transaction.category || "Uncategorized";
      categories[category] = (categories[category] || 0) + transaction.amount;
    });

    const categoryChartData = Object.entries(categories).map(([name, value]) => ({
      name,
      value
    }));
    setCategoryData(categoryChartData);

    // Get recent transactions
    const recent = [...transactions]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
    setRecentTransactions(recent);
  }, [transactions, currentUser]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Button 
          className="bg-splitwise hover:bg-splitwise-hover"
          onClick={() => navigate("/transactions/new")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalOwed - totalOwe).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {totalOwed > totalOwe 
                ? "You're owed more than you owe" 
                : totalOwed < totalOwe 
                  ? "You owe more than you're owed" 
                  : "Your balance is even"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">You're Owed</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">${totalOwed.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From {new Set(transactions.filter(t => t.paidBy === currentUser?.uid && !t.settled).flatMap(t => t.participants.map(p => p.userId))).size} people</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">You Owe</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500 transform rotate-180" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">${totalOwe.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">To {new Set(transactions.filter(t => t.paidBy !== currentUser?.uid && !t.settled).map(t => t.paidBy)).size} people</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">{transactions.filter(t => t.settled).length} settled, {transactions.filter(t => !t.settled).length} pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Transactions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Your expense distribution across categories</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#01C39F" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No transaction data available</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>Proportion of your expenses by category</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No transaction data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest expenses and payments</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.map(transaction => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-4 rounded-lg border"
                  onClick={() => navigate(`/transactions/${transaction.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="flex items-center">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${transaction.settled ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                      {transaction.settled ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        <CreditCard size={16} />
                      )}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium">{transaction.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.date.toLocaleDateString()} · {transaction.category}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      ${transaction.amount.toFixed(2)} · {transaction.currency}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.paidBy === currentUser?.uid ? 'You paid' : `${transaction.paidByName} paid`}
                    </p>
                  </div>
                </div>
              ))}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/transactions")}
              >
                View All Transactions
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No transactions yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start tracking your shared expenses by adding your first transaction.
              </p>
              <Button 
                onClick={() => navigate("/transactions/new")}
                className="bg-splitwise hover:bg-splitwise-hover"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Expense
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
