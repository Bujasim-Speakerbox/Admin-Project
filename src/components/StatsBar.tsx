import React from 'react';
import { Users, FolderCheck, Share2, Palette, Layers } from 'lucide-react';
import { Admin, Project } from '../types';

interface StatsBarProps {
  admins: Admin[];
  projects: Project[];
}

export const StatsBar: React.FC<StatsBarProps> = ({ admins, projects }) => {
  const socialMediaCount = projects.filter((p) => p.projectType !== 'branding').length;
  const brandingCount = projects.filter((p) => p.projectType === 'branding').length;
  const avgProjectsPerAdmin = admins.length > 0 ? (projects.length / admins.length).toFixed(1) : '0';

  return (
    <div id="stats-summary-bar" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 my-6">
      <div id="stat-total-admins" className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-xs flex items-center gap-3 hover:border-zinc-300 transition-all">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-zinc-600">Total Admins</p>
          <p className="text-2xl font-black text-black">{admins.length}</p>
        </div>
      </div>

      <div id="stat-total-projects" className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-xs flex items-center gap-3 hover:border-orange-300 transition-all">
        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center shrink-0">
          <FolderCheck className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-zinc-600">Total Projects</p>
          <p className="text-2xl font-black text-black">{projects.length}</p>
        </div>
      </div>

      <div id="stat-social-media-projects" className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-xs flex items-center gap-3 hover:border-emerald-300 transition-all">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
          <Share2 className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-zinc-600">Social Media</p>
          <p className="text-2xl font-black text-emerald-600">{socialMediaCount}</p>
        </div>
      </div>

      <div id="stat-branding-projects" className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-xs flex items-center gap-3 hover:border-pink-300 transition-all">
        <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 border border-pink-200 flex items-center justify-center shrink-0">
          <Palette className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-zinc-600">Branding / One-time</p>
          <p className="text-2xl font-black text-pink-600">{brandingCount}</p>
        </div>
      </div>

      <div id="stat-avg-per-admin" className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1 hover:border-purple-300 transition-all">
        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-zinc-600">Avg. / Admin</p>
          <p className="text-2xl font-black text-purple-700">{avgProjectsPerAdmin}</p>
        </div>
      </div>
    </div>
  );
};
