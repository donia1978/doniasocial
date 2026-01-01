import { supabase } from "@/integrations/supabase/client";

interface CourseInput {
  title: string;
  cycle: string;
  status: string;
  price: number;
  level?: string;
  category?: string;
  description?: string;
}

export async function listMyCourses() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("instructor_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createCourse(input: CourseInput) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data, error } = await supabase
    .from("courses")
    .insert({
      title: input.title,
      description: input.description || "",
      category: input.category || input.cycle,
      difficulty: input.level || "beginner",
      instructor_id: user.id,
      is_published: input.status === "published",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function publishCourse(courseId: string) {
  const { error } = await supabase
    .from("courses")
    .update({ is_published: true })
    .eq("id", courseId);

  if (error) throw error;
}

export async function seedCoursesForMe() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const sampleCourses = [
    { title: "Introduction à la Médecine", cycle: "university", level: "L1", category: "Médecine" },
    { title: "Anatomie Humaine", cycle: "university", level: "L2", category: "Médecine" },
    { title: "Mathématiques Avancées", cycle: "secondaire", level: "Terminale", category: "Sciences" },
    { title: "Physique Quantique", cycle: "university", level: "M1", category: "Physique" },
    { title: "Chimie Organique", cycle: "secondaire", level: "1ère", category: "Chimie" },
  ];

  for (const course of sampleCourses) {
    await createCourse({
      title: course.title,
      cycle: course.cycle,
      status: "draft",
      price: 0,
      level: course.level,
      category: course.category,
    });
  }
}
