import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PagePlaceholderProps = {
  title: string;
  description: string;
};

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            This section is scaffolded and ready for the next iteration.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          We will connect this page to business-specific backend endpoints in
          the follow-up task.
        </CardContent>
      </Card>
    </div>
  );
}
