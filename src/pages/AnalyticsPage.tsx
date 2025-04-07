import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  AreaChart,
  Area
} from "recharts";
import { useTransactions, Transaction } from "@/contexts/TransactionContext";
import { 
  Calendar as CalendarIcon, 
  Filter, 
  BarChart2, 
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Download,
  RefreshCcw,
  AreaChart as AreaChartLucideIcon
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, subMonths, isAfter, isBefore, isEqual } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Layers, ListFilter } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

type Currency = "USD" | "EUR" | "GBP" | "INR";
type MetricScale = "hundreds" | "thousands" | "lakhs";
type ChartType = "bar" | "line" | "pie" | "area";
type GroupBy = "day" | "week" | "month" | "category";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF', '#01C39F', '#FF6384'];

// Function to format currency values
const formatCurrency = (value: number, currency: Currency): string => {
  switch (currency) {
    case "USD":
      return `$${value.toFixed(2)}`;
    case "EUR":
      return `€${value.toFixed(2)}`;
    case "GBP":
      return `£${value.toFixed(2)}`;
    case "INR":
      return `₹${value.toFixed(2)}`;
    default:
      return `$${value.toFixed(2)}`;
  }
};

// Function to scale values
const scaleValue = (value: number, scale: MetricScale): number => {
  switch (scale) {
    case "hundreds":
      return value;
    case "thousands":
      return value / 1000;
    case "lakhs":
      return value / 100000;
    default:
      return value;
  }
};

// Function to format scale suffix
const formatScaleSuffix = (scale: MetricScale): string => {
  switch (scale) {
    case "hundreds":
      return "";
    case "thousands":
      return "K";
    case "lakhs":
      return "L";
    default:
      return "";
  }
};

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, currentCurrency }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload; // Access the full data object passed to the chart item

    // Check if it's category data (for Pie/Bar chart) or transaction data (for Line chart potentially)
    if (data.category && data.totalAmount !== undefined) { // Category summary tooltip
      return (
        <div className="bg-background border p-2 rounded shadow-lg text-sm">
          <p className="font-bold">{`${data.category}`}</p>
          <p>{`Total: ${formatCurrency(data.totalAmount, data.currency || currentCurrency || 'USD')}`}</p>
          <p>{`Transactions: ${data.count}`}</p>
        </div>
      );
    } else if (data.date && data.amount !== undefined) { // Individual transaction tooltip (example for a time series chart)
      return (
        <div className="bg-background border p-2 rounded shadow-lg text-sm">
          <p className="font-bold">{`${data.title || 'Transaction'}`}</p>
          <p>{`Amount: ${formatCurrency(data.amount, data.currency || currentCurrency)}`}</p>
          <p>{`Date: ${new Date(data.date).toLocaleDateString()}`}</p>
          {data.category && <p>{`Category: ${data.category}`}</p>}
        </div>
      );
    }
    // Fallback or specific tooltip for other chart types
    else if (payload[0].name && payload[0].value !== undefined) {
      return (
        <div className="bg-background border p-2 rounded shadow-lg text-sm">
          <p className="font-bold">{`${payload[0].name}`}</p>
          <p>{`${formatCurrency(payload[0].value, data.currency || currentCurrency || 'USD')}`}</p>
        </div>
      );
    }
  }

  return null;
};

