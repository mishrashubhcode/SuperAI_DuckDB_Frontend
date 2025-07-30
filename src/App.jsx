import React, { useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { FaChartLine, FaRegCalendarAlt, FaUsers, FaMoneyBillWave, FaPaperclip, FaArrowRight, FaDownload } from 'react-icons/fa';
import Skeleton from './components/Skeleton';

const App = () => {
  const [prompt, setPrompt] = useState("");
  const [csvData, setCsvData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [display, setDisplay] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);  // Upload status state

  const [limit, setLimit] = useState(10); // Default limit
  const [offset, setOffset] = useState(0); // Default offset

  //const url = "http://localhost:5000"; //
  const url = "https://super-ai-duck-db-backend.vercel.app/"; // Uncomment for production

  const [badgeCount, setBadgeCount] = useState(0);

  const handleSelection = (data) => {
    setBadgeCount(1);
    setCsvFile(data);
  };

  const customPrompt = (data) => {
    setPrompt(data);
  };

  const uploadFile = async (file) => {
    if (!file) {
      throw new Error('No file provided to upload.');
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${url}/upload_file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log(res.data);
      setCsvFile(res.data.filePath);
      alert("File uploaded successfully!");
      return res.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      if (error.res) {
        throw new Error(error.res.data.error || 'File upload failed.');
      } else {
        throw new Error('An unexpected error occurred while uploading the file.');
      }
    }
  };

  const generateSQL = async () => {
    try {
      if (!prompt) {
        alert("Please enter a prompt");
        return;
      }

      if (!csvFile) {
        alert("Please upload a file");
        return;
      }

      console.log(prompt, csvFile);

      setIsLoading(true);
      setDisplay(true);
      const res = await axios.post(`${url}/generate_sql`, {
        text: prompt,
        filePath: csvFile,
        limit: limit, // Adding limit
        offset: offset, // Adding offset
      }, { responseType: 'blob' });

      if (res.status >= 500) {
        alert("Internal Server Error or prompt entered is not relevant to the file.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const csvText = reader.result;

        Papa.parse(csvText, {
          complete: (results) => {
            setCsvData(results.data);
            setIsLoading(false);
          },
        });
      };
      reader.readAsText(res.data);
    } catch (error) {
      console.error('Error fetching CSV:', error);
      setIsLoading(false);
      setDisplay(false);
    }
  };

  const handleDownload = () => {
    if (!csvData || csvData.length === 0) {
      alert("No data available to download");
      return;
    }

    try {
      const csvString = Papa.unparse(csvData);
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = 'data.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating the download:", error);
    }
  };

  const handlePaginationChange = (direction) => {
    if (direction === 'next') {
      setOffset(offset + limit);
    } else if (direction === 'prev' && offset > 0) {
      setOffset(offset - limit);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black text-white flex flex-col items-center px-6 py-12">
      <header className="mb-10 text-center max-w-3xl">
        <h1 className="text-4xl font-extrabold tracking-wide mb-3 drop-shadow-lg">
          AI-Powered DuckDB Query Interface
        </h1>
        <p className="text-indigo-300 text-lg max-w-xl mx-auto">
          Upload your CSV data and generate SQL queries effortlessly using cutting-edge AI.
        </p>
      </header>

      <main className="bg-gradient-to-tr from-purple-800 via-indigo-800 to-indigo-900 rounded-3xl shadow-2xl p-8 w-full max-w-[900px] flex flex-col gap-8">

        {/* Query Preset Buttons */}
        <section className="flex flex-wrap gap-4 justify-center">
          {[
            { icon: <FaChartLine size={20} />, label: "Top 10 customers by orders", prompt: "Find the top 10 customers with the most orders" },
            { icon: <FaMoneyBillWave size={20} />, label: "Customers spending above $5,000", prompt: "Identify customers with total spending above $5000" },
            { icon: <FaRegCalendarAlt size={20} />, label: "Orders in last 30 days", prompt: "List all orders where Order Date is greater than year 2024" },
            { icon: <FaUsers size={20} />, label: "Avg spending per order by region", prompt: "Calculate the average spending per order by region" }
          ].map(({ icon, label, prompt }, i) => (
            <button
              key={i}
              onClick={() => customPrompt(prompt)}
              className="flex items-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {icon}
              <span className="font-semibold text-white whitespace-nowrap">{label}</span>
            </button>
          ))}
        </section>

        {/* Query Input Area */}
        <section className="flex flex-col gap-4">
          <textarea
            placeholder="Enter your query here..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            className="w-full p-4 text-lg rounded-xl bg-indigo-900 border border-indigo-700 placeholder-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-600 resize-none shadow-lg text-white"
          />

          <div className="flex items-center gap-4">
            <label className="flex items-center mx-2">
              <FaPaperclip size={18} className="cursor-pointer" />
              <input
                type="file"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setIsUploading(true);
                    try {
                      await uploadFile(file);
                    } catch (error) {
                      alert(error.message);
                    } finally {
                      setIsUploading(false);
                    }
                  }
                }}
                accept=".csv,.txt"
                disabled={isUploading}
              />
            </label>


            {/* Upload status */}
            {isUploading && (
              <span className="text-indigo-300 animate-pulse select-none">Uploading file, please wait...</span>
            )}
            {csvFile && !isUploading && (
              <span className="text-green-400 select-none truncate max-w-xs">
                ✓ Uploaded: {csvFile.split('/').pop()}
              </span>
            )}

            <button
              onClick={generateSQL}
              disabled={isLoading || isUploading}
              className={`ml-auto bg-indigo-500 text-white rounded-lg p-3 shadow-lg transition transform hover:scale-110 active:scale-95 disabled:bg-indigo-800 disabled:cursor-not-allowed`}
              aria-label="Generate SQL"
            >
              <FaArrowRight size={20} />
            </button>
          </div>
        </section>

        {/* Query Results */}
        {display && (
          <section className="bg-indigo-900 rounded-2xl p-6 shadow-xl">
            {isLoading ? (
              <Skeleton />
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-indigo-50">Query Results ({csvData.length - 1} rows)</h2>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 rounded-lg px-4 py-2 bg-indigo-700 hover:bg-indigo-600 transition"
                  >
                    <FaDownload />
                    <span>Download CSV</span>
                  </button>
                </div>

                <div className="overflow-auto max-h-[55vh] border border-indigo-700 rounded-lg">
                  <table className="min-w-full border-collapse text-indigo-100">
                    <thead className="bg-indigo-800 sticky top-0">
                      <tr>
                        <th className="text-left py-3 px-4 border-b border-indigo-700 font-semibold">#</th>
                        {csvData.length > 0 && csvData[0].map((header, idx) => (
                          <th key={idx} className="text-left py-3 px-4 border-b border-indigo-700 font-semibold whitespace-nowrap">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {csvData.length > 1 ? csvData.slice(1).map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className={`hover:bg-indigo-700 ${rowIndex % 2 === 0 ? "bg-indigo-900" : "bg-indigo-800"}`}
                        >
                          <td className="py-2 px-4 border-b border-indigo-700">{rowIndex + 1}</td>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="py-2 px-4 border-b border-indigo-700 truncate max-w-xs whitespace-nowrap" title={cell}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={csvData[0].length + 1} className="text-center py-4 text-indigo-300">No data available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between mt-4">
                  <button
                    onClick={() => handlePaginationChange('prev')}
                    disabled={offset === 0}
                    className={`px-4 py-2 rounded ${offset === 0 ? "bg-indigo-700 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500"}`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePaginationChange('next')}
                    disabled={offset + limit >= csvData.length - 1}
                    className={`px-4 py-2 rounded ${offset + limit >= csvData.length - 1 ? "bg-indigo-700 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500"}`}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </section>
        )}
      </main>

      <footer className="mt-auto pt-16 pb-6 text-indigo-400 text-center select-none">
        Built with 💜 using React, Flask & DuckDB
      </footer>
    </div>
  );
};

export default App;
