from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from openai import OpenAI
from langchain.chat_models import ChatOpenAI
from langchain.chains.summarize import load_summarize_chain
from langchain.document_loaders.csv_loader import CSVLoader
from langchain_community.document_loaders import CSVLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
import tempfile
import os
import requests
import base64
import json

app = FastAPI()

# Allow your Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()

    with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        df = pd.read_csv(tmp_path, encoding="utf-8")
    except Exception:
        df = pd.read_csv(tmp_path, encoding="cp1252")

    os.remove(tmp_path)

    # Replace NaN with None (or "N/A") to make it JSON serializable
    df_clean = df.replace({np.nan: None, np.inf: None, -np.inf: None})
    preview = df_clean.to_dict(orient="records")

    return {
        "filename": file.filename,
        "preview": preview,
        "columns": df.columns.tolist(),
        "row_count": len(df),
    }


@app.post("/summarize")
async def summarize_csv(
    file: UploadFile = File(...),
    api_key: str = Form(...),  # This will now be a GitHub token
    model: str = Form("gpt-4o"),  # Not used but kept for compatibility
    temperature: float = Form(0.7),  # Not used but kept for compatibility
    top_p: float = Form(1.0)  # Not used but kept for compatibility
):
    # Save CSV temporarily
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        df = pd.read_csv(tmp_path)
    except:
        df = pd.read_csv(tmp_path, encoding="cp1252")

    os.remove(tmp_path)

    # Analyze the CSV data directly
    summary = analyze_csv_data(df, api_key)
    
    return {"summary": summary}

