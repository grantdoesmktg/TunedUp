import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { Build, User } from '../types';
import { GearIcon } from './icons/GearIcon';
import { UserIcon } from './icons/UserIcon';
import { CameraIcon } from './icons/CameraIcon';
import { MapPinIcon } from './icons/MapPinIcon';
import { GARAGE_STATUS_OPTIONS } from '../constants';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';

interface ProfileProps {
  user: User;
  builds: Build[];
  whatsNextText: string;
  onWhatsNextChange: (text: string) => void;
  onLoadBuild: (build: Build) => void;
  onDeleteBuild: (id: string) => void;
  onNavigateToForm: () => void;
  onProfileUpdate: (updatedFields: Partial<User>) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, builds, onLoadBuild, onDeleteBuild, onNavigateToForm, onProfileUpdate }) => {
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  
  const [bio, setBio] = useState(user.bio || '');
  const [location, setLocation] = useState(user.location || '');
  const [garageStatus, setGarageStatus] = useState(user.garageStatus || GARAGE_STATUS_OPTIONS[0]);

  // State for image cropper
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropAspectRatio, setCropAspectRatio] = useState(1);
  const [imageTypeToCrop, setImageTypeToCrop] = useState<'profile' | 'banner' | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      onProfileUpdate({ bio, location, garageStatus });
    }, 1000); // Debounce updates
    return () => clearTimeout(handler);
  }, [bio, location, garageStatus]);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, imageType: 'profile' | 'banner') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        if (loadEvent.target?.result) {
          setImageToCrop(loadEvent.target.result as string);
          setImageTypeToCrop(imageType);
          setCropAspectRatio(imageType === 'profile' ? 1 / 1 : 3 / 1);
        }
      };
      reader.readAsDataURL(file);
    }
    event.target.value = ''; // Allow re-selecting the same file
  };

  const saveCroppedImage = async () => {
    if (croppedAreaPixels && imageToCrop && imageTypeToCrop) {
      try {
        const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
        if (croppedImage) {
           if (imageTypeToCrop === 'profile') {
            onProfileUpdate({ profilePictureUrl: croppedImage });
          } else {
            onProfileUpdate({ bannerPictureUrl: croppedImage });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        // Close and reset cropper modal
        setImageToCrop(null);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
      }
    }
  };
  
  return (
    <>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 text-textPrimary">
        {/* Banner and Profile Picture */}
        <div className="relative bg-secondary border border-divider rounded-xl shadow-lg mb-8">
          <div 
            className="relative h-48 sm:h-64 bg-divider rounded-t-xl group cursor-pointer"
            onClick={() => bannerFileInputRef.current?.click()}
          >
            {user.bannerPictureUrl ? (
              <img src={user.bannerPictureUrl} alt="Banner" className="w-full h-full object-cover rounded-t-xl" />
            ) : (
               <div className="flex items-center justify-center h-full">
                <p className="text-textSecondary">Click to upload a banner</p>
              </div>
            )}
             <div className="absolute inset-0 rounded-t-xl bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <CameraIcon className="w-8 h-8 text-white"/>
            </div>
          </div>
          <input
            type="file" ref={bannerFileInputRef} onChange={(e) => handleFileSelect(e, 'banner')}
            accept="image/png, image/jpeg, image/gif" style={{ display: 'none' }}
          />
          <div className="absolute top-32 sm:top-44 left-8">
             <div 
              className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-background group cursor-pointer"
              onClick={() => profileFileInputRef.current?.click()}
             >
                {user.profilePictureUrl ? (
                  <img src={user.profilePictureUrl} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-divider flex items-center justify-center">
                    <UserIcon className="w-16 h-16 sm:w-20 sm:h-20 text-textSecondary" />
                  </div>
                )}
                 <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <CameraIcon className="w-8 h-8 text-white"/>
                </div>
            </div>
            <input
              type="file" ref={profileFileInputRef} onChange={(e) => handleFileSelect(e, 'profile')}
              accept="image/png, image/jpeg, image/gif" style={{ display: 'none' }}
            />
          </div>
          <div className="pt-20 sm:pt-24 pb-6 px-8">
            <h1 className="text-3xl font-bold">{user.firstName} {user.lastName}</h1>
            <div className="flex items-center space-x-4 text-textSecondary mt-2">
              <div className="flex items-center text-sm">
                  <MapPinIcon className="w-4 h-4 mr-1.5" />
                  <input 
                      type="text" 
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Your Location" 
                      className="bg-transparent focus:outline-none focus:border-b border-divider transition w-32"
                  />
              </div>
              <div className="flex items-center text-sm">
                   <select 
                      value={garageStatus}
                      onChange={(e) => setGarageStatus(e.target.value)}
                      className="bg-transparent focus:outline-none appearance-none"
                   >
                      {GARAGE_STATUS_OPTIONS.map(opt => <option key={opt} value={opt} className="bg-secondary text-textPrimary">{opt}</option>)}
                  </select>
              </div>
            </div>
             <div className="flex items-center space-x-6 text-sm text-textSecondary mt-4">
                <span><strong className="text-textPrimary">1.2k</strong> Followers</span>
                <span><strong className="text-textPrimary">420</strong> Following</span>
            </div>
          </div>
        </div>

        {/* Profile Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
              <div className="bg-secondary/50 border border-divider rounded-xl p-6">
                <h2 className="text-xl font-semibold text-textPrimary mb-3">About Me</h2>
                 <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={5}
                    placeholder="Tell everyone a bit about yourself and your car journey..."
                    className="w-full px-3 py-2 bg-background border border-divider text-textSecondary rounded-md focus:outline-none focus:ring-1 focus:ring-primary transition text-sm"
                />
              </div>
          </div>

          <div className="lg:col-span-2">
             <h2 className="text-2xl font-bold mb-4">My Saved Builds ({builds.length})</h2>
             {builds.length === 0 ? (
                  <div className="text-center bg-secondary/50 border border-divider rounded-xl p-12">
                      <GearIcon className="w-16 h-16 mx-auto text-textSecondary mb-4"/>
                      <h3 className="text-xl font-semibold text-textPrimary">No Builds Saved Yet</h3>
                      <p className="text-textSecondary mt-2">Create a new performance estimate and save it to see it here.</p>
                      <button
                          onClick={onNavigateToForm}
                          className="mt-6 px-6 py-2 bg-primary text-background font-semibold rounded-lg shadow-md hover:bg-primary/90 transition-all"
                      >
                          Create a Build
                      </button>
                  </div>
              ) : (
                  <div className="space-y-4">
                  {builds.map(build => (
                      <div key={build.id} className="bg-secondary border border-divider rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-divider/50 transition-colors">
                      <div className="mb-4 sm:mb-0">
                          <h3 className="text-lg font-bold text-primary">{`${build.carInput.year} ${build.carInput.make} ${build.carInput.model}`}</h3>
                          <p className="text-sm text-textSecondary">{build.carInput.trim}</p>
                          <p className="text-xs text-textSecondary/70 mt-2 truncate max-w-xs sm:max-w-sm">{build.carInput.modifications}</p>
                      </div>
                      <div className="flex space-x-2 self-end sm:self-center">
                          <button
                            onClick={() => onLoadBuild(build)}
                            className="px-3 py-1.5 text-sm bg-primary text-background rounded-md hover:bg-primary/90 transition-colors"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => onDeleteBuild(build.id)}
                            className="px-3 py-1.5 text-sm bg-error text-textPrimary rounded-md hover:bg-error/90 transition-colors"
                          >
                            Delete
                          </button>
                      </div>
                      </div>
                  ))}
                  </div>
              )}
          </div>
        </div>
      </div>

      {imageToCrop && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
          <div className="bg-secondary rounded-xl shadow-2xl w-full max-w-lg h-[75vh] flex flex-col p-4">
            <h3 className="text-xl font-bold text-textPrimary mb-4 flex-shrink-0">Crop Your Image</h3>
            <div className="relative flex-grow">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={cropAspectRatio}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            {/* You could add a zoom slider here for more control */}
            <div className="flex justify-end space-x-4 mt-4 flex-shrink-0">
              <button
                onClick={() => setImageToCrop(null)}
                className="px-6 py-2 bg-divider text-textSecondary font-semibold rounded-lg hover:bg-divider/80 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveCroppedImage}
                className="px-6 py-2 bg-primary text-background font-semibold rounded-lg shadow-md hover:bg-primary/90 transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
