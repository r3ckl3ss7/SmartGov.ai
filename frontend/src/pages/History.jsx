import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  FileText,
  Calendar,
  Database,
  ChevronRight,
  Search,
  Filter,
} from 'lucide-react';
import Layout from '../components/Layout';

const History = () => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUploads();
  }, [pagination.page]);

  const fetchUploads = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/admin/uploads`, {
        params: {
          page: pagination.page,
          limit: pagination.limit,
        },
      });

      setUploads(data.uploads);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching uploads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUploads = uploads.filter((upload) =>
    upload.originalName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'processing':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Upload History</h1>
          <p className="text-slate-400">
            View and manage all uploaded datasets
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by filename..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 overflow-hidden"
        >
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-blue-500 mb-4"></div>
              <p className="text-slate-400">Loading uploads...</p>
            </div>
          ) : filteredUploads.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No uploads found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredUploads.map((upload, index) => (
                <motion.div
                  key={upload._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-slate-700/30 transition-all cursor-pointer"
                  onClick={() => navigate(`/history/${upload._id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="bg-blue-600/20 p-4 rounded-lg">
                        <Database className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            {upload.originalName}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              upload.status
                            )}`}
                          >
                            {upload.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(upload.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {upload.stats?.totalRows || 0} rows
                          </div>
                          <div className="flex items-center gap-1">
                            <Database className="w-4 h-4" />
                            {upload.stats?.newTransactions || 0} transactions
                          </div>
                        </div>
                        {upload.stats && (
                          <div className="mt-3 flex gap-3">
                            <div className="text-sm">
                              <span className="text-slate-400">Processed: </span>
                              <span className="text-green-400 font-medium">
                                {upload.stats.processedRows}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="text-slate-400">Duplicates: </span>
                              <span className="text-yellow-400 font-medium">
                                {upload.stats.duplicateTransactions}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="text-slate-400">Rejected: </span>
                              <span className="text-red-400 font-medium">
                                {upload.stats.rejectedRows}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-slate-400" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && pagination.pages > 1 && (
            <div className="p-6 border-t border-slate-700/50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                    }
                    disabled={pagination.page === 1}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                    }
                    disabled={pagination.page === pagination.pages}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default History;
