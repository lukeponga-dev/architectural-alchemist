/**
 * Design Detail Modal
 * Full-screen modal for viewing design details with before/after comparison
 */

import React, { useEffect, useState } from "react";
import { ShowcaseItem } from "../../lib";

interface DesignDetailModalProps {
  design: ShowcaseItem | null;
  onClose: () => void;
}

const DesignDetailModal: React.FC<DesignDetailModalProps> = ({
  design,
  onClose,
}) => {
  const [showAfter, setShowAfter] = useState(false);
  const [likes, setLikes] = useState(0);

  useEffect(() => {
    if (design) {
      setLikes(design.likes || 0);
      // Prevent background scroll while modal is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [design]);

  if (!design) return null;

  const handleLike = async () => {
    try {
      const { db, FirestoreManager } = await import("../../lib");
      const manager = new FirestoreManager(db, "architectural-alchemist");
      if (design.id) {
        const newLikes = await manager.toggleLike(design.id);
        setLikes(newLikes);
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-slate-900/95 border border-slate-700/60 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-cyan-500/5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-all border border-slate-600/40"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Image Section */}
        <div className="relative aspect-video overflow-hidden rounded-t-2xl bg-slate-800">
          <img
            src={
              showAfter
                ? design.afterImage
                : design.beforeImage || design.thumbnail
            }
            alt={design.title}
            className="w-full h-full object-cover transition-opacity duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />

          {/* Before/After Toggle */}
          {design.beforeImage &&
            design.afterImage &&
            design.beforeImage !== design.afterImage && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex rounded-full bg-slate-900/80 backdrop-blur-sm border border-slate-600/40 p-0.5">
                <button
                  onClick={() => setShowAfter(false)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${!showAfter ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"}`}
                >
                  Before
                </button>
                <button
                  onClick={() => setShowAfter(true)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${showAfter ? "bg-purple-500 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  After
                </button>
              </div>
            )}

          {/* Style Badge */}
          <div className="absolute top-4 left-4">
            <span className="bg-slate-900/80 text-cyan-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-cyan-500/20 backdrop-blur-sm">
              {design.metadata?.style || "Original"}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* Title & Author */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {design.title || design.name || "Untitled Design"}
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                {design.description}
              </p>
            </div>
          </div>

          {/* Author & Stats Row */}
          <div className="flex items-center justify-between py-4 border-t border-b border-slate-700/40">
            <div className="flex items-center gap-3">
              {design.author?.photoURL && (
                <img
                  src={design.author.photoURL}
                  alt={design.author.displayName}
                  className="w-8 h-8 rounded-full ring-2 ring-slate-600"
                />
              )}
              <div>
                <span className="text-slate-200 text-sm font-medium">
                  {design.author?.displayName || "Anonymous"}
                </span>
                <p className="text-slate-500 text-xs">
                  {design.createdAt?.toDate
                    ? design.createdAt.toDate().toLocaleDateString()
                    : design.createdAt instanceof Date
                      ? design.createdAt.toLocaleDateString()
                      : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/40 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all text-sm"
              >
                <span>❤️</span> {likes}
              </button>
              <span className="flex items-center gap-1.5 text-slate-500 text-sm">
                <span>👁️</span> {design.views || 0}
              </span>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
              <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold mb-1">
                Room Type
              </p>
              <p className="text-slate-200 text-sm font-medium">
                {design.metadata?.roomType || "N/A"}
              </p>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
              <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold mb-1">
                Style
              </p>
              <p className="text-slate-200 text-sm font-medium">
                {design.metadata?.style || "N/A"}
              </p>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
              <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold mb-1">
                Type
              </p>
              <p className="text-slate-200 text-sm font-medium">
                {design.metadata?.transformationType || "N/A"}
              </p>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
              <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold mb-1">
                Processing
              </p>
              <p className="text-slate-200 text-sm font-medium">
                {design.metadata?.processingTime
                  ? `${design.metadata.processingTime}ms`
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Materials & Colors */}
          {(design.metadata?.materials?.length ||
            design.metadata?.colors?.length) && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {design.metadata?.materials &&
                  design.metadata.materials.length > 0 && (
                    <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
                      <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold mb-2">
                        Materials
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {design.metadata.materials.map((material, i) => (
                          <span
                            key={i}
                            className="bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded-full text-xs"
                          >
                            {material}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                {design.metadata?.colors && design.metadata.colors.length > 0 && (
                  <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
                    <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold mb-2">
                      Colors
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {design.metadata.colors.map((color, i) => (
                        <span
                          key={i}
                          className="bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded-full text-xs"
                        >
                          {color}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Tags */}
          {design.tags && design.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {design.tags.map((tag, i) => (
                <span
                  key={i}
                  className="bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-full text-xs font-medium border border-cyan-500/20"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesignDetailModal;
