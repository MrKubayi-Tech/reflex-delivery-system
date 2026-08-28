import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Role, VehicleType } from '../types';
import { register, ApiError } from '../lib/api';
import { saveSession } from '../lib/auth';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

const ROLE_COPY: Record<Role, { title: string; blurb: string }> = {
  retailer: {
    title: 'Retailer staff',
    blurb: "You'll register your business and log delivery requests for it.",
  },
  dispatcher: {
    title: 'Dispatcher',
    blurb: "You'll see open requests across retailers and assign them to riders.",
  },
  rider: {
    title: 'Rider',
    blurb: "You'll see deliveries assigned to you and update their status from the field.",
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
        setErrors({ _general: err instanceof Error ? err.message : 'Something went wrong. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-forest flex items-center justify-center px-6 py-10">
      <Card className="w-full max-w-md p-8 border-none">
        <div className="font-display text-3xl font-semibold text-forest mb-1">
          Fikisha<span className="text-amber italic font-medium">.</span>
        </div>
        <p className="text-sm text-ink/50 mb-6">Create an account.</p>

        <div className="mb-6">
          <label
            htmlFor="role"
            className="block text-xs font-semibold uppercase tracking-wide text-ink/50 mb-1.5"
          >
            I am a
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full border border-ink/15 px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-forest"
          >
            {ROLE_ORDER.map((r) => (
              <option key={r} value={r}>
                {ROLE_COPY[r].title}
              </option>
            ))}
          </select>
          <p className="text-xs text-ink/50 mt-1.5">{ROLE_COPY[role].blurb}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Full name" value={fullName} onChange={setFullName} error={errors.full_name} />
          <Field
            label="Phone number"
            value={phone}
            onChange={setPhone}
            error={errors.phone_number}
            placeholder="+254700000000"
            type="tel"
          />

          {role === 'retailer' && (
            <>
              <Field
                label="Business name"
                value={businessName}
                onChange={setBusinessName}
                error={errors.business_name}
                placeholder="e.g. Jumia Hardware — Industrial Area"
              />
              <Field
                label="Business address"
                value={businessAddress}
                onChange={setBusinessAddress}
                error={errors.business_address}
                placeholder="Also used as your pickup location for deliveries"
              />
            </>
          )}

          {role === 'rider' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink/50 mb-1.5">
                Vehicle type <span className="normal-case text-ink/30">(optional)</span>
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as VehicleType | '')}
                className="w-full border border-ink/15 px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-forest"
              >
                <option value="">Not specified</option>
                <option value="motorbike">Motorbike</option>
                <option value="light_truck">Light truck</option>
                <option value="heavy_van">Heavy van</option>
              </select>
            </div>
          )}

          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            error={errors.password}
            placeholder="At least 8 characters"
          />
          <Field
            label="Confirm password"
            type="password"
            value={passwordConfirmation}
            onChange={setPasswordConfirmation}
            error={errors.password_confirmation}
          />

          {errors._general && <p className="text-sm text-rust">{errors._general}</p>}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-sm text-ink/50">
          Already have an account?{' '}
          <Link to="/login" className="text-forest font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-ink/50 mb-1.5">{label}</label>
      <input
        type={type}
        required
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border px-3 py-2.5 text-sm focus:outline-none focus:border-forest ${
          error ? 'border-rust' : 'border-ink/15'
        }`}
      />
      {error && <p className="text-xs text-rust mt-1">{error}</p>}
    </div>
  );
}