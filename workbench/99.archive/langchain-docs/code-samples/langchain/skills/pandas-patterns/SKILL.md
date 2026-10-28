<!-- source: langchain-ai/docs  src/code-samples/langchain/skills/pandas-patterns/SKILL.md -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

---
name: pandas-patterns
description: Common pandas and matplotlib patterns for data analysis and visualization
---

## Data loading
Use `pd.read_csv()` for CSV files. Always check `df.info()` and `df.describe()` first.

## Visualization
Use `matplotlib` for bar charts, `seaborn` for statistical plots.
Save figures with `plt.savefig("output.png", dpi=150, bbox_inches="tight")`.

## Reporting
Write a markdown summary to `report.md` alongside any generated charts.
