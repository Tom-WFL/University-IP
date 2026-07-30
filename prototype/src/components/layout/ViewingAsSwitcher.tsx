import { useNavigate } from 'react-router-dom';
import { Eye, RotateCcw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useDemo } from '@/store/DemoStore';
import { HOME_ROUTE, PERSONAS } from '@/store/personas';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

/**
 * Prototype-only affordance. The live app has no impersonation feature — this exists so one
 * person can walk a room through every role in a single sitting.
 */
export function ViewingAsSwitcher({ variant = 'console' }: { variant?: 'console' | 'floating' }) {
  const { state, persona, setPersona, resetDemo } = useDemo();
  const navigate = useNavigate();

  const pick = (id: (typeof PERSONAS)[number]['id']) => {
    setPersona(id);
    navigate(HOME_ROUTE[id]);
    const p = PERSONAS.find((x) => x.id === id);
    toast({ title: `Viewing as ${p?.name}`, description: p?.title });
  };

  const label = persona.id === 'founder' ? state.founderDisplayName : persona.name;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'gap-2 border-gray-200 text-gray-700',
            variant === 'floating' && 'bg-white/90 shadow-sm backdrop-blur-sm',
          )}
        >
          <Eye className="h-4 w-4 text-gray-500" />
          <span className="max-w-[180px] truncate">Viewing as: {label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[290px]">
        <DropdownMenuLabel>Prototype — switch role</DropdownMenuLabel>
        {PERSONAS.map((p) => (
          <DropdownMenuItem key={p.id} onSelect={() => pick(p.id)}>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {p.id === 'founder' ? state.founderDisplayName : p.name}
              </p>
              <p className="text-xs text-gray-500">{p.title}</p>
            </div>
            {p.id === persona.id && <Check className="h-4 w-4 text-green-600" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            resetDemo();
            navigate('/welcome');
            toast({ title: 'Demo reset', description: 'Seed data restored.' });
          }}
        >
          <RotateCcw className="h-4 w-4 text-gray-500" />
          <span className="text-sm">Reset demo data</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
