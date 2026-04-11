import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  Video,
  Upload,
  Play,
  Pause,
  Trash2,
  Loader2,
  Globe,
  Lock,
  Eye,
  Clock,
  Plus,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { videoResumeAPI } from '../lib/api';

const VideoResume = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    video_type: 'cover_letter',
    is_public: false
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const response = await videoResumeAPI.getMyVideos();
      if (response.data) {
        setVideos(response.data);
      }
    } catch (error) {
      console.error('Load videos error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('video/')) {
        toast.error('Please select a video file');
        return;
      }
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error('Video size must be less than 50MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Please select a video file');
      return;
    }
    
    if (!uploadForm.title) {
      toast.error('Please enter a title');
      return;
    }

    setUploading(true);
    try {
      await videoResumeAPI.upload({
        ...uploadForm,
        file
      });
      toast.success('Video uploaded successfully!');
      setUploadForm({
        title: '',
        description: '',
        video_type: 'cover_letter',
        is_public: false
      });
      setFile(null);
      loadVideos();
      
      // Reset file input
      const fileInput = document.getElementById('video-upload');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (videoId) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    
    try {
      await videoResumeAPI.delete(videoId);
      toast.success('Video deleted successfully');
      loadVideos();
      if (selectedVideo && selectedVideo.id === videoId) {
        setSelectedVideo(null);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete video');
    }
  };

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(dateString));
  };

  const videoTypes = [
    { value: 'cover_letter', label: 'Cover Letter' },
    { value: 'self_introduction', label: 'Self Introduction' },
    { value: 'portfolio', label: 'Portfolio Showcase' },
    { value: 'other', label: 'Other' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center">
            <Video className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[var(--text-main)]">
              {t('video_resume') || 'Video Resume'}
            </h1>
            <p className="text-[var(--text-muted)] font-medium">
              {t('video_resume_subtitle') || 'Create and manage your video resumes'}
            </p>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-8">
        <h3 className="text-xl font-black text-[var(--text-main)] mb-6 flex items-center gap-3">
          <Upload className="w-5 h-5 text-purple-500" />
          {t('upload_new_video') || 'Upload New Video'}
        </h3>
        
        <form onSubmit={handleUpload} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">
                {t('title') || 'Title'} *
              </label>
              <input
                type="text"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                placeholder={t('enter_video_title') || 'Enter video title'}
                className="w-full px-5 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-medium focus:outline-none focus:border-purple-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">
                {t('video_type') || 'Video Type'}
              </label>
              <select
                value={uploadForm.video_type}
                onChange={(e) => setUploadForm({ ...uploadForm, video_type: e.target.value })}
                className="w-full px-5 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-medium focus:outline-none focus:border-purple-500"
              >
                {videoTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">
              {t('description') || 'Description'}
            </label>
            <textarea
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              placeholder={t('enter_description') || 'Enter description (optional)'}
              rows={3}
              className="w-full px-5 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-medium focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">
                {t('video_file') || 'Video File'} *
              </label>
              <input
                id="video-upload"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="w-full px-5 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-medium focus:outline-none focus:border-purple-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-purple-600 file:text-white file:cursor-pointer"
              />
              <p className="text-xs text-[var(--text-muted)] mt-2">
                Max size: 50MB. Supported formats: MP4, MOV, AVI, WebM
              </p>
            </div>

            <div className="flex items-center gap-6 pt-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={uploadForm.is_public}
                  onChange={(e) => setUploadForm({ ...uploadForm, is_public: e.target.checked })}
                  className="w-5 h-5 rounded border-[var(--border-main)] text-purple-500 focus:ring-purple-500"
                />
                <span className="text-[var(--text-main)] font-medium flex items-center gap-2">
                  {uploadForm.is_public ? <Globe className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-gray-500" />}
                  {t('make_public') || 'Make Public'}
                </span>
              </label>
            </div>
          </div>

          {file && (
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5 text-purple-500" />
                <span className="text-purple-400 font-medium">{file.name}</span>
                <span className="text-purple-400/60 text-sm">
                  ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  document.getElementById('video-upload').value = '';
                }}
                className="text-purple-400 hover:text-red-400"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || !file || !uploadForm.title}
            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-colors flex items-center gap-3"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
            {t('upload_video') || 'Upload Video'}
          </button>
        </form>
      </div>

      {/* Video List */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-8">
        <h3 className="text-xl font-black text-[var(--text-main)] mb-6 flex items-center gap-3">
          <Video className="w-5 h-5 text-purple-500" />
          {t('my_videos') || 'My Videos'}
          <span className="text-sm font-medium text-[var(--text-muted)]">
            ({videos.length})
          </span>
        </h3>

        {videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div
                key={video.id}
                className="bg-[var(--bg-main)] rounded-2xl border border-[var(--border-main)] overflow-hidden hover:border-purple-500/50 transition-all cursor-pointer"
                onClick={() => setSelectedVideo(video)}
              >
                {/* Video Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-purple-900/50 to-indigo-900/50 flex items-center justify-center">
                  <Play className="w-16 h-16 text-white/80" />
                  
                  {/* Type Badge */}
                  <div className="absolute top-3 left-3 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full">
                    <span className="text-xs font-bold text-white">
                      {videoTypes.find(v => v.value === video.video_type)?.label || video.video_type}
                    </span>
                  </div>
                  
                  {/* Public/Private Badge */}
                  <div className="absolute top-3 right-3">
                    {video.is_public ? (
                      <div className="px-2 py-1 bg-green-500/80 rounded-full flex items-center gap-1">
                        <Globe className="w-3 h-3 text-white" />
                        <span className="text-xs font-bold text-white">Public</span>
                      </div>
                    ) : (
                      <div className="px-2 py-1 bg-gray-500/80 rounded-full flex items-center gap-1">
                        <Lock className="w-3 h-3 text-white" />
                        <span className="text-xs font-bold text-white">Private</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Video Info */}
                <div className="p-5">
                  <h4 className="font-bold text-[var(--text-main)] mb-2 line-clamp-1">{video.title}</h4>
                  {video.description && (
                    <p className="text-sm text-[var(--text-muted)] mb-3 line-clamp-2">{video.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(video.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {video.view_count || 0} views
                    </span>
                  </div>
                </div>

                {/* Delete Button */}
                <div className="p-3 border-t border-[var(--border-main)]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(video.id);
                    }}
                    className="w-full py-2 text-red-400 font-bold text-sm hover:bg-red-500/10 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-[var(--bg-main)] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-[var(--text-muted)]" />
            </div>
            <h3 className="text-xl font-black text-[var(--text-main)] mb-2">
              {t('no_videos') || 'No Videos Yet'}
            </h3>
            <p className="text-[var(--text-muted)]">
              {t('upload_first_video') || 'Upload your first video resume to get started'}
            </p>
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8" onClick={() => setSelectedVideo(null)}>
          <div className="bg-[var(--bg-surface)] rounded-[2rem] p-8 max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-[var(--text-main)]">{selectedVideo.title}</h3>
              <button
                onClick={() => setSelectedVideo(null)}
                className="p-2 hover:bg-[var(--bg-main)] rounded-xl transition-colors"
              >
                <Trash2 className="w-6 h-6 text-[var(--text-muted)]" />
              </button>
            </div>
            
            <div className="aspect-video bg-black rounded-2xl mb-6 relative">
              <video
                className="w-full h-full rounded-2xl"
                controls
                autoPlay={isPlaying}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                <source src={`http://127.0.0.1:8000/uploads/videos/${selectedVideo.file_path?.split('/').pop()}`} type="video/mp4" />
                Your browser does not support video playback.
              </video>
            </div>
            
            {selectedVideo.description && (
              <div className="mb-6">
                <h4 className="text-sm font-bold text-[var(--text-muted)] mb-2">Description</h4>
                <p className="text-[var(--text-main)]">{selectedVideo.description}</p>
              </div>
            )}
            
            <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Created: {formatDate(selectedVideo.created_at)}
              </span>
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                {selectedVideo.view_count || 0} views
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoResume;