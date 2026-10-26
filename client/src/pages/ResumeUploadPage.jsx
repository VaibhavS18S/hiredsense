import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Layers,
  ShieldCheck,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { ScoreBadge } from '../components/common/ScoreBadge';

export const ResumeUploadPage = () => {
  const [searchParams] = useSearchParams();
  const preselectedJobId = searchParams.get('jobId') || '';
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(preselectedJobId);
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPipelineStage, setCurrentPipelineStage] = useState(0);
  const [uploadResults, setUploadResults] = useState(null);
  const fileInputRef = useRef(null);

  const PIPELINE_STAGES = [
    'Upload & Validation',
    'Text Extraction',
    'Entity Parsing',
    'Skill Identification',
    'Job Matching & Scoring',
    'Recruiter Review Ready',
  ];

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs');
      if (res.success) {
        setJobs(res.data || []);
        if (!selectedJob && res.data.length > 0) {
          setSelectedJob(res.data[0]._id);
        }
      }
    } catch (e) {}
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addValidFiles(droppedFiles);
  };

  const handleFileInput = (e) => {
    const selected = Array.from(e.target.files);
    addValidFiles(selected);
  };

  const addValidFiles = (incoming) => {
    const valid = incoming.filter((f) => {
      const ext = f.name.toLowerCase();
      return ext.endsWith('.pdf') || ext.endsWith('.docx') || ext.endsWith('.txt');
    });

    if (valid.length < incoming.length) {
      alert('Some files were ignored because only PDF, DOCX, and TXT are supported.');
    }

    setFiles((prev) => [...prev, ...valid]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProcessUpload = async () => {
    if (files.length === 0) {
      alert('Please select at least one resume file to upload.');
      return;
    }

    setIsProcessing(true);
    setUploadResults(null);

    // Simulate animated pipeline progression stages
    const stageInterval = setInterval(() => {
      setCurrentPipelineStage((prev) => (prev < 4 ? prev + 1 : prev));
    }, 700);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('resumes', file);
    });
    if (selectedJob) {
      formData.append('jobId', selectedJob);
    }

    try {
      const res = await api.upload('/resumes/upload', formData);
      clearInterval(stageInterval);
      setCurrentPipelineStage(5); // Complete

      if (res.success) {
        setUploadResults(res.data);
      }
    } catch (err) {
      clearInterval(stageInterval);
      alert(err.message || 'Error occurred during resume processing');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-forest-700">
          Smart Resume Processing Center
        </span>
        <h1 className="font-editorial text-3xl font-bold text-ink mt-0.5">
          Bulk Resume Intake & Screening Pipeline
        </h1>
        <p className="text-xs text-ink-muted mt-1">
          Ingest PDF & DOCX resumes with automatic entity parsing, skill mapping, duplicate detection, and explainable scoring.
        </p>
      </div>

      {/* Target Job Selector Banner */}
      <div className="surface-card rounded-2xl p-5 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <label className="block text-xs font-semibold text-ink mb-1">
            Match Resumes Against Target Opening (Optional):
          </label>
          <span className="text-[11px] text-ink-muted">
            Uploaded candidates will be immediately scored against this role's mandatory skills and semantic requirements.
          </span>
        </div>

        <select
          value={selectedJob}
          onChange={(e) => setSelectedJob(e.target.value)}
          className="bg-white border border-border rounded-lg text-xs font-medium text-ink px-3 py-2 focus:outline-none focus:border-forest-500 shadow-subtle min-w-[260px]"
        >
          <option value="">Do not match immediately (Ingest to Pool only)</option>
          {jobs.map((j) => (
            <option key={j._id} value={j._id}>
              {j.title} ({j.department})
            </option>
          ))}
        </select>
      </div>

      {/* Processing Pipeline Stage Stepper */}
      <div className="surface-card rounded-2xl p-5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle block mb-3">
          HireSense Screening Pipeline Architecture
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isCompleted = isProcessing ? currentPipelineStage > idx : uploadResults !== null;
            const isCurrent = isProcessing && currentPipelineStage === idx;

            return (
              <div
                key={stage}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-forest-50 border-forest-500 ring-2 ring-forest-200'
                    : isCompleted
                    ? 'bg-sage-50 border-sage-300 text-forest-800'
                    : 'bg-[#FBFBF9] border-border text-ink-subtle'
                }`}
              >
                <div className="flex items-center justify-center mb-1">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-forest-600" />
                  ) : isCurrent ? (
                    <RefreshCw className="w-4 h-4 text-forest-600 animate-spin" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-ink-subtle text-[10px] flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-medium block leading-tight">{stage}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drag & Drop Zone */}
      {!uploadResults && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-forest-500 bg-forest-50/50'
              : 'border-border hover:border-forest-400 bg-white'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            onChange={handleFileInput}
            className="hidden"
          />

          <div className="w-14 h-14 rounded-2xl bg-sage-100 text-forest-700 flex items-center justify-center mx-auto mb-4 shadow-subtle">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h3 className="font-editorial text-xl font-bold text-ink mb-1">
            Drag and drop resume documents here
          </h3>
          <p className="text-xs text-ink-muted max-w-md mx-auto mb-3">
            Supports batch upload of up to 15 resumes at once (PDF, DOCX, TXT up to 15MB each). Duplicate documents are automatically detected via SHA-256 fingerprinting.
          </p>

          <button
            type="button"
            className="text-xs px-4 py-2 bg-sage-50 text-forest-800 border border-sage-300 rounded-lg font-medium hover:bg-sage-100 transition-colors"
          >
            Browse files on computer
          </button>
        </div>
      )}

      {/* Selected Files Staging List */}
      {files.length > 0 && !uploadResults && (
        <div className="surface-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink">
              Selected Files ({files.length})
            </span>
            <button
              onClick={() => setFiles([])}
              className="text-xs text-ink-subtle hover:text-red-700"
            >
              Clear all
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#FBFBF9] border border-border text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-forest-600 shrink-0" />
                  <span className="font-medium text-ink truncate">{file.name}</span>
                  <span className="text-[10px] text-ink-subtle shrink-0">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="text-ink-subtle hover:text-red-700 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleProcessUpload}
              disabled={isProcessing}
              className="px-5 py-2.5 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-xs font-medium flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing Batch...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start AI Screening ({files.length} Resumes)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Upload Results & Candidate Cards */}
      {uploadResults && (
        <div className="surface-card rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="font-editorial text-xl font-bold text-ink">
                Batch Screening Results
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Successfully processed {uploadResults.processed?.length || 0} candidate(s).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setFiles([]);
                  setUploadResults(null);
                }}
                className="px-3.5 py-1.5 border border-border bg-white rounded-lg text-xs font-medium text-ink hover:bg-sage-50 transition-colors"
              >
                Upload Another Batch
              </button>
              {selectedJob && (
                <Link
                  to={`/pipeline?jobId=${selectedJob}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-forest-500 text-white rounded-lg text-xs font-medium shadow-sm hover:bg-forest-600 transition-colors"
                >
                  <span>View in Pipeline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>

          {/* Processed Candidates List */}
          <div className="space-y-3">
            {(uploadResults.processed || []).map((item, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border border-border bg-[#FDFCFA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-forest-300 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-ink">
                      {item.candidate?.name}
                    </span>
                    {item.isDuplicate && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                        Duplicate File Detected
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded bg-sage-50 text-forest-700 border border-sage-200 font-mono">
                      {item.candidate?.skillsCount || 0} skills extracted
                    </span>
                  </div>
                  <span className="text-xs text-ink-muted">
                    {item.candidate?.email} &bull; File: <span className="font-mono text-[11px]">{item.file}</span>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {item.matchResult ? (
                    <ScoreBadge score={item.matchResult.overallScore} showLabel={true} />
                  ) : (
                    <span className="text-xs text-ink-subtle italic">Saved to Pool</span>
                  )}
                  <Link
                    to={`/candidates/${item.candidate?._id}`}
                    className="text-xs text-forest-600 hover:text-forest-800 font-medium whitespace-nowrap"
                  >
                    View Profile &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Failed files if any */}
          {(uploadResults.failed || []).length > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900">
              <span className="font-semibold block mb-1">
                Failed to process {uploadResults.failed.length} file(s):
              </span>
              <ul className="space-y-1 list-disc list-inside text-red-800 text-[11px]">
                {uploadResults.failed.map((f, i) => (
                  <li key={i}>
                    {f.file}: {f.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
