import { useState } from "react";
import { Search, Upload, FileText, Cpu, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  id: string;
  content: string;
  similarity: number;
  source: string;
  fileType: string;
  chunk: number;
}

export default function Index() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState(0);
  const [filePreviews, setFilePreviews] = useState<
    { name: string; size: number; type: string; preview?: string }[]
  >([]);
  const [fileText, setFileText] = useState(""); // text extracted from backend
  const [chatHistory, setChatHistory] = useState<
    { question: string; answer: string }[]
  >([]);

  // --- Handle File Upload ---
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setFileText(data.text || "");
      setUploadedFiles(1);

      setFilePreviews([
        {
          name: file.name,
          size: file.size,
          type: file.type || "Unknown",
          preview: data.text?.slice(0, 400) || "",
        },
      ]);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Error uploading file. Check backend logs for details.");
    }
  };

  // --- Handle Search ---
  const handleSearch = async () => {
    if (!query.trim()) {
      alert("Please enter a question.");
      return;
    }

    setIsSearching(true);

    const formData = new FormData();
    formData.append("question", query);
    formData.append("context", fileText);

    try {
      const res = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();

      const newResult: SearchResult = {
        id: (results.length + 1).toString(),
        content: data.answer,
        similarity: 1.0,
        source: filePreviews[0]?.name || "Uploaded File",
        fileType: filePreviews[0]?.type || "File",
        chunk: results.length + 1,
      };

      setResults((prev) => [newResult, ...prev]);
      setChatHistory((prev) => [
        { question: query, answer: data.answer },
        ...prev,
      ]);
      setQuery("");
    } catch (error) {
      console.error("Error fetching AI response:", error);
      alert("Error fetching AI response. Check backend logs for details.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-semantic-secondary">
      {/* Header */}
      <header className="border-b border-brand-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-brand-500 rounded-lg">
              <Cpu className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                SemanticSearch
              </h1>
              <p className="text-sm text-gray-600">
                AI-Powered Document Intelligence
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-brand-100 text-brand-700">
            {uploadedFiles} Document{uploadedFiles !== 1 ? "s" : ""} Indexed
          </Badge>
        </div>
      </header>

      {/* Main Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Beyond Keywords.{" "}
              <span className="bg-gradient-to-r from-brand-500 to-semantic-accent bg-clip-text text-transparent">
                Into Meaning.
              </span>
            </h2>
            <p className="text-xl text-gray-600 mb-12">
              Upload your documents and ask questions naturally. Our AI
              understands context — not just words.
            </p>

            {/* Search and Upload UI */}
            <div className="bg-white rounded-2xl shadow-xl border border-brand-200 p-8 mb-12">
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Ask something about your document..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-12 pr-4 py-6 text-lg border-2 border-brand-200 focus:border-brand-500 rounded-xl"
                    disabled={!fileText}
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !query.trim() || !fileText}
                  className="px-8 py-6 text-lg bg-brand-500 hover:bg-brand-600 rounded-xl"
                >
                  {isSearching ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                      <span>Searching...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Zap className="h-5 w-5" />
                      <span>Search</span>
                    </div>
                  )}
                </Button>
              </div>

              {/* File Upload */}
              <div className="flex items-center justify-center">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.csv,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="flex items-center space-x-2 px-6 py-3 bg-brand-50 hover:bg-brand-100 rounded-lg border-2 border-dashed border-brand-300 transition-colors">
                    <Upload className="h-5 w-5 text-brand-600" />
                    <span className="text-brand-700 font-medium">
                      Upload PDF / DOCX / TXT / CSV / JSON
                    </span>
                  </div>
                </label>
              </div>

              {/* File Preview */}
              {filePreviews.length > 0 && (
                <div className="mt-4 max-w-xl mx-auto text-left space-y-3">
                  {filePreviews.map((file, idx) => (
                    <div
                      key={idx}
                      className="border border-brand-200 rounded-lg p-3 bg-brand-50"
                    >
                      <div className="font-semibold text-brand-700">
                        {file.name}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {file.type} · {(file.size / 1024).toFixed(1)} KB
                      </div>
                      <div
                        className="text-gray-700 text-sm whitespace-pre-line overflow-hidden"
                        style={{ maxHeight: 80 }}
                      >
                        {file.preview}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chat History (previous Q&A) */}
            {chatHistory.length > 0 && (
              <div className="space-y-4 text-left">
                <h3 className="text-2xl font-bold text-gray-900">
                  Chat History
                </h3>
                {chatHistory.map((chat, idx) => (
                  <Card key={idx} className="border-brand-200">
                    <CardHeader className="pb-1">
                      <CardTitle className="text-brand-600 text-base">
                        Q: {chat.question}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {chat.answer}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

// To run the app -
// 1. Open terminal
// 2. cd backend
// 3. uvicorn main:app --reload
// 4. open new terminal
// 5. npm run dev
