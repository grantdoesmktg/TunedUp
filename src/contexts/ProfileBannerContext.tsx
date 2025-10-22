import React, { createContext, useState, useContext, ReactNode } from 'react';

interface ProfileBannerContextType {
  bannerImageUri: string | null;
  setBannerImageUri: (uri: string | null) => void;
}

const ProfileBannerContext = createContext<ProfileBannerContextType | undefined>(undefined);

export const ProfileBannerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bannerImageUri, setBannerImageUri] = useState<string | null>(null);

  return (
    <ProfileBannerContext.Provider value={{ bannerImageUri, setBannerImageUri }}>
      {children}
    </ProfileBannerContext.Provider>
  );
};

export const useProfileBanner = () => {
  const context = useContext(ProfileBannerContext);
  if (context === undefined) {
    throw new Error('useProfileBanner must be used within a ProfileBannerProvider');
  }
  return context;
};
