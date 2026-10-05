import styles from './AskList.module.css';

export function AskList({ questions, title }: { questions: string[]; title: string }) {
  if (questions.length === 0) return null;
  return (
    <section className={styles.wrap} aria-labelledby="ask-heading">
      <h2 id="ask-heading" className={styles.heading}>
        {title}
      </h2>
      <ol className={styles.list}>
        {questions.map((q, i) => (
          <li key={i}>{q}</li>
        ))}
      </ol>
    </section>
  );
}
