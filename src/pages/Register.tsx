import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Smartphone, 
  Lock, 
  Building2, 
  MapPin, 
  Truck, 
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import type { Role, VehicleType } from '../types';
import { register, ApiError } from '../lib/api';
import { saveSession } from '../lib/auth';

// --- Visual & Copy Data ---

const ROLE_INFO: Record<Role, { title: string; blurb: string; icon: any }> = {
  retailer: {
    title: 'Business Retailer',
    blurb: "Register your shop to manage and track outward deliveries to your customers.",
    icon: Building2
  },
  dispatcher: {
    title: 'Logistics Dispatcher',
    blurb: "Oversee the fleet, monitor unassigned requests, and manage rider assignments.",
    icon: CheckCircle2
  },
  rider: {
    title: 'Delivery Rider',
    blurb: "Access your assigned tasks, navigate to destinations, and update delivery status.",
    icon: Truck
  },
};

const ROLE_ORDER: Role[] = ['retailer', 'dispatcher', 'rider'];

export function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>('retailer');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      const { token, user } = await register({
        role,
        full_name: fullName,
        phone_number: phone,
        password,
        password_confirmation: passwordConfirmation,
        ...(role === 'retailer' ? { business_name: businessName, business_address: businessAddress } : {}),
        ...(role === 'rider' && vehicleType ? { vehicle_type: vehicleType } : {}),
      });

      saveSession(token, user);
      const landing: Record<Role, string> = { retailer: '/retailer', dispatcher: '/dispatcher', rider: '/rider' };
      navigate(landing[user.role]);
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setErrors(err.fieldErrors);
      } else {
        setErrors({ _general: err instanceof Error ? err.message : 'Registration failed. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col md:flex-row font-sans">
      
      {/* Branding & Role Explainer Side */}
      <div className="hidden lg:flex lg:w-[40%] bg-[#0047BB] p-16 flex-col justify-between text-white shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-[#0047BB] font-black italic text-xl">R</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">Reflex</h1>
          </div>

          <h2 className="text-4xl font-black leading-tight mb-8">
            Join the network.
          </h2>
          
          <div className="space-y-4">
            {ROLE_ORDER.map((r) => {
              const Icon = ROLE_INFO[r].icon;
              const isActive = role === r;
              return (
                <div
                  key={r}
                  className={`p-6 rounded-2xl border transition-all cursor-default ${
                    isActive 
                      ? 'bg-white/10 border-white/20 shadow-xl shadow-black/10' 
                      : 'border-white/5 opacity-40 grayscale'
                  }`}
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-white text-[#0047BB]' : 'bg-white/10'}`}>
                      <Icon size={18} />
                    </div>
                    <span className="font-black text-sm uppercase tracking-wider">{ROLE_INFO[r].title}</span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed font-medium">
                    {ROLE_INFO[r].blurb}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
          Reflex Logistics Engine &copy; 2024
        </p>
      </div>

      {/* Form Side */}
      <div className="flex-1 bg-white overflow-y-auto">
        <div className="max-w-xl mx-auto p-8 md:p-16">
          
          <div className="lg:hidden flex items-center gap-2 mb-12">
            <div className="w-8 h-8 bg-[#0047BB] rounded flex items-center justify-center">
              <span className="text-white font-black italic">R</span>
            </div>
            <span className="font-black text-xl">Reflex</span>
          </div>

          <header className="mb-10">
            <h3 className="text-3xl font-black text-slate-900 mb-2">Create Account</h3>
            <p className="text-slate-400 text-sm font-medium">Please provide your details to get started.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Step 1: Role Selection (Interactive Segment) */}
            <div className="space-y-4">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Registering As
              </label>
              <div className="flex p-1.5 bg-slate-50 rounded-xl border border-slate-100">
                {ROLE_ORDER.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${
                      role === r 
                        ? 'bg-white shadow-sm text-[#0047BB] ring-1 ring-slate-100' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {ROLE_LABELS_SHORT[r]}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Personal Details Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
               <div className="md:col-span-2">
                 <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-6">Personal Information</p>
               </div>
               
               <Field 
                  label="Full Name" 
                  icon={User} 
                  value={fullName} 
                  onChange={setFullName} 
                  error={errors.full_name} 
                  placeholder="e.g. John Doe"
                  required 
               />

               <Field 
                  label="Phone Number" 
                  icon={Smartphone} 
                  value={phone} 
                  onChange={setPhone} 
                  error={errors.phone_number} 
                  placeholder="+254 700..."
                  type="tel"
                  required 
               />
            </div>

            {/* Step 3: Role Specific Details */}
            {role === 'retailer' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-slate-50 animate-in fade-in duration-500">
                <div className="md:col-span-2">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-6">Business Details</p>
                </div>
                <Field 
                  label="Business Name" 
                  icon={Building2} 
                  value={businessName} 
                  onChange={setBusinessName} 
                  error={errors.business_name} 
                  placeholder="The Hardware Hub"
                  required 
                />
                <Field 
                  label="Business Address" 
                  icon={MapPin} 
                  value={businessAddress} 
                  onChange={setBusinessAddress} 
                  error={errors.business_address} 
                  placeholder="Nairobi, Industrial Area"
                  required 
                />
              </div>
            )}

            {role === 'rider' && (
              <div className="pt-8 border-t border-slate-50 animate-in fade-in duration-500">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-6">Vehicle Details</p>
                <div className="relative group">
                  <Truck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-[#0047BB]/10 font-medium text-slate-900 appearance-none"
                  >
                    <option value="">Select Vehicle Type (Optional)</option>
                    <option value="motorbike">Motorbike</option>
                    <option value="light_truck">Light Truck</option>
                    <option value="heavy_van">Heavy Van</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 4: Security */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-slate-50">
               <div className="md:col-span-2">
                 <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-6">Security</p>
               </div>
               <Field 
                  label="Create Password" 
                  icon={Lock} 
                  type="password"
                  value={password} 
                  onChange={setPassword} 
                  error={errors.password} 
                  placeholder="••••••••••••"
                  required 
               />
               <Field 
                  label="Confirm Password" 
                  icon={Lock} 
                  type="password"
                  value={passwordConfirmation} 
                  onChange={setPasswordConfirmation} 
                  error={errors.password_confirmation} 
                  placeholder="••••••••••••"
                  required 
               />
            </div>

            {errors._general && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 items-center">
                <AlertCircle size={18} className="text-red-500 shrink-0" />
                <p className="text-xs text-red-600 font-bold leading-tight">{errors._general}</p>
              </div>
            )}

            <div className="pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-5 bg-[#0047BB] text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-[#0047BB]/30 hover:bg-[#0037a3] disabled:opacity-50 transition-all flex items-center justify-center gap-3 group"
              >
                {submitting ? 'Creating Profile...' : 'Complete Registration'}
                {!submitting && <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />}
              </button>
              
              <p className="mt-8 text-center text-sm text-slate-400 font-medium">
                Already have an account?{' '}
                <Link to="/login" className="text-[#0047BB] font-black hover:underline underline-offset-4">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---

const ROLE_LABELS_SHORT: Record<Role, string> = {
  retailer: 'Retailer',
  dispatcher: 'Dispatcher',
  rider: 'Rider',
};

function Field({ label, value, onChange, icon: Icon, error, type = 'text', placeholder, required }: any) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative group">
        <Icon className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-red-300' : 'text-slate-300 group-focus-within:text-[#0047BB]'}`} size={18} />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-xl outline-none transition-all font-medium text-slate-900 ${
            error ? 'border-red-200 focus:ring-red-100 ring-2' : 'border-slate-100 focus:ring-2 focus:ring-[#0047BB]/10 focus:border-[#0047BB]'
          }`}
        />
      </div>
      {error && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tighter ml-1">{error}</p>}
    </div>
  );
}