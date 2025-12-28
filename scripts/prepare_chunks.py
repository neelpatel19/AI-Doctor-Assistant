import pandas as pd

df = pd.read_csv("Data/dataset.csv")

disease_col = "diseases"

symptom_cols = [c for c in df.columns if c != disease_col]

# Build text chunks
chunks = []
for _, row in df.iterrows():
    disease = row[disease_col]
    symptoms = [symptom for symptom in symptom_cols if row[symptom] == 1]
    text = f"{disease} is associated with symptoms such as {', '.join(symptoms)}."
    chunks.append(text)

chunk_df = pd.DataFrame({"chunk": chunks})

# Save to new file
chunk_df.to_csv("Data/chunks.csv", index=False)
print(f"✅ Created {len(chunk_df)} chunks and saved to Data/chunks.csv")