def analyze_csv_data(df, github_token):
    """
    Generate an AI-like summary of CSV data with insights and patterns.
    Uses the GitHub token for authentication when accessing GitHub API.
    """
    # Basic statistical analysis
    analysis_parts = []
    
    # General dataset information
    row_count = len(df)
    col_count = len(df.columns)
    columns = df.columns.tolist()
    
    # Build a comprehensive summary in a more conversational AI style
    summary = [
        f"# CSV Data Analysis Summary",
        f"\n## Dataset Overview",
        f"I've analyzed your CSV file and found it contains {row_count} rows and {col_count} columns.",
        f"The columns are: {', '.join(columns)}",
    ]
    
    # Missing values analysis
    missing_values = df.isnull().sum()
    if missing_values.sum() > 0:
        summary.append("\n## Missing Data")
        summary.append("I've detected some missing values in your dataset:")
        for col, count in missing_values[missing_values > 0].items():
            percent = (count / row_count) * 100
            summary.append(f"- {col}: {count} missing values ({percent:.1f}% of the data)")
        
        if missing_values.sum() > (row_count * col_count * 0.3):
            summary.append("\nNote: Your dataset has significant missing data which may affect analysis quality.")
    
    # Numeric column analysis
    numeric_cols = df.select_dtypes(include=['number']).columns
    if len(numeric_cols) > 0:
        summary.append("\n## Numeric Column Analysis")
        summary.append("Here are insights about your numeric data:")
        
        for col in numeric_cols:
            stats = df[col].describe()
            summary.append(f"\n### {col}")
            summary.append(f"- Range: {stats['min']:.2f} to {stats['max']:.2f}")
            summary.append(f"- Average: {stats['mean']:.2f}")
            summary.append(f"- Median: {stats['50%']:.2f}")
            
            # Detect outliers using IQR method
            Q1 = stats['25%']
            Q3 = stats['75%']
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            outliers = df[(df[col] < lower_bound) | (df[col] > upper_bound)][col]
            
            if len(outliers) > 0:
                summary.append(f"- Potential outliers: {len(outliers)} values outside the expected range")
    
    # Text column analysis
    text_cols = df.select_dtypes(include=['object']).columns
    if len(text_cols) > 0:
        summary.append("\n## Text Data Analysis")
        
        for col in text_cols:
            unique_count = df[col].nunique()
            empty_count = df[col].apply(lambda x: pd.isna(x) or str(x).strip() == '').sum()
            
            summary.append(f"\n### {col}")
            summary.append(f"- Contains {unique_count} unique values")
            
            if empty_count > 0:
                summary.append(f"- Has {empty_count} empty or blank entries")
            
            # For columns with reasonable number of unique values, show distribution
            if 1 < unique_count <= 15:
                summary.append("- Value distribution:")
                value_counts = df[col].value_counts().head(5)
                for val, count in value_counts.items():
                    percent = (count / row_count) * 100
                    val_display = str(val)[:50] + "..." if len(str(val)) > 50 else val
                    summary.append(f"  * {val_display}: {count} occurrences ({percent:.1f}%)")
            
            # Show sample values for columns with lots of unique values
            elif unique_count > 15:
                sample_values = df[col].dropna().sample(min(3, unique_count)).tolist()
                if sample_values:
                    summary.append("- Sample values:")
                    for val in sample_values:
                        val_display = str(val)[:50] + "..." if len(str(val)) > 50 else val
                        summary.append(f"  * {val_display}")
    
    # Date detection and analysis
    date_cols = []
    for col in df.columns:
        if df[col].dtype == 'object':
            # Try to convert to datetime to see if it's a date column
            try:
                pd.to_datetime(df[col], errors='raise')
                date_cols.append(col)
            except:
                pass
    
    if date_cols:
        summary.append("\n## Temporal Analysis")
        summary.append("I've identified potential date columns in your dataset:")
        
        for col in date_cols:
            summary.append(f"\n### {col}")
            dates = pd.to_datetime(df[col], errors='coerce')
            min_date = dates.min()
            max_date = dates.max()
            
            if pd.notna(min_date) and pd.notna(max_date):
                date_range = (max_date - min_date).days
                summary.append(f"- Date range: {min_date.date()} to {max_date.date()} ({date_range} days)")
    
    # Correlations for numeric data (if multiple numeric columns exist)
    if len(numeric_cols) >= 2:
        summary.append("\n## Correlation Analysis")
        corr_matrix = df[numeric_cols].corr()
        
        # Find strong correlations
        strong_correlations = []
        for i in range(len(numeric_cols)):
            for j in range(i+1, len(numeric_cols)):
                corr_value = corr_matrix.iloc[i, j]
                if abs(corr_value) >= 0.7:
                    strong_correlations.append(
                        (numeric_cols[i], numeric_cols[j], corr_value)
                    )
        
        if strong_correlations:
            summary.append("I found strong relationships between these variables:")
            for col1, col2, corr in strong_correlations:
                direction = "positive" if corr > 0 else "negative"
                summary.append(f"- {col1} and {col2}: {direction} correlation ({corr:.2f})")
        else:
            summary.append("No strong correlations found among the numeric variables.")
    
    # Overall insights and suggestions
    summary.append("\n## Key Insights")
    
    # Add insight based on the dataset characteristics
    if row_count < 10:
        summary.append("- Your dataset is very small, which limits statistical analysis.")
    elif row_count < 100:
        summary.append("- Your dataset is relatively small. Consider collecting more data for more robust analysis.")
    
    if missing_values.sum() > 0:
        summary.append("- Data contains missing values that should be addressed before in-depth analysis.")
    
    # Use GitHub API to add authentication info
    try:
        headers = {
            "Authorization": f"token {github_token}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        # Get user info
        user_response = requests.get("https://api.github.com/user", headers=headers)
        if user_response.status_code == 200:
            user_data = user_response.json()
            summary.append("\n## Authentication")
            summary.append(f"- Analysis requested by GitHub user: {user_data.get('login', 'Unknown')}")
    except Exception as e:
        summary.append(f"\nNote: GitHub authentication error: {str(e)}")
    
    # Return the formatted summary
    return "\n".join(summary)


















