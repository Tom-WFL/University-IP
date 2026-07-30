import { Info, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { PageTitle, PrototypeNote } from '@/components/shared/primitives';
import { useDemo } from '@/store/DemoStore';

/**
 * UIP-6 / UIP-18 / UIP-22 — the settings where two institutions visibly differ.
 * Switching between the two IP Manager personas shows different values here, which is the
 * cheapest way to make the per-institution configurability question concrete.
 */
export default function InstitutionSettings() {
  const { institution, updateInstitution } = useDemo();
  if (!institution) return null;

  return (
    <div className="space-y-6">
      <PageTitle title={`Institution Settings — ${institution.shortName}`} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Release policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={institution.releasePolicy}
            onValueChange={(v) => {
              updateInstitution(institution.id, { releasePolicy: v as 'staged' | 'wide_net' });
              toast({ title: 'Release policy updated' });
            }}
            className="gap-3"
          >
            <label className="flex cursor-pointer items-start gap-3">
              <RadioGroupItem value="staged" id="pol-staged" className="mt-1" />
              <span>
                <span className="block text-sm font-medium text-gray-900">Staged — campus first</span>
                <span className="block text-xs text-gray-500">
                  Release to our own would-be entrepreneurs, let it sit, then widen to statewide and the national
                  network. Skipping a tier asks for confirmation.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3">
              <RadioGroupItem value="wide_net" id="pol-wide" className="mt-1" />
              <span>
                <span className="block text-sm font-medium text-gray-900">Wide net — straight to the network</span>
                <span className="block text-xs text-gray-500">
                  We do not care where the founder comes from; we want someone to take it on.
                </span>
              </span>
            </label>
          </RadioGroup>
          <PrototypeNote>
            How long an IP should sit at each tier before it escalates, and whether escalation is automatic, was left
            open at the meeting.
          </PrototypeNote>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Inventor involvement policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-start justify-between gap-4">
            <span>
              <span className="block text-sm font-medium text-gray-900">Force contact-only</span>
              <span className="block text-xs text-gray-500">
                Inventors are listed as a contact and cannot be set as hands-on co-founders. Whoever takes the idea
                runs with it.
              </span>
            </span>
            <Switch
              checked={institution.forceContactOnly}
              onCheckedChange={(v) => {
                updateInstitution(institution.id, { forceContactOnly: v });
                toast({
                  title: v ? 'Inventors are contact-only' : 'Inventors can choose to be involved',
                  description: v
                    ? 'Existing records set to “involved” were left as they are.'
                    : undefined,
                });
              }}
            />
          </label>
          {institution.forceContactOnly && (
            <p className="flex items-start gap-2 rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
              The involvement option is hidden from inventors while this is on. Whether the inventor should be told is
              undecided.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>IP ownership</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            {institution.ownershipNote}
          </p>
          <p className="mt-3 text-xs text-gray-500">
            Recorded as a note, not enforced logic. How North Dakota actually works is still unknown, and the other
            Great Plains Hub states — Kansas, Wyoming, Montana — have not been checked at all.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Non-disclosure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-gray-700">
            Every founder accepts a blanket NDA (v1.0) before reading any concept summary. Always on.
          </p>
          <PrototypeNote>
            Open from the meeting: whether the NDA is per-IP or one agreement per person, where the document lives, and
            whether each institution supplies its own template. Equity and revenue sharing between the university and
            the founder was raised and explicitly parked — nothing here covers it.
          </PrototypeNote>
        </CardContent>
      </Card>
    </div>
  );
}
