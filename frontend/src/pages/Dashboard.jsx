import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  FileText,
  AlertTriangle,
  TrendingUp,
  Database,
  Upload,
  History,
  ArrowRight,
} from 'lucide-react';
import Layout from '../components/Layout';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUploads: 0,
    totalTransactions: 0,
    highRiskCount: 0,
    recentUploads: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data } = await axios.get('http://localhost:3000/api/v1/admin/uploads', {
        params: { page: 1, limit: 5 },
      });

      setStats({
        totalUploads: data.pagination.total,
        totalTransactions: data.uploads.reduce(
          (sum, upload) => sum + (upload.stats?.newTransactions || 0),
          0
        ),
        highRiskCount: 0,
        recentUploads: data.uploads,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Datasets',
      value: stats.totalUploads,
      icon: Database,
      color: 'blue',
      bgGradient: 'from-blue-500/20 to-blue-600/20',
      iconBg: 'bg-blue-600',
    },
    {
      title: 'Transactions Analyzed',
      value: stats.totalTransactions.toLocaleString(),
      icon: FileText,
      color: 'purple',
      bgGradient: 'from-purple-500/20 to-purple-600/20',
      iconBg: 'bg-purple-600',
    },
    {
      title: 'High Risk Detected',
      value: stats.highRiskCount,
      icon: AlertTriangle,
      color: 'red',
      bgGradient: 'from-red-500/20 to-red-600/20',
      iconBg: 'bg-red-600',
    },
    {
      title: 'Detection Rate',
      value: '94.2%',
      icon: TrendingUp,
      color: 'green',
      bgGradient: 'from-green-500/20 to-green-600/20',
      iconBg: 'bg-green-600',
    },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">
            Monitor your audit analytics and anomaly detection
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gradient-to-br ${stat.bgGradient} backdrop-blur-xl rounded-xl p-6 border border-slate-700/50`}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`${stat.iconBg} p-3 rounded-lg shadow-lg shadow-${stat.color}-600/30`}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-slate-400 text-sm mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          <Link
            to="/upload"
            className="group bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 hover:border-blue-500/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Upload New Dataset
                </h3>
                <p className="text-slate-400">
                  Upload CSV files for anomaly detection
                </p>
              </div>
              <div className="bg-blue-600 p-4 rounded-lg group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6 text-white" />
              </div>
            </div>
          </Link>

          <Link
            to="/history"
            className="group bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 hover:border-purple-500/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  View Upload History
                </h3>
                <p className="text-slate-400">
                  Access all uploaded datasets and results
                </p>
              </div>
              <div className="bg-purple-600 p-4 rounded-lg group-hover:scale-110 transition-transform">
                <History className="w-6 h-6 text-white" />
              </div>
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Recent Uploads</h2>
              <Link
                to="/history"
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8 text-slate-400">Loading...</div>
            ) : stats.recentUploads.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No uploads yet. Upload your first dataset to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentUploads.map((upload) => (
                  <div
                    key={upload._id}
                    className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-600/20 p-3 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {upload.originalName}
                        </p>
                        <p className="text-sm text-slate-400">
                          {new Date(upload.createdAt).toLocaleDateString()} •{' '}
                          {upload.stats?.newTransactions || 0} transactions
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/history/${upload._id}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2"
                    >
                      View Details
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Dashboard;
