import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Plus, ThumbsUp, ChevronDown } from "lucide-react";
import { ContentItem, DetailModal } from "./ContentRow";

const SearchResults = ({ query, items }: { query: string; items: ContentItem[] }) => {
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

    const filteredItems = items.filter(
        (item) =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase())) ||
            item.category.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#141414] pt-24 pb-20 px-4 md:px-12">
            <div className="mb-6">
                <h2 className="text-xl md:text-2xl font-medium text-gray-400">
                    Search results for: <span className="text-white font-bold">"{query}"</span>
                </h2>
            </div>

            {filteredItems.length === 0 ? (
                <div className="text-center mt-20 text-gray-400">
                    <p className="text-xl">Your search for "{query}" did not find any matches.</p>
                    <p className="mt-4 text-sm">Suggestions:</p>
                    <ul className="text-sm mt-2">
                        <li>Try different keywords</li>
                        <li>Looking for a specific technology? Try "React", "Python", etc.</li>
                        <li>Try "Web App" or "Portfolio"</li>
                    </ul>
                </div>
            ) : (
                <div className="max-w-[1400px] mx-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-y-16 gap-x-3 md:gap-x-4">
                        {filteredItems.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                className="relative flex flex-col group/card cursor-pointer"
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05, duration: 0.4 }}
                                viewport={{ once: true }}
                                onMouseEnter={() => setHoveredId(item.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                onClick={() => setSelectedItem(item)}
                            >
                                <div className="netflix-card aspect-video bg-card/50 w-full overflow-hidden border border-white/5 group-hover/card:z-50 group-hover/card:shadow-2xl group-hover/card:ring-2 ring-primary/50 transition-all duration-300">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-cover transform transition-transform duration-500 group-hover/card:scale-105"
                                    />

                                    {/* Default info shown without hover */}
                                    <div className={`absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 ${hoveredId === item.id ? 'opacity-0' : 'opacity-100'}`}>
                                        <p className="text-xs font-bold text-white mb-0.5 line-clamp-1">{item.title}</p>
                                        <div className="flex items-center gap-2 text-[9px]">
                                            <span className="text-primary font-bold">{item.match}</span>
                                            <span className="text-gray-300 font-medium">• {item.category}</span>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {hoveredId === item.id && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/20 flex flex-col justify-end p-3 backdrop-blur-[1px] z-[100]"
                                            >
                                                <div className="flex gap-2 mb-2">
                                                    <button
                                                        className="w-7 h-7 rounded-full bg-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (item.url) window.open(item.url, "_blank");
                                                        }}
                                                    >
                                                        <Play className="w-3.5 h-3.5 text-black fill-current ml-0.5" />
                                                    </button>
                                                    <button className="w-7 h-7 rounded-full bg-[#2a2a2a]/80 border border-gray-400/30 flex items-center justify-center hover:bg-[#2a2a2a] hover:border-white transition-all">
                                                        <Plus className="w-3.5 h-3.5 text-white" />
                                                    </button>
                                                    <button className="w-7 h-7 rounded-full bg-[#2a2a2a]/80 border border-gray-400/30 flex items-center justify-center hover:bg-[#2a2a2a] hover:border-white transition-all">
                                                        <ThumbsUp className="w-3.5 h-3.5 text-white" />
                                                    </button>
                                                    <button
                                                        className="w-7 h-7 rounded-full bg-[#2a2a2a]/80 border border-gray-400/30 flex items-center justify-center hover:bg-[#2a2a2a] hover:border-white transition-all ml-auto"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedItem(item);
                                                        }}
                                                    >
                                                        <ChevronDown className="w-3.5 h-3.5 text-white" />
                                                    </button>
                                                </div>
                                                <p className="text-xs font-bold text-white mb-0.5">{item.title}</p>
                                                <p className="text-[10px] text-primary font-bold mb-1">{item.match}</p>
                                                <div className="flex gap-1.5 mt-1 flex-wrap">
                                                    {item.tags.slice(0, 3).map((tag) => (
                                                        <span key={tag} className="text-[9px] text-gray-400">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {selectedItem && (
                <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
            )}
        </div>
    );
};

export default SearchResults;
