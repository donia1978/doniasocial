import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Award, Download, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface CourseCertificateProps {
  courseId: string;
  courseTitle: string;
  instructorName: string | null;
  isCompleted: boolean;
}

interface Certificate {
  id: string;
  certificate_number: string;
  issued_at: string;
  completion_date: string;
}

export function CourseCertificate({ 
  courseId, 
  courseTitle, 
  instructorName, 
  isCompleted 
}: CourseCertificateProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCertificate, setShowCertificate] = useState(false);

  const { data: certificate, isLoading } = useQuery({
    queryKey: ["course-certificate", courseId],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("course_certificates")
        .select("*")
        .eq("course_id", courseId)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Certificate | null;
    },
    enabled: !!user?.id
  });

  const generateCertificate = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Non authentifié");
      if (!isCompleted) throw new Error("Cours non terminé");

      const certificateNumber = `DONIA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const { error } = await supabase
        .from("course_certificates")
        .insert({
          course_id: courseId,
          user_id: user.id,
          certificate_number: certificateNumber
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-certificate", courseId] });
      toast.success("Certificat généré !");
      setShowCertificate(true);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id
  });

  const downloadCertificate = () => {
    // Simple text-based download for now
    const content = `
    ═══════════════════════════════════════════════════════════════
    
                        CERTIFICAT D'ACHÈVEMENT
    
    ═══════════════════════════════════════════════════════════════
    
    Nous certifions par la présente que
    
                    ${profile?.full_name || user?.email}
    
    a complété avec succès le cours
    
                    "${courseTitle}"
    
    ${instructorName ? `Enseigné par: ${instructorName}` : ''}
    
    Date de complétion: ${certificate ? new Date(certificate.completion_date).toLocaleDateString("fr-FR") : new Date().toLocaleDateString("fr-FR")}
    
    Numéro de certificat: ${certificate?.certificate_number}
    
    ═══════════════════════════════════════════════════════════════
    
                        DONIA - Plateforme d'Apprentissage
    
    ═══════════════════════════════════════════════════════════════
    `;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certificat-${courseTitle.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Certificat téléchargé");
  };

  if (!isCompleted && !certificate) {
    return null;
  }

  return (
    <>
      <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Award className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold">
                {certificate ? "Certificat obtenu !" : "Cours terminé !"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {certificate 
                  ? `Délivré le ${new Date(certificate.issued_at).toLocaleDateString("fr-FR")}`
                  : "Obtenez votre certificat d'achèvement"
                }
              </p>
            </div>
          </div>
          
          {certificate ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCertificate(true)}>
                Voir
              </Button>
              <Button onClick={downloadCertificate}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => generateCertificate.mutate()}
              disabled={generateCertificate.isPending}
            >
              {generateCertificate.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Award className="h-4 w-4 mr-2" />
              )}
              Obtenir le certificat
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCertificate} onOpenChange={setShowCertificate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Certificat d'achèvement</DialogTitle>
          </DialogHeader>
          
          <div className="p-8 border-4 border-double border-amber-500/50 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
            <div className="text-center space-y-6">
              <Award className="h-16 w-16 mx-auto text-amber-500" />
              
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-widest">
                  Certificat d'achèvement
                </p>
                <h2 className="text-2xl font-bold mt-2">
                  {profile?.full_name || user?.email}
                </h2>
              </div>
              
              <p className="text-muted-foreground">
                a complété avec succès le cours
              </p>
              
              <h3 className="text-xl font-semibold text-primary">
                {courseTitle}
              </h3>
              
              {instructorName && (
                <p className="text-sm text-muted-foreground">
                  Enseigné par: {instructorName}
                </p>
              )}
              
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span>Vérifié</span>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Numéro de certificat: {certificate?.certificate_number}
                </p>
                <p className="text-xs text-muted-foreground">
                  Date: {certificate ? new Date(certificate.completion_date).toLocaleDateString("fr-FR") : ""}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCertificate(false)}>
              Fermer
            </Button>
            <Button onClick={downloadCertificate}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
