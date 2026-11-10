import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  Tablet,
  Laptop,
  Wifi,
  Hash,
  User,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  LayoutGrid,
  Table as TableIcon,
  Copy,
  Check,
} from 'lucide-react';
import { Admin, DeviceAllocation, DeviceType } from '../types';

interface DeviceAllocationViewProps {
  devices: DeviceAllocation[];
  admins: Admin[];
  isAdminLoggedIn: boolean;
  onOpenAddDevice: (adminId?: string) => void;
  onEditDevice: (device: DeviceAllocation) => void;
  onDeleteDevice: (deviceId: string) => void;
  onRequireAdminAuth: (action: () => void) => void;
}

export const DeviceAllocationView: React.FC<DeviceAllocationViewProps> = ({
  devices,
  admins,
  onOpenAddDevice,
  onEditDevice,
  onDeleteDevice,
  onRequireAdminAuth,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAdminId, setSelectedAdminId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [copiedSimId, setCopiedSimId] = useState<string | null>(null);

  // Copy SIM number to clipboard with feedback
  const handleCopySim = (simNumber: string, id: string) => {
    navigator.clipboard.writeText(simNumber);
    setCopiedSimId(id);
    setTimeout(() => {
      setCopiedSimId(null);
    }, 2000);
  };

  // Device icon resolver
  const getDeviceIcon = (type?: DeviceType) => {
    switch (type) {
      case 'tablet':
        return <Tablet className="w-5 h-5 text-orange-600" />;
      case 'laptop':
        return <Laptop className="w-5 h-5 text-orange-600" />;
      case 'hotspot':
        return <Wifi className="w-5 h-5 text-orange-600" />;
      case 'smartphone':
      default:
        return <Smartphone className="w-5 h-5 text-orange-600" />;
    }
  };

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      // Admin filter
      if (selectedAdminId !== 'all' && device.adminId !== selectedAdminId) {
        return false;
      }
      // Type filter
      if (selectedType !== 'all' && device.deviceType !== selectedType) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'all' && device.status !== selectedStatus) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const admin = admins.find((a) => a.id === device.adminId);
        const matchesAdmin = admin?.name.toLowerCase().includes(query) || device.adminName?.toLowerCase().includes(query);
        const matchesDevice = device.deviceName.toLowerCase().includes(query);
        const matchesSim = device.simNumber.toLowerCase().includes(query);
        const matchesCarrier = device.carrier?.toLowerCase().includes(query);
        const matchesSerial = device.imeiOrSerial?.toLowerCase().includes(query);
        const matchesNotes = device.notes?.toLowerCase().includes(query);

        if (!matchesAdmin && !matchesDevice && !matchesSim && !matchesCarrier && !matchesSerial && !matchesNotes) {
          return false;
        }
      }
      return true;
    });
  }, [devices, selectedAdminId, selectedType, selectedStatus, searchQuery, admins]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = devices.length;
    const active = devices.filter((d) => d.status === 'Active').length;
    const spare = devices.filter((d) => d.status === 'Spare').length;
    const smartphones = devices.filter((d) => d.deviceType === 'smartphone' || !d.deviceType).length;
    const tabletsOrLaptops = devices.filter((d) => d.deviceType === 'tablet' || d.deviceType === 'laptop').length;

    // Distinct admins with assigned devices
    const assignedAdminIds = new Set(devices.map((d) => d.adminId));

    return {
      total,
      active,
      spare,
      smartphones,
      tabletsOrLaptops,
      assignedAdminsCount: assignedAdminIds.size,
    };
  }, [devices]);

  return (
    <div id="device-allocation-page" className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white shadow-sm">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-black tracking-tight">
                Admin Device & SIM Allocation
              </h2>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            <button
              id="add-device-btn"
              onClick={() => {
                onRequireAdminAuth(() => onOpenAddDevice());
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Allocate Device</span>
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-zinc-200">
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Total Devices</span>
              <Smartphone className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-black">{stats.total}</span>
              <span className="text-[10px] text-zinc-500 font-semibold">allocated units</span>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Active SIM Lines</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-emerald-700">{stats.active}</span>
              <span className="text-[10px] text-emerald-800 font-semibold">in service</span>
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Smartphones / Laptops</span>
              <Laptop className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <p className="text-xl font-black text-black mt-1">
              {stats.smartphones} <span className="text-xs text-zinc-400 font-normal">/</span> {stats.tabletsOrLaptops}
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Admins Equipped</span>
              <User className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-amber-700">{stats.assignedAdminsCount}</span>
              <span className="text-[10px] text-amber-800 font-semibold">of {admins.length} admins</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and View Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="device-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Admin Name, Device Name, or SIM Number..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-black placeholder-zinc-400 font-medium shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-black font-semibold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Admin Filter */}
          <select
            id="filter-device-admin"
            value={selectedAdminId}
            onChange={(e) => setSelectedAdminId(e.target.value)}
            className="text-xs bg-white border border-zinc-300 rounded-xl px-3 py-2 text-black font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs cursor-pointer"
          >
            <option value="all">All Admins</option>
            {admins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            id="filter-device-status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-white border border-zinc-300 rounded-xl px-3 py-2 text-black font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Spare">Spare</option>
            <option value="In Repair">In Repair</option>
            <option value="Returned">Returned</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-zinc-100 border border-zinc-200 rounded-xl p-1 shadow-xs">
            <button
              id="view-mode-cards"
              onClick={() => setViewMode('cards')}
              title="Cards Grid View"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-zinc-600 hover:text-black'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              id="view-mode-table"
              onClick={() => setViewMode('table')}
              title="Table View"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-zinc-600 hover:text-black'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Display */}
      {filteredDevices.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-3">
            <Smartphone className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-black">No device allocations found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
            {searchQuery
              ? `No devices match "${searchQuery}". Try clearing the search query.`
              : 'No devices currently allocated under the selected filters.'}
          </p>
          <button
            onClick={() => {
              onRequireAdminAuth(() => onOpenAddDevice(selectedAdminId !== 'all' ? selectedAdminId : undefined));
            }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Allocate New Device</span>
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map((device) => {
            const admin = admins.find((a) => a.id === device.adminId);
            const isCopied = copiedSimId === device.id;

            return (
              <div
                key={device.id}
                id={`device-card-${device.id}`}
                className="bg-white border border-zinc-200 hover:border-orange-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Device Category & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center">
                        {getDeviceIcon(device.deviceType)}
                      </div>
                      <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                        {device.deviceType || 'Smartphone'}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        device.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : device.status === 'Spare'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-pink-50 text-pink-800 border border-pink-200'
                      }`}
                    >
                      {device.status}
                    </span>
                  </div>

                  {/* REQUIRED FIELD 1: DEVICE NAME */}
                  <div className="mb-3">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-0.5">
                      Device Name
                    </span>
                    <h3 className="text-base font-black text-black tracking-tight leading-snug">
                      {device.deviceName}
                    </h3>
                    {device.imeiOrSerial && (
                      <p className="text-[11px] text-zinc-500 font-mono mt-0.5 truncate">
                        {device.imeiOrSerial}
                      </p>
                    )}
                  </div>

                  {/* REQUIRED FIELD 2: SIM NUMBER */}
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        <span>SIM Number</span>
                      </span>
                      {device.carrier && (
                        <span className="text-[10px] text-zinc-500 font-semibold">
                          {device.carrier}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-black font-mono tracking-wide">
                        {device.simNumber}
                      </span>
                      <button
                        onClick={() => handleCopySim(device.simNumber, device.id)}
                        title="Copy SIM Number"
                        className="p-1 rounded-md text-zinc-500 hover:text-black hover:bg-zinc-200 transition-colors"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Notes / Accessories if present */}
                  {device.notes && (
                    <p className="text-xs text-zinc-600 mb-3 line-clamp-2 italic bg-zinc-50 p-2 rounded-lg border border-zinc-200">
                      "{device.notes}"
                    </p>
                  )}
                </div>

                {/* Card Footer: REQUIRED FIELD 3: ADMIN NAME */}
                <div className="pt-3 border-t border-zinc-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 text-white shadow-sm"
                      style={{ backgroundColor: admin?.color || '#f97316' }}
                    >
                      {(admin?.name || device.adminName || 'A')[0]}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">
                        Assigned Admin
                      </span>
                      <p className="text-xs font-bold text-black truncate">
                        {admin?.name || device.adminName || 'Unassigned'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      id={`edit-device-${device.id}`}
                      onClick={() => {
                        onRequireAdminAuth(() => onEditDevice(device));
                      }}
                      title="Edit Allocation"
                      className="p-1.5 text-zinc-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`delete-device-${device.id}`}
                      onClick={() => {
                        onRequireAdminAuth(() => onDeleteDevice(device.id));
                      }}
                      title="Delete Allocation"
                      className="p-1.5 text-zinc-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-800">
              <thead className="bg-zinc-50 text-[11px] font-bold text-zinc-700 uppercase tracking-wider border-b border-zinc-200">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Admin Name</th>
                  <th scope="col" className="px-5 py-3.5">Device Name</th>
                  <th scope="col" className="px-5 py-3.5">SIM Number</th>
                  <th scope="col" className="px-5 py-3.5">Carrier / Network</th>
                  <th scope="col" className="px-5 py-3.5">Status</th>
                  <th scope="col" className="px-5 py-3.5">Allocated Date</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filteredDevices.map((device) => {
                  const admin = admins.find((a) => a.id === device.adminId);
                  const isCopied = copiedSimId === device.id;

                  return (
                    <tr
                      key={device.id}
                      className="hover:bg-orange-50/20 transition-colors"
                    >
                      {/* Admin Name */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ backgroundColor: admin?.color || '#f97316' }}
                          >
                            {(admin?.name || device.adminName || 'A')[0]}
                          </div>
                          <div>
                            <p className="font-bold text-black">
                              {admin?.name || device.adminName || 'Unassigned'}
                            </p>
                            <p className="text-[10px] text-zinc-500">
                              {admin?.department || 'Operations'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Device Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-orange-600 shrink-0">
                            {getDeviceIcon(device.deviceType)}
                          </span>
                          <div>
                            <p className="font-bold text-black">
                              {device.deviceName}
                            </p>
                            {device.imeiOrSerial && (
                              <p className="text-[10px] text-zinc-500 font-mono truncate max-w-[180px]">
                                {device.imeiOrSerial}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SIM Number */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-black bg-zinc-100 px-2 py-1 rounded-md border border-zinc-200">
                            {device.simNumber}
                          </span>
                          <button
                            onClick={() => handleCopySim(device.simNumber, device.id)}
                            title="Copy SIM Number"
                            className="p-1 rounded text-zinc-500 hover:text-black"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Carrier */}
                      <td className="px-5 py-4 whitespace-nowrap font-medium text-zinc-700">
                        {device.carrier || 'Standard SIM'}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            device.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : device.status === 'Spare'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-pink-50 text-pink-800 border border-pink-200'
                          }`}
                        >
                          {device.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-zinc-500 text-xs font-medium">
                        {device.allocatedDate || '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              onRequireAdminAuth(() => onEditDevice(device));
                            }}
                            title="Edit"
                            className="p-1.5 text-zinc-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              onRequireAdminAuth(() => onDeleteDevice(device.id));
                            }}
                            title="Delete"
                            className="p-1.5 text-zinc-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
