import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type BasicsStepProps = { 
  readonly name: string;
  readonly setName: (v: string) => void;
  readonly notes: string;
  readonly setNotes: (v: string) => void;
};

export function BasicsStep({ 
  name, setName, 
  notes, setNotes 
}: BasicsStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div>
        <h3 className="text-lg font-medium">Basic Information</h3>
        <p className="text-sm text-muted-foreground">Give this draft a memorable name to find it later.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="draft-name">Draft Name <span className="text-muted-foreground font-normal">(Optional)</span></Label>
          <Input 
            id="draft-name"
            placeholder="e.g. Weekly Restock - Koramangala Store"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="draft-notes">Internal Notes <span className="text-muted-foreground font-normal">(Optional)</span></Label>
          <Textarea 
            id="draft-notes"
            placeholder="Add any internal notes here. These won't be seen by the courier."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="resize-none"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
