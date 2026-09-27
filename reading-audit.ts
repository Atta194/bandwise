import { READING_MOCKS } from "./app/src/content/reading/index";

const rows = READING_MOCKS.map((mock: any) => {
  const passages = mock.passages ?? [];
  const questions = mock.questions ?? [];
  const words = passages.map((p: any) => p.wordCount);
  const key = questions[0] && "part" in questions[0] ? "part" : "passage";
  const byPart = [1, 2, 3].map(
    (n) => questions.filter((q: any) => (q[key] ?? q.part ?? q.passage) === n).length,
  );
  return {
    id: mock.id,
    title: mock.title,
    passages: passages.length,
    words,
    total: words.reduce((t: number, w: number) => t + w, 0),
    questions: questions.length,
    split: byPart.join("/"),
    minutes: mock.minutes ?? null,
  };
});

console.log(JSON.stringify(rows, null, 1));
const totals = rows.map((r: any) => r.total);
console.log(`papers: ${rows.length}`);
console.log(`words per paper: min ${Math.min(...totals)} max ${Math.max(...totals)}`);
console.log(`every paper 3 passages: ${rows.every((r: any) => r.passages === 3)}`);
console.log(`every paper 40 questions: ${rows.every((r: any) => r.questions === 40)}`);
console.log(`every paper split 13/13/14: ${rows.every((r: any) => r.split === "13/13/14")} -> ${rows.map((r: any) => r.split).join(" ")}`);
console.log(`papers inside the official 2150-2750 range: ${rows.filter((r: any) => r.total >= 2150 && r.total <= 2750).length}/${rows.length}`);
