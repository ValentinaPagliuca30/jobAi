import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const sections = [
  "Personal and contact details",
  "Education and work authorization",
  "Resume upload and parsing",
  "Writing samples for tone anchoring",
];

export default function OnboardingPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Onboarding
        </p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Build the profile once, reuse it everywhere.
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Collect enough structured information to make autofill reliable and
          drafts believable, without turning setup into another long form.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>What belongs here</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm">
              {sections.map((section) => (
                <li
                  key={section}
                  className="rounded-md border border-border bg-muted/40 px-3 py-2"
                >
                  {section}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Form skeleton</CardTitle>
            <CardDescription>Fields to implement first.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" placeholder="Valentina Pagliuca" />
              <Field label="Email" placeholder="valentinap@uchicago.edu" />
              <Field label="School" placeholder="University of Chicago" />
              <Field label="Graduation" placeholder="June 2026" />
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label>LinkedIn</Label>
                <Input placeholder="https://linkedin.com/in/..." />
              </div>
              <Slot
                label="Resume upload"
                description="PDF parser slot"
                className="sm:col-span-2"
              />
              <Slot
                label="Writing samples"
                description="Store 2-3 past cover letters or strong application answers"
                className="sm:col-span-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Input placeholder={placeholder} />
    </div>
  );
}

function Slot({
  label,
  description,
  className,
}: {
  label: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`}>
      <Label>{label}</Label>
      <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-border bg-muted/30 px-4 text-sm text-muted-foreground">
        {description}
      </div>
    </div>
  );
}
