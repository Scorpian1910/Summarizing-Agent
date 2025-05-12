"use client";

import { useState, useRef, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Brain,
  Upload,
  MessageSquare,
  FileSpreadsheet,
  BarChart3,
  Check,
  Key,
  LucideSquareArrowLeft,
  LucideSquareArrowRight,
} from "lucide-react";
import axios from "axios";

const functionalities = [
  { value: "home", label: "Home" },
  { value: "summarize", label: "Summarize CSV" },
  { value: "analyze", label: "Analyze CSV" },
];

const models = [
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
];

export default function Home() {
  const [selectedFunction, setSelectedFunction] = useState("home");
  const [apiKey, setApiKey] = useState("");
  const [isApiKeyValid, setIsApiKeyValid] = useState(false);
  const [topP, setTopP] = useState([0.7]);
  const [temperature, setTemperature] = useState([0.7]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState("gpt-3.5-turbo");

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [columns, setColumns] = useState<string[] | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedFunction = localStorage.getItem("selectedFunction");
    if (savedFunction) {
      setSelectedFunction(savedFunction);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("selectedFunction", selectedFunction);
  }, [selectedFunction]);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.value;
    setApiKey(key);
    setIsApiKeyValid(key.startsWith("sk-") && key.length > 20);
  };

  const handleFileSelectAndUpload = () => {
    fileInputRef.current?.click();
  };

  

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setSummary(null); // clear old summary
      uploadCSV(selectedFile);
    }
  };

  const uploadCSV = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey); // 👈 add this
    formData.append("model", model);
    formData.append("temperature", temperature[0].toString());
    formData.append("top_p", topP[0].toString()); 
  
    try {
      setLoading(true);
  
      const res = await axios.post("http://localhost:8000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      const { preview, columns, filename, row_count } = res.data;
      setPreview(preview);
      setColumns(columns);
      setFilename(filename);
      setRowCount(row_count);
  
      const summaryResponse = await axios.post("http://localhost:8000/summarize", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      setSummary(summaryResponse.data.summary);
    } catch (err) {
      console.error("Upload or summarization failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <button
        className={`fixed top-4 z-50 p-2 bg-card rounded-lg shadow-md transition-all duration-300 ${isSidebarOpen ? "left-80" : "left-4"
          }`}
        onClick={() => setIsSidebarOpen((prev) => !prev)}
      >
        {isSidebarOpen ? <LucideSquareArrowLeft size={20} /> : <LucideSquareArrowRight size={20} />}
      </button>

      <div
        className={`absolute top-0 left-0 h-full bg-card border-r border-border transition-transform duration-300 z-40 ${isSidebarOpen ? "translate-x-0 w-80" : "-translate-x-full w-80"
          } p-6 flex flex-col gap-6`}
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Key className="w-5 h-5" />
            Enter OpenAI API key 👇
          </h2>
          <Input
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={handleApiKeyChange}
            className="bg-background"
          />
          {isApiKeyValid && (
            <div className="flex items-center gap-2 text-green-500">
              <Check className="w-4 h-4" />
              <span className="text-sm">API key loaded</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Model Selection</h2>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger>
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Parameters</h2>
            <div className="space-y-2">
              <label className="text-sm">Top P: {topP}</label>
              <Slider value={topP} onValueChange={setTopP} max={1} step={0.1} />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Temperature: {temperature}</label>
              <Slider value={temperature} onValueChange={setTemperature} max={1} step={0.1} />
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          className="mt-auto"
          onClick={() => {
            setApiKey("");
            setIsApiKeyValid(false);
            setTopP([0.7]);
            setTemperature([0.7]);
          }}
        >
          Default Setting
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
              <Brain className="w-10 h-10" />
              Summarizing Agent
            </h1>
            <p className="text-xl text-muted-foreground">
              Analyzing and Summarizing CSV Files!
            </p>
          </div>

          <Select value={selectedFunction} onValueChange={setSelectedFunction}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a functionality" />
            </SelectTrigger>
            <SelectContent>
              {functionalities.map((func) => (
                <SelectItem key={func.value} value={func.value}>
                  {func.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="mt-8">
            {selectedFunction === "home" ? (
              <Card className="p-6 space-y-4">
                <h2 className="text-2xl font-semibold">Getting Started</h2>
                <ol className="space-y-4">
                  <li className="flex items-center gap-3">
                    <FileSpreadsheet className="w-6 h-6 text-primary" />
                    <span>1. Summarize CSV - Get quick insights about your dataset</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-primary" />
                    <span>2. Analyze CSV - Deep dive into your data patterns</span>
                  </li>
                </ol>
              </Card>
            ) : (
              <Card className="p-6 space-y-6">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <Upload className="w-12 h-12 text-muted-foreground" />
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">Upload your CSV file</h3>
                      <p className="text-muted-foreground">Drag and drop your file here, or click to browse</p>
                      {filename && (
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground">📄 {filename} ({rowCount} rows)</p>
                        </div>
                      )}
                      {/* {preview && columns && (
                        <div className="overflow-auto border rounded-md bg-muted/10 p-4">
                          <table className="min-w-full text-sm text-left">
                            <thead className="bg-muted text-muted-foreground">
                              <tr>
                                {columns.map((col) => (
                                  <th key={col} className="px-4 py-2 border-r last:border-r-0">{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {preview.map((row, idx) => (
                                <tr key={idx}>
                                  {columns.map((col) => (
                                    <td key={col} className="px-4 py-2 border-r last:border-r-0">
                                      {row[col] ?? "—"}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )} */}
                    </div>
                    <Button variant="secondary" onClick={handleFileSelectAndUpload}>
                      Choose File
                    </Button>
                    <input
                      type="file"
                      accept=".csv"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  {loading && <p className="mt-4 text-sm text-muted-foreground">Uploading and summarizing...</p>}
                  {summary && (
                    <div className="mt-6 text-left border-t pt-4">
                      <h4 className="font-semibold text-lg mb-2">Summary:</h4>
                      <p className="text-muted-foreground whitespace-pre-wrap">{summary}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}
            <div className="p-4">
              {preview && columns && (
                <div className="overflow-auto max-h-80 border rounded-md bg-muted/10 p-4">
                  <table className="min-w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground sticky top-0 z-10">
                      <tr>
                        {columns.map((col) => (
                          <th key={col} className="px-4 py-2 border-r last:border-r-0">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {preview.map((row, idx) => (
                        <tr key={idx}>
                          {columns.map((col) => (
                            <td key={col} className="px-4 py-2 border-r last:border-r-0">
                              {row[col] ?? "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
