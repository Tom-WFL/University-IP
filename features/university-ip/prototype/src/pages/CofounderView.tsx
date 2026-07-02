import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Container, ConfirmedHint, RoleHero, RecommendedTier,
} from "@/components/Shell";
import { UNIVERSITY } from "@/data";
import {
  Building2, Rocket, Users, GraduationCap, HeartHandshake, Landmark, Phone,
} from "lucide-react";

/* Co-founder (via Founder Match) — an EXISTING Founder role. A student or
   Wildfire Network member matched to a professor's university-IP idea.
   Nothing new is built for them; this view validates how university IP
   appears from their side. */

export default function CofounderView() {
  return (
    <Container>
      <RoleHero
        role="Co-founder (via Founder Match) — existing Founder role"
        name="Jess Munoz"
        tagline={`Matched through the EXISTING Founder Match to Dr. Hale's cardiac tissue preservation idea from ${UNIVERSITY}. Becomes the second founder in the company — two founders, exactly as set up today.`}
        meta={[
          { icon: <HeartHandshake className="w-4 h-4 text-gray-400" />, label: "Matched via Founder Match (existing)" },
          { icon: <Rocket className="w-4 h-4 text-gray-400" />, label: "HaleCardio · co-founder" },
          { icon: <GraduationCap className="w-4 h-4 text-gray-400" />, label: "Student · Wildfire Network" },
        ]}
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge className="bg-orange-500 hover:bg-orange-500 text-white">Founder</Badge>
        <Badge variant="outline">Existing role — nothing new built</Badge>
      </div>
      <ConfirmedHint>
        Confirmed: Founder Match brings a student or Wildfire Network member as the co-founder — two founders in one company, as currently set up.
      </ConfirmedHint>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4 text-orange-500" /> The company (existing shape)</CardTitle>
            <CardDescription>Two founders in one company, as today.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">Dr. Miriam Hale</span>
              <span className="text-xs text-muted-foreground">Founder · professor (idea owner) · day-to-day co-founder</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-medium">Jess Munoz</span>
              <span className="text-xs text-muted-foreground">Founder · matched via Founder Match</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Landmark className="h-4 w-4 text-orange-500" /> The idea they picked up</CardTitle>
            <CardDescription>University IP is just an idea in the app — not a separate object type.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="font-medium">Cardiac tissue preservation compound</p>
            <p className="text-xs text-muted-foreground">
              A compound extending viable heart-tissue preservation windows for transplant logistics.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" /> {UNIVERSITY} owns the IP; the professor owns the knowledge of the idea.
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3.5 w-3.5" /> Contact-only professors: whoever takes the idea can reach out directly.
            </div>
          </CardContent>
        </Card>
      </div>

      <RecommendedTier id="REC-5" title="University-IP provenance label + professor contact on the idea">
        What a matched founder / hackathon participant would SEE on the idea — that it is university-owned IP and who the professor contact is — is not confirmed. Needs PO sign-off; this view shows plain idea data only.
      </RecommendedTier>
    </Container>
  );
}
