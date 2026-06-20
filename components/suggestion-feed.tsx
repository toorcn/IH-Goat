import type { SilentSuggestion } from "@/lib/types";
import { Badge, EmptyState, Panel } from "./ui";

export function SuggestionFeed({ suggestions }: { suggestions: SilentSuggestion[] }) {
  return (
    <Panel title="Silent Suggestions" eyebrow="Advisor-only">
      {suggestions.length === 0 ? (
        <EmptyState>Suggestions appear here when live conversation touches known memory.</EmptyState>
      ) : (
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <article key={suggestion.id} className="rounded-lg border border-line bg-paper p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  tone={
                    suggestion.priority === "high"
                      ? "rose"
                      : suggestion.priority === "medium"
                        ? "orange"
                        : "neutral"
                  }
                >
                  {suggestion.priority}
                </Badge>
                <span className="text-xs font-medium text-muted">{suggestion.source}</span>
              </div>
              <h3 className="mt-2 font-heading text-sm font-bold text-ink">{suggestion.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted">{suggestion.reason}</p>
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}
