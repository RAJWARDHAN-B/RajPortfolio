import type { ContentItem } from "@/data/portfolio";
import ContentImage from "./ContentImage";

const ContentCard = ({
  item,
  onSelect,
}: {
  item: ContentItem;
  onSelect: (button: HTMLButtonElement) => void;
}) => (
  <button
    type="button"
    aria-label={`View details for ${item.title}`}
    onClick={(event) => onSelect(event.currentTarget)}
    className="netflix-card aspect-video w-full bg-card/50 text-left shadow-lg transition-all duration-300 hover:ring-2 hover:ring-primary/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
  >
    <ContentImage item={item} />
    <div className={`absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t ${item.imageStyle ? "from-black via-black/90 to-black/40" : "from-black/90 via-black/40 to-transparent"}`}>
      <p className="text-sm font-bold text-white mb-0.5 line-clamp-1">{item.title}</p>
      <div className="flex items-center gap-2 text-[10px]">
        <span className="text-primary font-bold">{item.match}</span>
        <span className="text-gray-300 font-medium">• {item.category}</span>
      </div>
    </div>
  </button>
);

export default ContentCard;
