import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { useDemo } from '@/store/DemoStore';
import { CLASSIFICATIONS } from '@/data/seed';
import type { Inventor } from '@/store/types';

/** UIP-3 — single disclosure entry. Lands Private by default (UIP-5). */
export function AddIpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { addIp, persona, institution } = useDemo();
  const [title, setTitle] = React.useState('');
  const [disclosureDate, setDisclosureDate] = React.useState('');
  const [classification, setClassification] = React.useState(CLASSIFICATIONS[0]);
  const [keywords, setKeywords] = React.useState('');
  const [internal, setInternal] = React.useState('');
  const [inventors, setInventors] = React.useState<Inventor[]>([{ name: '', email: '', retired: false }]);
  const [touched, setTouched] = React.useState(false);

  const valid = title.trim() && disclosureDate && inventors.some((i) => i.name.trim());

  const reset = () => {
    setTitle('');
    setDisclosureDate('');
    setClassification(CLASSIFICATIONS[0]);
    setKeywords('');
    setInternal('');
    setInventors([{ name: '', email: '', retired: false }]);
    setTouched(false);
  };

  const submit = () => {
    setTouched(true);
    if (!valid || !persona.institutionId) return;
    const rec = addIp({
      title: title.trim(),
      inventors: inventors.filter((i) => i.name.trim()),
      disclosureDate,
      classification,
      keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
      internalDescription: internal.trim(),
      institutionId: persona.institutionId,
      source: 'manual',
    });
    toast({
      title: `Added as Private — IP #${rec.displayNo}`,
      description: `Nobody outside ${institution?.shortName ?? 'your university'} can see it until you release it.`,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add IP disclosure</DialogTitle>
          <DialogDescription>
            New records land Private. Nothing is visible to founders until you generate a summary, approve it, and
            release it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Adaptive Prosthetic Socket Liner"
              className={touched && !title.trim() ? 'border-red-400' : ''}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="disclosed">
                Disclosure date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="disclosed"
                type="date"
                value={disclosureDate}
                onChange={(e) => setDisclosureDate(e.target.value)}
                className={touched && !disclosureDate ? 'border-red-400' : ''}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Classification</Label>
              <Select value={classification} onValueChange={setClassification}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLASSIFICATIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Inventors <span className="text-red-500">*</span>
            </Label>
            {inventors.map((inv, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-2">
                <Input
                  placeholder="Name"
                  className="min-w-[140px] flex-1"
                  value={inv.name}
                  onChange={(e) =>
                    setInventors((s) => s.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))
                  }
                />
                <Input
                  placeholder="Email"
                  className="min-w-[160px] flex-1"
                  value={inv.email ?? ''}
                  onChange={(e) =>
                    setInventors((s) => s.map((x, i) => (i === idx ? { ...x, email: e.target.value } : x)))
                  }
                />
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <Checkbox
                    checked={!!inv.retired}
                    onCheckedChange={(v) =>
                      setInventors((s) => s.map((x, i) => (i === idx ? { ...x, retired: !!v } : x)))
                    }
                  />
                  Retired
                </label>
                {inventors.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setInventors((s) => s.filter((_, i) => i !== idx))}
                    aria-label="Remove inventor"
                  >
                    <Trash2 className="h-4 w-4 text-gray-400" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInventors((s) => [...s, { name: '', email: '', retired: false }])}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add inventor
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="keywords">Keywords</Label>
            <Input
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="comma, separated, keywords"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="internal">Internal description</Label>
            <Textarea
              id="internal"
              value={internal}
              onChange={(e) => setInternal(e.target.value)}
              className="min-h-[110px] resize-y"
              placeholder="How it actually works. Never shown to founders."
            />
            <p className="text-xs text-gray-500">
              Internal only. The founder-facing summary is generated separately and approved by you.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Add as Private</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
