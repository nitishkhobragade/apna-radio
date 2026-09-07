import React, { useState } from 'react';
import { extractPlaylistId } from '../utils/youtube';
import { X, Music, AlertCircle, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

interface AddPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlaylist: (urlOrId: string) => Promise<{ success: boolean; message: string }>;
}

export const AddPlaylistModal: React.FC<AddPlaylistModalProps> = ({
  isOpen,
  onClose,
  onAddPlaylist,
}) => {
  const [urlInput, setUrlInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [statusStep, setStatusStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdd = async (linkToUse?: string) => {
    setErrorMessage(null);

    const raw = (linkToUse !== undefined ? linkToUse : urlInput).trim();
    if (!raw) {
      setErrorMessage('कृपया YouTube playlist लिंक दर्ज करें (Please paste a YouTube playlist URL).');
      return;
    }

    const playlistId = extractPlaylistId(raw);
    if (!playlistId) {
      setErrorMessage('अरे! यह लिंक अमान्य है। कृपया वैध YouTube playlist लिंक डालें (Invalid YouTube Playlist link).');
      return;
    }

    setLoading(true);
    setStatusStep('Fetching public playlist dataset from YouTube...');

    // Small timer steps to give visual feedback of the dynamic extraction loop
    const stepTimer = setTimeout(() => {
      setStatusStep('Extracting titles, durations, thumbnails & artist metadata...');
    }, 900);

    try {
      const result = await onAddPlaylist(raw);
      clearTimeout(stepTimer);
      if (result.success) {
        setUrlInput('');
        setStatusStep('');
        onClose();
      } else {
        setErrorMessage(result.message);
      }
    } catch {
      clearTimeout(stepTimer);
      setErrorMessage('अरे! कुछ समस्या आई। कृपया पुनः प्रयास करें।');
    } finally {
      setLoading(false);
      setStatusStep('');
    }
  };

  const handleQuickSelect = (url: string) => {
    setUrlInput(url);
    handleAdd(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none animate-in fade-in duration-200">
      {/* Vintage Postal Card / Courier Slip Modal Box */}
      <div
        className="relative w-full max-w-lg rounded-xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.95)] border-4 border-[#6e4624] overflow-hidden"
        style={{
          backgroundColor: '#faeed4',
          backgroundImage: `
            radial-gradient(circle at 10% 10%, rgba(200,160,110,0.2) 0%, transparent 60%),
            repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(160,120,70,0.12) 28px, rgba(160,120,70,0.12) 29px)
          `,
          boxShadow: 'inset 0 0 40px rgba(110,70,30,0.25), 0 20px 50px rgba(0,0,0,0.9)',
        }}
      >
        {/* Postal Stamp Badge at top right */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <div className="hidden sm:flex flex-col items-center justify-center w-14 h-16 border-2 border-dashed border-[#8c2d1b] p-1 text-center rotate-3 bg-[#faecd6]">
            <span className="text-[8px] font-mono text-[#8c2d1b] uppercase">INDIA POST</span>
            <span className="text-xs font-bold text-[#8c2d1b]">10 p</span>
            <span className="text-[7px] text-[#8c2d1b]">RADIO MAIL</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#3d2414] text-[#faeed4] hover:bg-[#633a20] flex items-center justify-center cursor-pointer transition-colors shadow-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Title */}
        <div className="border-b-2 border-[#825c34]/40 pb-3 mb-5 pr-14">
          <div className="flex items-center gap-2 text-xs font-serif font-bold text-[#8c2d1b] uppercase tracking-wider">
            <Music className="w-4 h-4 text-[#8c2d1b]" />
            <span>रेडियो कैसेट संग्रह (Radio Cassette Vault)</span>
          </div>
          <h2
            className="text-2xl sm:text-3xl font-black text-[#381f10] mt-0.5 tracking-tight font-serif"
            style={{ fontFamily: "'Yatra One', 'Rozha One', serif" }}
          >
            Add YouTube Playlist
          </h2>
          <p className="text-xs text-[#6e4a2c] font-sans mt-1">
            किसी भी सार्वजनिक YouTube playlist का लिंक डालें — नाम, अवधि (duration), थंबनेल स्वतः आ जाएंगे!
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold font-serif uppercase tracking-wider text-[#402312] mb-1.5 flex items-center justify-between">
              <span>Paste YouTube playlist URL</span>
              <span className="text-[10px] text-[#8c2d1b] font-normal normal-case flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#d97706]" /> 100% Free • No API Key Needed
              </span>
            </label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="https://youtube.com/playlist?list=PL..."
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-md bg-[#fffaf0] border-2 border-[#9e744b] text-[#291407] placeholder-[#a68668] text-xs sm:text-sm focus:outline-none focus:border-[#8c2d1b] shadow-inner font-mono"
            />
          </div>

          {/* Quick preset chips to try with 1-click */}
          <div>
            <span className="text-[11px] font-mono font-bold text-[#5c3c1e] block mb-1">
              क्लिक करके तुरंत आज़माएं (One-Click Examples):
            </span>
            <div className="space-y-1.5">
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  handleQuickSelect('https://youtube.com/playlist?list=PLv_CqV-_-qijqIst653OSSKo-8UG4-OWd')
                }
                className="w-full text-left p-2 rounded-md bg-[#f4e4c7] hover:bg-[#ebd3ac] border border-[#b8956c] text-[#331c0a] text-[11px] font-mono transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div className="truncate pr-2">
                  <span className="font-bold text-[#8c2d1b]">OLD IS GOLD (99+ Songs):</span>{' '}
                  <span className="opacity-80">https://youtube.com/playlist?list=PLv_CqV-_-qijqIst653OSSKo-8UG4-OWd</span>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded bg-[#8c2d1b] text-white text-[9px] font-sans font-bold group-hover:bg-[#a63722]">
                  LOAD
                </span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  handleQuickSelect('https://www.youtube.com/playlist?list=PLFgquLnL59alGJcdc0BEZJb2p7IgkL0Ce')
                }
                className="w-full text-left p-2 rounded-md bg-[#f4e4c7] hover:bg-[#ebd3ac] border border-[#b8956c] text-[#331c0a] text-[11px] font-mono transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div className="truncate pr-2">
                  <span className="font-bold text-[#8c2d1b]">Top Hindi Classics:</span>{' '}
                  <span className="opacity-80">https://www.youtube.com/playlist?list=PLFgquLnL59alGJcdc0BEZJb2p7IgkL0Ce</span>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded bg-[#8c2d1b] text-white text-[9px] font-sans font-bold group-hover:bg-[#a63722]">
                  LOAD
                </span>
              </button>
            </div>
          </div>

          {/* Loading status progress indicator */}
          {loading && (
            <div className="p-3 rounded-md bg-[#fff7e6] border-2 border-[#e6b359] text-[#734b10] text-xs animate-in fade-in flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin shrink-0 text-[#b47119]" />
              <div className="min-w-0 flex-1">
                <p className="font-bold font-serif">{statusStep || 'धुनें खोजी जा रही हैं...'}</p>
                <p className="text-[10px] opacity-80 mt-0.5">
                  Dynamic loop running: extracting titles, song lengths, video IDs & artwork...
                </p>
              </div>
            </div>
          )}

          {/* Error message box */}
          {errorMessage && (
            <div className="p-3 rounded-md bg-[#fbeae6] border-2 border-[#d9534f] text-[#8c2321] text-xs font-sans flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#d9534f]" />
              <div>
                <p className="font-bold">{errorMessage}</p>
                <p className="text-[11px] text-[#6b1e1c] mt-0.5">
                  सुनिश्चित करें कि YouTube playlist &quot;Public&quot; है।
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#825c34]/30">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-md border-2 border-[#825c34] text-[#4a2e19] font-serif font-bold text-xs uppercase tracking-wider hover:bg-[#efe0c3] transition-colors cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-md bg-gradient-to-b from-[#8c2d1b] to-[#631c0e] text-[#fbf1dc] font-serif font-black text-xs uppercase tracking-wider hover:from-[#a33520] hover:to-[#782312] border border-[#ffb1a3] shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>लोड हो रहा है...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ADD & PLAY</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
