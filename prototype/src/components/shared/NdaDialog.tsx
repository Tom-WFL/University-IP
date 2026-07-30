import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { NDA_VERSION } from '@/store/DemoStore';

/**
 * UIP-15 — "they don't want it to go and read it, and then someone takes it."
 * Blanket acceptance per person in this prototype; per-IP vs blanket is still an open question.
 */
export function NdaDialog({
  open,
  onAccept,
  onCancel,
}: {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Non-disclosure agreement</DialogTitle>
          <DialogDescription>
            Accept once to read concept summaries across the network. Version {NDA_VERSION}.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-64 space-y-3 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <p>
            The concept summaries in this app describe inventions owned by universities and their governing boards. They
            are shared so that founders can decide whether they want to build a company around an idea.
          </p>
          <p>
            By accepting, you agree not to disclose the summaries or any information you learn about an invention to
            anyone outside this process, and not to use that information to pursue the idea yourself without a written
            agreement with the university that owns it.
          </p>
          <p>
            Your account is recorded against every summary you open. If an idea appears elsewhere, the university can
            see who had access to it.
          </p>
          <p className="text-xs text-gray-500">
            Placeholder text for the prototype. The real agreement, its storage, and whether each institution supplies
            its own template are all still to be decided.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Not now
          </Button>
          <Button onClick={onAccept}>I agree</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
