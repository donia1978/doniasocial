import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Upload,
  X,
  Loader2,
  Download,
  Edit,
  Save,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SUBJECTS = [
  "Mathématiques",
  "Physique",
  "Chimie",
  "Biologie",
  "Français",
  "Anglais",
  "Arabe",
  "Histoire",
  "Géographie",
  "Philosophie",
  "Informatique",
  "Sciences de la Vie et de la Terre",
];

const LEVELS = [
  { group: "Primaire", items: ["1ère année", "2ème année", "3ème année", "4ème année", "5ème année", "6ème année"] },
  { group: "Secondaire", items: ["7ème année", "8ème année", "9ème année", "1ère année secondaire", "2ème année secondaire", "3ème année secondaire", "Baccalauréat"] },
  { group: "Université", items: ["Licence 1", "Licence 2", "Licence 3", "Master 1", "Master 2"] },
];

const LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "ar", label: "Arabe" },
  { value: "en", label: "Anglais" },
];

const EVALUATION_TYPES = [
  { value: "formative", label: "Formative" },
  { value: "summative", label: "Sommative" },
  { value: "diagnostic", label: "Diagnostique" },
];

interface FormData {
  subject: string;
  level: string;
  language: string;
  evaluationType: string;
  duration: number;
  exerciseCount: number;
  easyPercent: number;
  mediumPercent: number;
  hardPercent: number;
  includeAnswerKey: boolean;
  objectives: string;
  uploadedFiles: File[];
}

const MOCK_GENERATED_EXAM = `# Examen de Mathématiques - 3ème année secondaire

**Durée:** 2 heures | **Coefficient:** 4 | **Date:** ${new Date().toLocaleDateString('fr-FR')}

---

## Exercice 1 (4 points) - Niveau Facile

Résoudre les équations suivantes dans ℝ:

1. \`2x + 5 = 13\`
2. \`3(x - 2) = 2x + 4\`
3. \`x² - 9 = 0\`

---

## Exercice 2 (6 points) - Niveau Moyen

Soit f la fonction définie sur ℝ par: \`f(x) = x² - 4x + 3\`

1. Calculer f(0), f(1) et f(3)
2. Déterminer les racines de f
3. Dresser le tableau de variations de f
4. Tracer la courbe représentative de f

---

## Exercice 3 (6 points) - Niveau Moyen

Dans un repère orthonormé (O, i, j), on considère les points:
- A(1, 2)
- B(4, 6)
- C(-2, 4)

1. Calculer les coordonnées du vecteur AB
2. Calculer la distance AB
3. Déterminer l'équation de la droite (AB)
4. Le triangle ABC est-il rectangle? Justifier.

---

## Exercice 4 (4 points) - Niveau Difficile

Démontrer par récurrence que pour tout entier naturel n ≥ 1:

\`1 + 2 + 3 + ... + n = n(n+1)/2\`

---

## Corrigé

### Exercice 1
1. x = 4
2. x = 10
3. x = 3 ou x = -3

### Exercice 2
1. f(0) = 3, f(1) = 0, f(3) = 0
2. Les racines sont x = 1 et x = 3
3. f décroissante sur ]-∞, 2] et croissante sur [2, +∞[
4. Parabole avec sommet en (2, -1)

### Exercice 3
1. AB(3, 4)
2. AB = 5
3. y = (4/3)x + 2/3
4. Oui, car AB² + AC² = BC²

### Exercice 4
Initialisation: Pour n=1, 1 = 1×2/2 = 1 ✓
Hérédité: Si P(n) vraie, alors 1+2+...+n+(n+1) = n(n+1)/2 + (n+1) = (n+1)(n+2)/2 ✓
`;

