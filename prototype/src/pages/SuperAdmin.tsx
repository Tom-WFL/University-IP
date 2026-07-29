import { useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusChip } from '@/components/shared/chips';
import { FadeIn, Stagger } from '@/components/shared/motion';
import { useStore } from '@/data/store';
import { formatDate } from '@/lib/utils';

/**
 * Wildfire-side provisioning (approved recommendations REC-2 / REC-4): each
 * university is its own tenant, and somebody has to create it and hand the
 * keys to an IP Manager before any IP can be entered.
 */
export function SuperAdmin() {
  const universities = useStore((s) => s.universities);
  const users = useStore((s) => s.users);
  const ipItems = useStore((s) => s.ipItems);
  const invites = useStore((s) => s.invites);
  const provisionUniversity = useStore((s) => s.provisionUniversity);

  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [managerEmail, setManagerEmail] = useState('');

  const schools = universities.filter((u) => u.kind === 'university');
  const parent = universities.find((u) => u.kind === 'state_system');
  const canSubmit = name.trim() && shortName.trim() && managerName.trim() && managerEmail.trim();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Stagger className="space-y-5">
        <FadeIn>
          <PageHeader
            icon={Building2}
            title="Universities"
            subtitle="Each university is its own organization. Its IP Manager only ever sees that school's IP."
          />
        </FadeIn>

        <FadeIn>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {schools.length} universit{schools.length === 1 ? 'y' : 'ies'} under {parent?.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-gray-100">
                {schools.map((school) => {
                  const manager = users.find(
                    (u) => u.persona === 'ip_manager' && u.universityId === school.id,
                  );
                  const count = ipItems.filter((i) => i.universityId === school.id).length;
                  const invite = invites.find(
                    (inv) => inv.universityId === school.id && inv.role === 'ip_manager',
                  );
                  return (
                    <li key={school.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900">{school.name}</p>
                        <p className="text-sm text-gray-500">
                          {manager ? `${manager.name} · ${manager.email}` : 'No IP Manager assigned'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {invite && <StatusChip status={invite.status} />}
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{count}</p>
                          <p className="text-xs text-gray-400">disclosures</p>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-gray-400">Added {formatDate(school.createdAt)}</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Provision a university</CardTitle>
              <p className="text-sm text-gray-500">
                Creates the organization and invites its IP Manager. Nothing else can happen until this does.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="uni-name">University name</Label>
                  <Input
                    id="uni-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Black Hills State University"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="uni-short">Short name</Label>
                  <Input
                    id="uni-short"
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                    placeholder="BHSU"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mgr-name">IP Manager name</Label>
                  <Input
                    id="mgr-name"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="Dana Whitecloud"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mgr-email">IP Manager email</Label>
                  <Input
                    id="mgr-email"
                    type="email"
                    value={managerEmail}
                    onChange={(e) => setManagerEmail(e.target.value)}
                    placeholder="dana@bhsu.edu"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="gradient"
                  disabled={!canSubmit}
                  onClick={() => {
                    provisionUniversity(name.trim(), shortName.trim(), managerName.trim(), managerEmail.trim());
                    setName('');
                    setShortName('');
                    setManagerName('');
                    setManagerEmail('');
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Provision &amp; invite
                </Button>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </Stagger>
    </div>
  );
}
