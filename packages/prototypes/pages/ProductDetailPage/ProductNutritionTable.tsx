import styles from "./ProductDetailPage.module.css";
import type { ProductDetailNutrition } from "./ProductDetailPage.types";

export function ProductNutritionTable({ nutrition }: { nutrition: ProductDetailNutrition }) {
  return (
    <div className={styles.nutritionLabel}>
      <table className={styles.nutritionTable} aria-label={nutrition.title}>
        <caption>
          <h3 className={styles.nutritionTitle}>{nutrition.title}</h3>
          <div className={styles.nutritionServing}>
            <p>{nutrition.servingsPerContainer}</p>
            <p className={styles.nutritionServingSize}>
              <span>{nutrition.servingSizeLabel}</span>
              <span>{nutrition.servingSize}</span>
            </p>
          </div>
          <div className={styles.nutritionCalories}>
            <p>{nutrition.amountPerServingLabel}</p>
            <p><span>{nutrition.calories.label}</span><span>{nutrition.calories.value}</span></p>
          </div>
        </caption>
        <thead>
          <tr><td aria-hidden="true" /><th scope="col">{nutrition.dailyValueLabel}</th></tr>
        </thead>
        <tbody>
          {nutrition.rows.map((row) => (
            <tr key={row.label} className={[row.indented && styles.nutritionIndented, row.groupStart && styles.nutritionGroupStart].filter(Boolean).join(" ")}>
              <th scope="row">{row.label} <span className={styles.nutritionAmount}>{row.amount ?? "—"}</span></th>
              <td>{row.dailyValue ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.nutritionFootnote}>{nutrition.dailyValueNote}</p>
    </div>
  );
}
