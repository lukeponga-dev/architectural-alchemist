/**
 * Public Gallery Component
 * Displays community designs with simple collection queries
 */

import React, { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import GlassPanel from "./GlassPanel";
import GlassButton from "./GlassButton";
import { glassmorphism } from "../styles/brand-system";
import { ShowcaseItem } from "../lib/firestore-manager";

interface PublicGalleryProps {
  onDesignSelect?: (design: ShowcaseItem) => void;
  limit?: number;
  showFeatured?: boolean;
}

const PublicGallery: React.FC<PublicGalleryProps> = ({
  onDesignSelect,
  limit = 50,
  showFeatured = true,
}) => {
  const [galleryItems, setGalleryItems] = useState<ShowcaseItem[]>([]);
  const [featuredItems, setFeaturedItems] = useState<ShowcaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    loadGallery();
  }, [limit]);

  const loadGallery = async () => {
    setLoading(true);
    try {
      const { db } = await import("../lib/firebase");
      const { default: FirestoreManager } =
        await import("../lib/firestore-manager");

      const manager = new FirestoreManager(db, "architectural-alchemist");
      const items = await manager.getPublicGallery(limit);

      // Ensure we have properly formatted dates/Timestamps
      const formattedItems = items.map((item) => ({
        ...item,
        createdAt: item.createdAt?.toDate
          ? item.createdAt.toDate()
          : new Date((item.createdAt as any) || Date.now()),
      }));

      setGalleryItems(formattedItems as any);
      setFeaturedItems(formattedItems.filter((item) => item.featured) as any);
    } catch (error) {
      console.error("Error loading gallery:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = galleryItems.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.metadata.style === selectedCategory;
    const matchesSearch =
      searchTerm === "" ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase()),
      );

    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: "all", name: "All Designs" },
    { id: "ocean-view", name: "Ocean Views" },
    { id: "forest-scene", name: "Forest Scenes" },
    { id: "city-skyline", name: "City Skylines" },
    { id: "mountain-view", name: "Mountain Views" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-cyan text-lg">Loading Gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-charcoal/90 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Community Gallery
              </h1>
              <p className="text-gray-400">
                Discover amazing architectural transformations
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Search designs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${glassmorphism.button} px-4 py-2 text-white placeholder-gray-400`}
              />

              <div className="flex gap-2">
                <GlassButton
                  onClick={() => setViewMode("grid")}
                  variant={viewMode === "grid" ? "primary" : "ghost"}
                  size="sm"
                >
                  Grid
                </GlassButton>
                <GlassButton
                  onClick={() => setViewMode("list")}
                  variant={viewMode === "list" ? "primary" : "ghost"}
                  size="sm"
                >
                  List
                </GlassButton>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map((category) => (
              <GlassButton
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                variant={selectedCategory === category.id ? "primary" : "ghost"}
                size="sm"
              >
                {category.name}
              </GlassButton>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Section */}
      {showFeatured && featuredItems.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            Featured Designs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredItems.map((item, index) => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.1 }}
              >
                <GlassPanel
                  className="overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => onDesignSelect?.(item)}
                >
                  <div className="relative">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <span className="bg-cyan text-charcoal px-2 py-1 rounded-full text-xs font-semibold">
                        Featured
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-semibold mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={item.author.photoURL}
                          alt={item.author.displayName}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-gray-300 text-sm">
                          {item.author.displayName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-400 text-sm">
                        <span className="flex items-center gap-1">
                          ❤️ {item.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          👁️ {item.views}
                        </span>
                      </div>
                    </div>
                  </div>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Main Gallery */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-white mb-6">
          {selectedCategory === "all"
            ? "All Designs"
            : categories.find((c) => c.id === selectedCategory)?.name}
          {searchTerm && ` - Search: "${searchTerm}"`}
        </h2>

        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              No designs found matching your criteria.
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredItems.map((item, index) => (
              <motion.div key={item.id} variants={itemVariants}>
                <div
                  className="group relative bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/10"
                  onClick={() => onDesignSelect?.(item)}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60" />
                    <div className="absolute top-3 left-3">
                      <span className="bg-slate-900/80 text-cyan-400 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-cyan-500/20 backdrop-blur-sm">
                        {item.metadata.style}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-white font-bold mb-1.5 line-clamp-1 group-hover:text-cyan-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-slate-400 text-xs mb-4 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between border-t border-slate-700/50 pt-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.author.photoURL}
                          alt={item.author.displayName}
                          className="w-6 h-6 rounded-full ring-1 ring-slate-600"
                        />
                        <span className="text-slate-300 text-xs font-medium">
                          {item.author.displayName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <span className="text-cyan-500/50">❤</span>{" "}
                          {item.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-purple-500/50">👁</span>{" "}
                          {item.views}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* Load More */}
      {filteredItems.length >= limit && (
        <div className="container mx-auto px-4 py-8 text-center">
          <GlassButton
            onClick={() => {
              /* Load more */
            }}
          >
            Load More Designs
          </GlassButton>
        </div>
      )}
    </div>
  );
};

export default PublicGallery;
