import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart3, 
  TrendingUp, 
  Calculator,
  Brain,
  Loader2,
  LineChart,
  PieChart,
  Activity,
  Target,
  Sigma,
  Percent,
  GitBranch
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Statistics() {
  const [dataInput, setDataInput] = useState("");
  const [contextInput, setContextInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);

  const parseInputData = (input: string) => {
    try {
      // Try JSON first
      const jsonData = JSON.parse(input);
      return Array.isArray(jsonData) ? jsonData : [jsonData];
    } catch {
      // Try CSV-like format
      const lines = input.trim().split('\n');
      if (lines.length > 1) {
        const headers = lines[0].split(',').map(h => h.trim());
        return lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const obj: any = {};
          headers.forEach((h, i) => {
            const num = parseFloat(values[i]);
            obj[h] = isNaN(num) ? values[i] : num;
          });
          return obj;
        });
      }
      // Try simple number list
      const numbers = input.split(/[,\s\n]+/).map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
      if (numbers.length > 0) {
        return numbers.map((value, index) => ({ index: index + 1, value }));
      }
      return [];
    }
  };

  const executeAnalysis = async (action: string) => {
    if (!dataInput.trim()) {
      toast.error("Veuillez entrer des données à analyser");
      return;
    }

    const data = parseInputData(dataInput);
    if (data.length === 0) {
      toast.error("Format de données non reconnu");
      return;
    }

    setParsedData(data);
    setIsLoading(true);
    setActiveAction(action);
    setResult(null);

    try {
      const { data: responseData, error } = await supabase.functions.invoke('statistics-ai', {
        body: { action, data, context: contextInput }
      });

      if (error) throw error;

      if (responseData.success) {
        setResult(responseData.result);
        toast.success("Analyse terminée");
      } else {
        throw new Error(responseData.error);
      }
    } catch (error: any) {
      console.error('Statistics error:', error);
      toast.error(error.message || "Erreur lors de l'analyse");
    } finally {
      setIsLoading(false);
      setActiveAction(null);
    }
  };

  const sampleDatasets = [
    {
      name: "Glycémie patients",
      data: `patient,age,glycemie,hba1c,imc
P001,45,126,6.8,28.5
P002,52,142,7.2,31.2
P003,38,98,5.9,24.1
P004,61,158,7.8,29.8
P005,55,135,7.0,27.3
P006,48,112,6.3,25.9
P007,67,165,8.1,32.0
P008,42,105,6.1,23.8
P009,59,148,7.5,30.5
P010,51,121,6.6,26.7`
    },
    {
      name: "Tension artérielle",
      data: `patient,systolique,diastolique,age,traitement
P001,145,92,58,oui
P002,128,84,45,non
P003,152,98,62,oui
P004,118,76,38,non
P005,138,88,55,oui
P006,165,102,71,oui
P007,124,80,42,non
P008,142,90,60,oui`
    },
    {
      name: "Survie post-op",
      data: `patient,survie_mois,evenement,age,stade
P001,24,0,55,I
P002,18,1,62,II
P003,36,0,48,I
P004,12,1,71,III
P005,30,0,52,II
P006,8,1,68,III
P007,42,0,45,I
P008,15,1,65,II`
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Advanced Statistics
          </h1>
          <p className="text-muted-foreground">
            Analyses statistiques avancées : descriptives, inférentielles, bayésiennes et prédictives
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Data Input Panel */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Données d'Entrée
                </CardTitle>
                <CardDescription>
                  Format: JSON, CSV, ou liste de nombres
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Données</Label>
                  <Textarea
                    placeholder="Entrez vos données...
Ex: 12, 15, 18, 22, 25
Ou format CSV:
nom,valeur
A,10
B,15"
                    value={dataInput}
                    onChange={(e) => setDataInput(e.target.value)}
                    className="min-h-[150px] font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contexte (optionnel)</Label>
                  <Input
                    placeholder="Ex: Étude diabète type 2"
                    value={contextInput}
                    onChange={(e) => setContextInput(e.target.value)}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Jeux de données exemples</Label>
                  <div className="flex flex-wrap gap-2">
                    {sampleDatasets.map((ds) => (
                      <Badge
                        key={ds.name}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => setDataInput(ds.data)}
                      >
                        {ds.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            {parsedData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Aperçu des Données</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Observations:</span>
                      <span className="font-medium">{parsedData.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Variables:</span>
                      <span className="font-medium">{Object.keys(parsedData[0] || {}).length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Analysis Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="descriptive" className="space-y-4">
              <TabsList className="grid grid-cols-3 lg:grid-cols-6">
                <TabsTrigger value="descriptive" className="gap-1">
                  <Sigma className="h-4 w-4" />
                  <span className="hidden lg:inline">Descriptif</span>
                </TabsTrigger>
                <TabsTrigger value="inferential" className="gap-1">
                  <Target className="h-4 w-4" />
                  <span className="hidden lg:inline">Inférentiel</span>
                </TabsTrigger>
                <TabsTrigger value="bayesian" className="gap-1">
                  <Percent className="h-4 w-4" />
                  <span className="hidden lg:inline">Bayésien</span>
                </TabsTrigger>
                <TabsTrigger value="predictive" className="gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden lg:inline">Prédictif</span>
                </TabsTrigger>
                <TabsTrigger value="correlation" className="gap-1">
                  <GitBranch className="h-4 w-4" />
                  <span className="hidden lg:inline">Corrélation</span>
                </TabsTrigger>
                <TabsTrigger value="survival" className="gap-1">
                  <Activity className="h-4 w-4" />
                  <span className="hidden lg:inline">Survie</span>
                </TabsTrigger>
              </TabsList>

              {/* Descriptive Statistics */}
              <TabsContent value="descriptive">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sigma className="h-5 w-5" />
                      Statistiques Descriptives
                    </CardTitle>
                    <CardDescription>
                      Moyenne, médiane, écart-type, quartiles, distribution
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={() => executeAnalysis('descriptive')}
                      disabled={isLoading && activeAction === 'descriptive'}
                      className="w-full"
                    >
                      {isLoading && activeAction === 'descriptive' ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <BarChart3 className="h-4 w-4 mr-2" />
                      )}
                      Analyser
                    </Button>

                    {/* Sample Visualization */}
                    {parsedData.length > 0 && (
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={parsedData.slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey={Object.keys(parsedData[0])[0]} className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip />
                            <Bar 
                              dataKey={Object.keys(parsedData[0]).find(k => typeof parsedData[0][k] === 'number') || 'value'} 
                              fill="hsl(var(--primary))" 
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Inferential Statistics */}
              <TabsContent value="inferential">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Statistiques Inférentielles
                    </CardTitle>
                    <CardDescription>
                      Tests d'hypothèses, intervalles de confiance, comparaisons de groupes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={() => executeAnalysis('inferential')}
                      disabled={isLoading && activeAction === 'inferential'}
                      className="w-full"
                    >
                      {isLoading && activeAction === 'inferential' ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Target className="h-4 w-4 mr-2" />
                      )}
                      Test d'Hypothèse
                    </Button>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-muted-foreground">Tests disponibles</div>
                        <div className="font-medium">t-test, Chi², ANOVA, Mann-Whitney</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-muted-foreground">Niveau de confiance</div>
                        <div className="font-medium">95% (α = 0.05)</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Bayesian Statistics */}
              <TabsContent value="bayesian">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Percent className="h-5 w-5" />
                      Analyse Bayésienne
                    </CardTitle>
                    <CardDescription>
                      Priors, posteriors, facteur de Bayes, intervalles de crédibilité
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={() => executeAnalysis('bayesian')}
                      disabled={isLoading && activeAction === 'bayesian'}
                      className="w-full"
                    >
                      {isLoading && activeAction === 'bayesian' ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Brain className="h-4 w-4 mr-2" />
                      )}
                      Analyse Bayésienne
                    </Button>

                    {/* Bayesian Concept Visual */}
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="p-3 rounded-lg border">
                        <div className="text-muted-foreground text-xs">Prior</div>
                        <div className="font-medium">P(H)</div>
                      </div>
                      <div className="p-3 rounded-lg border">
                        <div className="text-muted-foreground text-xs">Likelihood</div>
                        <div className="font-medium">P(D|H)</div>
                      </div>
                      <div className="p-3 rounded-lg border bg-primary/10">
                        <div className="text-muted-foreground text-xs">Posterior</div>
                        <div className="font-medium">P(H|D)</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Predictive Analytics */}
              <TabsContent value="predictive">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Modélisation Prédictive
                    </CardTitle>
                    <CardDescription>
                      Régression, classification, machine learning, facteurs de risque
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={() => executeAnalysis('predictive')}
                      disabled={isLoading && activeAction === 'predictive'}
                      className="w-full"
                    >
                      {isLoading && activeAction === 'predictive' ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <LineChart className="h-4 w-4 mr-2" />
                      )}
                      Modèle Prédictif
                    </Button>

                    {parsedData.length > 0 && (
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis 
                              dataKey={Object.keys(parsedData[0]).find(k => typeof parsedData[0][k] === 'number') || 'x'} 
                              name="X"
                              className="text-xs"
                            />
                            <YAxis 
                              dataKey={Object.keys(parsedData[0]).filter(k => typeof parsedData[0][k] === 'number')[1] || 'y'}
                              name="Y"
                              className="text-xs"
                            />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                            <Scatter data={parsedData} fill="hsl(var(--primary))" />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Correlation Analysis */}
              <TabsContent value="correlation">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GitBranch className="h-5 w-5" />
                      Analyse de Corrélation
                    </CardTitle>
                    <CardDescription>
                      Pearson, Spearman, corrélations partielles, multicolinéarité
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={() => executeAnalysis('correlation')}
                      disabled={isLoading && activeAction === 'correlation'}
                      className="w-full"
                    >
                      {isLoading && activeAction === 'correlation' ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <GitBranch className="h-4 w-4 mr-2" />
                      )}
                      Matrice de Corrélation
                    </Button>

                    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      <strong>Note:</strong> Corrélation n'implique pas causalité. 
                      L'analyse identifie les associations statistiques, pas les relations causales.
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Survival Analysis */}
              <TabsContent value="survival">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Analyse de Survie
                    </CardTitle>
                    <CardDescription>
                      Kaplan-Meier, log-rank, modèle de Cox, hazard ratios
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={() => executeAnalysis('survival')}
                      disabled={isLoading && activeAction === 'survival'}
                      className="w-full"
                    >
                      {isLoading && activeAction === 'survival' ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Activity className="h-4 w-4 mr-2" />
                      )}
                      Analyse de Survie
                    </Button>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-muted-foreground">Méthode</div>
                        <div className="font-medium">Kaplan-Meier</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-muted-foreground">Comparaison</div>
                        <div className="font-medium">Log-rank test</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Results Panel */}
            {result && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    Résultats de l'Analyse
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                      {result}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
