import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const metrics = [
  {
    title: "Total orders",
    value: "1,284",
    delta: "+12.2%",
    helper: "Compared to last 30 days",
  },
  {
    title: "Active deliveries",
    value: "47",
    delta: "+6",
    helper: "Currently in progress",
  },
  {
    title: "Monthly spend",
    value: "INR 1,42,300",
    delta: "-3.8%",
    helper: "Delivery cost trend",
  },
  {
    title: "Team members",
    value: "18",
    delta: "+2",
    helper: "Ops and support users",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Delivery operations overview for your business account.
          </p>
        </div>
        <Badge variant="secondary" className="px-3 py-1 text-xs">
          MVP scaffold
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="pb-2">
              <CardDescription>{metric.title}</CardDescription>
              <CardTitle className="text-2xl">{metric.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-primary">{metric.delta}</p>
              <p className="text-xs text-muted-foreground">{metric.helper}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Next steps</CardTitle>
          <CardDescription>
            Backend business routes will be integrated in the next
            implementation phase.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This dashboard already includes auth flow, route protection, and
          layout scaffolding.
        </CardContent>
      </Card>
    </div>
  );
}
