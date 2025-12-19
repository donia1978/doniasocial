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
  PageOrientation,
  ImageRun,
  ShadingType,
  VerticalAlign,
  convertInchesToTwip,
  LevelFormat,
  HeadingLevel,
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
  evaluationType?: string;
  sourceReferences?: SourceReference[];
}

export interface ExerciseData {
  title: string;
  points: number;
  difficulty: "easy" | "medium" | "hard";
  questions: QuestionData[];
  answers?: string[];
  source?: SourceReference;
  instructions?: string;
}

export interface QuestionData {
  text: string;
  subQuestions?: string[];
  points?: number;
  type?: "calculation" | "text" | "choice" | "true_false" | "matching" | "essay";
  options?: string[];
  hasImage?: boolean;
  answerLines?: number;
}

export interface SourceReference {
  name: string;
  url: string;
  year?: string;
  type: "devoir" | "cours" | "serie" | "bac";
}

// Tunisian Educational Resources Database
export const TUNISIAN_RESOURCES: Record<string, SourceReference[]> = {
  primary: [
    { name: "Devoir.tn - Devoirs Primaire", url: "https://www.devoir.tn/primaire/", type: "devoir" },
    { name: "Edunet.tn - Ressources Primaire", url: "https://www.edunet.tn/", type: "cours" },
    { name: "Cnte.tn - Centre National", url: "https://www.cnte.tn/", type: "cours" },
  ],
  secondary: [
    { name: "Devoir.tn - Devoirs Secondaire", url: "https://www.devoir.tn/secondaire/", type: "devoir" },
    { name: "Mathsways.tn", url: "https://www.mathsways.tn/", type: "serie" },
    { name: "Bacweb.tn", url: "https://www.bacweb.tn/", type: "bac" },
  ],
  bac: [
    { name: "Devoir.tn - Baccalauréat", url: "https://www.devoir.tn/bac/", type: "bac", year: "2024" },
    { name: "Bacweb.tn - Annales", url: "https://www.bacweb.tn/annales/", type: "bac" },
    { name: "Mathsways.tn - Bac", url: "https://www.mathsways.tn/bac/", type: "bac" },
  ],
};

