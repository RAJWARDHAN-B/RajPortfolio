import { useRef, useState } from "react";
import { motion } from "framer-motion";
import type { ContentItem } from "@/data/portfolio";
import ContentCard from "./ContentCard";
import DetailModal from "./DetailModal";

const SearchResults = ({ query, items }: { query: string; items: ContentItem[] }) => {
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const normalizedQuery = query.toLowerCase();
  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery)) ||
      item.category.toLowerCase().includes(normalizedQuery) ||
      item.description.toLowerCase().includes(normalizedQuery) ||
      item.longDescription.toLowerCase().includes(normalizedQuery) ||
      item.year.toLowerCase().includes(normalizedQuery)
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
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                className="relative group/card"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                viewport={{ once: true }}
              >
                <ContentCard
                  item={item}
                  onSelect={(button) => {
                    returnFocusRef.current = button;
                    setSelectedItem(item);
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}
      {selectedItem && (
        <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} returnFocusRef={returnFocusRef} />
      )}
    </div>
  );
};

export default SearchResults;
