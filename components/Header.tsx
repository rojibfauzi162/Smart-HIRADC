import React from 'react';
import { ShieldCheckIcon } from './icons/Icons';

interface HeaderProps {
    onHomeClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onHomeClick }) => {
  return (
    <header className="bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={onHomeClick}
          >
            <ShieldCheckIcon className="h-10 w-10 text-sky-400" />
            <span className="text-2xl font-bold text-white">Smart HIRADC</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;