// Create professional header with République Tunisienne style
const createOfficialHeader = (data: ExamData, isRTL: boolean) => {
  const fontFamily = isRTL ? "Traditional Arabic" : "Times New Roman";
  
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.DOUBLE, size: 6, color: "000000" },
      bottom: { style: BorderStyle.DOUBLE, size: 6, color: "000000" },
      left: { style: BorderStyle.DOUBLE, size: 6, color: "000000" },
      right: { style: BorderStyle.DOUBLE, size: 6, color: "000000" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    },
    rows: [
      // First row: Ministry and School Year
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
                spacing: { before: 100, after: 50 },
                children: [
                  new TextRun({
                    text: isRTL ? "الجمهورية التونسية" : "République Tunisienne",
                    bold: true,
                    size: 22,
                    font: fontFamily,
                  }),
                ],
              }),
              new Paragraph({
                alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
                spacing: { before: 50, after: 50 },
                children: [
                  new TextRun({
                    text: isRTL ? "وزارة التربية" : "Ministère de l'Éducation",
                    size: 20,
                    font: fontFamily,
                  }),
                ],
              }),
              new Paragraph({
                alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
                spacing: { before: 50, after: 100 },
                children: [
                  new TextRun({
                    text: data.schoolName,
                    bold: true,
                    size: 22,
                    font: fontFamily,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: isRTL ? AlignmentType.LEFT : AlignmentType.RIGHT,
                spacing: { before: 100, after: 50 },
                children: [
                  new TextRun({
                    text: isRTL ? `السنة الدراسية: ${data.schoolYear}` : `Année scolaire: ${data.schoolYear}`,
                    bold: true,
                    size: 22,
                    font: fontFamily,
                  }),
                ],
              }),
              new Paragraph({
                alignment: isRTL ? AlignmentType.LEFT : AlignmentType.RIGHT,
                spacing: { before: 50, after: 50 },
                children: [
                  new TextRun({
                    text: isRTL ? `المستوى: ${data.level}` : `Niveau: ${data.level}`,
                    size: 20,
                    font: fontFamily,
                  }),
                ],
              }),
              new Paragraph({
                alignment: isRTL ? AlignmentType.LEFT : AlignmentType.RIGHT,
                spacing: { before: 50, after: 100 },
                children: [
                  new TextRun({
                    text: isRTL ? `المدة: ${data.duration}` : `Durée: ${data.duration}`,
                    size: 20,
                    font: fontFamily,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      // Second row: Exam title
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            shading: { fill: "E8E8E8", type: ShadingType.SOLID },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 150, after: 150 },
                children: [
                  new TextRun({
                    text: getExamTypeTitle(data.evaluationType || "summative", data.trimester, isRTL),
                    bold: true,
                    size: 32,
                    font: fontFamily,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 50, after: 150 },
                children: [
                  new TextRun({
                    text: isRTL ? `مادة: ${data.subject}` : `Matière: ${data.subject}`,
                    bold: true,
                    size: 28,
                    font: fontFamily,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      // Third row: Student info
      new TableRow({
        children: [
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
                spacing: { before: 100, after: 100 },
                children: [
                  new TextRun({
                    text: isRTL 
                      ? "الاسم و اللقب: ..................................................." 
                      : "Nom et Prénom: ...................................................",
                    size: 22,
                    font: fontFamily,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: isRTL ? AlignmentType.LEFT : AlignmentType.RIGHT,
                spacing: { before: 100, after: 100 },
                children: [
                  new TextRun({
                    text: isRTL 
                      ? "العدد: .......... / 20" 
                      : "Note: .......... / 20",
                    bold: true,
                    size: 24,
                    font: fontFamily,
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

const getExamTypeTitle = (type: string, trimester: string, isRTL: boolean): string => {
  const titles: Record<string, { fr: string; ar: string }> = {
    formative: { fr: "Devoir de Contrôle", ar: "فرض مراقبة" },
    summative: { fr: "Devoir de Synthèse", ar: "فرض تأليفي" },
    diagnostic: { fr: "Évaluation Diagnostique", ar: "تقييم تشخيصي" },
  };
  
  const title = titles[type] || titles.summative;
  const trimesterLabel = isRTL ? `${trimester}` : `${trimester}`;
  
  return isRTL 
    ? `${title.ar} - ${trimesterLabel}`
    : `${title.fr} - ${trimesterLabel}`;
};

// Create exercise with better formatting
const createExercise = (
  exercise: ExerciseData, 
  index: number, 
  isRTL: boolean, 
  lang: string
): Paragraph[] => {
  const fontFamily = isRTL ? "Traditional Arabic" : "Times New Roman";
  const alignment = isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT;
  
  const difficultyLabels = {
    fr: { easy: "★", medium: "★★", hard: "★★★" },
    ar: { easy: "★", medium: "★★", hard: "★★★" },
    en: { easy: "★", medium: "★★", hard: "★★★" },
  };

  const exerciseLabel = isRTL 
    ? `التمرين ${toArabicNumber(index + 1)}` 
    : lang === "fr" 
      ? `Exercice N°${index + 1}` 
      : `Exercise ${index + 1}`;
  
  const pointsLabel = isRTL 
    ? `(${toArabicNumber(exercise.points)} نقاط)` 
    : `(${exercise.points} pts)`;
  
  const stars = difficultyLabels[lang as keyof typeof difficultyLabels]?.[exercise.difficulty] || "";

  const paragraphs: Paragraph[] = [];

  // Exercise header with box
  paragraphs.push(
    new Paragraph({
      alignment,
      spacing: { before: 400, after: 200 },
      border: {
        bottom: { color: "000000", size: 12, style: BorderStyle.SINGLE },
      },
      children: [
        new TextRun({
          text: `${exerciseLabel} ${pointsLabel} `,
          bold: true,
          size: 26,
          font: fontFamily,
        }),
        new TextRun({
          text: stars,
          size: 20,
          color: "FFD700",
        }),
      ],
    })
  );

  // Exercise instructions if any
  if (exercise.instructions) {
    paragraphs.push(
      new Paragraph({
        alignment,
        spacing: { before: 100, after: 150 },
        indent: { left: 300 },
        children: [
          new TextRun({
            text: exercise.instructions,
            italics: true,
            size: 22,
            font: fontFamily,
          }),
        ],
      })
    );
  }

  // Questions
  exercise.questions.forEach((question, qIndex) => {
    const questionNumber = isRTL 
      ? `${toArabicNumber(qIndex + 1)})` 
      : `${qIndex + 1})`;
    
    const pointsText = question.points 
      ? isRTL ? ` (${toArabicNumber(question.points)} ن)` : ` (${question.points} pt${question.points > 1 ? 's' : ''})`
      : '';

    paragraphs.push(
      new Paragraph({
        alignment,
        spacing: { before: 150, after: 100 },
        indent: { left: 400 },
        children: [
          new TextRun({
            text: `${questionNumber} ${question.text}`,
            size: 24,
            font: fontFamily,
          }),
          new TextRun({
            text: pointsText,
            size: 20,
            font: fontFamily,
            bold: true,
          }),
        ],
      })
    );

    // Sub-questions if any
    if (question.subQuestions && question.subQuestions.length > 0) {
      question.subQuestions.forEach((subQ, subIndex) => {
        const subLetter = isRTL 
          ? String.fromCharCode(1571 + subIndex) // Arabic letters أ، ب، ت
          : String.fromCharCode(97 + subIndex); // a, b, c
        
        paragraphs.push(
          new Paragraph({
            alignment,
            spacing: { before: 80, after: 80 },
            indent: { left: 800 },
            children: [
              new TextRun({
                text: `${subLetter}) ${subQ}`,
                size: 22,
                font: fontFamily,
              }),
            ],
          })
        );
      });
    }

    // Multiple choice options
    if (question.type === "choice" && question.options) {
      question.options.forEach((option, optIndex) => {
        paragraphs.push(
          new Paragraph({
            alignment,
            spacing: { before: 60, after: 60 },
            indent: { left: 800 },
            children: [
              new TextRun({
                text: `☐ ${option}`,
                size: 22,
                font: fontFamily,
              }),
            ],
          })
        );
      });
    }

    // Answer lines
    const answerLines = question.answerLines || 2;
    for (let i = 0; i < answerLines; i++) {
      paragraphs.push(
        new Paragraph({
          alignment,
          spacing: { before: 80, after: 80 },
          indent: { left: 600 },
          children: [
            new TextRun({
              text: "........................................................................................................................................................",
              size: 20,
              font: "Arial",
              color: "CCCCCC",
            }),
          ],
        })
      );
    }
  });

  // Source reference
  if (exercise.source) {
    paragraphs.push(
      new Paragraph({
        alignment: isRTL ? AlignmentType.LEFT : AlignmentType.RIGHT,
        spacing: { before: 100, after: 50 },
        children: [
          new TextRun({
            text: isRTL 
              ? `المصدر: ${exercise.source.name}` 
              : `Source: ${exercise.source.name}`,
            size: 16,
            font: fontFamily,
            italics: true,
            color: "666666",
          }),
        ],
      })
    );
  }

  return paragraphs;
};

// Convert number to Arabic numerals
const toArabicNumber = (num: number): string => {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().split('').map(d => arabicNumerals[parseInt(d)]).join('');
};

// Create grading table
const createGradingTable = (exercises: ExerciseData[], isRTL: boolean, lang: string): Table => {
  const fontFamily = isRTL ? "Traditional Arabic" : "Times New Roman";
  const totalPoints = exercises.reduce((sum, ex) => sum + ex.points, 0);
  
  const headers = isRTL 
    ? ["التمرين", "السلم", "العدد"]
    : lang === "fr" 
      ? ["Exercice", "Barème", "Note"]
      : ["Exercise", "Points", "Score"];

  const rows = [
    new TableRow({
      children: headers.map(header => 
        new TableCell({
          shading: { fill: "D9D9D9", type: ShadingType.SOLID },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 80, after: 80 },
              children: [
                new TextRun({
                  text: header,
                  bold: true,
                  size: 22,
                  font: fontFamily,
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
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: isRTL ? toArabicNumber(i + 1) : `${i + 1}`,
                    size: 22,
                    font: fontFamily,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: isRTL ? toArabicNumber(ex.points) : `${ex.points}`,
                    size: 22,
                    font: fontFamily,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "",
                    size: 22,
                    font: fontFamily,
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
          shading: { fill: "D9D9D9", type: ShadingType.SOLID },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: isRTL ? "المجموع" : lang === "fr" ? "Total" : "Total",
                  bold: true,
                  size: 22,
                  font: fontFamily,
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          shading: { fill: "D9D9D9", type: ShadingType.SOLID },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: isRTL ? toArabicNumber(totalPoints) : `${totalPoints}`,
                  bold: true,
                  size: 22,
                  font: fontFamily,
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          shading: { fill: "D9D9D9", type: ShadingType.SOLID },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "/20",
                  bold: true,
                  size: 22,
                  font: fontFamily,
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ];

  return new Table({
    width: { size: 50, type: WidthType.PERCENTAGE },
    alignment: AlignmentType.CENTER,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    },
    rows,
  });
};

// Create answer key with better formatting
const createAnswerKey = (exercises: ExerciseData[], isRTL: boolean, lang: string): (Paragraph | Table)[] => {
  const fontFamily = isRTL ? "Traditional Arabic" : "Times New Roman";
  const alignment = isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT;
  
  const elements: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 300 },
      pageBreakBefore: true,
      border: {
        top: { color: "000000", size: 12, style: BorderStyle.DOUBLE },
        bottom: { color: "000000", size: 12, style: BorderStyle.DOUBLE },
      },
      children: [
        new TextRun({
          text: isRTL ? "الإصـــلاح" : lang === "fr" ? "CORRIGÉ TYPE" : "ANSWER KEY",
          bold: true,
          size: 36,
          font: fontFamily,
        }),
      ],
    }),
  ];

  exercises.forEach((exercise, exIndex) => {
    const exerciseLabel = isRTL 
      ? `التمرين ${toArabicNumber(exIndex + 1)}` 
      : lang === "fr" 
        ? `Exercice ${exIndex + 1}` 
        : `Exercise ${exIndex + 1}`;
    
    elements.push(
      new Paragraph({
        alignment,
        spacing: { before: 300, after: 150 },
        shading: { fill: "F0F0F0", type: ShadingType.SOLID },
        children: [
          new TextRun({
            text: `${exerciseLabel} (${exercise.points} pts)`,
            bold: true,
            size: 26,
            font: fontFamily,
          }),
        ],
      })
    );

    exercise.answers?.forEach((answer, aIndex) => {
      const questionNumber = isRTL ? toArabicNumber(aIndex + 1) : `${aIndex + 1}`;
      
      elements.push(
        new Paragraph({
          alignment,
          spacing: { before: 100, after: 100 },
          indent: { left: 400 },
          children: [
            new TextRun({
              text: `${questionNumber}) `,
              bold: true,
              size: 24,
              font: fontFamily,
            }),
            new TextRun({
              text: answer,
              size: 24,
              font: fontFamily,
              color: "006600",
            }),
          ],
        })
      );
    });
  });

  return elements;
};

// Create source references section
const createSourceReferences = (sources: SourceReference[], isRTL: boolean, lang: string): Paragraph[] => {
  const fontFamily = isRTL ? "Traditional Arabic" : "Times New Roman";
  
  const paragraphs: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
      children: [
        new TextRun({
          text: isRTL ? "المصادر والمراجع" : lang === "fr" ? "Sources et Références" : "Sources and References",
          bold: true,
          size: 24,
          font: fontFamily,
          underline: {},
        }),
      ],
    }),
  ];

  sources.forEach((source, index) => {
    paragraphs.push(
      new Paragraph({
        alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
        spacing: { before: 80, after: 80 },
        bullet: { level: 0 },
        children: [
          new TextRun({
            text: source.name,
            size: 20,
            font: fontFamily,
          }),
          new TextRun({
            text: ` - ${source.url}`,
            size: 18,
            font: fontFamily,
            color: "0066CC",
            italics: true,
          }),
          source.year ? new TextRun({
            text: ` (${source.year})`,
            size: 18,
            font: fontFamily,
            color: "666666",
          }) : new TextRun({ text: "" }),
        ],
      })
    );
  });

  return paragraphs;
};

// Footer with note
const createFooterNote = (isRTL: boolean, lang: string): Paragraph => {
  const fontFamily = isRTL ? "Traditional Arabic" : "Times New Roman";
  
  const noteText = isRTL 
    ? "ملاحظة: يُراعى في الإصلاح سلامة اللغة ووضوح الخط ونظافة الورقة"
    : lang === "fr"
      ? "N.B: La clarté de l'écriture et la propreté de la copie seront prises en compte."
      : "Note: Handwriting clarity and paper cleanliness will be taken into account.";
  
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 100 },
    border: {
      top: { color: "000000", size: 4, style: BorderStyle.SINGLE },
    },
    children: [
      new TextRun({
        text: noteText,
        italics: true,
        size: 18,
        font: fontFamily,
      }),
    ],
  });
};

// Main export function
export const generateExamDocx = async (data: ExamData): Promise<void> => {
  const isRTL = data.language === "ar";
  const children: (Paragraph | Table)[] = [];

  // Official header
  children.push(createOfficialHeader(data, isRTL));

  // Spacing after header
  children.push(
    new Paragraph({
      spacing: { before: 300 },
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
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
      children: [
        new TextRun({
          text: isRTL ? "سلم التنقيط" : data.language === "fr" ? "Barème de Notation" : "Grading Scale",
          bold: true,
          size: 26,
          font: isRTL ? "Traditional Arabic" : "Times New Roman",
          underline: {},
        }),
      ],
    })
  );
  children.push(createGradingTable(data.exercises, isRTL, data.language));

  // Footer note
  children.push(createFooterNote(isRTL, data.language));

  // Source references
  if (data.sourceReferences && data.sourceReferences.length > 0) {
    const sourceElements = createSourceReferences(data.sourceReferences, isRTL, data.language);
    children.push(...sourceElements);
  }

  // Answer key if requested
  if (data.includeAnswerKey) {
    const answerKeyElements = createAnswerKey(data.exercises, isRTL, data.language);
    children.push(...answerKeyElements);
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.PORTRAIT,
            },
            margin: {
              top: convertInchesToTwip(0.7),
              bottom: convertInchesToTwip(0.7),
              left: convertInchesToTwip(0.8),
              right: convertInchesToTwip(0.8),
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `Devoir_${data.subject}_${data.level}_${new Date().toISOString().split('T')[0]}.docx`;
  saveAs(blob, fileName);
};

// ============================================
// TUNISIAN CURRICULUM EXERCISE GENERATOR
// ============================================

interface SubjectConfig {
  name: string;
  nameAr: string;
  levels: LevelConfig[];
  sources: SourceReference[];
}

interface LevelConfig {
  id: string;
  name: string;
  nameAr: string;
  cycle: "primary" | "secondary" | "bac";
}

// Complete Tunisian curriculum configuration
export const TUNISIAN_CURRICULUM: Record<string, SubjectConfig> = {
  math: {
    name: "Mathématiques",
    nameAr: "الرياضيات",
    levels: [
      { id: "1p", name: "1ère année primaire", nameAr: "السنة الأولى ابتدائي", cycle: "primary" },
      { id: "2p", name: "2ème année primaire", nameAr: "السنة الثانية ابتدائي", cycle: "primary" },
      { id: "3p", name: "3ème année primaire", nameAr: "السنة الثالثة ابتدائي", cycle: "primary" },
      { id: "4p", name: "4ème année primaire", nameAr: "السنة الرابعة ابتدائي", cycle: "primary" },
      { id: "5p", name: "5ème année primaire", nameAr: "السنة الخامسة ابتدائي", cycle: "primary" },
      { id: "6p", name: "6ème année primaire", nameAr: "السنة السادسة ابتدائي", cycle: "primary" },
      { id: "7b", name: "7ème année de base", nameAr: "السنة السابعة أساسي", cycle: "secondary" },
      { id: "8b", name: "8ème année de base", nameAr: "السنة الثامنة أساسي", cycle: "secondary" },
      { id: "9b", name: "9ème année de base", nameAr: "السنة التاسعة أساسي", cycle: "secondary" },
      { id: "1s", name: "1ère année secondaire", nameAr: "السنة الأولى ثانوي", cycle: "secondary" },
      { id: "2s", name: "2ème année secondaire", nameAr: "السنة الثانية ثانوي", cycle: "secondary" },
      { id: "3s", name: "3ème année secondaire", nameAr: "السنة الثالثة ثانوي", cycle: "secondary" },
      { id: "bac", name: "Baccalauréat", nameAr: "البكالوريا", cycle: "bac" },
    ],
    sources: [
      { name: "Devoir.tn - Mathématiques", url: "https://www.devoir.tn/mathematiques/", type: "devoir" },
      { name: "Mathsways.tn", url: "https://www.mathsways.tn/", type: "serie" },
      { name: "Bacweb.tn - Math", url: "https://www.bacweb.tn/math/", type: "bac" },
    ],
  },
  french: {
    name: "Français",
    nameAr: "الفرنسية",
    levels: [
      { id: "3p", name: "3ème année primaire", nameAr: "السنة الثالثة ابتدائي", cycle: "primary" },
      { id: "4p", name: "4ème année primaire", nameAr: "السنة الرابعة ابتدائي", cycle: "primary" },
      { id: "5p", name: "5ème année primaire", nameAr: "السنة الخامسة ابتدائي", cycle: "primary" },
      { id: "6p", name: "6ème année primaire", nameAr: "السنة السادسة ابتدائي", cycle: "primary" },
      { id: "7b", name: "7ème année de base", nameAr: "السنة السابعة أساسي", cycle: "secondary" },
      { id: "8b", name: "8ème année de base", nameAr: "السنة الثامنة أساسي", cycle: "secondary" },
      { id: "9b", name: "9ème année de base", nameAr: "السنة التاسعة أساسي", cycle: "secondary" },
      { id: "bac", name: "Baccalauréat", nameAr: "البكالوريا", cycle: "bac" },
    ],
    sources: [
      { name: "Devoir.tn - Français", url: "https://www.devoir.tn/francais/", type: "devoir" },
      { name: "Edunet.tn - Français", url: "https://www.edunet.tn/francais/", type: "cours" },
    ],
  },
  arabic: {
    name: "Arabe",
    nameAr: "العربية",
    levels: [
      { id: "1p", name: "1ère année primaire", nameAr: "السنة الأولى ابتدائي", cycle: "primary" },
      { id: "2p", name: "2ème année primaire", nameAr: "السنة الثانية ابتدائي", cycle: "primary" },
      { id: "3p", name: "3ème année primaire", nameAr: "السنة الثالثة ابتدائي", cycle: "primary" },
      { id: "4p", name: "4ème année primaire", nameAr: "السنة الرابعة ابتدائي", cycle: "primary" },
      { id: "5p", name: "5ème année primaire", nameAr: "السنة الخامسة ابتدائي", cycle: "primary" },
      { id: "6p", name: "6ème année primaire", nameAr: "السنة السادسة ابتدائي", cycle: "primary" },
      { id: "7b", name: "7ème année de base", nameAr: "السنة السابعة أساسي", cycle: "secondary" },
      { id: "8b", name: "8ème année de base", nameAr: "السنة الثامنة أساسي", cycle: "secondary" },
      { id: "9b", name: "9ème année de base", nameAr: "السنة التاسعة أساسي", cycle: "secondary" },
      { id: "bac", name: "Baccalauréat", nameAr: "البكالوريا", cycle: "bac" },
    ],
    sources: [
      { name: "Devoir.tn - Arabe", url: "https://www.devoir.tn/arabe/", type: "devoir" },
      { name: "Edunet.tn - Arabe", url: "https://www.edunet.tn/arabe/", type: "cours" },
    ],
  },
  physics: {
    name: "Physique",
    nameAr: "الفيزياء",
    levels: [
      { id: "7b", name: "7ème année de base", nameAr: "السنة السابعة أساسي", cycle: "secondary" },
      { id: "8b", name: "8ème année de base", nameAr: "السنة الثامنة أساسي", cycle: "secondary" },
      { id: "9b", name: "9ème année de base", nameAr: "السنة التاسعة أساسي", cycle: "secondary" },
      { id: "1s", name: "1ère année secondaire", nameAr: "السنة الأولى ثانوي", cycle: "secondary" },
      { id: "2s", name: "2ème année secondaire", nameAr: "السنة الثانية ثانوي", cycle: "secondary" },
      { id: "3s", name: "3ème année secondaire", nameAr: "السنة الثالثة ثانوي", cycle: "secondary" },
      { id: "bac", name: "Baccalauréat", nameAr: "البكالوريا", cycle: "bac" },
    ],
    sources: [
      { name: "Devoir.tn - Physique", url: "https://www.devoir.tn/physique/", type: "devoir" },
      { name: "Physique-Tunisie.com", url: "https://www.physique-tunisie.com/", type: "serie" },
    ],
  },
  svt: {
    name: "Sciences de la Vie et de la Terre",
    nameAr: "علوم الحياة والأرض",
    levels: [
      { id: "7b", name: "7ème année de base", nameAr: "السنة السابعة أساسي", cycle: "secondary" },
      { id: "8b", name: "8ème année de base", nameAr: "السنة الثامنة أساسي", cycle: "secondary" },
      { id: "9b", name: "9ème année de base", nameAr: "السنة التاسعة أساسي", cycle: "secondary" },
      { id: "bac", name: "Baccalauréat", nameAr: "البكالوريا", cycle: "bac" },
    ],
    sources: [
      { name: "Devoir.tn - SVT", url: "https://www.devoir.tn/svt/", type: "devoir" },
      { name: "Edunet.tn - SVT", url: "https://www.edunet.tn/svt/", type: "cours" },
    ],
  },
  english: {
    name: "Anglais",
    nameAr: "الإنجليزية",
    levels: [
      { id: "7b", name: "7ème année de base", nameAr: "السنة السابعة أساسي", cycle: "secondary" },
      { id: "8b", name: "8ème année de base", nameAr: "السنة الثامنة أساسي", cycle: "secondary" },
      { id: "9b", name: "9ème année de base", nameAr: "السنة التاسعة أساسي", cycle: "secondary" },
      { id: "bac", name: "Baccalauréat", nameAr: "البكالوريا", cycle: "bac" },
    ],
    sources: [
      { name: "Devoir.tn - Anglais", url: "https://www.devoir.tn/anglais/", type: "devoir" },
    ],
  },
  history: {
    name: "Histoire-Géographie",
    nameAr: "التاريخ والجغرافيا",
    levels: [
      { id: "5p", name: "5ème année primaire", nameAr: "السنة الخامسة ابتدائي", cycle: "primary" },
      { id: "6p", name: "6ème année primaire", nameAr: "السنة السادسة ابتدائي", cycle: "primary" },
      { id: "7b", name: "7ème année de base", nameAr: "السنة السابعة أساسي", cycle: "secondary" },
      { id: "8b", name: "8ème année de base", nameAr: "السنة الثامنة أساسي", cycle: "secondary" },
      { id: "9b", name: "9ème année de base", nameAr: "السنة التاسعة أساسي", cycle: "secondary" },
      { id: "bac", name: "Baccalauréat", nameAr: "البكالوريا", cycle: "bac" },
    ],
    sources: [
      { name: "Devoir.tn - Histoire-Géo", url: "https://www.devoir.tn/histoire-geo/", type: "devoir" },
    ],
  },
  islamic: {
    name: "Éducation Islamique",
    nameAr: "التربية الإسلامية",
    levels: [
      { id: "1p", name: "1ère année primaire", nameAr: "السنة الأولى ابتدائي", cycle: "primary" },
      { id: "2p", name: "2ème année primaire", nameAr: "السنة الثانية ابتدائي", cycle: "primary" },
      { id: "3p", name: "3ème année primaire", nameAr: "السنة الثالثة ابتدائي", cycle: "primary" },
      { id: "4p", name: "4ème année primaire", nameAr: "السنة الرابعة ابتدائي", cycle: "primary" },
      { id: "5p", name: "5ème année primaire", nameAr: "السنة الخامسة ابتدائي", cycle: "primary" },
      { id: "6p", name: "6ème année primaire", nameAr: "السنة السادسة ابتدائي", cycle: "primary" },
    ],
    sources: [
      { name: "Devoir.tn - Islamique", url: "https://www.devoir.tn/islamique/", type: "devoir" },
    ],
  },
};

// Enhanced exercise templates by subject and level
const EXERCISE_TEMPLATES: Record<string, Record<string, Record<string, { questions: QuestionData[]; answers: string[] }[]>>> = {
  math: {
    primary: {
      easy: [
        {
          questions: [
            { text: "Calcule: 45 + 28 = ........", type: "calculation", points: 1, answerLines: 1 },
            { text: "Calcule: 72 - 35 = ........", type: "calculation", points: 1, answerLines: 1 },
            { text: "Range les nombres suivants en ordre croissant: 56, 23, 89, 12, 45", type: "text", points: 1, answerLines: 1 },
          ],
          answers: ["73", "37", "12, 23, 45, 56, 89"],
        },
        {
          questions: [
            { text: "Écris en lettres le nombre 234", type: "text", points: 1, answerLines: 1 },
            { text: "Complète la suite: 5, 10, 15, ....., ....., .....", type: "calculation", points: 1, answerLines: 1 },
            { text: "Quel est le double de 45?", type: "calculation", points: 1, answerLines: 1 },
          ],
          answers: ["deux cent trente-quatre", "20, 25, 30", "90"],
        },
      ],
      medium: [
        {
          questions: [
            { text: "Une fermier a 156 moutons. Il en vend 48. Combien lui en reste-t-il?", type: "calculation", points: 2, answerLines: 3 },
            { text: "Calcule le périmètre d'un rectangle de longueur 12 cm et de largeur 8 cm.", type: "calculation", points: 2, answerLines: 2 },
            { text: "Convertis 3 heures en minutes.", type: "calculation", points: 1, answerLines: 1 },
          ],
          answers: ["156 - 48 = 108 moutons", "P = 2 × (12 + 8) = 40 cm", "180 minutes"],
        },
      ],
      hard: [
        {
          questions: [
            { text: "Un commerçant achète 25 articles à 12 dinars l'unité et les revend à 15 dinars l'unité. Calcule son bénéfice total.", type: "calculation", points: 3, answerLines: 4 },
            { text: "L'aire d'un carré est 64 cm². Calcule son périmètre.", type: "calculation", points: 2, answerLines: 3 },
          ],
          answers: ["Bénéfice = 25 × (15 - 12) = 75 dinars", "Côté = √64 = 8 cm, Périmètre = 4 × 8 = 32 cm"],
        },
      ],
    },
    secondary: {
      easy: [
        {
          questions: [
            { text: "Résous l'équation: 3x - 7 = 14", type: "calculation", points: 2, answerLines: 3 },
            { text: "Simplifie la fraction: 24/36", type: "calculation", points: 1, answerLines: 2 },
            { text: "Calcule: (-5) × (+3) = ........", type: "calculation", points: 1, answerLines: 1 },
          ],
          answers: ["x = 7", "2/3", "-15"],
        },
      ],
      medium: [
        {
          questions: [
            { 
              text: "Soit f(x) = 2x² - 5x + 3. Calcule:", 
              type: "calculation", 
              points: 4, 
              answerLines: 1,
              subQuestions: ["f(0)", "f(1)", "f(-2)"]
            },
            { text: "Développe et réduis: (2x + 3)(x - 4)", type: "calculation", points: 2, answerLines: 3 },
          ],
          answers: ["f(0) = 3, f(1) = 0, f(-2) = 21", "2x² - 5x - 12"],
        },
      ],
      hard: [
        {
          questions: [
            { 
              text: "Résous le système d'équations:", 
              type: "calculation", 
              points: 4, 
              answerLines: 1,
              subQuestions: ["2x + 3y = 12", "x - y = 1"]
            },
            { text: "Démontre que pour tout réel x: (x + 1)² - (x - 1)² = 4x", type: "text", points: 3, answerLines: 5 },
          ],
          answers: ["x = 3, y = 2", "Développement: (x² + 2x + 1) - (x² - 2x + 1) = 4x ✓"],
        },
      ],
    },
    bac: {
      easy: [
        {
          questions: [
            { text: "Calculer la dérivée de f(x) = 3x³ - 2x² + 5x - 1", type: "calculation", points: 2, answerLines: 3 },
            { text: "Déterminer le domaine de définition de f(x) = ln(2x - 4)", type: "calculation", points: 2, answerLines: 2 },
          ],
          answers: ["f'(x) = 9x² - 4x + 5", "Df = ]2, +∞["],
        },
      ],
      medium: [
        {
          questions: [
            { 
              text: "Soit f(x) = xe^(-x). Étudier les variations de f.", 
              type: "essay", 
              points: 5, 
              answerLines: 8,
              subQuestions: [
                "Calculer f'(x)",
                "Déterminer le signe de f'(x)",
                "Dresser le tableau de variations"
              ]
            },
          ],
          answers: ["f'(x) = (1-x)e^(-x), f'(x) > 0 sur ]-∞, 1[, f'(x) < 0 sur ]1, +∞[, max en x=1"],
        },
      ],
      hard: [
        {
          questions: [
            { 
              text: "Soit la suite (Un) définie par U₀ = 2 et Un+1 = (3Un + 4)/(Un + 2)", 
              type: "essay", 
              points: 7, 
              answerLines: 10,
              subQuestions: [
                "Montrer que pour tout n ∈ ℕ, 2 ≤ Un ≤ 4",
                "Étudier la monotonie de (Un)",
                "Montrer que (Un) converge et calculer sa limite"
              ]
            },
          ],
          answers: ["Par récurrence: Un ∈ [2,4], suite croissante, limite L = 2"],
        },
      ],
    },
  },
  french: {
    primary: {
      easy: [
        {
          questions: [
            { text: "Complète avec le bon article (le, la, les, l'): ........ école est grande.", type: "text", points: 1, answerLines: 1 },
            { text: "Écris le pluriel de: un cahier → des ........", type: "text", points: 1, answerLines: 1 },
            { text: "Recopie la phrase en corrigeant la faute: Les enfant jouent.", type: "text", points: 1, answerLines: 1 },
          ],
          answers: ["L'", "cahiers", "Les enfants jouent."],
        },
      ],
      medium: [
        {
          questions: [
            { text: "Conjugue le verbe 'finir' au présent de l'indicatif avec 'nous'.", type: "text", points: 1, answerLines: 1 },
            { text: "Transforme à la forme négative: Elle mange une pomme.", type: "text", points: 1, answerLines: 1 },
            { text: "Trouve un synonyme du mot 'content'.", type: "text", points: 1, answerLines: 1 },
          ],
          answers: ["nous finissons", "Elle ne mange pas de pomme.", "heureux / joyeux"],
        },
      ],
      hard: [
        {
          questions: [
            { text: "Analyse la phrase: 'Le petit chat dort sur le canapé.' (sujet, verbe, complément)", type: "essay", points: 3, answerLines: 4 },
            { text: "Rédige trois phrases avec les temps: présent, passé composé, futur simple.", type: "essay", points: 3, answerLines: 5 },
          ],
          answers: ["Sujet: Le petit chat, Verbe: dort, CC de lieu: sur le canapé", "Réponse libre avec conjugaison correcte"],
        },
      ],
    },
    secondary: {
      easy: [
        {
          questions: [
            { text: "Identifie le type de cette phrase: 'Quelle belle journée!'", type: "text", points: 1, answerLines: 1 },
            { text: "Donne la nature grammaticale du mot souligné: 'Il marche *rapidement*.'", type: "text", points: 1, answerLines: 1 },
          ],
          answers: ["Phrase exclamative", "Adverbe de manière"],
        },
      ],
      medium: [
        {
          questions: [
            { text: "Réécris la phrase au discours indirect: Il dit: 'Je viendrai demain.'", type: "text", points: 2, answerLines: 2 },
            { text: "Identifie la figure de style: 'Cette fille est un ange.'", type: "text", points: 1, answerLines: 1 },
          ],
          answers: ["Il dit qu'il viendrait le lendemain.", "Métaphore"],
        },
      ],
      hard: [
        {
          questions: [
            { 
              text: "Analyse le texte suivant et identifie les procédés littéraires utilisés:", 
              type: "essay", 
              points: 5, 
              answerLines: 8,
              subQuestions: [
                "'La mer, vaste miroir d'azur, reflétait les premiers rayons du soleil. Les vagues, telles des danseuses, ondulaient gracieusement.'"
              ]
            },
          ],
          answers: ["Métaphore: 'vaste miroir d'azur', Comparaison: 'telles des danseuses', Personnification: 'ondulaient gracieusement'"],
        },
      ],
    },
    bac: {
      easy: [
        {
          questions: [
            { text: "Identifie le registre littéraire de ce passage: 'Ô rage! ô désespoir! ô vieillesse ennemie!'", type: "text", points: 2, answerLines: 2 },
          ],
          answers: ["Registre tragique (Corneille, Le Cid)"],
        },
      ],
      medium: [
        {
          questions: [
            { 
              text: "Commentez ce passage en analysant le style et les thèmes:", 
              type: "essay", 
              points: 6, 
              answerLines: 12,
              subQuestions: [
                "Identifiez les figures de style",
                "Analysez le rythme et la sonorité",
                "Dégagez le thème principal"
              ]
            },
          ],
          answers: ["Analyse littéraire complète attendue"],
        },
      ],
      hard: [
        {
          questions: [
            { 
              text: "Dissertation: Dans quelle mesure la littérature peut-elle changer notre vision du monde?", 
              type: "essay", 
              points: 10, 
              answerLines: 20
            },
          ],
          answers: ["Introduction, développement en 3 parties, conclusion"],
        },
      ],
    },
  },
  arabic: {
    primary: {
      easy: [
        {
          questions: [
            { text: "أكمل بالحرف المناسب (ـة أو ـت): المعلم..... تشرح الدرس", type: "text", points: 1, answerLines: 1 },
            { text: "حوّل إلى المثنى: التلميذ يكتب ← ........", type: "text", points: 1, answerLines: 1 },
            { text: "استخرج الفعل من الجملة: يلعب الأطفال في الحديقة", type: "text", points: 1, answerLines: 1 },
          ],
          answers: ["ـة", "التلميذان يكتبان", "يلعب"],
        },
      ],
      medium: [
        {
          questions: [
            { text: "أعرب الكلمة التي تحتها خط: ذهب محمد إلى المدرسة", type: "text", points: 2, answerLines: 2 },
            { text: "حوّل الجملة إلى المبني للمجهول: كتب التلميذ الدرس", type: "text", points: 2, answerLines: 1 },
          ],
          answers: ["محمد: فاعل مرفوع وعلامة رفعه الضمة الظاهرة", "كُتِبَ الدرسُ"],
        },
      ],
      hard: [
        {
          questions: [
            { text: "أنتج فقرة قصيرة عن موضوع 'العائلة' في 5 أسطر", type: "essay", points: 4, answerLines: 6 },
          ],
          answers: ["إجابة حرة تتضمن: مقدمة، صلب، خاتمة"],
        },
      ],
    },
    secondary: {
      easy: [
        {
          questions: [
            { text: "بيّن نوع الأسلوب في الجملة: ما أجمل السماء!", type: "text", points: 1, answerLines: 1 },
            { text: "استخرج النعت والمنعوت: رأيت طفلا جميلا", type: "text", points: 2, answerLines: 2 },
          ],
          answers: ["أسلوب تعجب", "النعت: جميلا، المنعوت: طفلا"],
        },
      ],
      medium: [
        {
          questions: [
            { text: "استخرج الاستعارة وبيّن نوعها: الشمس تبتسم للأرض", type: "text", points: 3, answerLines: 3 },
            { text: "أعرب الجملة إعرابا تاما: إنّ العلم نور", type: "text", points: 3, answerLines: 4 },
          ],
          answers: ["استعارة مكنية: شبّه الشمس بإنسان يبتسم وحذف المشبه به", "إنّ: حرف ناسخ، العلم: اسم إن منصوب، نور: خبر إن مرفوع"],
        },
      ],
      hard: [
        {
          questions: [
            { 
              text: "حلّل القصيدة التالية تحليلا أدبيا شاملا:", 
              type: "essay", 
              points: 6, 
              answerLines: 10,
              subQuestions: [
                "البنية الإيقاعية",
                "الصور البلاغية",
                "المضمون الفكري"
              ]
            },
          ],
          answers: ["تحليل شامل للقصيدة"],
        },
      ],
    },
    bac: {
      easy: [
        {
          questions: [
            { text: "حدّد المذهب الأدبي للنص: (نص رومنسي أو كلاسيكي أو واقعي)", type: "text", points: 2, answerLines: 2 },
          ],
          answers: ["تحديد المذهب مع التعليل"],
        },
      ],
      medium: [
        {
          questions: [
            { 
              text: "قارن بين الشعر القديم والشعر الحديث من حيث:", 
              type: "essay", 
              points: 5, 
              answerLines: 10,
              subQuestions: [
                "البناء الفني",
                "المضامين",
                "اللغة والأسلوب"
              ]
            },
          ],
          answers: ["مقارنة شاملة مع أمثلة"],
        },
      ],
      hard: [
        {
          questions: [
            { 
              text: "إنشاء أدبي: ناقش قول الشاعر 'وما نيل المطالب بالتمنّي ولكن تؤخذ الدنيا غلابا'", 
              type: "essay", 
              points: 10, 
              answerLines: 20
            },
          ],
          answers: ["إنشاء أدبي متكامل: مقدمة، عرض، خاتمة"],
        },
      ],
    },
  },
};

// Get cycle from level
const getCycleFromLevel = (level: string): "primary" | "secondary" | "bac" => {
  if (level.includes("primaire") || level.includes("ابتدائي")) return "primary";
  if (level.includes("Baccalauréat") || level.includes("البكالوريا") || level.includes("bac")) return "bac";
  return "secondary";
};

// Generate exercises from Tunisian resources
export const generateTunisianExercises = (
  subject: string,
  level: string,
  language: "fr" | "ar" | "en",
  exerciseCount: number,
  difficulty: { easy: number; medium: number; hard: number }
): { exercises: ExerciseData[]; sources: SourceReference[] } => {
  const exercises: ExerciseData[] = [];
  const usedSources: SourceReference[] = [];
  
  const easyCount = Math.max(1, Math.round(exerciseCount * (difficulty.easy / 100)));
  const mediumCount = Math.max(1, Math.round(exerciseCount * (difficulty.medium / 100)));
  const hardCount = Math.max(0, exerciseCount - easyCount - mediumCount);

  // Map subject name to key
  const subjectKey = getSubjectKey(subject);
  const cycle = getCycleFromLevel(level);
  
  // Get templates
  const templates = EXERCISE_TEMPLATES[subjectKey]?.[cycle] || EXERCISE_TEMPLATES.math.secondary;
  
  // Get sources for this subject
  const subjectConfig = TUNISIAN_CURRICULUM[subjectKey];
  if (subjectConfig) {
    usedSources.push(...subjectConfig.sources);
  }
  
  // Add general Tunisian resources
  usedSources.push(...TUNISIAN_RESOURCES[cycle]);

  // Generate easy exercises
  for (let i = 0; i < easyCount && exercises.length < exerciseCount; i++) {
    const template = templates.easy?.[i % (templates.easy?.length || 1)];
    if (template) {
      exercises.push(createExerciseFromNewTemplate(template, exercises.length, "easy", language, usedSources[0]));
    }
  }
  
  // Generate medium exercises
  for (let i = 0; i < mediumCount && exercises.length < exerciseCount; i++) {
    const template = templates.medium?.[i % (templates.medium?.length || 1)];
    if (template) {
      exercises.push(createExerciseFromNewTemplate(template, exercises.length, "medium", language, usedSources[1] || usedSources[0]));
    }
  }
  
  // Generate hard exercises
  for (let i = 0; i < hardCount && exercises.length < exerciseCount; i++) {
    const template = templates.hard?.[i % (templates.hard?.length || 1)];
    if (template) {
      exercises.push(createExerciseFromNewTemplate(template, exercises.length, "hard", language, usedSources[2] || usedSources[0]));
    }
  }

  return { exercises, sources: usedSources };
};

const getSubjectKey = (subject: string): string => {
  const mapping: Record<string, string> = {
    "Mathématiques": "math",
    "الرياضيات": "math",
    "Mathematics": "math",
    "Français": "french",
    "الفرنسية": "french",
    "French": "french",
    "Arabe": "arabic",
    "العربية": "arabic",
    "Arabic": "arabic",
    "Physique": "physics",
    "الفيزياء": "physics",
    "Physics": "physics",
    "Sciences": "svt",
    "علوم الحياة والأرض": "svt",
    "SVT": "svt",
    "Anglais": "english",
    "الإنجليزية": "english",
    "English": "english",
    "Histoire": "history",
    "التاريخ": "history",
    "History": "history",
    "Islamique": "islamic",
    "التربية الإسلامية": "islamic",
  };
  
  return mapping[subject] || "math";
};

const createExerciseFromNewTemplate = (
  template: { questions: QuestionData[]; answers: string[] },
  index: number,
  difficulty: "easy" | "medium" | "hard",
  language: string,
  source?: SourceReference
): ExerciseData => {
  const points = difficulty === "easy" ? 4 : difficulty === "medium" ? 6 : 10;
  const totalPoints = template.questions.reduce((sum, q) => sum + (q.points || 1), 0);
  
  const instructions = language === "ar" 
    ? getArabicInstructions(difficulty)
    : language === "fr"
      ? getFrenchInstructions(difficulty)
      : getEnglishInstructions(difficulty);
  
  return {
    title: language === "ar" 
      ? `التمرين ${index + 1}` 
      : language === "fr" 
        ? `Exercice ${index + 1}` 
        : `Exercise ${index + 1}`,
    points: totalPoints || points,
    difficulty,
    questions: template.questions,
    answers: template.answers,
    source,
    instructions,
  };
};

const getFrenchInstructions = (difficulty: string): string => {
  const instructions: Record<string, string> = {
    easy: "Répondez aux questions suivantes. Justifiez vos réponses.",
    medium: "Résolvez les problèmes suivants en montrant toutes les étapes de votre raisonnement.",
    hard: "Analysez et résolvez les exercices suivants. Une démonstration rigoureuse est attendue.",
  };
  return instructions[difficulty] || instructions.medium;
};

const getArabicInstructions = (difficulty: string): string => {
  const instructions: Record<string, string> = {
    easy: "أجب عن الأسئلة التالية. علّل إجابتك.",
    medium: "حلّ المسائل التالية مع إظهار جميع مراحل الحلّ.",
    hard: "حلّل وأجب عن التمارين التالية. يُطلب برهان دقيق.",
  };
  return instructions[difficulty] || instructions.medium;
};

const getEnglishInstructions = (difficulty: string): string => {
  const instructions: Record<string, string> = {
    easy: "Answer the following questions. Justify your answers.",
    medium: "Solve the following problems, showing all steps of your reasoning.",
    hard: "Analyze and solve the following exercises. A rigorous demonstration is expected.",
  };
  return instructions[difficulty] || instructions.medium;
};
