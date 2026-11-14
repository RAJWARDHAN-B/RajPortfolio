import type { RefObject } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Play, X } from "lucide-react";
import type { ContentItem } from "@/data/portfolio";
import { DialogDescription, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import ContentImage from "./ContentImage";

const DetailModal = ({
  item,
  onClose,
  returnFocusRef,
}: {
  item: ContentItem;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement>;
}) => (
  <DialogPrimitive.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogPortal>
      <DialogOverlay className="z-[150] bg-background/80 backdrop-blur-sm" />
      <DialogPrimitive.Content
        className="fixed left-1/2 top-1/2 z-[151] w-[calc(100%-2rem)] max-w-3xl max-h-[calc(100dvh-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-card shadow-2xl focus:outline-none"
        onCloseAutoFocus={(event) => {
          if (returnFocusRef.current?.isConnected) {
            event.preventDefault();
            returnFocusRef.current.focus();
          }
        }}
      >
        <div className="relative aspect-video">
          <ContentImage item={item} />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          <DialogPrimitive.Close
            aria-label="Close details"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-card/80 flex items-center justify-center hover:bg-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <X className="w-5 h-5 text-foreground" />
          </DialogPrimitive.Close>
          <div className="absolute bottom-6 left-6 right-6">
            <DialogTitle className="font-display text-3xl md:text-5xl text-foreground text-shadow-hero mb-3">
              {item.title}
            </DialogTitle>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-2 rounded-sm font-semibold text-sm hover:bg-foreground/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                View
              </a>
            )}
          </div>
        </div>
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-primary font-bold">{item.match}</span>
            <span className="text-muted-foreground text-sm">{item.year}</span>
            <span className="border border-muted-foreground text-muted-foreground text-xs px-2 py-0.5 rounded">
              {item.category}
            </span>
          </div>
          <DialogDescription className="text-foreground/90 leading-relaxed mb-6">
            {item.longDescription}
          </DialogDescription>
          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground mb-1">
              <span className="text-foreground/70">Technologies: </span>
              {item.tags.join(", ")}
            </p>
          </div>
        </div>
      </DialogPrimitive.Content>
    </DialogPortal>
  </DialogPrimitive.Root>
);

export default DetailModal;
