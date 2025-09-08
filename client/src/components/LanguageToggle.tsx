import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/i18n";

export function LanguageToggle() {
  const { lang, setLang, availableLangs } = useI18n();
  const labels: Record<string, string> = { en: "English", de: "Deutsch" };

  return (
    <Select value={lang} onValueChange={(v) => setLang(v as string)}>
      <SelectTrigger className="w-[120px]">
        <SelectValue placeholder={labels[lang] || lang.toUpperCase()} />
      </SelectTrigger>
      <SelectContent>
        {availableLangs.map((code) => (
          <SelectItem key={code} value={code}>
            {labels[code] || code.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
