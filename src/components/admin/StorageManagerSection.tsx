import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext.tsx';
import { useRadio } from '../../context/RadioContext.tsx';
import {
  HardDrive,
  Copy,
  FolderSync,
  Trash2,
  Check,
  AlertTriangle,
  FolderTree,
  Sliders,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';

export const StorageManagerSection: React.FC = () => {
  const {
    storageData,
    refreshStorage,
    updateStorageSettings,
    cleanOrphans,
    duplicates,
    refreshDuplicates,
  } = useAdmin();
  const { refreshLibrary, deleteTrack } = useRadio();

  const [folderTemplate, setFolderTemplate] = useState<any>('{artist} - {title}');
  const [rescanStatus, setRescanStatus] = useState<string | null>(null);
  const [cleanStatus, setCleanStatus] = useState<string | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);

  useEffect(() => {
    refreshStorage();
    refreshDuplicates();
  }, [refreshStorage, refreshDuplicates]);

  useEffect(() => {
    if (storageData?.settings?.folderTemplate) {
      setFolderTemplate(storageData.settings.folderTemplate);
    }
  }, [storageData]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 MB';
    if (bytes > 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSaveTemplate = async () => {
    await updateStorageSettings({ folderTemplate });
    setRescanStatus('Storage organization template updated.');
    setTimeout(() => setRescanStatus(null), 3000);
  };

  const handleCleanOrphans = async () => {
    setIsCleaning(true);
    const res = await cleanOrphans();
    setIsCleaning(false);
    if (res.success) {
      setCleanStatus(`Cleaned ${res.removedCount} orphaned database entries.`);
      await refreshStorage();
      await refreshLibrary();
      setTimeout(() => setCleanStatus(null), 4000);
    }
  };

  const handleRemoveDuplicate = async (trackId: string) => {
    await deleteTrack(trackId, true);
    await refreshDuplicates();
    await refreshStorage();
    await refreshLibrary();
  };

  return (
    <div className="bg-[#ece6d8] border border-[#3e3831] p-5 shadow-[2px_2px_0px_#3e3831] space-y-6">
      <div className="border-b border-[#3e3831] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#2d2722]">
            Storage Manager & Duplicate Detection
          </h2>
          <p className="text-xs font-mono text-[#746b60]">
            Disk allocation, folder hierarchy templates, duplicate collision resolver, and orphan cleaner
          </p>
        </div>
      </div>

      {rescanStatus && (
        <div className="p-2.5 bg-[#e0edd8] border border-[#557b42] text-xs font-mono text-[#2d4b1f] flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{rescanStatus}</span>
        </div>
      )}

      {cleanStatus && (
        <div className="p-2.5 bg-[#e0edd8] border border-[#557b42] text-xs font-mono text-[#2d4b1f] flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{cleanStatus}</span>
        </div>
      )}

      {/* Storage Allocation Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 border border-[#3e3831] bg-[#e4dfd1]/60">
          <span className="text-[10px] font-mono uppercase text-[#746b60] block">
            Audio Files (/data/music/)
          </span>
          <span className="text-2xl font-serif font-bold text-[#2d2722] tabular-nums">
            {formatFileSize(storageData?.metrics?.musicBytes)}
          </span>
        </div>

        <div className="p-3 border border-[#3e3831] bg-[#e4dfd1]/60">
          <span className="text-[10px] font-mono uppercase text-[#746b60] block">
            Artwork Cache (/data/artwork/)
          </span>
          <span className="text-2xl font-serif font-bold text-[#2d2722] tabular-nums">
            {formatFileSize(storageData?.metrics?.artworkBytes)}
          </span>
        </div>

        <div className="p-3 border border-[#3e3831] bg-[#e4dfd1]/60">
          <span className="text-[10px] font-mono uppercase text-[#746b60] block">
            Integrity Status
          </span>
          <span className="text-xs font-mono font-bold text-[#2d2722] block mt-1">
            {storageData?.missingCount || 0} missing files · {storageData?.unindexedCount || 0} unindexed files
          </span>
        </div>
      </div>

      {/* Folder Organization Template Selector */}
      <div className="border border-[#3e3831] bg-[#e4dfd1]/40 p-4 space-y-3 font-mono text-xs">
        <div className="flex items-center gap-2 font-bold text-[#2d2722]">
          <FolderTree className="w-4 h-4 text-[#c52838]" />
          <span>Storage Organization & Naming Template</span>
        </div>
        <p className="text-[#544d44] text-[11px]">
          Configure how yt-dlp and uploaded audio files are organized on the host volume:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <label className="border border-[#3e3831] p-3 bg-[#ece6d8] flex items-start gap-2.5 cursor-pointer">
            <input
              type="radio"
              name="template"
              value="{artist} - {title}"
              checked={folderTemplate === '{artist} - {title}'}
              onChange={(e) => setFolderTemplate(e.target.value)}
              className="mt-0.5 rounded-none"
            />
            <div>
              <div className="font-bold text-[#2d2722]">Flat Artist-Title Pattern</div>
              <code className="text-[10px] text-[#746b60]">
                /data/music/&#123;artist&#125; - &#123;title&#125;.mp3
              </code>
            </div>
          </label>

          <label className="border border-[#3e3831] p-3 bg-[#ece6d8] flex items-start gap-2.5 cursor-pointer">
            <input
              type="radio"
              name="template"
              value="{genre}/{artist}/{album}/{title}"
              checked={folderTemplate === '{genre}/{artist}/{album}/{title}'}
              onChange={(e) => setFolderTemplate(e.target.value)}
              className="mt-0.5 rounded-none"
            />
            <div>
              <div className="font-bold text-[#2d2722]">Structured Genre / Album Hierarchy</div>
              <code className="text-[10px] text-[#746b60]">
                /data/music/&#123;genre&#125;/&#123;artist&#125;/&#123;album&#125;/&#123;title&#125;.mp3
              </code>
            </div>
          </label>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={handleSaveTemplate}
            className="px-3 py-1 bg-[#c52838] text-white border border-[#3e3831] font-semibold"
          >
            Save Template Setting
          </button>
        </div>
      </div>

      {/* Library Maintenance & Orphan Cleaner */}
      <div className="border border-[#3e3831] bg-[#e4dfd1]/40 p-4 font-mono text-xs space-y-3">
        <h3 className="font-bold text-[#2d2722] flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-[#c52838]" />
          <span>Library Maintenance & Orphan Cleaner</span>
        </h3>
        <p className="text-[11px] text-[#544d44]">
          Clean stale database references where the underlying media file was moved or deleted from disk.
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCleanOrphans}
            disabled={isCleaning}
            className="px-3 py-1.5 border border-[#3e3831] bg-[#ece6d8] hover:bg-[#dcd6c7] text-[#2d2722] flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#c52838]" />
            <span>{isCleaning ? 'Cleaning...' : 'Remove Orphaned Database Records'}</span>
          </button>
        </div>
      </div>

      {/* Duplicate Candidates List */}
      <div className="border border-[#3e3831] bg-[#e4dfd1]/40 p-4 font-mono text-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[#2d2722] flex items-center gap-2">
            <Copy className="w-4 h-4 text-[#c52838]" />
            <span>Detected Duplicate Candidates ({duplicates.length})</span>
          </h3>
          <button
            onClick={refreshDuplicates}
            className="text-[11px] text-[#c52838] hover:underline"
          >
            Re-run Checksum & Similarity Audit
          </button>
        </div>

        {duplicates.length === 0 ? (
          <p className="text-center py-4 text-[#746b60]">
            No duplicate audio candidates detected in library.
          </p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {duplicates.map((dup, idx) => (
              <div
                key={idx}
                className="p-3 border border-[#3e3831] bg-[#ece6d8] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-[#c52838] border border-[#c52838] px-1.5 py-0.2">
                      {dup.reason.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-[#746b60]">
                      Confidence: {(dup.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-1 font-serif font-bold text-[#2d2722]">
                    "{dup.trackA.title}" by {dup.trackA.artist}
                  </div>
                  <div className="text-[11px] text-[#746b60]">
                    Conflicts with: "{dup.trackB.title}" by {dup.trackB.artist}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleRemoveDuplicate(dup.trackB.id)}
                    className="px-2.5 py-1 border border-[#3e3831] bg-[#fae2e4] text-[#c52838] hover:bg-[#c52838] hover:text-white"
                  >
                    Delete Track B
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
