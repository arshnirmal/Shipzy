import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, Info } from "lucide-react";
import { format, isBefore, setHours, setMinutes, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import type { DraftSchedule } from "@/types/business";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ScheduleStepProps = {
  readonly schedule: DraftSchedule;
  readonly onChange: (v: DraftSchedule) => void;
};

// Generate time slots (e.g. 09:00, 09:30, ...)
const TIME_SLOTS = Array.from({ length: 48 }).map((_, i) => {
  const h = Math.floor(i / 2);
  const m = (i % 2) * 30;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
});

export function ScheduleStep({ schedule, onChange }: ScheduleStepProps) {
  const selectedDate = schedule.pickupAt ? new Date(schedule.pickupAt) : undefined;
  const [timeStr, setTimeStr] = useState<string>(
    selectedDate ? format(selectedDate, "HH:mm") : "09:00"
  );

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange({ ...schedule, pickupAt: null });
      return;
    }
    
    // Apply time to selected date
    const [h, m] = timeStr.split(":").map(Number);
    const finalDate = setMinutes(setHours(date, h), m);
    onChange({ ...schedule, pickupAt: finalDate.toISOString() });
  };

  const handleTimeSelect = (t: string) => {
    setTimeStr(t);
    if (selectedDate) {
      const [h, m] = t.split(":").map(Number);
      const finalDate = setMinutes(setHours(selectedDate, h), m);
      onChange({ ...schedule, pickupAt: finalDate.toISOString() });
    }
  };

  const clearSchedule = () => {
    onChange({ ...schedule, pickupAt: null });
  };

  const isScheduled = !!schedule.pickupAt;
  const now = new Date();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div>
        <h3 className="text-lg font-medium">Pickup Schedule (Optional)</h3>
        <p className="text-sm text-muted-foreground">Leave blank to request a courier immediately upon submission.</p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <Label>Pickup Date & Time</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Popover>
                  <PopoverTrigger render={
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full sm:w-[240px] justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    />
                  }>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      disabled={(date) => isBefore(date, startOfDay(now))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Select value={timeStr} onValueChange={(t) => t && handleTimeSelect(t)} disabled={!selectedDate}>
                  <SelectTrigger className="w-full sm:w-[120px]">
                    <Clock className="w-4 h-4 mr-2 text-muted-foreground"/>
                    <SelectValue placeholder="Time" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {TIME_SLOTS.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isScheduled && (
               <Button variant="ghost" size="sm" onClick={clearSchedule} className="text-destructive h-8 px-2 mt-2">
                 Clear Schedule (Send Now)
               </Button>
            )}
          </div>

          <div className="hidden sm:block w-px bg-border" />

          <div className="flex-1">
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 size-5 text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300">How Scheduled Orders Work</p>
                  <p className="text-xs text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                    If you schedule this order for more than 30 minutes in the future, it will be placed in a <strong>Scheduled</strong> state. 
                    Our system will automatically release it to find a courier 30 minutes before your requested pickup time.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
