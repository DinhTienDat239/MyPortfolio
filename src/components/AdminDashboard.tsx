import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Plus, Trash2, Image as ImageIcon, LogOut, ChevronRight, ChevronDown, Upload, Loader2 } from 'lucide-react';
import { doc, setDoc, addDoc, collection, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { cn } from '../lib/utils';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

export default function AdminDashboard({ isOpen, onClose, data }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);

  const handleLogout = () => {
    auth.signOut();
    onClose();
  };

  // Compress image and convert to Base64 to store directly in Firestore
  // This bypasses the need for Firebase Storage setup
  const compressImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Max dimension to keep file size small (Firestore limit is 1MB per document)
          const MAX_DIMENSION = 800;
          if (width > height && width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          } else if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress as WebP with 0.7 quality to ensure small size (< 100kb usually)
            const dataUrl = canvas.toDataURL('image/webp', 0.7);
            resolve(dataUrl);
          } else {
            reject(new Error('Failed to get canvas context'));
          }
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const ImageInput = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        // Use local compression instead of Firebase Storage
        const base64Url = await compressImageToBase64(file);
        
        // Check size (rough estimate of base64 size)
        const sizeInBytes = Math.round((base64Url.length * 3) / 4);
        if (sizeInBytes > 800000) { // > 800KB
          alert('Image is still too large after compression. Please choose a smaller image.');
          return;
        }
        
        onChange(base64Url);
      } catch (err: any) {
        console.error('Image processing failed:', err);
        alert(`Failed to process image: ${err.message}`);
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    return (
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase text-ocean-400">{label}</label>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Paste image URL or click upload"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-ocean-500 outline-none pr-10"
            />
            {uploading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-5 h-5 text-ocean-400 animate-spin" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-3 bg-white/5 border border-white/10 rounded-xl text-ocean-300 hover:bg-white/10 transition-colors disabled:opacity-50"
            title="Upload Image"
          >
            <Upload className="w-5 h-5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
        {value && (
          <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border border-white/10 bg-black/50">
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    );
  };

  const PlayableUrlInput = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => {
    // Vite glob import to find all HTML files in the public/playables folder at build time
    const localFiles = import.meta.glob('/public/playables/*.html');
    const availablePaths = Object.keys(localFiles).map(p => p.replace('/public', ''));

    return (
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase text-ocean-400">{label}</label>
        <div className="flex flex-col gap-3">
          {availablePaths.length > 0 && (
            <select
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-ocean-500 outline-none appearance-none"
              value={availablePaths.includes(value) ? value : ''}
              onChange={(e) => {
                if (e.target.value) onChange(e.target.value);
              }}
            >
              <option value="">-- Select local file from /public/playables/ --</option>
              {availablePaths.map(path => (
                <option key={path} value={path}>{path}</option>
              ))}
            </select>
          )}
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Or paste external URL (https://...)"
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-ocean-500 outline-none"
          />
        </div>
        <p className="text-[10px] text-ocean-300 leading-relaxed">
          Tip: Upload your <code className="text-ocean-100 bg-white/10 px-1 py-0.5 rounded">.html</code> files to the <code className="text-ocean-100 bg-white/10 px-1 py-0.5 rounded">public/playables/</code> folder in your repository. They will automatically appear in the dropdown above.
        </p>
      </div>
    );
  };

  const ProfileEditor = () => {
    const [profile, setProfile] = useState(data.profile || {});
    const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

    const handleSave = async () => {
      setStatus('saving');
      try {
        await setDoc(doc(db, 'config', 'profile'), profile);
        setStatus('success');
        setTimeout(() => setStatus('idle'), 3000);
      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    };

    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-ocean-400">Full Name</label>
            <input
              type="text"
              value={profile.fullName || ''}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-ocean-500 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-ocean-400">Roles</label>
            <input
              type="text"
              value={profile.roles || ''}
              onChange={(e) => setProfile({ ...profile, roles: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-ocean-500 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-ocean-400">DOB</label>
            <input
              type="text"
              value={profile.dob || ''}
              onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-ocean-500 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-ocean-400">Location</label>
            <input
              type="text"
              value={profile.location || ''}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-ocean-500 outline-none"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-xs font-bold uppercase text-ocean-400">Profile Image Size ({profile.imageSize || 400}px)</label>
            <input
              type="range"
              min="200"
              max="800"
              value={profile.imageSize || 400}
              onChange={(e) => setProfile({ ...profile, imageSize: Number(e.target.value) })}
              className="w-full accent-ocean-500"
            />
          </div>
        </div>
        <ImageInput
          label="Profile Picture"
          value={profile.profilePic}
          onChange={(url) => setProfile({ ...profile, profilePic: url })}
        />
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-ocean-400">About Me</label>
          <textarea
            rows={4}
            value={profile.aboutMe || ''}
            onChange={(e) => setProfile({ ...profile, aboutMe: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-ocean-500 outline-none resize-none"
          />
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={status === 'saving'}
            className="flex items-center gap-2 px-6 py-3 bg-ocean-500 text-white font-bold rounded-xl hover:bg-ocean-400 transition-all disabled:opacity-50"
          >
            {status === 'saving' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {status === 'saving' ? 'Saving...' : 'Save Profile'}
          </button>
          {status === 'success' && <span className="text-green-400 text-sm font-medium">Saved successfully!</span>}
          {status === 'error' && <span className="text-red-400 text-sm font-medium">Error saving profile</span>}
        </div>
      </div>
    );
  };

  const CollectionEditor = ({ collectionName, fields }: { collectionName: string; fields: string[] }) => {
    const items = data[collectionName] || [];
    const [newItem, setNewItem] = useState<any>({});
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = async () => {
      if (Object.keys(newItem).length === 0) return;
      setIsAdding(true);
      try {
        await addDoc(collection(db, collectionName), { ...newItem, order: items.length });
        setNewItem({});
      } catch (err) {
        console.error(err);
      } finally {
        setIsAdding(false);
      }
    };

    const handleDelete = async (id: string) => {
      // Avoid confirm() as it might be blocked in iframe
      try {
        await deleteDoc(doc(db, collectionName, id));
      } catch (err) {
        console.error('Delete failed:', err);
      }
    };

    const isImageField = (field: string) => {
      const imageKeywords = ['image', 'thumbnail', 'logo', 'pic', 'bg'];
      return imageKeywords.some(kw => field.toLowerCase().includes(kw));
    };

    const isBooleanField = (field: string) => {
      return field.startsWith('show') || field.startsWith('is');
    };

    return (
      <div className="space-y-8">
        <div className="glass p-6 rounded-2xl border-white/5 space-y-4">
          <h4 className="font-bold text-ocean-100">Add New {collectionName.slice(0, -1)}</h4>
          <div className="grid sm:grid-cols-2 gap-4">
            {fields.map((field) => (
              isImageField(field) ? (
                <div key={field} className="sm:col-span-2">
                  <ImageInput
                    label={field}
                    value={newItem[field]}
                    onChange={(url) => setNewItem({ ...newItem, [field]: url })}
                  />
                </div>
              ) : field === 'iframeUrl' ? (
                <div key={field} className="sm:col-span-2">
                  <PlayableUrlInput
                    label={field}
                    value={newItem[field]}
                    onChange={(url) => setNewItem({ ...newItem, [field]: url })}
                  />
                </div>
              ) : isBooleanField(field) ? (
                <div key={field} className="space-y-2 flex items-center gap-3 sm:col-span-2 bg-white/5 p-4 rounded-xl border border-white/10 mt-2">
                  <input
                    type="checkbox"
                    id={`checkbox-${field}`}
                    checked={newItem[field] || false}
                    onChange={(e) => setNewItem({ ...newItem, [field]: e.target.checked })}
                    className="w-5 h-5 accent-ocean-500 rounded cursor-pointer"
                  />
                  <label htmlFor={`checkbox-${field}`} className="text-sm font-bold uppercase text-ocean-400 cursor-pointer select-none">
                    {field}
                  </label>
                </div>
              ) : (
                <div key={field} className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-ocean-400 ml-1">{field}</label>
                  <input
                    type="text"
                    placeholder={field}
                    value={newItem[field] || ''}
                    onChange={(e) => setNewItem({ ...newItem, [field]: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-ocean-500"
                  />
                </div>
              )
            ))}
          </div>
          <button
            onClick={handleAdd}
            disabled={isAdding}
            className="flex items-center gap-2 px-6 py-3 bg-ocean-600 text-white text-sm font-bold rounded-xl hover:bg-ocean-500 transition-all disabled:opacity-50"
          >
            {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Item
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item: any, index: number) => (
            <div key={item.id || `item-${index}`} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-4">
                {item.thumbnail || item.image || item.logo ? (
                  <img src={item.thumbnail || item.image || item.logo} className="w-12 h-12 rounded-lg object-cover" alt="" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-ocean-800 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-ocean-400" />
                  </div>
                )}
                <div>
                  <h5 className="font-bold text-white">{item.title || item.name || item.label}</h5>
                  <p className="text-xs text-ocean-400">{item.description || item.value}</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'playables', label: 'Playables', fields: ['title', 'description', 'iframeUrl', 'thumbnail'] },
    { id: 'games', label: 'Games', fields: ['title', 'description', 'externalLink', 'mainImage', 'bgImage'] },
    { id: 'awards', label: 'Awards', fields: ['name', 'description', 'image', 'checkoutLink', 'showCheckout'] },
    { id: 'stats', label: 'Stats', fields: ['label', 'value'] },
    { id: 'networks', label: 'Networks', fields: ['name', 'logo'] },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: '100%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-y-0 right-0 z-[150] w-full max-w-2xl glass-dark border-l border-white/10 shadow-2xl flex flex-col"
        >
          <div className="p-6 border-bottom border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-ocean-500 rounded-xl flex items-center justify-center font-bold text-white">
                AD
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Admin Dashboard</h2>
                <p className="text-xs text-ocean-400">Manage your portfolio content</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="p-2 text-ocean-300 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-ocean-300 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap',
                    activeTab === tab.id
                      ? 'bg-ocean-500 text-white shadow-lg shadow-ocean-500/20'
                      : 'bg-white/5 text-ocean-300 hover:bg-white/10'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'profile' ? (
                  <ProfileEditor />
                ) : (
                  <CollectionEditor
                    collectionName={activeTab}
                    fields={tabs.find((t) => t.id === activeTab)?.fields || []}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
