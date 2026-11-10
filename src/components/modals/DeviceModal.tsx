import React, { useState, useEffect } from 'react';
import { X, Smartphone, Save, Hash } from 'lucide-react';
import { Admin, DeviceAllocation, DeviceType } from '../../types';

interface DeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deviceData: Omit<DeviceAllocation, 'id' | 'createdAt'> & { id?: string }) => void;
  initialDevice?: DeviceAllocation | null;
  admins: Admin[];
  defaultAdminId?: string;
}

const COMMON_DEVICES = [
  'iPhone 16 Pro 256GB',
  'iPhone 15 Pro Max 256GB',
  'iPhone 15 128GB',
  'iPhone 14 Plus 256GB',
  'Samsung Galaxy S24 Ultra',
  'Google Pixel 8 Pro',
  'iPad Pro 13" M4 Cellular',
  'MacBook Pro 16" M3 Max',
];

const CARRIER_OPTIONS = [
  'Airtel Business 5G',
  'Jio Corporate 5G',
  'Vodafone Idea Enterprise',
  'Etisalat Priority Roaming',
  'du UAE Corporate',
  'Other / Local SIM',
];

export const DeviceModal: React.FC<DeviceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialDevice,
  admins,
  defaultAdminId,
}) => {
  const [adminId, setAdminId] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [simNumber, setSimNumber] = useState('');
  const [deviceType, setDeviceType] = useState<DeviceType>('smartphone');
  const [carrier, setCarrier] = useState('Airtel Business 5G');
  const [imeiOrSerial, setImeiOrSerial] = useState('');
  const [status, setStatus] = useState<'Active' | 'Spare' | 'In Repair' | 'Returned'>('Active');
  const [allocatedDate, setAllocatedDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialDevice) {
      setAdminId(initialDevice.adminId);
      setDeviceName(initialDevice.deviceName);
      setSimNumber(initialDevice.simNumber);
      setDeviceType(initialDevice.deviceType || 'smartphone');
      setCarrier(initialDevice.carrier || 'Airtel Business 5G');
      setImeiOrSerial(initialDevice.imeiOrSerial || '');
      setStatus(initialDevice.status);
      setAllocatedDate(initialDevice.allocatedDate);
      setNotes(initialDevice.notes || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setAdminId(defaultAdminId || admins[0]?.id || '');
      setDeviceName('');
      setSimNumber('');
      setDeviceType('smartphone');
      setCarrier('Airtel Business 5G');
      setImeiOrSerial('');
      setStatus('Active');
      setAllocatedDate(today);
      setNotes('');
    }
  }, [initialDevice, defaultAdminId, admins, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName.trim() || !simNumber.trim() || !adminId) return;

    const matchedAdmin = admins.find((a) => a.id === adminId);

    onSave({
      id: initialDevice?.id,
      adminId,
      adminName: matchedAdmin ? matchedAdmin.name : undefined,
      deviceName: deviceName.trim(),
      simNumber: simNumber.trim(),
      deviceType,
      carrier: carrier.trim() || undefined,
      imeiOrSerial: imeiOrSerial.trim() || undefined,
      status,
      allocatedDate: allocatedDate || new Date().toISOString().split('T')[0],
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="device-allocation-modal"
        className="bg-white border border-zinc-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8 animate-fadeIn"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-black">
                {initialDevice ? 'Edit Device Allocation' : 'Allocate New Device to Admin'}
              </h2>
              <p className="text-xs text-zinc-500">
                Track assigned phone/device hardware and SIM connection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-black p-1 rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Admin Selection */}
          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              Admin Name *
            </label>
            <select
              id="device-admin-select"
              required
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black font-semibold cursor-pointer"
            >
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id} className="bg-white text-black">
                  {admin.name} — {admin.department}
                </option>
              ))}
            </select>
          </div>

          {/* Device Name */}
          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              Device Name *
            </label>
            <input
              id="device-name-input"
              type="text"
              required
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="e.g. iPhone 15 Pro Max 256GB, Samsung S24 Ultra..."
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black placeholder-zinc-400 font-semibold"
            />
            {/* Quick Suggestions */}
            <div className="mt-2">
              <span className="text-[10px] text-zinc-500 block mb-1 font-bold uppercase">Quick Pick Device:</span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_DEVICES.slice(0, 5).map((dev) => (
                  <button
                    key={dev}
                    type="button"
                    onClick={() => {
                      setDeviceName(dev);
                      if (dev.includes('iPad')) setDeviceType('tablet');
                      else if (dev.includes('MacBook')) setDeviceType('laptop');
                      else setDeviceType('smartphone');
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                      deviceName === dev
                        ? 'bg-orange-50 text-orange-950 border-orange-500 font-bold'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-300 hover:border-orange-400'
                    }`}
                  >
                    {dev}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SIM Number */}
          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              SIM Number / Mobile Line *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <Hash className="w-4 h-4 text-orange-600" />
              </div>
              <input
                id="device-sim-input"
                type="text"
                required
                value={simNumber}
                onChange={(e) => setSimNumber(e.target.value)}
                placeholder="e.g. +91 98450 11201 or SIM ICCID"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black font-mono font-bold"
              />
            </div>
          </div>

          {/* Device Type & Carrier */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                Device Category
              </label>
              <select
                id="device-type-select"
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value as DeviceType)}
                className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black font-semibold cursor-pointer"
              >
                <option value="smartphone">Smartphone</option>
                <option value="tablet">Tablet / iPad</option>
                <option value="laptop">Laptop / MacBook</option>
                <option value="hotspot">Mobile Hotspot Dongle</option>
                <option value="other">Other Device</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                Carrier / Network
              </label>
              <select
                id="device-carrier-select"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black font-semibold cursor-pointer"
              >
                {CARRIER_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Allocation Date & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                Allocation Date *
              </label>
              <input
                id="device-date-input"
                type="date"
                required
                value={allocatedDate}
                onChange={(e) => setAllocatedDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                id="device-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black font-semibold cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Spare">Spare / Standby</option>
                <option value="In Repair">In Repair / Servicing</option>
                <option value="Returned">Returned / Decommissioned</option>
              </select>
            </div>
          </div>

          {/* IMEI or Serial No. */}
          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              IMEI / Serial Number (Optional)
            </label>
            <input
              id="device-imei-input"
              type="text"
              value={imeiOrSerial}
              onChange={(e) => setImeiOrSerial(e.target.value)}
              placeholder="e.g. IMEI: 356891102938471 or Serial No."
              className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black font-mono placeholder-zinc-400"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              Handover Notes & Accessories (Optional)
            </label>
            <textarea
              id="device-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Case, 20W charger, tempered glass, AppleCare+ active..."
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black placeholder-zinc-400 font-medium resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:text-black bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer border border-zinc-300"
            >
              Cancel
            </button>
            <button
              id="save-device-btn"
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{initialDevice ? 'Update Allocation' : 'Save Device Allocation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
