import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ContentItem } from "@/data/portfolio";
import ContentCard from "./ContentCard";
import DetailModal from "./DetailModal";

const ContentRow = ({ title, items }: { title: string; items: ContentItem[] }) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  const scroll = (dir: "left" | "right") => {
    if (!rowRef.current) return;
    const amount = rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <>
      <div className="mb-8 group/row">
        <h2 className="netflix-section-title text-foreground">{title}</h2>
        <div className="relative">
          <button
            type="button"
            aria-label={`Scroll ${title} left`}
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-8 z-40 w-12 bg-background/50 opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary transition-opacity flex items-center justify-center"
          >
            <ChevronLeft className="w-8 h-8 text-foreground" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Scroll ${title} right`}
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-8 z-40 w-12 bg-background/50 opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary transition-opacity flex items-center justify-center"
          >
            <ChevronRight className="w-8 h-8 text-foreground" aria-hidden="true" />
          </button>
          <div ref={rowRef} className="netflix-row">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                className="flex-shrink-0 w-[85%] sm:w-[45%] md:w-[30%] lg:w-[22%] relative group/card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
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
      </div>
      {selectedItem && (
        <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} returnFocusRef={returnFocusRef} />
      )}
    </>
  );
};

export default ContentRow;
