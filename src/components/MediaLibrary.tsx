import React, { useState, useEffect, useRef } from 'react';
import { 
  uploadMedia, 
  getMedia, 
  updateMedia, 
  deleteMedia,
  addMediaRelationships,
  removeMediaRelationships,
  type MediaItem,
  type UploadMediaRequest,
  formatFileSize,
  isImage,
  isVideo,
  isAudio
} from '../utils/media-library';

interface MediaLibraryProps {
  onMediaSelect?: (media: MediaItem) => void;
  allowUpload?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
  filterBy?: {
    eventIds?: string[];
    categoryIds?: string[];
    finalistIds?: string[];
    sponsorIds?: string[];
    tagIds?: string[];
  };
  mimeTypes?: string[];
  searchTerm?: string;
  limit?: number;
}

export default function MediaLibrary({
  onMediaSelect,
  allowUpload = true,
  allowEdit = true,
  allowDelete = true,
  filterBy,
  mimeTypes,
  searchTerm,
  limit = 50
}: MediaLibraryProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchTerm || '');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    altText: '',
    title: '',
    description: '',
    isPublic: true,
    eventIds: [] as string[],
    categoryIds: [] as string[],
    finalistIds: [] as string[],
    sponsorIds: [] as string[],
    tagIds: [] as string[]
  });

  const [editForm, setEditForm] = useState({
    altText: '',
    title: '',
    description: '',
    isPublic: true
  });

  // Load media on component mount and when filters change
  useEffect(() => {
    loadMedia();
  }, [currentPage, searchQuery, filterBy, mimeTypes]);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const result = await getMedia({
        ...filterBy,
        mimeTypes,
        searchTerm: searchQuery || undefined,
        limit,
        offset: currentPage * limit
      });

      if (result.success && result.media) {
        setMedia(result.media);
        setTotalCount(result.totalCount || 0);
      } else {
        console.error('Failed to load media:', result.error);
      }
    } catch (error) {
      console.error('Error loading media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadForm(prev => ({ ...prev, file }));
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file) return;

    setUploading(true);
    try {
      const uploadRequest: UploadMediaRequest = {
        file: uploadForm.file,
        altText: uploadForm.altText,
        title: uploadForm.title,
        description: uploadForm.description,
        isPublic: uploadForm.isPublic,
        eventIds: uploadForm.eventIds.length > 0 ? uploadForm.eventIds : undefined,
        categoryIds: uploadForm.categoryIds.length > 0 ? uploadForm.categoryIds : undefined,
        finalistIds: uploadForm.finalistIds.length > 0 ? uploadForm.finalistIds : undefined,
        sponsorIds: uploadForm.sponsorIds.length > 0 ? uploadForm.sponsorIds : undefined,
        tagIds: uploadForm.tagIds.length > 0 ? uploadForm.tagIds : undefined,
      };

      const result = await uploadMedia(uploadRequest);
      
      if (result.success) {
        setShowUploadModal(false);
        setUploadForm({
          file: null,
          altText: '',
          title: '',
          description: '',
          isPublic: true,
          eventIds: [],
          categoryIds: [],
          finalistIds: [],
          sponsorIds: [],
          tagIds: []
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        loadMedia(); // Reload media list
      } else {
        alert(`Upload failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedMedia) return;

    try {
      const result = await updateMedia(selectedMedia.id, editForm);
      
      if (result.success) {
        setShowEditModal(false);
        setSelectedMedia(null);
        loadMedia(); // Reload media list
      } else {
        alert(`Update failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Edit error:', error);
      alert('Update failed');
    }
  };

  const handleDelete = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this media?')) return;

    try {
      const result = await deleteMedia(mediaId);
      
      if (result.success) {
        loadMedia(); // Reload media list
      } else {
        alert(`Delete failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete failed');
    }
  };

  const openEditModal = (media: MediaItem) => {
    setSelectedMedia(media);
    setEditForm({
      altText: media.alt_text || '',
      title: media.title || '',
      description: media.description || '',
      isPublic: true // You might want to add this field to MediaItem
    });
    setShowEditModal(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    loadMedia();
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="media-library">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Media Library</h2>
        {allowUpload && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Upload Media
          </button>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search media..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded"
          />
          <button
            type="submit"
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Search
          </button>
        </div>
      </form>

      {/* Media Grid */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {media.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Media Preview */}
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                {isImage(item.mime_type) ? (
                  <img
                    src={item.file_url}
                    alt={item.alt_text || item.title || item.original_filename}
                    className="w-full h-full object-cover"
                  />
                ) : isVideo(item.mime_type) ? (
                  <video
                    src={item.file_url}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : isAudio(item.mime_type) ? (
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎵</div>
                    <div className="text-sm text-gray-600">Audio</div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-4xl mb-2">📄</div>
                    <div className="text-sm text-gray-600">{item.file_extension?.toUpperCase()}</div>
                  </div>
                )}
              </div>

              {/* Media Info */}
              <div className="p-3">
                <div className="text-sm font-medium truncate" title={item.title || item.original_filename}>
                  {item.title || item.original_filename}
                </div>
                <div className="text-xs text-gray-500">
                  {formatFileSize(item.file_size)}
                </div>
                {item.alt_text && (
                  <div className="text-xs text-gray-600 mt-1 truncate" title={item.alt_text}>
                    {item.alt_text}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-3 border-t border-gray-200 flex gap-1">
                {onMediaSelect && (
                  <button
                    onClick={() => onMediaSelect(item)}
                    className="flex-1 bg-blue-500 text-white text-xs px-2 py-1 rounded hover:bg-blue-600"
                  >
                    Select
                  </button>
                )}
                {allowEdit && (
                  <button
                    onClick={() => openEditModal(item)}
                    className="bg-yellow-500 text-white text-xs px-2 py-1 rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                )}
                {allowDelete && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1">
              {currentPage + 1} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage >= totalPages - 1}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Upload Media</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Alt Text</label>
                <input
                  type="text"
                  value={uploadForm.altText}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, altText: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={3}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={uploadForm.isPublic}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="isPublic" className="text-sm">Public</label>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!uploadForm.file || uploading}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Edit Media</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Alt Text</label>
                <input
                  type="text"
                  value={editForm.altText}
                  onChange={(e) => setEditForm(prev => ({ ...prev, altText: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={3}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editIsPublic"
                  checked={editForm.isPublic}
                  onChange={(e) => setEditForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="editIsPublic" className="text-sm">Public</label>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
