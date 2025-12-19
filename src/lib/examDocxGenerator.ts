import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  PageOrientation,
  Header,
  Footer,
} from "docx";
import { saveAs } from "file-saver";

export interface ExamData {
  schoolName: string;
  subject: string;
  level: string;
  trimester: string;
  schoolYear: string;
  duration: string;
  teacherName?: string;
  studentName?: string;
  exercises: ExerciseData[];
  includeAnswerKey: boolean;
  language: "fr" | "ar" | "en";
}

export interface ExerciseData {
  title: string;
  points: number;
  difficulty: "easy" | "medium" | "hard";
  questions: string[];
  answers?: string[];
}

// Tunisian exam template structure
const createHeader = (data: ExamData, isRTL: boolean) => {
  const alignment = isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT;
  
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment,
                children: [
                  new TextRun({
                    text: data.schoolName,
                    bold: true,
                    size: 24,
                    font: isRTL ? "Traditional Arabic" : "Arial",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 34, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: isRTL ? "اختبار" : data.language === "fr" ? "Devoir de Contrôle" : "Test",
                    bold: true,
                    size: 28,
                    font: isRTL ? "Traditional Arabic" : "Arial",
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${data.subject}`,
                    bold: true,
                    size: 24,
                    font: isRTL ? "Traditional Arabic" : "Arial",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: isRTL ? AlignmentType.LEFT : AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: isRTL ? `السنة الدراسية: ${data.schoolYear}` : `Année scolaire: ${data.schoolYear}`,
                    size: 20,
                    font: isRTL ? "Traditional Arabic" : "Arial",
                  }),
                ],
              }),
              new Paragraph({
                alignment: isRTL ? AlignmentType.LEFT : AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: isRTL ? `القسم: ${data.level}` : `Classe: ${data.level}`,
                    size: 20,
                    font: isRTL ? "Traditional Arabic" : "Arial",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            columnSpan: 2,
            children: [
              new Paragraph({
                alignment,
                children: [
                  new TextRun({
                    text: isRTL ? `الاسم و اللقب: .......................` : `Nom et prénom: .......................`,
                    size: 22,
                    font: isRTL ? "Traditional Arabic" : "Arial",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: isRTL ? AlignmentType.LEFT : AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: isRTL ? `المدة: ${data.duration}` : `Durée: ${data.duration}`,
                    size: 22,
                    font: isRTL ? "Traditional Arabic" : "Arial",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
};

const createExercise = (exercise: ExerciseData, index: number, isRTL: boolean, lang: string) => {
  const alignment = isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT;
  const difficultyLabels = {
    fr: { easy: "Facile", medium: "Moyen", hard: "Difficile" },
    ar: { easy: "سهل", medium: "متوسط", hard: "صعب" },
    en: { easy: "Easy", medium: "Medium", hard: "Hard" },
  };

  const exerciseLabel = isRTL ? `التمرين ${index + 1}` : lang === "fr" ? `Exercice ${index + 1}` : `Exercise ${index + 1}`;
  const pointsLabel = isRTL ? `(${exercise.points} نقاط)` : `(${exercise.points} points)`;
  const diffLabel = difficultyLabels[lang as keyof typeof difficultyLabels]?.[exercise.difficulty] || exercise.difficulty;

  const paragraphs: Paragraph[] = [
    new Paragraph({
      alignment,
      spacing: { before: 400, after: 200 },
      children: [
        new TextRun({
          text: `${exerciseLabel} ${pointsLabel} - ${diffLabel}`,
          bold: true,
          size: 24,
          font: isRTL ? "Traditional Arabic" : "Arial",
          underline: {},
        }),
      ],
    }),
  ];

  exercise.questions.forEach((question, qIndex) => {
    paragraphs.push(
      new Paragraph({
        alignment,
        spacing: { before: 100, after: 100 },
        indent: { left: 400 },
        children: [
          new TextRun({
            text: `${qIndex + 1}. ${question}`,
            size: 22,
            font: isRTL ? "Traditional Arabic" : "Arial",
          }),
        ],
      })
    );
    // Add answer lines
    paragraphs.push(
      new Paragraph({
        alignment,
        spacing: { before: 50, after: 150 },
        indent: { left: 600 },
        children: [
          new TextRun({
            text: ".............................................................................................",
            size: 20,
            font: "Arial",
          }),
        ],
      })
    );
  });

  return paragraphs;
};

const createGradingTable = (exercises: ExerciseData[], isRTL: boolean, lang: string) => {
  const headers = isRTL 
    ? ["التمرين", "العدد الأقصى", "العدد المتحصل عليه"]
    : lang === "fr" 
      ? ["Exercice", "Barème", "Note obtenue"]
      : ["Exercise", "Max Points", "Score"];

  const rows = [
    new TableRow({
      children: headers.map(header => 
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: header,
                  bold: true,
                  size: 20,
                  font: isRTL ? "Traditional Arabic" : "Arial",
                }),
              ],
            }),
          ],
        })
      ),
    }),
    ...exercises.map((ex, i) =>
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${i + 1}`,
                    size: 20,
                    font: "Arial",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${ex.points}`,
                    size: 20,
                    font: "Arial",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "",
                    size: 20,
                    font: "Arial",
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    ),
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: isRTL ? "المجموع" : lang === "fr" ? "Total" : "Total",
                  bold: true,
                  size: 20,
                  font: isRTL ? "Traditional Arabic" : "Arial",
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `${exercises.reduce((sum, ex) => sum + ex.points, 0)}`,
                  bold: true,
                  size: 20,
                  font: "Arial",
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "/20",
                  bold: true,
                  size: 20,
                  font: "Arial",
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ];

  return new Table({
    width: { size: 60, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    },
    rows,
  });
};

const createAnswerKey = (exercises: ExerciseData[], isRTL: boolean, lang: string) => {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 300 },
      pageBreakBefore: true,
      children: [
        new TextRun({
          text: isRTL ? "الإصلاح" : lang === "fr" ? "Corrigé Type" : "Answer Key",
          bold: true,
          size: 32,
          font: isRTL ? "Traditional Arabic" : "Arial",
          underline: {},
        }),
      ],
    }),
  ];

  exercises.forEach((exercise, exIndex) => {
    const alignment = isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT;
    const exerciseLabel = isRTL ? `التمرين ${exIndex + 1}` : lang === "fr" ? `Exercice ${exIndex + 1}` : `Exercise ${exIndex + 1}`;
    
    paragraphs.push(
      new Paragraph({
        alignment,
        spacing: { before: 300, after: 150 },
        children: [
          new TextRun({
            text: exerciseLabel,
            bold: true,
            size: 24,
            font: isRTL ? "Traditional Arabic" : "Arial",
          }),
        ],
      })
    );

    exercise.answers?.forEach((answer, aIndex) => {
      paragraphs.push(
        new Paragraph({
          alignment,
          spacing: { before: 50, after: 50 },
          indent: { left: 400 },
          children: [
            new TextRun({
              text: `${aIndex + 1}. ${answer}`,
              size: 22,
              font: isRTL ? "Traditional Arabic" : "Arial",
            }),
          ],
        })
      );
    });
  });

  return paragraphs;
};

export const generateExamDocx = async (data: ExamData): Promise<void> => {
  const isRTL = data.language === "ar";
  
  const sections = [];
  const children: (Paragraph | Table)[] = [];

  // Header table
  children.push(createHeader(data, isRTL));

  // Spacing after header
  children.push(
    new Paragraph({
      spacing: { before: 400 },
      children: [],
    })
  );

  // Exercises
  data.exercises.forEach((exercise, index) => {
    const exerciseParagraphs = createExercise(exercise, index, isRTL, data.language);
    children.push(...exerciseParagraphs);
  });

  // Grading table
  children.push(
    new Paragraph({
      spacing: { before: 400, after: 200 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: isRTL ? "سلم التنقيط" : data.language === "fr" ? "Barème de notation" : "Grading Scale",
          bold: true,
          size: 24,
          font: isRTL ? "Traditional Arabic" : "Arial",
        }),
      ],
    })
  );
  children.push(createGradingTable(data.exercises, isRTL, data.language));

  // Answer key if requested
  if (data.includeAnswerKey) {
    const answerKeyParagraphs = createAnswerKey(data.exercises, isRTL, data.language);
    children.push(...answerKeyParagraphs);
  }

  // Footer note
  children.push(
    new Paragraph({
      spacing: { before: 400 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: isRTL 
            ? "ملاحظة: تُسند نقطة على وضوح الخط ونظافة الورقة" 
            : data.language === "fr"
              ? "Note: Un point est attribué pour la clarté de l'écriture et la propreté de la copie"
              : "Note: One point is awarded for handwriting clarity and paper cleanliness",
          italics: true,
          size: 18,
          font: isRTL ? "Traditional Arabic" : "Arial",
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.PORTRAIT,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `${data.subject}_${data.level}_${new Date().toISOString().split('T')[0]}.docx`;
  saveAs(blob, fileName);
};

// Mock Tunisian educational resources
export const TUNISIAN_RESOURCES = {
  subjects: {
    "Mathématiques": {
      levels: ["1ère année", "2ème année", "3ème année", "4ème année", "5ème année", "6ème année", "7ème année", "8ème année", "9ème année", "Baccalauréat"],
      sources: ["devoir.tn", "edunet.tn", "moncef-math.com"],
    },
    "Français": {
      levels: ["1ère année", "2ème année", "3ème année", "4ème année", "5ème année", "6ème année", "7ème année", "8ème année", "9ème année", "Baccalauréat"],
      sources: ["devoir.tn", "edunet.tn"],
    },
    "Arabe": {
      levels: ["1ère année", "2ème année", "3ème année", "4ème année", "5ème année", "6ème année", "7ème année", "8ème année", "9ème année", "Baccalauréat"],
      sources: ["devoir.tn", "edunet.tn"],
    },
    "Sciences": {
      levels: ["3ème année", "4ème année", "5ème année", "6ème année", "7ème année", "8ème année", "9ème année"],
      sources: ["devoir.tn", "edunet.tn"],
    },
    "Physique": {
      levels: ["7ème année", "8ème année", "9ème année", "1ère année secondaire", "2ème année secondaire", "3ème année secondaire", "Baccalauréat"],
      sources: ["devoir.tn", "edunet.tn", "physique-tunisie.com"],
    },
  },
};

// Generate exercises based on Tunisian curriculum
export const generateTunisianExercises = (
  subject: string,
  level: string,
  language: "fr" | "ar" | "en",
  exerciseCount: number,
  difficulty: { easy: number; medium: number; hard: number }
): ExerciseData[] => {
  const exercises: ExerciseData[] = [];
  
  const easyCount = Math.round(exerciseCount * (difficulty.easy / 100));
  const mediumCount = Math.round(exerciseCount * (difficulty.medium / 100));
  const hardCount = exerciseCount - easyCount - mediumCount;

  // Sample exercises based on subject and level (mimicking devoir.tn style)
  const exerciseTemplates = getExerciseTemplates(subject, level, language);
  
  for (let i = 0; i < easyCount && exercises.length < exerciseCount; i++) {
    exercises.push(createExerciseFromTemplate(exerciseTemplates.easy, exercises.length, "easy", language));
  }
  
  for (let i = 0; i < mediumCount && exercises.length < exerciseCount; i++) {
    exercises.push(createExerciseFromTemplate(exerciseTemplates.medium, exercises.length, "medium", language));
  }
  
  for (let i = 0; i < hardCount && exercises.length < exerciseCount; i++) {
    exercises.push(createExerciseFromTemplate(exerciseTemplates.hard, exercises.length, "hard", language));
  }

  return exercises;
};

interface ExerciseTemplates {
  easy: { questions: string[]; answers: string[] }[];
  medium: { questions: string[]; answers: string[] }[];
  hard: { questions: string[]; answers: string[] }[];
}

const getExerciseTemplates = (subject: string, level: string, language: string): ExerciseTemplates => {
  // Templates inspired by Tunisian educational content
  const templates: Record<string, ExerciseTemplates> = {
    "Mathématiques": {
      easy: [
        {
          questions: language === "ar" 
            ? ["أحسب: 25 + 37 = ........", "أحسب: 48 - 19 = ........", "رتب الأعداد التالية تصاعديا: 45، 23، 67، 12"]
            : ["Calcule: 25 + 37 = ........", "Calcule: 48 - 19 = ........", "Range les nombres suivants en ordre croissant: 45, 23, 67, 12"],
          answers: language === "ar"
            ? ["62", "29", "12، 23، 45، 67"]
            : ["62", "29", "12, 23, 45, 67"],
        },
        {
          questions: language === "ar"
            ? ["اكتب العدد بالحروف: 156", "أكمل: 3 × 4 = ........", "ما هو ضعف العدد 25؟"]
            : ["Écris le nombre en lettres: 156", "Complète: 3 × 4 = ........", "Quel est le double de 25?"],
          answers: language === "ar"
            ? ["مائة وستة وخمسون", "12", "50"]
            : ["cent cinquante-six", "12", "50"],
        },
      ],
      medium: [
        {
          questions: language === "ar"
            ? ["حل المعادلة: 2x + 5 = 13", "احسب محيط مستطيل طوله 8 سم وعرضه 5 سم", "اختصر الكسر: 24/36"]
            : ["Résous l'équation: 2x + 5 = 13", "Calcule le périmètre d'un rectangle de longueur 8 cm et largeur 5 cm", "Simplifie la fraction: 24/36"],
          answers: language === "ar"
            ? ["x = 4", "26 سم", "2/3"]
            : ["x = 4", "26 cm", "2/3"],
        },
      ],
      hard: [
        {
          questions: language === "ar"
            ? ["أثبت أن مجموع زوايا المثلث يساوي 180°", "حل جملة المعادلتين: x + y = 7 و x - y = 3", "احسب مساحة دائرة نصف قطرها 7 سم (π = 22/7)"]
            : ["Démontre que la somme des angles d'un triangle égale 180°", "Résous le système: x + y = 7 et x - y = 3", "Calcule l'aire d'un cercle de rayon 7 cm (π = 22/7)"],
          answers: language === "ar"
            ? ["البرهان بالاستناد إلى خاصية الزوايا المتبادلة", "x = 5, y = 2", "154 سم²"]
            : ["Démonstration par les angles alternes-internes", "x = 5, y = 2", "154 cm²"],
        },
      ],
    },
    "Français": {
      easy: [
        {
          questions: [
            "Complète avec le bon article (le, la, les): .... maison est grande.",
            "Écris le pluriel de: un livre → des ........",
            "Souligne le verbe dans la phrase: Le chat dort sur le canapé.",
          ],
          answers: ["la", "livres", "dort"],
        },
      ],
      medium: [
        {
          questions: [
            "Conjugue le verbe 'finir' au présent de l'indicatif avec 'nous'.",
            "Transforme à la forme négative: Elle mange une pomme.",
            "Trouve un synonyme du mot 'content'.",
          ],
          answers: ["nous finissons", "Elle ne mange pas une pomme.", "heureux/joyeux"],
        },
      ],
      hard: [
        {
          questions: [
            "Analyse grammaticalement le mot souligné: Les enfants *jouent* dans la cour.",
            "Réécris la phrase en remplaçant le COD par un pronom: Pierre lit le livre.",
            "Rédige une phrase contenant une proposition subordonnée relative.",
          ],
          answers: [
            "Verbe jouer, 3ème groupe, présent de l'indicatif, 3ème personne du pluriel",
            "Pierre le lit.",
            "Exemple: L'homme qui parle est mon père.",
          ],
        },
      ],
    },
    "Arabe": {
      easy: [
        {
          questions: [
            "أكمل بالحرف المناسب (ـة أو ـت): المعلم.... تشرح الدرس",
            "حوّل إلى المثنى: التلميذ يكتب → ........",
            "استخرج الفعل من الجملة: يلعب الأطفال في الحديقة",
          ],
          answers: ["ـة", "التلميذان يكتبان", "يلعب"],
        },
      ],
      medium: [
        {
          questions: [
            "أعرب الكلمة التي تحتها خط: ذهب محمد إلى المدرسة",
            "حوّل الجملة إلى المبني للمجهول: كتب التلميذ الدرس",
            "استخرج النعت من الجملة: رأيت طفلا جميلا",
          ],
          answers: [
            "محمد: فاعل مرفوع وعلامة رفعه الضمة",
            "كُتِبَ الدرسُ",
            "جميلا",
          ],
        },
      ],
      hard: [
        {
          questions: [
            "أنتج فقرة قصيرة عن موضوع 'العائلة' في 5 أسطر",
            "بيّن نوع الأسلوب في: ما أجمل السماء!",
            "استخرج الاستعارة وبيّن نوعها: الشمس تبتسم للأرض",
          ],
          answers: [
            "إجابة حرة تتضمن: مقدمة، صلب، خاتمة",
            "أسلوب تعجب",
            "استعارة مكنية: شبّه الشمس بإنسان يبتسم",
          ],
        },
      ],
    },
  };

  return templates[subject] || templates["Mathématiques"];
};

const createExerciseFromTemplate = (
  templates: { questions: string[]; answers: string[] }[],
  index: number,
  difficulty: "easy" | "medium" | "hard",
  language: string
): ExerciseData => {
  const template = templates[index % templates.length];
  const points = difficulty === "easy" ? 3 : difficulty === "medium" ? 5 : 7;
  
  return {
    title: language === "ar" 
      ? `التمرين ${index + 1}` 
      : language === "fr" 
        ? `Exercice ${index + 1}` 
        : `Exercise ${index + 1}`,
    points,
    difficulty,
    questions: template.questions,
    answers: template.answers,
  };
};
