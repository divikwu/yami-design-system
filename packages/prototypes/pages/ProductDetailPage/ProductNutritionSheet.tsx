"use client";

import { type MouseEvent, useState } from "react";

import type { ProductDetailNutrition, ProductDetailPageProps } from "./ProductDetailPage.types";
import { ProductNutritionTable } from "./ProductNutritionTable";
import { ProductDetailSheet } from "./ProductDetailSheet";
import styles from "./ProductNutritionSheet.module.css";

const arrowDownIcon = new URL("../../../design-system/assets/icons/system/arrow-down.svg", import.meta.url).href;
const aiIcon = new URL("./assets/nutrition-ai.svg", import.meta.url).href;

interface ProductNutritionSheetProps {
  nutrition: ProductDetailNutrition;
  translations: ProductDetailPageProps["nutritionTranslations"];
  locale: "en" | "zh";
  onSourceClick: (event: MouseEvent<HTMLAnchorElement>, sourceHref: string) => void;
  onClose: () => void;
}

export function ProductNutritionSheet({ nutrition, translations, locale, onSourceClick, onClose }: ProductNutritionSheetProps) {
  const [language, setLanguage] = useState(locale);
  const selectedNutrition = translations?.[language] ?? nutrition;
  const zh = locale === "zh";

  return (
    <ProductDetailSheet
      id="nutrition"
      title={nutrition.title}
      closeLabel={zh ? "关闭营养成分表" : "Close nutrition facts"}
      onClose={onClose}
    >
        <div className={styles.notice}>
          <img src={aiIcon} alt="" width={20} height={20} />
          <p>{nutrition.note}</p>
        </div>
        <div className={styles.card}>
          <div className={styles.controls}>
            <a className={styles.source} href={nutrition.sourceHref} target="_blank" rel="noreferrer" onClick={(event) => onSourceClick(event, nutrition.sourceHref)}>
              {zh ? "查看标签原图" : "View original label"}
            </a>
            {translations?.en && translations.zh && (
              <div className={styles.language}>
                <select aria-label={zh ? "营养成分表语言" : "Nutrition facts language"} value={language} onChange={(event) => setLanguage(event.target.value as "en" | "zh")}>
                  <option value="en" lang="en">English</option>
                  <option value="zh" lang="zh">中文</option>
                </select>
                <span className={styles.languageValue} data-slot="nutrition-language-value" aria-hidden="true">
                  <span>{language === "zh" ? "中文" : "English"}</span>
                  <img src={arrowDownIcon} alt="" width={16} height={16} />
                </span>
              </div>
            )}
          </div>
          <div className={styles.table} lang={language}>
            <ProductNutritionTable nutrition={selectedNutrition} />
          </div>
        </div>
    </ProductDetailSheet>
  );
}
