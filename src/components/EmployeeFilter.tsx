import { useState } from "react";
import { Check, ChevronsUpDown, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type EmployeeOption = { id: string; ad_soyad: string; departman: string | null };

export function EmployeeFilter({
  employees,
  value,
  onChange,
}: {
  employees: EmployeeOption[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = employees.find((e) => e.id === value);

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between sm:w-[320px]"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">
                {selected ? selected.ad_soyad : "Çalışan ismine göre filtrele..."}
              </span>
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command>
            <CommandInput placeholder="İsim ara..." />
            <CommandList>
              <CommandEmpty>Çalışan bulunamadı.</CommandEmpty>
              <CommandGroup>
                {employees.map((emp) => (
                  <CommandItem
                    key={emp.id}
                    value={emp.ad_soyad + " " + (emp.departman ?? "")}
                    onSelect={() => {
                      onChange(emp.id === value ? null : emp.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === emp.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm">{emp.ad_soyad}</span>
                      {emp.departman && (
                        <span className="text-[11px] text-muted-foreground">
                          {emp.departman}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(null)}
          className="text-muted-foreground"
        >
          <X className="mr-1 h-4 w-4" /> Temizle
        </Button>
      )}
    </div>
  );
}