const AnalyticsPage = () => {
  const { 
    transactions, 
    analyticsTransactions, 
    loading, 
    setCategoryFilter, 
    setSearchQuery, 
    setCurrencyFilter,
    searchQuery, 
    categoryFilter,
    currencyFilter
  } = useTransactions();
  const { currentUser } = useAuth();
  const [currency, setCurrency] = useState<Currency>("USD");
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Apply filters to the TransactionContext
  useEffect(() => {
    setCategoryFilter(selectedCategory);
  }, [selectedCategory, setCategoryFilter]);
  
  useEffect(() => {
    setSearchQuery(searchTerm);
  }, [searchTerm, setSearchQuery]);

  useEffect(() => {
    setCurrencyFilter(currency !== "USD" ? currency : null);
  }, [currency, setCurrencyFilter]);

  // Initialize local filter states from global context
  useEffect(() => {
    setSelectedCategory(categoryFilter);
    setSearchTerm(searchQuery);
    setCurrency(currencyFilter as Currency || "USD");
  }, [categoryFilter, searchQuery, currencyFilter]);

  // Spending by category using analytics data
  const spendingByCategory = useMemo(() => {
    const categoryMap = new Map<string, { totalAmount: number, count: number, currency: string }>();
    analyticsTransactions.forEach(t => {
      const existing = categoryMap.get(t.category);
      categoryMap.set(t.category, {
        totalAmount: (existing?.totalAmount || 0) + t.amount,
        count: (existing?.count || 0) + 1,
        currency: t.currency
      });
    });
    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      ...data
    })).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [analyticsTransactions]);

  // Spending over time - default to monthly view
  const spendingOverTime = useMemo(() => {
    // Format: YYYY-MM
    const dateFormat = (date: Date) => `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const displayFormat = (key: string) => {
      const [year, month] = key.split('-');
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
    };

    // Group transactions by month
    const timeMap = new Map<string, { totalAmount: number, count: number, currency: string, displayKey: string }>();
    
    // Ensure transactions are sorted by date for time-based charts
    const sortedByDate = [...analyticsTransactions].sort((a, b) => a.date.getTime() - b.date.getTime());

    sortedByDate.forEach(t => {
      const timeKey = dateFormat(t.date);
      const existing = timeMap.get(timeKey);
      timeMap.set(timeKey, {
        totalAmount: (existing?.totalAmount || 0) + t.amount,
        count: (existing?.count || 0) + 1,
        currency: t.currency,
        displayKey: displayFormat(timeKey)
      });
    });

    // Convert to array and sort by time
    return Array.from(timeMap.entries())
      .map(([timeKey, data]) => ({
        timeKey,
        displayKey: data.displayKey,
        ...data
      }))
      .sort((a, b) => a.timeKey.localeCompare(b.timeKey));
  }, [analyticsTransactions]);

  // Get all available categories for filter dropdown
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    transactions.forEach(t => categorySet.add(t.category));
    return Array.from(categorySet).sort();
  }, [transactions]);

  // Restore the summaryStats calculation
  const summaryStats = useMemo(() => {
    if (!analyticsTransactions || analyticsTransactions.length === 0) {
      return { totalSpent: 0, averageTransaction: 0, transactionCount: 0, mostCommonCurrency: currency };
    }

    const totalSpent = analyticsTransactions.reduce((sum, t) => sum + t.amount, 0);
    const transactionCount = analyticsTransactions.length;
    const averageTransaction = transactionCount > 0 ? totalSpent / transactionCount : 0;

    return { totalSpent, averageTransaction, transactionCount, mostCommonCurrency: currency };
  }, [analyticsTransactions, currency]);

  // First, add a helper function to prepare data for the stacked area chart
  const getCategorySpendingOverTime = useMemo(() => {
    // Create a map of time periods with nested categories
    const timeCategories = new Map<string, Map<string, number>>();
    const allCategories = new Set<string>();
    
    // Sort transactions by date
    const sortedByDate = [...analyticsTransactions].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Format: YYYY-MM
    const dateFormat = (date: Date) => `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const displayFormat = (key: string) => {
      const [year, month] = key.split('-');
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
    };
    
    // Group transactions by month and category
    sortedByDate.forEach(t => {
      const timeKey = dateFormat(t.date);
      if (!timeCategories.has(timeKey)) {
        timeCategories.set(timeKey, new Map<string, number>());
      }
      const categoryMap = timeCategories.get(timeKey)!;
      categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
      allCategories.add(t.category);
    });
    
    // Convert to array format for chart
    const result = Array.from(timeCategories.entries())
      .map(([timeKey, categoryMap]) => {
        const entry: any = {
          timeKey,
          displayKey: displayFormat(timeKey)
        };
        
        // Add each category as a field
        allCategories.forEach(category => {
          entry[category] = categoryMap.get(category) || 0;
        });
        
        return entry;
      })
      .sort((a, b) => a.timeKey.localeCompare(b.timeKey));
      
    return {
      data: result,
      categories: Array.from(allCategories)
    };
  }, [analyticsTransactions]);

  // Function to refresh data
  const handleRefresh = () => {
    // For a real implementation, you might call a method to fetch data from the API
    // Since we're using context, we can just notify the user
    toast({
      title: "Data refreshed",
      description: `Loaded ${analyticsTransactions.length} transactions.`,
    });
  };

  // Function to export data as CSV
  const handleExportData = () => {
    if (analyticsTransactions.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no transactions to export.",
        variant: "destructive",
      });
      return;
    }
    
    // Create CSV content
    const headers = ["Date", "Title", "Category", "Amount", "Currency"];
    const csvContent = [
      headers.join(","),
      ...analyticsTransactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        `"${t.title.replace(/"/g, '""')}"`, // Handle quotes in titles
        t.category,
        t.amount,
        t.currency
      ].join(","))
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `expense-analytics-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export successful",
      description: `${analyticsTransactions.length} transactions exported.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportData}
            disabled={analyticsTransactions.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Customize your expense analytics view</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search transactions..."
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select 
                value={selectedCategory || "_all"}
                onValueChange={(value) => setSelectedCategory(value === "_all" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Currency</label>
              <Select value={currency} onValueChange={(value: Currency) => setCurrency(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Chart Type</label>
              <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select chart type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Show active filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {searchTerm && (
              <Badge variant="outline" className="flex items-center gap-1">
                <span>Search: {searchTerm}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4" 
                  onClick={() => setSearchTerm("")}
                >
                  <span className="sr-only">Clear search</span>
                  ×
                </Button>
              </Badge>
            )}
            
            {selectedCategory && (
              <Badge variant="outline" className="flex items-center gap-1">
                <span>Category: {selectedCategory}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4" 
                  onClick={() => setSelectedCategory(null)}
                >
                  <span className="sr-only">Clear category</span>
                  ×
                </Button>
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summaryStats.totalSpent, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {summaryStats.transactionCount} transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Transaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summaryStats.averageTransaction, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average amount per expense
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {spendingByCategory.length > 0 ? (
              <>
                <div className="text-2xl font-bold">{spendingByCategory[0].category}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(spendingByCategory[0].totalAmount, currency)} spent
                </p>
              </>
            ) : (
              <div className="text-lg font-medium text-muted-foreground">N/A</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>
            Expense {chartType === "pie" ? "Distribution" : "Trends"}
          </CardTitle>
          <CardDescription>
            Showing data based on Transaction Page filters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[500px] w-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-splitwise"></div>
              <p className="ml-3 text-lg font-medium">Loading analytics data...</p>
            </div>
          ) : (
            <div className="h-[500px] w-full">
              {analyticsTransactions.length > 0 ? (
                <>
                  <Tabs value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
                    <TabsList className="mb-4">
                      <TabsTrigger value="bar" className="flex items-center">
                        <BarChart2 className="h-4 w-4 mr-2" />
                        Bar
                      </TabsTrigger>
                      <TabsTrigger value="line" className="flex items-center">
                        <LineChartIcon className="h-4 w-4 mr-2" />
                        Line
                      </TabsTrigger>
                      <TabsTrigger value="area" className="flex items-center">
                        <AreaChartLucideIcon className="h-4 w-4 mr-2" />
                        Area
                      </TabsTrigger>
                      <TabsTrigger value="pie" className="flex items-center">
                        <PieChartIcon className="h-4 w-4 mr-2" />
                        Pie
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="bar">
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                          data={spendingByCategory}
                          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="category" 
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            tickFormatter={(value) => 
                              `${currency === "USD" ? "$" : 
                                 currency === "EUR" ? "€" : 
                                 currency === "GBP" ? "£" : "₹"}${value.toFixed(0)}`
                            } 
                          />
                          <Tooltip 
                            content={<CustomTooltip currentCurrency={currency} />}
                          />
                          <Legend />
                          <Bar dataKey="totalAmount" name="Total Spent" fill="#8884d8">
                            {spendingByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </TabsContent>
                    
                    <TabsContent value="line">
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart
                          data={spendingOverTime}
                          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="displayKey" 
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            tickFormatter={(value) => 
                              `${currency === "USD" ? "$" : 
                                 currency === "EUR" ? "€" : 
                                 currency === "GBP" ? "£" : "₹"}${value.toFixed(0)}`
                            } 
                          />
                          <Tooltip content={<CustomTooltip currentCurrency={currency} />} />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="totalAmount" 
                            name="Total Spent" 
                            stroke="#82ca9d" 
                            strokeWidth={2} 
                            dot={{ r: 4 }} 
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </TabsContent>
                    
                    <TabsContent value="area">
                      <ResponsiveContainer width="100%" height={400}>
                        <AreaChart
                          data={getCategorySpendingOverTime.data}
                          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="displayKey" 
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            tickFormatter={(value) => 
                              `${currency === "USD" ? "$" : 
                                 currency === "EUR" ? "€" : 
                                 currency === "GBP" ? "£" : "₹"}${value.toFixed(0)}`
                            } 
                          />
                          <Tooltip content={<CustomTooltip currentCurrency={currency} />} />
                          <Legend />
                          {getCategorySpendingOverTime.categories.slice(0, 5).map((category, index) => (
                            <Area 
                              key={category}
                              type="monotone" 
                              dataKey={category} 
                              name={category} 
                              stackId="1"
                              stroke={COLORS[index % COLORS.length]} 
                              fill={COLORS[index % COLORS.length]} 
                              fillOpacity={0.6} 
                            />
                          ))}
                        </AreaChart>
                      </ResponsiveContainer>
                    </TabsContent>
                    
                    <TabsContent value="pie">
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={spendingByCategory}
                            cx="50%"
                            cy="50%"
                            outerRadius={150}
                            fill="#8884d8"
                            dataKey="totalAmount"
                            nameKey="category"
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                              const RADIAN = Math.PI / 180;
                              const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                              const x = cx + (radius + 15) * Math.cos(-midAngle * RADIAN);
                              const y = cy + (radius + 15) * Math.sin(-midAngle * RADIAN);
                              return (
                                <text x={x} y={y} fill="currentColor" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs">
                                  {`${spendingByCategory[index].category} (${(percent * 100).toFixed(0)}%)`}
                                </text>
                              );
                            }}
                            labelLine={false}
                          >
                            {spendingByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip currentCurrency={currency} />} />
                          <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                        </PieChart>
                      </ResponsiveContainer>
                    </TabsContent>
                  </Tabs>
                </>
              ) : (
                <div className="flex h-full items-center justify-center flex-col">
                  <ListFilter className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No data available</h3>
                  <p className="text-sm text-muted-foreground max-w-md text-center mt-2">
                    There are no transactions matching the current filters.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
