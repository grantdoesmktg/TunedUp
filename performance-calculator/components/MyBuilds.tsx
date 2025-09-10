import React from 'react';
import type { Build } from '../types';
import { GearIcon } from './icons/GearIcon';

interface MyBuildsProps {
  builds: Build[];
  onLoadBuild: (build: Build) => void;
  onDeleteBuild: (id: string) => void;
  onNavigateToForm: () => void;
}

export const MyBuilds: React.FC<MyBuildsProps> = ({ builds, onLoadBuild, onDeleteBuild, onNavigateToForm }) => {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 text-textPrimary">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Saved Builds</h1>
      </div>

      {builds.length === 0 ? (
        <div className="text-center bg-secondary/50 border border-divider rounded-xl p-12">
            <GearIcon className="w-16 h-16 mx-auto text-textSecondary mb-4"/>
            <h2 className="text-xl font-semibold text-textPrimary">No Builds Saved Yet</h2>
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
                <h2 className="text-lg font-bold text-primary">{`${build.carInput.year} ${build.carInput.make} ${build.carInput.model}`}</h2>
                <p className="text-sm text-textSecondary">{build.carInput.trim}</p>
                 <p className="text-xs text-textSecondary/70 mt-2 truncate max-w-xs">{build.carInput.modifications}</p>
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
  );
};