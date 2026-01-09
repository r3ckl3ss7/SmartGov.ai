import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Upload as UploadIcon, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import Layout from '../components/Layout';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setError('');
      } else {
        setError('Please upload a CSV file');
      }
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Please upload a CSV file');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');
    setUploadResult(null);

    const formData = new FormData();
    formData.append('dataset', file);

    try {
      const { data } = await axios.post(
        'http://localhost:3000/api/v1/admin/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setUploadResult(data);
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Upload Dataset</h1>
          <p className="text-slate-400">
            Upload CSV files containing transaction data for anomaly detection
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-8 mb-6"
        >
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-600 hover:border-slate-500'
            }`}
          >
            <div className="flex flex-col items-center">
              <div
                className={`mb-6 p-6 rounded-full transition-all ${
                  dragActive ? 'bg-blue-600 scale-110' : 'bg-slate-700'
                }`}
              >
                <UploadIcon className="w-12 h-12 text-white" />
              </div>

              {file ? (
                <div className="mb-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700 flex items-center gap-4">
                  <FileText className="w-8 h-8 text-blue-400" />
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium">{file.name}</p>
                    <p className="text-sm text-slate-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-all"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Drop your CSV file here
                  </h3>
                  <p className="text-slate-400 mb-6">or click to browse</p>
                </>
              )}

              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg cursor-pointer transition-all"
              >
                Select File
              </label>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-400"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}

          {file && !uploading && !uploadResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 flex justify-center"
            >
              <button
                onClick={handleUpload}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all shadow-lg shadow-green-600/30"
              >
                Upload and Process
              </button>
            </motion.div>
          )}

          {uploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 text-center"
            >
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-blue-500 mb-4"></div>
              <p className="text-slate-400">Processing your file...</p>
            </motion.div>
          )}
        </motion.div>

        {uploadResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-600 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Upload Successful
                </h3>
                <p className="text-slate-400">{uploadResult.file.filename}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">Total Rows</p>
                <p className="text-2xl font-bold text-white">
                  {uploadResult.stats.totalRows}
                </p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">Valid Rows</p>
                <p className="text-2xl font-bold text-green-400">
                  {uploadResult.stats.validRows}
                </p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">New Transactions</p>
                <p className="text-2xl font-bold text-blue-400">
                  {uploadResult.stats.newTransactions}
                </p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">Duplicates</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {uploadResult.stats.duplicateTransactions}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => navigate(`/history/${uploadResult.file.id}`)}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all"
              >
                View Transactions
              </button>
              <button
                onClick={() => {
                  setUploadResult(null);
                  setFile(null);
                }}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all"
              >
                Upload Another
              </button>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6"
        >
          <h4 className="text-lg font-semibold text-blue-400 mb-3">
            CSV Format Requirements
          </h4>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>
                Required columns: transaction_id, amount, department, vendor_id,
                transaction_date, payment_mode, purpose
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Date format: YYYY-MM-DD</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>File size limit: 50MB</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Upload;
