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

  const [limit, setLimit] = useState(10); // Default limit
  const [offset, setOffset] = useState(0); // Default offset

  //const url = "http://localhost:5000"; //
  const url = "https://super-ai-duck-db-backend.vercel.app/";

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
      alert("File uploaded successfully!"); // Alert added after successful upload
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
    <div className="flex w-full h-full items-center justify-center flex-col py-10 px-10 gap-4">
      <div className="flex flex-col gap-3 mt-9 justify-center items-center">
        <h2 className="text-3xl font-bold">DuckDB Query Interface</h2>
      </div>

      <div className="flex w-[70vw] items-center">
        <label className="inline-flex items-center cursor-pointer">
        </label>
      </div>

      <div className="rounded-xl w-[70vw] h-[50vh] flex p-5 shadow-lg shadow-slate-300 gap-2 flex-col mb-5">
        <h2 className="text-gray-500">Please enter your query below: </h2>
        <div className="flex flex-row gap-2 mt-2 flex-wrap">
          <button className='flex items-center justify-center shadow-sm rounded-lg py-1 px-4 gap-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-300 ease-in-out transform hover:scale-105'
            onClick={() => customPrompt("Find the top 10 customers with the most orders")}>
            <FaChartLine size={18} />
            <span>
              Find the top 10 customers with the most orders
            </span>
          </button>
          <button className='flex items-center justify-center shadow-sm rounded-lg py-1 px-4 gap-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-300 ease-in-out transform hover:scale-105'
            onClick={() => customPrompt("Identify customers with total spending above $5000")}>
            <FaMoneyBillWave size={18} />
            <span>
              Identify customers with total spending above $5000
            </span>
          </button>

          <button className='flex items-center justify-center shadow-sm rounded-lg py-1 px-4 gap-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-300 ease-in-out transform hover:scale-105'
            onClick={() => customPrompt("Show a list of all orders made in the last 30 days")}>
            <FaRegCalendarAlt size={18} />
            <span>
              Show a list of all orders made in the last 30 days
            </span>
          </button>
          <button className='flex items-center justify-center shadow-sm rounded-lg py-1 px-4 gap-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-300 ease-in-out transform hover:scale-105'
            onClick={() => customPrompt("Calculate the average spending per order by region")}>
            <FaUsers size={18} />
            <span>
              Calculate the average spending per order by region
            </span>
          </button>

        </div>
        <div className="flex flex-col h-full shadow-sm rounded-xl p-3 border-[1px] border-gray-300 mt-3">
          <textarea
            className="flex-1 placeholder-gray-500 focus:outline-none focus:ring-0 border-none bg-transparent"
            placeholder='Enter your query here...'
            onChange={(e) => setPrompt(e.target.value)}
            value={prompt}
          />
          <div className='flex flex-row'>
            <label className="flex items-center mx-2 cursor-pointer">
              <FaPaperclip size={18} />
              <input
                type="file"
                className="hidden"
                onChange={(e) => uploadFile(e.target.files[0])}
                accept=".csv,.txt"
              />
            </label>
            {csvFile && <span className="ml-2 text-gray-700">{csvFile.split('/').pop()}</span>}
            <button className={`bg-blue-500 py-1 px-2 rounded-lg mx-2 ml-auto ${isLoading ? "bg-slate-400 cursor-not-allowed" : ""}`} onClick={generateSQL}><FaArrowRight size={18} className='text-white' /></button>
          </div>
        </div>
      </div>

      {display && (
        <div className="rounded-xl w-[70vw] h-auto flex shadow-lg shadow-slate-300 flex-col mb-5">
          {isLoading ? <Skeleton /> :
            <>
              <div className="flex w-full items-center justify-between border-b p-5">
                <div className="font-bold">Query Results</div>
                <button className="border border-gray-300 rounded-md flex gap-2 py-1 px-2 text-sm hover:bg-gray-100 active:scale-95" onClick={handleDownload}>
                  <FaDownload size={18} />
                  <span>Download CSV</span>
                </button>
              </div>
              <div className="overflow-auto h-[56vh] px-3">
                <table className="table-auto w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border-b px-4 py-3 text-left text-sm text-gray-400">INDEX</th>
                      {csvData && csvData.length > 0 && csvData[0].map((header, index) => (
                        <th
                          key={index}
                          className="border-b px-4 py-3 text-left text-sm text-gray-400"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData && csvData.slice(1, -1).map((row, rowIndex) => (
                      <tr key={rowIndex} className={`text-gray-400`}>
                        <td className=" px-4 py-2 text-sm text-gray-700">{rowIndex + 1}</td>
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className=" px-4 py-2 text-sm text-gray-700"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between px-5 py-2">
                <button onClick={() => handlePaginationChange('prev')} disabled={offset === 0} className="py-1 px-2 bg-gray-300 rounded">
                  Previous
                </button>
                <button onClick={() => handlePaginationChange('next')} className="py-1 px-2 bg-gray-300 rounded">
                  Next
                </button>
              </div>
            </>
          }
        </div>
      )}
    </div>
  );
}

export default App;
