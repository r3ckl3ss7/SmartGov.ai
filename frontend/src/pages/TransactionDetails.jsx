import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  AlertTriangle,
  FileText,
  TrendingUp,
  Brain,
  Download,
  BarChart3,
  PieChart,
  Activity,
  DollarSign,
  Users,
  Building2,
  Calendar,
  TrendingDown,
  Search,
  Target,
  ShieldAlert,
  Clock,
  CheckCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Layout from '../components/Layout';

const COLORS = {
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#10b981',
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  accent: '#06b6d4',
};

const TransactionDetails = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [simulationParams, setSimulationParams] = useState({ percentage: 10 });
  const [simulationResult, setSimulationResult] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, [fileId, currentPage]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/uploads/${fileId}/transactions`,
        {
          params: { page: currentPage, limit: 50 },
        }
      );

      setFile(data.file);
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/uploads/${fileId}/analysis`
      );

      setAnalysis(data);
      setActiveTab('overview');
    } catch (error) {
      console.error('Error running analysis:', error);
      alert('Failed to run analysis. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-slate-300 font-medium mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getRiskLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'low':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  const getRiskScoreColor = (score) => {
    if (score >= 70) return 'text-red-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  const runSimulation = () => {
    if (!analysis || !analysis.results) return;

    const allTransactions = analysis.results;
    const sortedByRisk = [...allTransactions].sort((a, b) => b.riskScore - a.riskScore);
    const auditCount = Math.ceil((simulationParams.percentage / 100) * sortedByRisk.length);
    const transactionsToAudit = sortedByRisk.slice(0, auditCount);

    const highRiskCaught = transactionsToAudit.filter(t => t.riskLevel === 'High').length;
    const totalHighRisk = allTransactions.filter(t => t.riskLevel === 'High').length;
    const fraudCoveragePercent = totalHighRisk > 0 ? (highRiskCaught / totalHighRisk) * 100 : 0;
    const transactionsSaved = allTransactions.length - auditCount;
    const workloadReduction = ((transactionsSaved / allTransactions.length) * 100);

    const estimatedLeakage = transactionsToAudit.reduce((sum, t) => {
      const txn = transactions.find(tr => tr.transaction_id === t.payment_uid);
      return sum + (txn?.payment?.amount || 0);
    }, 0);

    setSimulationResult({
      auditCount,
      transactionsSaved,
      fraudCoveragePercent: fraudCoveragePercent.toFixed(1),
      workloadReduction: workloadReduction.toFixed(1),
      estimatedLeakage: estimatedLeakage.toFixed(2),
      highRiskCaught,
      totalHighRisk
    });
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/history')}
              className="p-2 hover:bg-slate-700 rounded-lg transition-all"
            >
              <ArrowLeft className="w-6 h-6 text-slate-400" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {file?.originalName || 'Transaction Details'}
              </h1>
              <p className="text-slate-400">
                Uploaded on{' '}
                {file?.uploadedAt &&
                  new Date(file.uploadedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
              </p>
            </div>
          </div>
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all shadow-lg shadow-purple-600/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Brain className="w-5 h-5" />
            {analyzing ? 'Analyzing...' : 'Run Risk Analysis'}
          </button>
        </div>

        {file?.stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <p className="text-slate-400 text-sm">Total Rows</p>
              </div>
              <p className="text-3xl font-bold text-white">{file.stats.totalRows}</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <p className="text-slate-400 text-sm">New Transactions</p>
              </div>
              <p className="text-3xl font-bold text-green-400">
                {file.stats.newTransactions}
              </p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-yellow-400" />
                <p className="text-slate-400 text-sm">Duplicates</p>
              </div>
              <p className="text-3xl font-bold text-yellow-400">
                {file.stats.duplicateTransactions}
              </p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <p className="text-slate-400 text-sm">Rejected</p>
              </div>
              <p className="text-3xl font-bold text-red-400">
                {file.stats.rejectedRows}
              </p>
            </div>
          </motion.div>
        )}

        {analysis && analysis.analytics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-xl rounded-xl border border-purple-500/30 p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-600 p-3 rounded-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Comprehensive Risk Analysis
                  </h2>
                  <p className="text-slate-400">
                    {analysis.analytics.statisticalSummary?.totalTransactions || 0} transactions analyzed across{' '}
                    {analysis.analytics.statisticalSummary?.uniqueDepartments || 0} departments
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <p className="text-slate-400 text-sm">High Risk</p>
                  </div>
                  <p className="text-2xl font-bold text-red-400">
                    {analysis.analytics.statisticalSummary?.highRiskCount || 0}
                  </p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-yellow-400" />
                    <p className="text-slate-400 text-sm">Medium Risk</p>
                  </div>
                  <p className="text-2xl font-bold text-yellow-400">
                    {analysis.analytics.statisticalSummary?.mediumRiskCount || 0}
                  </p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <p className="text-slate-400 text-sm">Total Amount</p>
                  </div>
                  <p className="text-2xl font-bold text-green-400">
                    ₹{(analysis.analytics.statisticalSummary?.totalAmount / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <p className="text-slate-400 text-sm">Avg Risk Score</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-400">
                    {analysis.analytics.statisticalSummary?.avgRiskScore?.toFixed(1) || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-2 mb-6 flex gap-2 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'department', label: 'Department Analysis', icon: Building2 },
                { id: 'vendor', label: 'Vendor Analysis', icon: Users },
                { id: 'timeline', label: 'Timeline Analysis', icon: Calendar },
                { id: 'investigation', label: '🔍 Investigation Mode', icon: Search },
                { id: 'simulator', label: '🎯 What-If Simulator', icon: Target },
                { id: 'transactions', label: 'High-Risk Transactions', icon: AlertTriangle },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:bg-slate-700/50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-blue-400" />
                    Risk Level Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPie>
                      <Pie
                        data={Object.entries(analysis.analytics.riskDistribution || {}).map(([name, value]) => ({
                          name,
                          value,
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.keys(analysis.analytics.riskDistribution || {}).map((key) => (
                          <Cell key={key} fill={COLORS[key]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </RechartsPie>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-4">
                    {Object.entries(analysis.analytics.riskDistribution || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[key] }}
                        />
                        <span className="text-slate-300 text-sm">
                          {key}: {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-400" />
                    Statistical Summary
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-slate-400">Total Transactions</span>
                      <span className="text-white font-bold">
                        {analysis.analytics.statisticalSummary?.totalTransactions?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-slate-400">Average Amount</span>
                      <span className="text-green-400 font-bold">
                        ₹{analysis.analytics.statisticalSummary?.avgAmount?.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-slate-400">Median Amount</span>
                      <span className="text-blue-400 font-bold">
                        ₹{analysis.analytics.statisticalSummary?.medianAmount?.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-slate-400">Unique Departments</span>
                      <span className="text-purple-400 font-bold">
                        {analysis.analytics.statisticalSummary?.uniqueDepartments}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-slate-400">Unique Vendors</span>
                      <span className="text-cyan-400 font-bold">
                        {analysis.analytics.statisticalSummary?.uniqueVendors}
                      </span>
                    </div>
                  </div>
                </div>

                {analysis.analytics.paymentModeAnalysis && analysis.analytics.paymentModeAnalysis.length > 0 && (
                  <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 lg:col-span-2">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-green-400" />
                      Payment Mode Analysis
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analysis.analytics.paymentModeAnalysis}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="paymentMode" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="transactionCount" fill={COLORS.primary} name="Transactions" />
                        <Bar dataKey="avgRiskScore" fill={COLORS.secondary} name="Avg Risk Score" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'department' && (
              <div className="space-y-6">
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-400" />
                    Department Transaction Volume & Amount
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={analysis.analytics.departmentAnalysis}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="department" stroke="#94a3b8" angle={-45} textAnchor="end" height={100} />
                      <YAxis yAxisId="left" stroke="#94a3b8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="transactionCount" fill={COLORS.primary} name="Transactions" />
                      <Bar yAxisId="right" dataKey="totalAmount" fill={COLORS.accent} name="Total Amount (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    Department Risk Scores
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={analysis.analytics.departmentAnalysis}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="department" stroke="#94a3b8" angle={-45} textAnchor="end" height={100} />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="avgRiskScore" fill={COLORS.secondary} name="Average Risk Score" />
                      <Bar dataKey="maxRiskScore" fill="#ef4444" name="Max Risk Score" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {analysis.analytics.departmentRiskDistribution && (
                  <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-purple-400" />
                      Risk Distribution by Department
                    </h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={analysis.analytics.departmentRiskDistribution.map((dept) => ({
                          department: dept.department,
                          High: dept.High || 0,
                          Medium: dept.Medium || 0,
                          Low: dept.Low || 0,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="department" stroke="#94a3b8" angle={-45} textAnchor="end" height={100} />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="High" stackId="a" fill={COLORS.High} />
                        <Bar dataKey="Medium" stackId="a" fill={COLORS.Medium} />
                        <Bar dataKey="Low" stackId="a" fill={COLORS.Low} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'vendor' && (
              <div className="space-y-6">
                {analysis.analytics.vendorAnalysis && analysis.analytics.vendorAnalysis.length > 0 ? (
                  <>
                    <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-green-400" />
                        Top 20 Vendors by Total Amount
                      </h3>
                      <ResponsiveContainer width="100%" height={500}>
                        <BarChart
                          data={analysis.analytics.vendorAnalysis}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="vendor_id" stroke="#94a3b8" angle={-45} textAnchor="end" height={100} />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="totalAmount" fill={COLORS.accent} name="Total Amount (₹)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        Vendor Risk Profile
                      </h3>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={analysis.analytics.vendorAnalysis}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="vendor_id" stroke="#94a3b8" angle={-45} textAnchor="end" height={100} />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="avgRiskScore" fill={COLORS.secondary} name="Avg Risk Score" />
                          <Bar dataKey="transactionCount" fill={COLORS.primary} name="Transaction Count" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 overflow-hidden">
                      <div className="p-6 border-b border-slate-700/50">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-400" />
                          Detailed Vendor Statistics
                        </h3>
                      </div>
                      <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        <table className="w-full">
                          <thead className="bg-slate-900/50 sticky top-0">
                            <tr>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                                Vendor ID
                              </th>
                              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-300">
                                Total Amount
                              </th>
                              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-300">
                                Transactions
                              </th>
                              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-300">
                                Avg Amount
                              </th>
                              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-300">
                                Avg Risk
                              </th>
                              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-300">
                                Departments
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700/50">
                            {analysis.analytics.vendorAnalysis.map((vendor) => (
                              <tr key={vendor.vendor_id} className="hover:bg-slate-700/30">
                                <td className="px-6 py-3 text-sm text-white">{vendor.vendor_id}</td>
                                <td className="px-6 py-3 text-sm text-green-400 text-right font-semibold">
                                  ₹{vendor.totalAmount?.toLocaleString()}
                                </td>
                                <td className="px-6 py-3 text-sm text-blue-400 text-right">
                                  {vendor.transactionCount}
                                </td>
                                <td className="px-6 py-3 text-sm text-slate-300 text-right">
                                  ₹{vendor.avgAmount?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-3 text-sm text-right">
                                  <span
                                    className={`font-semibold ${
                                      vendor.avgRiskScore >= 70
                                        ? 'text-red-400'
                                        : vendor.avgRiskScore >= 40
                                        ? 'text-yellow-400'
                                        : 'text-green-400'
                                    }`}
                                  >
                                    {vendor.avgRiskScore?.toFixed(1)}
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-sm text-purple-400 text-right">
                                  {vendor.departmentCount}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-12 text-center">
                    <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Vendor Data Available</h3>
                    <p className="text-slate-400">
                      Vendor analysis will appear here after running the risk analysis.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'timeline' && analysis.analytics.timeSeriesAnalysis && (
              <div className="space-y-6">
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    Daily Transaction Volume
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={analysis.analytics.timeSeriesAnalysis}>
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
                          <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#94a3b8" angle={-45} textAnchor="end" height={100} />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="totalAmount"
                        stroke={COLORS.primary}
                        fillOpacity={1}
                        fill="url(#colorAmount)"
                        name="Total Amount (₹)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Daily Transaction Count & Risk Trend
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={analysis.analytics.timeSeriesAnalysis}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#94a3b8" angle={-45} textAnchor="end" height={100} />
                      <YAxis yAxisId="left" stroke="#94a3b8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="transactionCount"
                        stroke={COLORS.accent}
                        strokeWidth={2}
                        name="Transaction Count"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="avgRiskScore"
                        stroke={COLORS.secondary}
                        strokeWidth={2}
                        name="Avg Risk Score"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {analysis.analytics.monthEndStats && analysis.analytics.monthEndStats.length > 0 && (
                  <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-purple-400" />
                      Month-End Transaction Pattern
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {analysis.analytics.monthEndStats.map((stat) => (
                        <div
                          key={stat.isMonthEnd}
                          className="bg-slate-900/50 p-6 rounded-lg border border-slate-700"
                        >
                          <h4 className="text-lg font-semibold text-white mb-4">
                            {stat.isMonthEnd ? 'Month-End' : 'Regular Days'}
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Total Amount</span>
                              <span className="text-green-400 font-semibold">
                                ₹{stat.totalAmount?.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Transaction Count</span>
                              <span className="text-blue-400 font-semibold">{stat.count}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Avg Amount</span>
                              <span className="text-cyan-400 font-semibold">
                                ₹{stat.avgAmount?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Avg Risk Score</span>
                              <span
                                className={`font-semibold ${
                                  stat.avgRiskScore >= 70
                                    ? 'text-red-400'
                                    : stat.avgRiskScore >= 40
                                    ? 'text-yellow-400'
                                    : 'text-green-400'
                                }`}
                              >
                                {stat.avgRiskScore?.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'investigation' && analysis.analytics.investigationInsights && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-xl rounded-xl border border-purple-500/30 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Search className="w-8 h-8 text-purple-400" />
                    <div>
                      <h2 className="text-2xl font-bold text-white">🕵️ Investigation Mode</h2>
                      <p className="text-slate-400">Department-level deep dive with actionable insights</p>
                    </div>
                  </div>
                </div>

                {analysis.analytics.investigationInsights.map((insight, index) => (
                  <motion.div
                    key={insight.department}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-slate-800/50 backdrop-blur-xl rounded-xl border ${
                      insight.anomalyRate >= 30
                        ? 'border-red-500/50'
                        : insight.anomalyRate >= 15
                        ? 'border-yellow-500/50'
                        : 'border-green-500/50'
                    } overflow-hidden`}
                  >
                    <div className="p-6 border-b border-slate-700/50">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-2">{insight.department}</h3>
                          <div className="flex items-center gap-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                insight.anomalyRate >= 30
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                                  : insight.anomalyRate >= 15
                                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                                  : 'bg-green-500/20 text-green-400 border border-green-500/50'
                              }`}
                            >
                              {insight.anomalyRate >= 30
                                ? '🚨 HIGH PRIORITY'
                                : insight.anomalyRate >= 15
                                ? '⚠️ MEDIUM PRIORITY'
                                : '✅ LOW PRIORITY'}
                            </span>
                            <span className="text-slate-400 text-sm">
                              {insight.totalTransactions} total transactions
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-red-400">{insight.anomalyRate.toFixed(1)}%</p>
                          <p className="text-slate-400 text-sm">Anomaly Rate</p>
                        </div>
                      </div>

                      <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <ShieldAlert className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-white font-semibold mb-2">📋 Recommendation:</p>
                            <p className="text-slate-300 text-sm leading-relaxed">{insight.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                          <Users className="w-5 h-5 text-red-400" />
                          Top Risky Vendors
                        </h4>
                        <div className="space-y-3">
                          {insight.topRiskyVendors && insight.topRiskyVendors.length > 0 ? (
                            insight.topRiskyVendors.map((vendor, idx) => (
                              <div
                                key={vendor.vendor_id}
                                className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 hover:border-red-500/50 transition-all"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-white font-medium">
                                    #{idx + 1} Vendor {vendor.vendor_id}
                                  </span>
                                  <span
                                    className={`text-lg font-bold ${
                                      vendor.avgRiskScore >= 70
                                        ? 'text-red-400'
                                        : vendor.avgRiskScore >= 40
                                        ? 'text-yellow-400'
                                        : 'text-green-400'
                                    }`}
                                  >
                                    {vendor.avgRiskScore?.toFixed(1)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-400">
                                    {vendor.transactionCount} transactions
                                  </span>
                                  <span className="text-green-400 font-semibold">
                                    ₹{vendor.totalAmount?.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-400 text-sm">No risky vendors identified</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                          <Clock className="w-5 h-5 text-purple-400" />
                          Suspicious Payment Timeline
                        </h4>
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {insight.suspiciousTimeline && insight.suspiciousTimeline.length > 0 ? (
                            insight.suspiciousTimeline.map((payment, idx) => (
                              <div
                                key={idx}
                                className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 hover:border-purple-500/50 transition-all"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-slate-400 text-xs mb-1">
                                      {new Date(payment.transaction_date).toLocaleDateString()}
                                    </p>
                                    <p className="text-white text-sm">Vendor {payment.vendor_id}</p>
                                  </div>
                                  <span className="text-red-400 font-bold">
                                    ₹{payment.amount?.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-400 text-sm">No suspicious timeline data</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-slate-900/30 border-t border-slate-700/50">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-slate-400 text-sm mb-1">High Risk Count</p>
                          <p className="text-2xl font-bold text-red-400">{insight.highRiskCount}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-slate-400 text-sm mb-1">Total Amount</p>
                          <p className="text-2xl font-bold text-green-400">
                            ₹{(insight.totalAmount / 1000000).toFixed(2)}M
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-slate-400 text-sm mb-1">Avg Amount</p>
                          <p className="text-2xl font-bold text-blue-400">
                            ₹{insight.avgAmount?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-slate-400 text-sm mb-1">Anomaly %</p>
                          <p className="text-2xl font-bold text-yellow-400">{insight.anomalyRate.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'simulator' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-green-900/30 to-blue-900/30 backdrop-blur-xl rounded-xl border border-green-500/30 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-8 h-8 text-green-400" />
                    <div>
                      <h2 className="text-2xl font-bold text-white">🎯 What-If Audit Simulator</h2>
                      <p className="text-slate-400">
                        Simulate audit scenarios to optimize workload and maximize fraud detection
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
                  <h3 className="text-xl font-bold text-white mb-6">Simulation Parameters</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-slate-300 mb-2 font-medium">
                        What percentage of transactions should we audit?
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={simulationParams.percentage}
                          onChange={(e) =>
                            setSimulationParams({ ...simulationParams, percentage: parseInt(e.target.value) })
                          }
                          className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <span className="text-2xl font-bold text-white w-20 text-right">
                          {simulationParams.percentage}%
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mt-2">
                        Audit the top {simulationParams.percentage}% riskiest transactions
                      </p>
                    </div>

                    <button
                      onClick={runSimulation}
                      disabled={!analysis || !analysis.results}
                      className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-green-600/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Target className="w-5 h-5" />
                      Run Simulation
                    </button>
                  </div>
                </div>

                {simulationResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 overflow-hidden"
                  >
                    <div className="p-6 bg-gradient-to-r from-green-900/30 to-blue-900/30 border-b border-slate-700/50">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                        Simulation Results
                      </h3>
                      <p className="text-slate-400 mt-1">
                        Auditing top {simulationParams.percentage}% of risky transactions
                      </p>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 p-6 rounded-xl border border-blue-500/30">
                        <div className="flex items-center gap-3 mb-3">
                          <FileText className="w-6 h-6 text-blue-400" />
                          <p className="text-slate-400 text-sm">Transactions to Audit</p>
                        </div>
                        <p className="text-4xl font-bold text-blue-400 mb-2">
                          {simulationResult.auditCount}
                        </p>
                        <p className="text-slate-400 text-sm">
                          Out of {analysis.results.length} total transactions
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 p-6 rounded-xl border border-green-500/30">
                        <div className="flex items-center gap-3 mb-3">
                          <CheckCircle className="w-6 h-6 text-green-400" />
                          <p className="text-slate-400 text-sm">Fraud Coverage</p>
                        </div>
                        <p className="text-4xl font-bold text-green-400 mb-2">
                          {simulationResult.fraudCoveragePercent}%
                        </p>
                        <p className="text-slate-400 text-sm">
                          Catching {simulationResult.highRiskCaught} of {simulationResult.totalHighRisk} high-risk
                          cases
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 p-6 rounded-xl border border-purple-500/30">
                        <div className="flex items-center gap-3 mb-3">
                          <TrendingDown className="w-6 h-6 text-purple-400" />
                          <p className="text-slate-400 text-sm">Workload Reduction</p>
                        </div>
                        <p className="text-4xl font-bold text-purple-400 mb-2">
                          {simulationResult.workloadReduction}%
                        </p>
                        <p className="text-slate-400 text-sm">
                          Saving {simulationResult.transactionsSaved} transactions from audit
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-red-900/30 to-red-800/30 p-6 rounded-xl border border-red-500/30 lg:col-span-3">
                        <div className="flex items-center gap-3 mb-3">
                          <DollarSign className="w-6 h-6 text-red-400" />
                          <p className="text-slate-400 text-sm">Estimated Money at Risk (in audited txns)</p>
                        </div>
                        <p className="text-4xl font-bold text-red-400 mb-2">
                          ₹{parseFloat(simulationResult.estimatedLeakage).toLocaleString()}
                        </p>
                        <p className="text-slate-400 text-sm">
                          Total amount in transactions flagged for audit
                        </p>
                      </div>
                    </div>

                    <div className="p-6 bg-slate-900/30 border-t border-slate-700/50">
                      <div className="flex items-start gap-3">
                        <Brain className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-white font-semibold mb-2">💡 AI Insight:</p>
                          <p className="text-slate-300 text-sm leading-relaxed">
                            {simulationResult.fraudCoveragePercent >= 80
                              ? `Excellent! By auditing only ${simulationParams.percentage}% of transactions, you can catch ${simulationResult.fraudCoveragePercent}% of high-risk cases, reducing audit workload by ${simulationResult.workloadReduction}%. This is a highly efficient audit strategy.`
                              : simulationResult.fraudCoveragePercent >= 60
                              ? `Good coverage. Auditing ${simulationParams.percentage}% of transactions catches ${simulationResult.fraudCoveragePercent}% of fraud. Consider increasing to 15-20% for better coverage.`
                              : `Low fraud coverage at ${simulationResult.fraudCoveragePercent}%. Consider auditing at least 10-15% of transactions to catch majority of high-risk cases.`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-6 border-b border-slate-700/50">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    High-Risk Transactions (Top 50)
                  </h3>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  {analysis.results
                    ?.sort((a, b) => b.riskScore - a.riskScore)
                    .slice(0, 50)
                    .map((result, index) => (
                      <div
                        key={result.payment_uid}
                        className="p-6 border-b border-slate-700/50 hover:bg-slate-700/30 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-slate-500 font-medium">#{index + 1}</span>
                              <p className="text-white font-medium">
                                Transaction: {result.payment_uid}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskLevelColor(
                                  result.riskLevel
                                )}`}
                              >
                                {result.riskLevel} Risk
                              </span>
                              <span
                                className={`text-lg font-bold ${getRiskScoreColor(
                                  result.riskScore
                                )}`}
                              >
                                Score: {result.riskScore}/100
                              </span>
                            </div>
                          </div>
                        </div>

                        {result.aiExplanation && (
                          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-4 mb-4 border border-purple-500/30">
                            <div className="flex items-start gap-3">
                              <Brain className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                              <div>
                                <p className="text-sm text-purple-300 font-semibold mb-2">🤖 AI Analysis:</p>
                                <p className="text-sm text-slate-200 leading-relaxed">{result.aiExplanation}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {result.reasons && result.reasons.length > 0 && (
                          <div className="bg-slate-900/50 rounded-lg p-4 border border-yellow-500/30">
                            <div className="flex items-center gap-2 mb-3">
                              <AlertTriangle className="w-5 h-5 text-yellow-400" />
                              <p className="text-sm text-yellow-400 font-bold">
                                ⚠️ WHY FLAGGED? ({result.reasons.length} Risk Factors)
                              </p>
                            </div>
                            <ul className="space-y-2">
                              {result.reasons.map((reason, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-slate-200 flex items-start gap-3 p-2 bg-slate-800/50 rounded border-l-2 border-red-500"
                                >
                                  <span className="text-red-400 font-bold flex-shrink-0">❗</span>
                                  <span className="flex-1">{reason}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="mt-4 pt-4 border-t border-slate-700">
                              <p className="text-xs text-slate-400 flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4" />
                                <span className="font-semibold">Action:</span>
                                {result.riskScore >= 70
                                  ? 'Immediate audit recommended'
                                  : result.riskScore >= 40
                                  ? 'Schedule detailed review'
                                  : 'Continue routine monitoring'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Transactions</h2>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-blue-500 mb-4"></div>
              <p className="text-slate-400">Loading transactions...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                        Transaction ID
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                        Department
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                        Vendor
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                        Payment Mode
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction._id}
                        className="hover:bg-slate-700/30 transition-all"
                      >
                        <td className="px-6 py-4 text-sm text-white font-medium">
                          {transaction.transaction_id}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {new Date(transaction.transactionDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {transaction.department?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {transaction.vendor?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-green-400 font-semibold">
                          ₹{transaction.payment?.amount?.toLocaleString() || '0'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {transaction.payment?.paymentMode || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.pages > 1 && (
                <div className="p-6 border-t border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400">
                      Showing {(currentPage - 1) * pagination.limit + 1} to{' '}
                      {Math.min(currentPage * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} transactions
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => p - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage((p) => p + 1)}
                        disabled={currentPage === pagination.pages}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default TransactionDetails;
