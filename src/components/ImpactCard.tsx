import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getImpactComparison } from "@/lib/impactComparisons";

interface ImpactCardProps {
  co2Grams: number;
  title?: string;
}

export const ImpactCard = ({ co2Grams, title = "Real-World Impact" }: ImpactCardProps) => {
  const impact = getImpactComparison(co2Grams);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span>{impact.emoji}</span>
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold text-primary">
            {(co2Grams / 1000).toFixed(3)} kg CO₂
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{impact.category}:</span>
            <br />
            {impact.description}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
