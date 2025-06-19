# 🧠 CSV Summarizing Agent

A powerful web application that allows users to upload a CSV file, analyze the dataset, and generate AI-powered summaries using OpenAI's GPT models. Built using **FastAPI** for the backend and **Next.js** for the frontend.

---

## 🚀 Features

- 📁 Upload and preview CSV files
- 📊 Perform in-depth data analysis (numeric, text, date columns)
- 🧠 Generate conversational AI summaries using OpenAI models
- 🔐 Supports OpenAI API key input
- 🌐 CORS-enabled backend for easy frontend integration
- 🎨 Responsive and user-friendly UI

---

## 🧩 Tech Stack

| Layer    | Tech                      |
|----------|---------------------------|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Backend  | FastAPI, Pandas, LangChain, OpenAI |
| Others   | Axios, Lucide Icons, ShadCN UI |

---

## 🔧 Backend Setup (FastAPI)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/csv-summarizing-agent.git
cd csv-summarizing-agent/backend
````

### 2. Install Dependencies

Create a virtual environment and install required packages:

```bash
pip install -r requirements.txt
```

> Make sure your `requirements.txt` includes:
>
> ```
> fastapi
> uvicorn
> pandas
> numpy
> openai
> langchain
> langchain-community
> ```

### 3. Run the FastAPI Server

```bash
uvicorn main:app --reload --port 8000
```

Backend will be available at `http://localhost:8000`

---

## 🌐 Frontend Setup (Next.js)

### 1. Navigate to Frontend Folder

```bash
cd ../frontend
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

> Make sure your `package.json` includes:
>
> * `axios`
> * `lucide-react`
> * `shadcn/ui`
> * `tailwindcss`

### 3. Run the Next.js Dev Server

```bash
npm run dev
```

App will be available at `http://localhost:3000`

---

## 💡 How It Works

1. User uploads a `.csv` file via the UI.
2. File is sent to the FastAPI backend at `/upload`:

   * Preview data is returned (filename, rows, columns).
3. Then sent to `/summarize` endpoint:

   * Performs statistical, text, and date analysis.
   * Generates summary using OpenAI's GPT models.
4. Summary and preview table are displayed to the user.

---

## 🛠 Configuration Notes

* 🔑 **OpenAI API Key** is required and must start with `sk-`.
* 📄 Supports `.csv` files up to reasonable size (\~5MB recommended).
* ⚠️ API key is stored only in browser memory – never sent elsewhere.

---

## 📸 Preview

![screenshot](https://user-images.githubusercontent.com/your-github-id/csv-summarizer-ui.png)

---

## 🧪 Example CSV Columns Handled

* **Numerical**: Stats, outlier detection, correlations
* **Text**: Unique values, empty checks, sample distribution
* **Dates**: Date range extraction
* **Missing Data**: Detected and reported

---

## 🧑‍💻 Author

Made with ❤️ by [Nagendran Shetty](https://github.com/Scorpian1910)