export default function ExamGenerator() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedExam, setGeneratedExam] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    subject: "",
    level: "",
    language: "fr",
    evaluationType: "summative",
    duration: 60,
    exerciseCount: 4,
    easyPercent: 30,
    mediumPercent: 50,
    hardPercent: 20,
    includeAnswerKey: true,
    objectives: "",
    uploadedFiles: [],
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isDragging, setIsDragging] = useState(false);

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (step === 1) {
      if (!formData.subject) newErrors.subject = "Veuillez sélectionner une matière";
      if (!formData.level) newErrors.level = "Veuillez sélectionner un niveau";
      if (!formData.language) newErrors.language = "Veuillez sélectionner une langue";
      if (!formData.evaluationType) newErrors.evaluationType = "Veuillez sélectionner un type d'évaluation";
    }

    if (step === 2) {
      if (formData.duration < 15 || formData.duration > 240) {
        newErrors.duration = "La durée doit être entre 15 et 240 minutes";
      }
      if (formData.exerciseCount < 1 || formData.exerciseCount > 20) {
        newErrors.exerciseCount = "Le nombre d'exercices doit être entre 1 et 20";
      }
      const totalPercent = formData.easyPercent + formData.mediumPercent + formData.hardPercent;
      if (totalPercent !== 100) {
        newErrors.easyPercent = `Le total des pourcentages doit être 100% (actuellement ${totalPercent}%)`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleGenerate = async () => {
    if (!validateStep(currentStep)) return;

    setIsGenerating(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setGeneratedExam(MOCK_GENERATED_EXAM);
    setIsGenerating(false);
    toast({
      title: "Examen généré",
      description: "Votre examen a été créé avec succès.",
    });
  };

  const handleSaveDraft = () => {
    toast({
      title: "Brouillon enregistré",
      description: "Votre examen a été sauvegardé comme brouillon.",
    });
  };

  const handleExport = (format: "pdf" | "markdown" | "json") => {
    toast({
      title: `Export ${format.toUpperCase()}`,
      description: `Téléchargement en cours...`,
    });
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter(
      (file) => file.type === "application/pdf"
    );
    if (newFiles.length !== files.length) {
      toast({
        title: "Fichiers non valides",
        description: "Seuls les fichiers PDF sont acceptés.",
        variant: "destructive",
      });
    }
    setFormData((prev) => ({
      ...prev,
      uploadedFiles: [...prev.uploadedFiles, ...newFiles],
    }));
  };

  const handleRemoveFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((_, i) => i !== index),
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const adjustDifficulty = (field: "easyPercent" | "mediumPercent" | "hardPercent", value: number) => {
    const remaining = 100 - value;
    const others = ["easyPercent", "mediumPercent", "hardPercent"].filter((f) => f !== field) as Array<"easyPercent" | "mediumPercent" | "hardPercent">;
    const currentOtherTotal = formData[others[0]] + formData[others[1]];
    
    if (currentOtherTotal === 0) {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
        [others[0]]: Math.floor(remaining / 2),
        [others[1]]: Math.ceil(remaining / 2),
      }));
    } else {
      const ratio0 = formData[others[0]] / currentOtherTotal;
      const ratio1 = formData[others[1]] / currentOtherTotal;
      setFormData((prev) => ({
        ...prev,
        [field]: value,
        [others[0]]: Math.round(remaining * ratio0),
        [others[1]]: Math.round(remaining * ratio1),
      }));
    }
  };

  if (isGenerating) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="relative">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <BookOpen className="h-6 w-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Génération en cours...</h2>
            <p className="text-muted-foreground">
              L'IA analyse vos documents et crée votre examen personnalisé
            </p>
          </div>
          <div className="w-64">
            <Progress value={66} className="h-2" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (generatedExam) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Examen Généré</h1>
              <p className="text-muted-foreground">
                {formData.subject} - {formData.level}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setGeneratedExam(null)}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <Button variant="outline" onClick={() => handleExport("pdf")}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" onClick={() => handleExport("markdown")}>
                <FileText className="h-4 w-4 mr-2" />
                Markdown
              </Button>
              <Button onClick={() => handleExport("json")}>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-foreground bg-transparent p-0">
                  {generatedExam}
                </pre>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button variant="outline" onClick={() => navigate("/dashboard/education")}>
              Retour à l'éducation
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Générateur d'Examens</h1>
            <p className="text-muted-foreground">
              Créez des examens personnalisés avec l'aide de l'IA
            </p>
          </div>
          <Button variant="ghost" onClick={() => navigate("/dashboard/education")}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Étape {currentStep} sur {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className={cn(currentStep >= 1 && "text-primary font-medium")}>
              Informations
            </span>
            <span className={cn(currentStep >= 2 && "text-primary font-medium")}>
              Paramètres
            </span>
            <span className={cn(currentStep >= 3 && "text-primary font-medium")}>
              Références
            </span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && "Informations de base"}
              {currentStep === 2 && "Paramètres de l'examen"}
              {currentStep === 3 && "Documents de référence"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <Label htmlFor="subject">Matière *</Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(v) => setFormData((prev) => ({ ...prev, subject: v }))}
                  >
                    <SelectTrigger className={errors.subject ? "border-destructive" : ""}>
                      <SelectValue placeholder="Sélectionner une matière" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.subject && (
                    <p className="text-sm text-destructive">{errors.subject}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Niveau *</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(v) => setFormData((prev) => ({ ...prev, level: v }))}
                  >
                    <SelectTrigger className={errors.level ? "border-destructive" : ""}>
                      <SelectValue placeholder="Sélectionner un niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVELS.map((group) => (
                        <div key={group.group}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            {group.group}
                          </div>
                          {group.items.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.level && (
                    <p className="text-sm text-destructive">{errors.level}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Langue *</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(v) => setFormData((prev) => ({ ...prev, language: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="evaluationType">Type d'évaluation *</Label>
                    <Select
                      value={formData.evaluationType}
                      onValueChange={(v) => setFormData((prev) => ({ ...prev, evaluationType: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVALUATION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Parameters */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Durée (minutes) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      min={15}
                      max={240}
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, duration: parseInt(e.target.value) || 60 }))
                      }
                      className={errors.duration ? "border-destructive" : ""}
                    />
                    {errors.duration && (
                      <p className="text-sm text-destructive">{errors.duration}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exerciseCount">Nombre d'exercices *</Label>
                    <Input
                      id="exerciseCount"
                      type="number"
                      min={1}
                      max={20}
                      value={formData.exerciseCount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          exerciseCount: parseInt(e.target.value) || 4,
                        }))
                      }
                      className={errors.exerciseCount ? "border-destructive" : ""}
                    />
                    {errors.exerciseCount && (
                      <p className="text-sm text-destructive">{errors.exerciseCount}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Répartition de la difficulté</Label>
                  {errors.easyPercent && (
                    <p className="text-sm text-destructive">{errors.easyPercent}</p>
                  )}
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-green-500">Facile</span>
                        <span>{formData.easyPercent}%</span>
                      </div>
                      <Slider
                        value={[formData.easyPercent]}
                        onValueChange={([v]) => adjustDifficulty("easyPercent", v)}
                        max={100}
                        step={5}
                        className="[&_[role=slider]]:bg-green-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-yellow-500">Moyen</span>
                        <span>{formData.mediumPercent}%</span>
                      </div>
                      <Slider
                        value={[formData.mediumPercent]}
                        onValueChange={([v]) => adjustDifficulty("mediumPercent", v)}
                        max={100}
                        step={5}
                        className="[&_[role=slider]]:bg-yellow-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-red-500">Difficile</span>
                        <span>{formData.hardPercent}%</span>
                      </div>
                      <Slider
                        value={[formData.hardPercent]}
                        onValueChange={([v]) => adjustDifficulty("hardPercent", v)}
                        max={100}
                        step={5}
                        className="[&_[role=slider]]:bg-red-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeAnswerKey"
                    checked={formData.includeAnswerKey}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, includeAnswerKey: !!checked }))
                    }
                  />
                  <Label htmlFor="includeAnswerKey" className="cursor-pointer">
                    Inclure le corrigé
                  </Label>
                </div>
              </div>
            )}

            {/* Step 3: Reference Materials */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                    isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                    "hover:border-primary/50"
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-1">
                    Glissez-déposez vos fichiers PDF ici
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    ou cliquez pour sélectionner
                  </p>
                  <Input
                    type="file"
                    accept=".pdf"
                    multiple
                    className="hidden"
                    id="file-upload"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                  <Button variant="outline" asChild>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      Parcourir
                    </label>
                  </Button>
                </div>

                {formData.uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Fichiers téléchargés ({formData.uploadedFiles.length})</Label>
                    <div className="space-y-2">
                      {formData.uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-sm font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="objectives">Objectifs pédagogiques (optionnel)</Label>
                  <Textarea
                    id="objectives"
                    placeholder="Décrivez les compétences et connaissances à évaluer..."
                    value={formData.objectives}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, objectives: e.target.value }))
                    }
                    rows={4}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleSaveDraft}>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer brouillon
            </Button>

            {currentStep < totalSteps ? (
              <Button onClick={handleNext}>
                Suivant
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleGenerate}>
                <BookOpen className="h-4 w-4 mr-2" />
                Générer l'examen
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
