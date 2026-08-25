import React, { useState } from 'react';
import { Shield, Users, ArrowRight, Building2 } from 'lucide-react';
import GoldenEagleEmblem from './GoldenEagleEmblem';

interface LoginGatewayProps {
  onSelectAdminGate: () => void;
  onSelectClientGate: () => void;
}

export const LoginGateway: React.FC<LoginGatewayProps> = ({ 
  onSelectAdminGate, 
  onSelectClientGate 
}) => {
  const [selectedGate, setSelectedGate] = useState<'admin' | 'client' | null>(null);

  const handleAdminSelect = () => {
    setSelectedGate('admin');
    setTimeout(onSelectAdminGate, 300);
  };

  const handleClientSelect = () => {
    setSelectedGate('client');
    setTimeout(onSelectClientGate, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 flex flex-col items-center justify-center p-4">
      {/* Header with Logo */}
      <div className="mb-12 text-center">
        <div className="flex justify-center mb-6">
          <GoldenEagleEmblem />
        </div>
        <h1 className="text-4xl font-bold text-amber-100 mb-2">منصة المحاماة القانونية</h1>
        <p className="text-amber-200 text-lg">Legal Platform for Egyptian Lawyers</p>
      </div>

      {/* Gateway Selection */}
      <div className="max-w-4xl w-full">
        <p className="text-center text-amber-200 mb-8 text-lg font-semibold">
          اختر بوابة الدخول المناسبة
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Admin/Staff Gateway */}
          <div
            onClick={handleAdminSelect}
            className={`group relative cursor-pointer transition-all duration-300 transform ${
              selectedGate === 'admin' ? 'scale-105' : 'hover:scale-105'
            }`}
          >
            <div className={`bg-gradient-to-br from-amber-700 to-amber-900 rounded-2xl p-8 shadow-2xl border-2 transition-all duration-300 ${
              selectedGate === 'admin' 
                ? 'border-yellow-300 shadow-yellow-500/50' 
                : 'border-amber-600 hover:border-yellow-300'
            }`}>
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 p-4 bg-amber-800 rounded-full">
                  <Shield className="w-12 h-12 text-yellow-300" />
                </div>
                <h2 className="text-2xl font-bold text-amber-50 mb-2">بوابة الإدارة</h2>
                <p className="text-amber-100 mb-4 text-sm">
                  تسجيل الدخول للمديرين والمحامين
                </p>
                
                <div className="w-full bg-amber-950 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-center gap-2 text-amber-100 text-sm">
                    <Building2 className="w-4 h-4" />
                    <span>الوصول الكامل للنظام</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-yellow-300 font-semibold group-hover:gap-4 transition-all">
                  <span>دخول</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Client/Seeker Gateway */}
          <div
            onClick={handleClientSelect}
            className={`group relative cursor-pointer transition-all duration-300 transform ${
              selectedGate === 'client' ? 'scale-105' : 'hover:scale-105'
            }`}
          >
            <div className={`bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-2xl p-8 shadow-2xl border-2 transition-all duration-300 ${
              selectedGate === 'client' 
                ? 'border-green-300 shadow-green-500/50' 
                : 'border-emerald-600 hover:border-green-300'
            }`}>
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 p-4 bg-emerald-800 rounded-full">
                  <Users className="w-12 h-12 text-green-300" />
                </div>
                <h2 className="text-2xl font-bold text-emerald-50 mb-2">بوابة الموكلين</h2>
                <p className="text-emerald-100 mb-4 text-sm">
                  تسجيل الدخول للموكلين والمستخدمين
                </p>
                
                <div className="w-full bg-emerald-950 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-center gap-2 text-emerald-100 text-sm">
                    <Users className="w-4 h-4" />
                    <span>عرض حالات ووثائقك</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-green-300 font-semibold group-hover:gap-4 transition-all">
                  <span>دخول</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-amber-300 text-sm">
        <p>© 2026 جميع الحقوق محفوظة لمكتب وسام الشناوي القانوني</p>
      </div>
    </div>
  );
};
