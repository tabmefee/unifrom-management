import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";
import { Badge } from "./components/ui/badge";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "One Size"];

// Dashboard Component
const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_items: 8,
    total_students: 0,
    total_receipts: 0,
    total_issues: 0,
    low_stock_count: 0
  });

  useEffect(() => {
    if (supabase) {
      fetchStats();
    } else {
      console.log('Supabase not available, using mock data');
    }
  }, []);

  const fetchStats = async () => {
    try {
      // Get counts from each table
      const [itemsRes, studentsRes, receiptsRes, issuesRes] = await Promise.all([
        supabase.from('uniform_items').select('*', { count: 'exact', head: true }),
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('stock_receipts').select('*', { count: 'exact', head: true }),
        supabase.from('issue_receipts').select('*', { count: 'exact', head: true })
      ]);

      // Calculate low stock count
      const { data: stockBalance } = await supabase
        .from('stock_receipts')
        .select('items');

      const { data: issueData } = await supabase
        .from('issue_receipts')
        .select('items');

      // Calculate stock balance
      const receivedDict = {};
      stockBalance?.forEach(receipt => {
        receipt.items.forEach(item => {
          const key = `${item.item_id}_${item.size}`;
          if (!receivedDict[key]) {
            receivedDict[key] = { received: 0, issued: 0 };
          }
          receivedDict[key].received += item.quantity;
        });
      });

      issueData?.forEach(issue => {
        issue.items.forEach(item => {
          const key = `${item.item_id}_${item.size}`;
          if (!receivedDict[key]) {
            receivedDict[key] = { received: 0, issued: 0 };
          }
          receivedDict[key].issued += item.quantity;
        });
      });

      const lowStockCount = Object.values(receivedDict)
        .filter(balance => balance.received - balance.issued < 10 && balance.received - balance.issued > 0)
        .length;

      setStats({
        total_items: itemsRes.count || 0,
        total_students: studentsRes.count || 0,
        total_receipts: receiptsRes.count || 0,
        total_issues: issuesRes.count || 0,
        low_stock_count: lowStockCount
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load dashboard stats");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-2" data-testid="app-title">
              Uniform Tracker
            </h1>
            <p className="text-slate-600 text-lg">University Uniform Inventory Management</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/settings')}
            className="bg-white shadow-lg hover:shadow-xl"
          >
            ⚙️ Settings
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow" data-testid="total-items-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">Uniform Items</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-cyan-600">{stats.total_items}</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow" data-testid="total-receipts-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{stats.total_receipts}</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow" data-testid="total-issues-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600">{stats.total_issues}</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow" data-testid="total-students-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">Students</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{stats.total_students}</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow" data-testid="low-stock-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">Low Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{stats.low_stock_count}</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card 
            className="bg-white shadow-lg hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-cyan-500"
            onClick={() => navigate('/receive')}
            data-testid="receive-stock-card"
          >
            <CardHeader>
              <CardTitle className="text-2xl text-cyan-700 flex items-center gap-2">
                <span className="text-3xl">📦</span>
                Receive Stock
              </CardTitle>
              <CardDescription className="text-base">Record new uniform deliveries and bills</CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="bg-white shadow-lg hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-blue-500"
            onClick={() => navigate('/issue')}
            data-testid="issue-uniform-card"
          >
            <CardHeader>
              <CardTitle className="text-2xl text-blue-700 flex items-center gap-2">
                <span className="text-3xl">👕</span>
                Issue Uniform
              </CardTitle>
              <CardDescription className="text-base">Issue uniforms to students</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card 
            className="bg-white shadow-lg hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-emerald-500"
            onClick={() => navigate('/stock')}
            data-testid="stock-balance-card"
          >
            <CardHeader>
              <CardTitle className="text-2xl text-emerald-700 flex items-center gap-2">
                <span className="text-3xl">📊</span>
                Stock Balance
              </CardTitle>
              <CardDescription className="text-base">View current inventory levels</CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="bg-white shadow-lg hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-purple-500"
            onClick={() => navigate('/history')}
            data-testid="history-card"
          >
            <CardHeader>
              <CardTitle className="text-2xl text-purple-700 flex items-center gap-2">
                <span className="text-3xl">📜</span>
                History
              </CardTitle>
              <CardDescription className="text-base">View deliveries and issue records</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Receive Stock Component
const ReceiveStock = () => {
  const navigate = useNavigate();
  const [uniformItems, setUniformItems] = useState([]);
  const [formData, setFormData] = useState({
    bill_number: "",
    vendor_name: "",
    bill_date: new Date().toISOString().split('T')[0],
    total_amount: ""
  });
  const [items, setItems] = useState([{ item_id: "", item_name: "", size: "M", quantity: 1 }]);

  useEffect(() => {
    if (supabase) {
      fetchUniformItems();
    }
  }, []);

  const fetchUniformItems = async () => {
    try {
      const { data, error } = await supabase
        .from('uniform_items')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setUniformItems(data || []);
    } catch (error) {
      console.error("Error fetching uniform items:", error);
      toast.error("Failed to load uniform items");
    }
  };

  const addItemRow = () => {
    setItems([...items, { item_id: "", item_name: "", size: "M", quantity: 1 }]);
  };

  const removeItemRow = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    if (field === "item_id") {
      const selectedItem = uniformItems.find(item => item.id === value);
      if (selectedItem) {
        newItems[index].item_name = selectedItem.name;
        if (!selectedItem.has_size) {
          newItems[index].size = "One Size";
        }
      }
    }
    
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.bill_number || !formData.vendor_name) {
      toast.error("Please fill all required fields");
      return;
    }
    
    const validItems = items.filter(item => item.item_id && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error("Please add at least one item");
      return;
    }
    
    try {
      // 1. Create the stock receipt
      const { error: receiptError } = await supabase
        .from('stock_receipts')
        .insert({
          bill_number: formData.bill_number,
          vendor_name: formData.vendor_name,
          bill_date: formData.bill_date,
          total_amount: parseFloat(formData.total_amount) || 0,
          items: validItems
        });
      
      if (receiptError) throw receiptError;

      // 2. Update stock balance for each item
      for (const item of validItems) {
        // Get current stock
        const { data: currentStock, error: stockError } = await supabase
          .from('stock_balance')
          .select('quantity')
          .eq('item_id', item.item_id)
          .eq('size', item.size || null)
          .single();

        const currentQuantity = currentStock?.quantity || 0;
        const newQuantity = currentQuantity + item.quantity;

        // Update stock balance
        const { error: updateError } = await supabase
          .from('stock_balance')
          .update({ quantity: newQuantity })
          .eq('item_id', item.item_id)
          .eq('size', item.size || null);
        
        if (updateError) {
          // If update fails, try to insert
          const { error: insertError } = await supabase
            .from('stock_balance')
            .insert({
              item_id: item.item_id,
              size: item.size || null,
              quantity: newQuantity
            });
          
          if (insertError) throw insertError;
        }
      }
      
      toast.success("Stock received successfully!");
      navigate('/');
    } catch (error) {
      console.error("Error saving stock receipt:", error);
      toast.error("Failed to record stock receipt: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="outline" 
          onClick={() => navigate('/')} 
          className="mb-6"
        >
          ← Back to Dashboard
        </Button>

        <Card className="bg-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl text-cyan-700">Receive Stock</CardTitle>
            <CardDescription>Record new uniform delivery</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Bill Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bill_number">Bill Number *</Label>
                  <Input
                    id="bill_number"
                    value={formData.bill_number}
                    onChange={(e) => setFormData({...formData, bill_number: e.target.value})}
                    placeholder="INV-001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vendor_name">Vendor Name *</Label>
                  <Input
                    id="vendor_name"
                    value={formData.vendor_name}
                    onChange={(e) => setFormData({...formData, vendor_name: e.target.value})}
                    placeholder="ABC Uniforms"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="bill_date">Bill Date</Label>
                  <Input
                    id="bill_date"
                    type="date"
                    value={formData.bill_date}
                    onChange={(e) => setFormData({...formData, bill_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="total_amount">Total Amount</Label>
                  <Input
                    id="total_amount"
                    type="number"
                    step="0.01"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
                    placeholder="5000.00"
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <Label className="text-lg mb-3 block">Items</Label>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Select 
                          value={item.item_id} 
                          onValueChange={(value) => updateItem(index, "item_id", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            {uniformItems.map(uItem => (
                              <SelectItem key={uItem.id} value={uItem.id}>{uItem.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-32">
                        <Select 
                          value={item.size} 
                          onValueChange={(value) => updateItem(index, "size", value)}
                          disabled={!item.item_id || item.size === "One Size"}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SIZES.map(size => (
                              <SelectItem key={size} value={size}>{size}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeItemRow(index)}
                        disabled={items.length === 1}
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addItemRow}
                  className="mt-3"
                >
                  + Add Item
                </Button>
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                  Save Receipt
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/')}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Issue Uniform Component
const IssueUniform = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [student, setStudent] = useState(null);
  const [uniformItems, setUniformItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [issuedBy, setIssuedBy] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [showNewStudentDialog, setShowNewStudentDialog] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [studentAlreadyTaken, setStudentAlreadyTaken] = useState([]);
  const [stockLimits, setStockLimits] = useState({});
  const [itemLimits, setItemLimits] = useState({});
  const [newStudent, setNewStudent] = useState({
    registration_number: "",
    roll_number: "",
    name: "",
    class_year: "",
    course: "",
    phone: ""
  });

  useEffect(() => {
    if (supabase) {
      fetchUniformItems();
      fetchItemLimits();
    }
  }, []);

  useEffect(() => {
    if (student && supabase) {
      fetchStudentAlreadyTaken();
      fetchStockLimits();
    }
  }, [student]);

  const fetchUniformItems = async () => {
    try {
      const { data, error } = await supabase
        .from('uniform_items')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setUniformItems(data || []);
    } catch (error) {
      console.error("Error fetching uniform items:", error);
      toast.error("Failed to load uniform items");
    }
  };

  const fetchItemLimits = async () => {
    try {
      const { data, error } = await supabase
        .from('uniform_item_limits')
        .select('*');
      
      if (error) throw error;
      
      const limitsMap = {};
      data?.forEach(limit => {
        limitsMap[limit.item_id] = limit.max_per_student;
      });
      setItemLimits(limitsMap);
    } catch (error) {
      console.error("Error fetching item limits:", error);
    }
  };

  const fetchStudentAlreadyTaken = async () => {
    try {
      const { data, error } = await supabase
        .from('issue_receipts')
        .select('*')
        .eq('student_id', student.id);
      
      if (error) throw error;
      
      // Flatten the items array from each receipt
      const flattenedItems = [];
      data?.forEach(receipt => {
        if (receipt.items && Array.isArray(receipt.items)) {
          receipt.items.forEach(item => {
            flattenedItems.push({
              ...item,
              receipt_id: receipt.id,
              issued_date: receipt.issued_date
            });
          });
        }
      });
      
      setStudentAlreadyTaken(flattenedItems);
    } catch (error) {
      console.error("Error fetching student's already taken items:", error);
    }
  };

  const fetchStockLimits = async () => {
    try {
      // First try to get from stock_balance table
      const { data: stockData, error: stockError } = await supabase
        .from('stock_balance')
        .select('*');
      
      if (stockError) {
        console.warn("stock_balance table not found, using fallback");
        // Fallback: use uniform_items table if stock_balance doesn't exist
        const { data: itemsData, error: itemsError } = await supabase
          .from('uniform_items')
          .select('*');
        
        if (itemsError) throw itemsError;
        
        const stockMap = {};
        itemsData?.forEach(item => {
          if (item.has_size) {
            SIZES.forEach(size => {
              const key = item.id + size;
              stockMap[key] = 0; // Default to 0 if no stock_balance data
            });
          } else {
            const key = item.id;
            stockMap[key] = 0; // Default to 0 if no stock_balance data
          }
        });
        setStockLimits(stockMap);
        return;
      }
      
      const stockMap = {};
      stockData?.forEach(stock => {
        const key = stock.item_id + (stock.size || '');
        stockMap[key] = stock.quantity;
      });
      setStockLimits(stockMap);
    } catch (error) {
      console.error("Error fetching stock limits:", error);
    }
  };

  const checkBillNumberExists = async (billNum) => {
    try {
      const { data, error } = await supabase
        .from('issue_receipts')
        .select('id')
        .eq('bill_number', billNum)
        .single();
      
      return data !== null; // If data exists, bill number is taken
    } catch (error) {
      return false; // If error (like no rows), bill number is available
    }
  };

  const generateBillNumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BILL-${year}${month}${day}-${random}`;
  };

  const fetchSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .or(`name.ilike.%${query}%,registration_number.ilike.%${query}%,roll_number.ilike.%${query}%`)
        .limit(5);
      
      if (error) throw error;
      setSuggestions(data || []);
      setShowSuggestions((data || []).length > 0);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearchInputChange = (value) => {
    setSearchQuery(value);
    fetchSuggestions(value);
  };

  const selectStudent = (selectedStudent) => {
    setStudent(selectedStudent);
    setSearchQuery(selectedStudent.name);
    setSelectedItems([]);
    setShowSuggestions(false);
    toast.success("Student selected!");
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter student name, registration or roll number");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .or(`name.ilike.%${searchQuery}%,registration_number.ilike.%${searchQuery}%,roll_number.ilike.%${searchQuery}%`)
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setStudent(data);
        setSelectedItems([]);
        setShowSuggestions(false);
        toast.success("Student found!");
      } else {
        toast.error("Student not found. Create new student?");
        setShowNewStudentDialog(true);
        setNewStudent({...newStudent, name: searchQuery});
      }
    } catch (error) {
      console.error("Error searching student:", error);
      toast.error("Error searching student");
    }
  };

  const handleCreateStudent = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert(newStudent)
        .select()
        .single();
      
      if (error) throw error;
      
      setStudent(data);
      setShowNewStudentDialog(false);
      toast.success("Student created successfully!");
    } catch (error) {
      console.error("Error creating student:", error);
      toast.error("Failed to create student");
    }
  };

  const toggleItem = (itemId) => {
    const item = uniformItems.find(i => i.id === itemId);
    const existingIndex = selectedItems.findIndex(si => si.item_id === itemId);
    
    if (existingIndex >= 0) {
      setSelectedItems(selectedItems.filter(si => si.item_id !== itemId));
    } else {
      setSelectedItems([...selectedItems, {
        item_id: item.id,
        item_name: item.name,
        size: item.has_size ? "M" : "One Size",
        quantity: 1
      }]);
    }
  };

  const updateSelectedItem = (itemId, field, value) => {
    setSelectedItems(selectedItems.map(item => 
      item.item_id === itemId ? {...item, [field]: value} : item
    ));
    
    // Refresh stock after any change to ensure real-time accuracy
    if (field === 'quantity' || field === 'size') {
      setTimeout(() => {
        fetchStockLimits();
      }, 100);
    }
  };

  const handleIssue = async () => {
    if (!student) {
      toast.error("Please select a student");
      return;
    }
    
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item");
      return;
    }
    
    if (!issuedBy.trim()) {
      toast.error("Please enter issued by name");
      return;
    }

    if (!billNumber.trim()) {
      toast.error("Please enter a bill number");
      return;
    }

    // Check if bill number already exists
    const billExists = await checkBillNumberExists(billNumber);
    if (billExists) {
      toast.error("Bill number already exists. Please use a different number.");
      return;
    }

    // Validate stock and limits before issuing
    for (const item of selectedItems) {
      const alreadyTaken = studentAlreadyTaken
        .filter(taken => taken.item_id === item.item_id)
        .reduce((total, taken) => total + taken.quantity, 0);
      
      const maxLimit = itemLimits[item.item_id] || 1;
      const key = item.item_id + (item.size || '');
      const availableStock = stockLimits[key] || 0;
      
      if (alreadyTaken + item.quantity > maxLimit) {
        toast.error(`Cannot issue ${item.quantity} ${item.name}. Student already has ${alreadyTaken}/${maxLimit}`);
        return;
      }
      
      if (item.quantity > availableStock) {
        const itemName = uniformItems.find(ui => ui.id === item.item_id)?.name || 'item';
        toast.error(`Cannot issue ${item.quantity} ${itemName}. Only ${availableStock} available in stock`);
        return;
      }
    }

    try {
      // Start a transaction-like process
      // 1. Create the issue receipt
      const { data: receiptData, error: receiptError } = await supabase
        .from('issue_receipts')
        .insert({
          student_id: student.id,
          student_name: student.name,
          registration_number: student.registration_number,
          roll_number: student.roll_number,
          items: selectedItems,
          issued_date: new Date().toISOString().split('T')[0],
          issued_by: issuedBy,
          bill_number: billNumber
        })
        .select()
        .single();
      
      if (receiptError) throw receiptError;

      // 2. Update stock for each item
      for (const item of selectedItems) {
        const key = item.item_id + (item.size || '');
        const currentStock = stockLimits[key] || 0;
        const newStock = currentStock - item.quantity;

        // Update stock balance using the correct approach
        const { error: stockError } = await supabase
          .from('stock_balance')
          .update({ quantity: newStock })
          .eq('item_id', item.item_id)
          .eq('size', item.size || null);
        
        if (stockError) {
          // If update fails, try to insert
          const { error: insertError } = await supabase
            .from('stock_balance')
            .insert({
              item_id: item.item_id,
              size: item.size || null,
              quantity: newStock
            });
          
          if (insertError) throw insertError;
        }
      }
      
      toast.success("Uniform issued successfully!");
      
      // Clear form
      setSelectedItems([]);
      setIssuedBy("");
      setBillNumber("");
      
      // Refresh data
      fetchStudentAlreadyTaken();
      fetchStockLimits();
      
      navigate('/');
    } catch (error) {
      console.error("Error issuing uniform:", error);
      toast.error("Failed to issue uniform: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="outline" 
          onClick={() => navigate('/')} 
          className="mb-6"
        >
          ← Back to Dashboard
        </Button>

        <Card className="bg-white shadow-xl mb-6">
          <CardHeader>
            <CardTitle className="text-3xl text-blue-700">Issue Uniform</CardTitle>
            <CardDescription>Search student and issue uniforms</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Student Search with Autocomplete */}
            <div className="mb-6">
              <div className="relative">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Enter Name, Registration or Roll Number"
                      value={searchQuery}
                      onChange={(e) => handleSearchInputChange(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      className="w-full"
                    />
                    
                    {/* Autocomplete Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {suggestions.map((suggestion) => (
                          <div
                            key={suggestion.id}
                            onClick={() => selectStudent(suggestion)}
                            className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                          >
                            <p className="font-semibold text-slate-800">{suggestion.name}</p>
                            <p className="text-sm text-slate-600">
                              Reg: {suggestion.registration_number} | Roll: {suggestion.roll_number}
                            </p>
                            <p className="text-xs text-slate-500">{suggestion.class_year}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
                    Search
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Type at least 2 characters to see suggestions
                </p>
              </div>
            </div>

            {/* Student Info */}
            {student && (
              <Card className="bg-blue-50 border-blue-200 mb-6">
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <p className="text-sm text-slate-600">Name</p>
                      <p className="font-semibold text-lg">{student.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Registration No.</p>
                      <p className="font-semibold">{student.registration_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Roll No.</p>
                      <p className="font-semibold">{student.roll_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Class</p>
                      <p className="font-semibold">{student.class_year}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Course</p>
                      <p className="font-semibold">{student.course || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Phone</p>
                      <p className="font-semibold">{student.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  {/* Already Taken Items */}
                  {studentAlreadyTaken.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2">Already Taken Items:</h4>
                      <div className="flex flex-wrap gap-2">
                        {studentAlreadyTaken.map((item, index) => (
                          <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                            {item.name}
                            {item.size && ` (${item.size})`}
                            {item.quantity > 1 && ` x${item.quantity}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Item Selection */}
            {student && (
              <div>
                <Label className="text-lg mb-3 block">Select Items to Issue</Label>
                <div className="space-y-3 mb-6">
                  {uniformItems.map(item => {
                    const isSelected = selectedItems.some(si => si.item_id === item.id);
                    const selectedItem = selectedItems.find(si => si.item_id === item.id);
                    
                    // Calculate already taken by this student
                    const alreadyTaken = studentAlreadyTaken
                      .filter(taken => taken.item_id === item.id)
                      .reduce((total, taken) => total + taken.quantity, 0);
                    
                    // Get max limit for this item
                    const maxLimit = itemLimits[item.id] || 1;
                    
                    // Calculate available stock for each size
                    const getAvailableStock = (size) => {
                      const key = item.id + (size || '');
                      return stockLimits[key] || 0;
                    };
                    
                    // Check if item can be selected (has stock and within limits)
                    const canSelect = () => {
                      if (item.has_size) {
                        return SIZES.some(size => getAvailableStock(size) > 0);
                      } else {
                        return getAvailableStock() > 0;
                      }
                    };
                    
                    const isWithinLimit = alreadyTaken < maxLimit;
                    
                    return (
                      <div key={item.id} className={`flex items-center gap-3 p-3 border rounded-lg ${
                        !canSelect() ? 'bg-gray-100 opacity-50' : 'hover:bg-slate-50'
                      }`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItem(item.id)}
                          disabled={!canSelect() || !isWithinLimit}
                          className="w-5 h-5"
                        />
                        <div className="flex-1">
                          <span className="font-medium">{item.name}</span>
                          <div className="text-sm text-slate-600">
                            {alreadyTaken > 0 && (
                              <span className="text-orange-600">
                                Already taken: {alreadyTaken}/{maxLimit} | 
                              </span>
                            )}
                            {!isWithinLimit && (
                              <span className="text-red-600"> Limit reached |</span>
                            )}
                            {item.has_size ? (
                              <span> Stock: {SIZES.map(size => `${size}:${getAvailableStock(size)}`).join(', ')}</span>
                            ) : (
                              <span> Stock: {getAvailableStock()}</span>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <>
                            <Select
                              value={selectedItem.size}
                              onValueChange={(value) => updateSelectedItem(item.id, "size", value)}
                              disabled={!item.has_size}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SIZES.map(size => {
                                  const stock = getAvailableStock(size);
                                  return (
                                    <SelectItem 
                                      key={size} 
                                      value={size}
                                      disabled={stock <= 0}
                                    >
                                      {size} ({stock} left)
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              min="1"
                              max={Math.min(
                                getAvailableStock(selectedItem.size),
                                maxLimit - alreadyTaken
                              )}
                              value={selectedItem.quantity}
                              onChange={(e) => updateSelectedItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                              className="w-20"
                            />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mb-6">
                  <Label htmlFor="bill_number">Bill Number *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="bill_number"
                      value={billNumber}
                      onChange={(e) => setBillNumber(e.target.value)}
                      placeholder="Enter unique bill number"
                      className="flex-1"
                    />
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => setBillNumber(generateBillNumber())}
                      className="whitespace-nowrap"
                    >
                      Generate
                    </Button>
                  </div>
                </div>

                <div className="mb-6">
                  <Label htmlFor="issued_by">Issued By *</Label>
                  <Input
                    id="issued_by"
                    placeholder="Staff name"
                    value={issuedBy}
                    onChange={(e) => setIssuedBy(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handleIssue} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Issue Uniform
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Student Dialog */}
        <Dialog open={showNewStudentDialog} onOpenChange={setShowNewStudentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Student</DialogTitle>
              <DialogDescription>Enter student details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Registration Number *</Label>
                <Input
                  value={newStudent.registration_number}
                  onChange={(e) => setNewStudent({...newStudent, registration_number: e.target.value})}
                />
              </div>
              <div>
                <Label>Roll Number *</Label>
                <Input
                  value={newStudent.roll_number}
                  onChange={(e) => setNewStudent({...newStudent, roll_number: e.target.value})}
                />
              </div>
              <div>
                <Label>Name *</Label>
                <Input
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                />
              </div>
              <div>
                <Label>Class/Year *</Label>
                <Input
                  value={newStudent.class_year}
                  onChange={(e) => setNewStudent({...newStudent, class_year: e.target.value})}
                  placeholder="e.g., First Year"
                />
              </div>
              <div>
                <Label>Course</Label>
                <Input
                  value={newStudent.course}
                  onChange={(e) => setNewStudent({...newStudent, course: e.target.value})}
                  placeholder="e.g., Computer Science"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={newStudent.phone}
                  onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})}
                />
              </div>
              <Button onClick={handleCreateStudent} className="w-full">
                Create Student
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// Stock Balance Component
const StockBalance = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (supabase) {
      fetchBalance();
    }
  }, []);

  const fetchBalance = async () => {
    try {
      // Get all receipts and issues
      const [receiptsRes, issuesRes] = await Promise.all([
        supabase.from('stock_receipts').select('items'),
        supabase.from('issue_receipts').select('items')
      ]);

      if (receiptsRes.error) throw receiptsRes.error;
      if (issuesRes.error) throw issuesRes.error;

      // Calculate received quantities
      const receivedDict = {};
      receiptsRes.data?.forEach(receipt => {
        receipt.items.forEach(item => {
          const key = `${item.item_id}_${item.size}`;
          if (!receivedDict[key]) {
            receivedDict[key] = {
              item_id: item.item_id,
              item_name: item.item_name,
              size: item.size,
              received: 0,
              issued: 0
            };
          }
          receivedDict[key].received += item.quantity;
        });
      });

      // Calculate issued quantities
      issuesRes.data?.forEach(issue => {
        issue.items.forEach(item => {
          const key = `${item.item_id}_${item.size}`;
          if (!receivedDict[key]) {
            receivedDict[key] = {
              item_id: item.item_id,
              item_name: item.item_name,
              size: item.size,
              received: 0,
              issued: 0
            };
          }
          receivedDict[key].issued += item.quantity;
        });
      });

      // Calculate balance
      const balances = Object.values(receivedDict).map(data => ({
        item_id: data.item_id,
        item_name: data.item_name,
        size: data.size,
        received: data.received,
        issued: data.issued,
        balance: data.received - data.issued
      }));

      setBalance(balances);
    } catch (error) {
      console.error("Error fetching stock balance:", error);
      toast.error("Failed to load stock balance");
    }
  };

  const filteredBalance = balance.filter(item => {
    if (filter === "all") return true;
    if (filter === "low") return item.balance < 10 && item.balance > 0;
    if (filter === "out") return item.balance <= 0;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Button 
          variant="outline" 
          onClick={() => navigate('/')} 
          className="mb-6"
        >
          ← Back to Dashboard
        </Button>

        <Card className="bg-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl text-emerald-700">Stock Balance</CardTitle>
            <CardDescription>Current inventory levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-6">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                onClick={() => setFilter("all")}
              >
                All Items
              </Button>
              <Button
                variant={filter === "low" ? "default" : "outline"}
                onClick={() => setFilter("low")}
              >
                Low Stock
              </Button>
              <Button
                variant={filter === "out" ? "default" : "outline"}
                onClick={() => setFilter("out")}
              >
                Out of Stock
              </Button>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Issued</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBalance.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.item_name}</TableCell>
                      <TableCell>{item.size}</TableCell>
                      <TableCell className="text-right">{item.received}</TableCell>
                      <TableCell className="text-right">{item.issued}</TableCell>
                      <TableCell className={`text-right font-bold ${
                        item.balance <= 0 ? 'text-red-600' : 
                        item.balance < 10 ? 'text-orange-600' : 
                        'text-emerald-600'
                      }`}>
                        {item.balance}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredBalance.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-500">
                        No items found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// History Component
const History = () => {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState([]);
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    if (supabase) {
      fetchHistory();
    }
  }, []);

  const fetchHistory = async () => {
    try {
      const [receiptsRes, issuesRes] = await Promise.all([
        supabase
          .from('stock_receipts')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('issue_receipts')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      if (receiptsRes.error) throw receiptsRes.error;
      if (issuesRes.error) throw issuesRes.error;

      setReceipts(receiptsRes.data || []);
      setIssues(issuesRes.data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("Failed to load history");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Button 
          variant="outline" 
          onClick={() => navigate('/')} 
          className="mb-6"
        >
          ← Back to Dashboard
        </Button>

        <Card className="bg-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl text-purple-700">History</CardTitle>
            <CardDescription>View all transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="receipts">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="receipts">Deliveries ({receipts.length})</TabsTrigger>
                <TabsTrigger value="issues">Issues ({issues.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="receipts">
                <div className="space-y-4">
                  {receipts.map((receipt, index) => (
                    <Card key={receipt.id} className="border-l-4 border-l-cyan-500">
                      <CardContent className="pt-6">
                        <div className="flex justify-between mb-3">
                          <div>
                            <p className="font-bold text-lg">Bill #{receipt.bill_number}</p>
                            <p className="text-sm text-slate-600">{receipt.vendor_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">${receipt.total_amount}</p>
                            <p className="text-sm text-slate-600">{new Date(receipt.bill_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-sm">
                          {receipt.items.map((item, i) => (
                            <p key={i} className="text-slate-600">
                              {item.item_name} ({item.size}) × {item.quantity}
                            </p>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {receipts.length === 0 && (
                    <p className="text-center text-slate-500 py-8">No deliveries recorded yet</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="issues">
                <div className="space-y-4">
                  {issues.map((issue, index) => (
                    <Card key={issue.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-6">
                        <div className="flex justify-between mb-3">
                          <div>
                            <p className="font-bold text-lg">{issue.student_name}</p>
                            <p className="text-sm text-slate-600">Reg: {issue.registration_number} | Roll: {issue.roll_number}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-600">{new Date(issue.issued_date).toLocaleDateString()}</p>
                            <p className="text-xs text-slate-500">By: {issue.issued_by}</p>
                          </div>
                        </div>
                        <div className="text-sm">
                          {issue.items.map((item, i) => (
                            <p key={i} className="text-slate-600">
                              {item.item_name} ({item.size}) × {item.quantity}
                            </p>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {issues.length === 0 && (
                    <p className="text-center text-slate-500 py-8">No issues recorded yet</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Settings Component
const Settings = () => {
  const navigate = useNavigate();
  const [uniformItems, setUniformItems] = useState([]);
  const [limits, setLimits] = useState({});
  const [stockLimits, setStockLimits] = useState({});
  const [studentAlreadyTaken, setStudentAlreadyTaken] = useState([]);

  useEffect(() => {
    if (supabase) {
      fetchUniformItems();
      fetchLimits();
      fetchStockData();
      fetchSampleStudentData();
    }
  }, []);

  const fetchUniformItems = async () => {
    try {
      const { data, error } = await supabase
        .from('uniform_items')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setUniformItems(data || []);
    } catch (error) {
      console.error("Error fetching uniform items:", error);
      toast.error("Failed to load uniform items");
    }
  };

  const fetchLimits = async () => {
    try {
      const { data, error } = await supabase
        .from('uniform_item_limits')
        .select('*');
      
      if (error) throw error;
      
      const limitsMap = {};
      data?.forEach(limit => {
        limitsMap[limit.item_id] = limit.max_per_student;
      });
      setLimits(limitsMap);
    } catch (error) {
      console.error("Error fetching limits:", error);
    }
  };

  const fetchStockData = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_balance')
        .select('*');
      
      if (error) throw error;
      
      const stockMap = {};
      data?.forEach(stock => {
        const key = stock.item_id + (stock.size || '');
        stockMap[key] = stock.quantity;
      });
      setStockLimits(stockMap);
    } catch (error) {
      console.error("Error fetching stock data:", error);
    }
  };

  const fetchSampleStudentData = async () => {
    try {
      const { data, error } = await supabase
        .from('issue_receipts')
        .select('*')
        .limit(5);
      
      if (error) throw error;
      
      // Flatten the items array from each receipt
      const flattenedItems = [];
      data?.forEach(receipt => {
        if (receipt.items && Array.isArray(receipt.items)) {
          receipt.items.forEach(item => {
            flattenedItems.push({
              ...item,
              receipt_id: receipt.id,
              issued_date: receipt.issued_date
            });
          });
        }
      });
      
      setStudentAlreadyTaken(flattenedItems);
    } catch (error) {
      console.error("Error fetching sample student data:", error);
    }
  };

  const updateLimit = async (itemId, newLimit) => {
    try {
      const { error } = await supabase
        .from('uniform_item_limits')
        .upsert({
          item_id: itemId,
          max_per_student: newLimit
        });
      
      if (error) throw error;
      
      setLimits(prev => ({ ...prev, [itemId]: newLimit }));
      toast.success("Limit updated successfully!");
    } catch (error) {
      console.error("Error updating limit:", error);
      toast.error("Failed to update limit");
    }
  };

  const addTestStock = async () => {
    try {
      // Add test stock for all items
      for (const item of uniformItems) {
        if (item.has_size) {
          // Add stock for each size
          for (const size of ['XS', 'S', 'M', 'L', 'XL', 'XXL']) {
            const { error } = await supabase
              .from('stock_balance')
              .insert({
                item_id: item.id,
                size: size,
                quantity: 10
              });
            
            if (error && !error.message.includes('duplicate')) {
              console.error(`Error adding stock for ${item.name} ${size}:`, error);
            }
          }
        } else {
          // Add stock for items without sizes
          const { error } = await supabase
            .from('stock_balance')
            .insert({
              item_id: item.id,
              size: null,
              quantity: 15
            });
          
          if (error && !error.message.includes('duplicate')) {
            console.error(`Error adding stock for ${item.name}:`, error);
          }
        }
      }
      toast.success("Test stock added successfully!");
      fetchStockData(); // Refresh the stock data
    } catch (error) {
      console.error("Error adding test stock:", error);
      toast.error("Failed to add test stock");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="outline" 
          onClick={() => navigate('/')} 
          className="mb-6"
        >
          ← Back to Dashboard
        </Button>

        <Card className="bg-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl text-slate-700">Settings</CardTitle>
            <CardDescription>Manage uniform items and limits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-4">Uniform Items & Limits</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Set the maximum number of each item a student can receive
                </p>
                
                <div className="space-y-3">
                  {uniformItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-slate-500">
                          {item.has_size ? 'Has sizes' : 'One size only'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`limit-${item.id}`}>Max per student:</Label>
                        <Input
                          id={`limit-${item.id}`}
                          type="number"
                          min="1"
                          value={limits[item.id] || 1}
                          onChange={(e) => updateLimit(item.id, parseInt(e.target.value) || 1)}
                          className="w-20"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Main App
function App() {
  return (
    <div className="App">
      <Toaster position="top-center" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/receive" element={<ReceiveStock />} />
          <Route path="/issue" element={<IssueUniform />} />
          <Route path="/stock" element={<StockBalance />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
