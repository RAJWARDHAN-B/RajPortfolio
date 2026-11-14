import type { ContentItem } from "@/data/portfolio";

const ContentImage = ({ item, className = "" }: { item: ContentItem; className?: string }) => {
  if (!item.imageStyle) {
    return <img src={item.image} alt={item.imageAlt ?? item.title} className={`w-full h-full object-cover ${className}`} />;
  }

  return (
    <div className={`w-full h-full ${item.imageStyle === "logo-light" ? "bg-white" : "bg-[#171717]"} ${className}`}>
      <img
        src={item.image}
        alt={item.imageAlt ?? item.title}
        className="w-full h-[72%] object-contain px-4 py-2"
      />
    </div>
  );
};

export default ContentImage;
