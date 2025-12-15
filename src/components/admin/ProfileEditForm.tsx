import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { FileUpload } from '../ui/FileUpload';

interface ProfileData {
  firstName: string;
  lastName: string;
  profilePhotoUrl: string | null;
  jobTitle?: string;
}

interface ProfileEditFormProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSave?: (data: ProfileData) => Promise<void>;
  initialData?: ProfileData;
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  onSave: propOnSave,
  initialData: propInitialData,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for custom event to open modal
  useEffect(() => {
    const handleOpenModal = async (event: CustomEvent) => {
      const data = event.detail;
      
      // Fetch latest profile data
      try {
        const response = await fetch('/api/profile/');
        if (response.ok) {
          const profile = await response.json();
          setFirstName(profile.firstName || '');
          setLastName(profile.lastName || '');
          setJobTitle(profile.jobTitle || '');
          setProfilePhotoUrl(profile.profilePhotoUrl || null);
          setProfilePhoto(null);
        } else {
          // Use data from event if fetch fails
          if (data) {
            setFirstName(data.firstName || '');
            setLastName(data.lastName || '');
            setJobTitle(data.jobTitle || '');
            setProfilePhotoUrl(data.profilePhotoUrl || null);
            setProfilePhoto(null);
          }
        }
      } catch (err) {
        // Use data from event if fetch fails
        if (data) {
          setFirstName(data.firstName || '');
          setLastName(data.lastName || '');
          setJobTitle(data.jobTitle || '');
          setProfilePhotoUrl(data.profilePhotoUrl || null);
          setProfilePhoto(null);
        }
      }
      
      setIsOpen(true);
    };

    window.addEventListener('openProfileModal', handleOpenModal as EventListener);
    return () => {
      window.removeEventListener('openProfileModal', handleOpenModal as EventListener);
    };
  }, []);

  // Initialize form with initial data (for prop-based usage)
  useEffect(() => {
    if (propInitialData) {
      setFirstName(propInitialData.firstName || '');
      setLastName(propInitialData.lastName || '');
      setJobTitle(propInitialData.jobTitle || '');
      setProfilePhotoUrl(propInitialData.profilePhotoUrl || null);
      setProfilePhoto(null);
    }
    if (propIsOpen !== undefined) {
      setIsOpen(propIsOpen);
    }
  }, [propInitialData, propIsOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let photoUrl = profilePhotoUrl;

      // Upload new photo if selected
      if (profilePhoto) {
        // Convert file to base64 using chunked approach (avoids stack overflow for large files)
        const fileBuffer = await profilePhoto.arrayBuffer();
        const uint8Array = new Uint8Array(fileBuffer);
        
        // Process in chunks to avoid "Maximum call stack size exceeded" error
        let base64File = '';
        const chunkSize = 8192; // Process 8KB at a time
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.subarray(i, i + chunkSize);
          base64File += String.fromCharCode.apply(null, chunk as unknown as number[]);
        }
        base64File = btoa(base64File);

        const uploadResponse = await fetch('/api/media/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file: base64File,
            filename: profilePhoto.name,
            mimeType: profilePhoto.type,
            title: `Profile photo - ${firstName} ${lastName}`,
            altText: `Profile photo of ${firstName} ${lastName}`,
            isPublic: true,
          }),
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Failed to upload image');
        }

        const uploadData = await uploadResponse.json();
        photoUrl = uploadData.fileUrl;
      }

      // Save profile via API
      const saveResponse = await fetch('/api/profile/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          jobTitle: jobTitle.trim(),
          profilePhotoUrl: photoUrl,
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }

      // Call prop onSave if provided
      if (propOnSave) {
        await propOnSave({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          jobTitle: jobTitle.trim(),
          profilePhotoUrl: photoUrl,
        });
      }

      // Dispatch event to refresh profile display
      window.dispatchEvent(new CustomEvent('profileSaved'));

      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setProfilePhoto(null);
      setIsOpen(false);
      if (propOnClose) {
        propOnClose();
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Profile" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        <div>
          <label
            htmlFor="jobTitle"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Job Title (for email sender info)
          </label>
          <input
            type="text"
            id="jobTitle"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Awards Director"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500">
            This appears under your name in XR Awards communication emails.
          </p>
        </div>

        <div>
          <FileUpload
            label="Profile Photo"
            accept="image/*"
            maxSize={5 * 1024 * 1024} // 5MB
            value={profilePhoto}
            onChange={(file) => {
              setProfilePhoto(file);
              if (file) {
                setProfilePhotoUrl(null); // Clear old URL when new file is selected
              }
            }}
            onError={(err) => setError(err)}
            disabled={loading}
            enableCropping={true}
            aspectRatio={1}
            cropShape="circle"
            enableResizing={true}
            maxWidth={400}
            maxHeight={400}
            quality={0.9}
          />
          {profilePhotoUrl && !profilePhoto && (
            <div className="mt-2">
              <p className="text-sm text-gray-500 mb-2">Current photo:</p>
              <img 
                src={profilePhotoUrl} 
                alt="Current profile" 
                className="w-16 h-16 rounded-full object-cover"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProfileEditForm;

