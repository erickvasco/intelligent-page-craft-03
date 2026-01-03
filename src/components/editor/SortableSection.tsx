import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Type, List, MessageSquare, MousePointerClick, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Section {
  id: string;
  type: string;
  content: Record<string, any>;
}

interface SortableSectionProps {
  section: Section;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

const sectionIcons: Record<string, React.ElementType> = {
  hero: Type,
  features: List,
  testimonials: MessageSquare,
  cta: MousePointerClick,
  "how-it-works": Layers,
};

const sectionLabels: Record<string, string> = {
  hero: "Hero",
  features: "Features",
  testimonials: "Depoimentos",
  cta: "Call to Action",
  "how-it-works": "Como Funciona",
  footer: "Rodapé",
};

export function SortableSection({ section, isSelected, onSelect, onDelete }: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = sectionIcons[section.type] || Layers;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer",
        isDragging && "opacity-50 shadow-lg",
        isSelected
          ? "bg-primary/10 border-primary"
          : "bg-card hover:bg-muted/50 border-border"
      )}
      onClick={onSelect}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      
      <Icon className={cn("h-4 w-4", isSelected ? "text-primary" : "text-muted-foreground")} />
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {sectionLabels[section.type] || section.type}
        </p>
        {section.content?.headline && (
          <p className="text-xs text-muted-foreground truncate">
            {section.content.headline}
          </p>
        )}
        {section.content?.title && !section.content?.headline && (
          <p className="text-xs text-muted-foreground truncate">
            {section.content.title}
          </p>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </Button>
    </div>
  );
}
