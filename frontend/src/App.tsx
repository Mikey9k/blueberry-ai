import './App.css';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';

import preview from './assets/preview.png';
import Loader from './components/Loader';

function App() {
  const [form, setForm] = useState({
    prompt: '',
    photo: '',
    braid: '',
    iceberg: '',
    insight: '',
    hunt: '',
    tetris: '',
    fish: '',
    door: '',
    newton: '',
  });

  const [generatingImg, setGeneratingImg] = useState(false);
  const [generatingTheme, setGeneratingTheme] = useState(false);
  const [loading, setLoading] = useState(false);
  const [themes, setThemes] = useState({
    theme1: '',
    theme2: '',
    theme3: '',
  });

  const [selectedTheme, setSelectedTheme] = useState(''); 

  useEffect(() => {
    if (selectedTheme) {
      generateImage();
    }
  }, [selectedTheme]);


  const handleSubmit = () => {
    console.log('Submit');
  }

  const handleButtonClick = (theme: string) => {
    console.log('Button clicked with theme:', theme);
    setSelectedTheme(theme);
    // generateImage();
    // Add more actions here
    
    // You can add more actions as needed
  };

  const generateImage = async () => {
    console.log("Generating Image");
    if (form.prompt) {
      try {
        setGeneratingImg(true);
        const response = await fetch('http://localhost:3333/api/v1/dalle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: form.prompt, theme: selectedTheme }),
        });
        const data = await response.json();
        setForm({ 
          ...form, photo: `data:image/jpeg;base64,${data.photo}`, braid: `data:image/jpeg;base64,${data.braid}`, iceberg: `data:image/jpeg;base64,${data.iceberg}`, insight: `data:image/jpeg;base64,${data.insight}`, hunt: `data:image/jpeg;base64,${data.hunt}`,
          tetris: `data:image/jpeg;base64,${data.tetris}`, fish: `data:image/jpeg;base64,${data.fish}`, door: `data:image/jpeg;base64,${data.door}`, newton: `data:image/jpeg;base64,${data.newton}`
        });  
      } catch (error) {
        console.error(error);
      } finally {
        setGeneratingImg(false);
      }
    }
  }

  const generateTheme = async () => {
    console.log("Generating Image");
    if (form.prompt) {
      try {
        setGeneratingTheme(true);
        const response = await fetch('http://localhost:3333/api/v1/dalle/theme', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: form.prompt }),
        });
        const data = await response.json();
        setThemes({
          theme1: data.theme1,
          theme2: data.theme2,
          theme3: data.theme3,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setGeneratingTheme(false);
      }
    }
  }

  return (
    <div>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">Generate Beautiful Visuals From Text</h1>
        <form className="w-full max-w-md bg-white p-8 rounded-lg shadow-md" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter text here"
            className="w-full p-4 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, prompt: e.target.value })}
          />
          <button
            type="button"
            className="w-full bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition duration-300"
            onClick={generateTheme}
          >
            {generatingTheme ? 'Generating...' : 'Generate'}
          </button>

          <p className="text-gray-700 mt-6 text-center">Pick which perspective fits the best.</p>

        </form>


        <div className="flex flex-col items-center space-y-4 mt-6">
          <button
            className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition duration-300"
            onClick={() => handleButtonClick(themes.theme1 || 'Button 1')}
          >
            {themes.theme1 || 'Button 1'}
          </button>
          <button
            className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition duration-300"
            onClick={() => handleButtonClick(themes.theme2 || 'Button 2')}
          >
            {themes.theme2 || 'Button 2'}
          </button>
          <button
            className="bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 transition duration-300"
            onClick={() => handleButtonClick(themes.theme3 || 'Button 3')}
          >
            {themes.theme3 || 'Button 3'}
          </button>
        </div>


        <div className="relative bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-128 p-3 h-128 justify-center items-center mt-4">
          {form.photo ? (
            <img
              src={form.photo}
              alt={form.prompt}
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={preview}
              alt="preview"
              className="w-full h-full object-contain opacity-40"
            />
          )}
          {/* {form.braid ? (
            <img
              src={form.braid}
              alt={form.prompt}
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={preview}
              alt="preview"
              className="w-full h-full object-contain opacity-40"
            />
          )}
          {form.iceberg ? (
            <img
              src={form.iceberg}
              alt={form.prompt}
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={preview}
              alt="preview"
              className="w-full h-full object-contain opacity-40"
            />
          )}
          {form.insight ? (
            <img
              src={form.insight}
              alt={form.prompt}
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={preview}
              alt="preview"
              className="w-full h-full object-contain opacity-40"
            />
          )}
          {generatingImg && (
            <div className="absolute inset-0 z-0 flex justify-center items-center bg-[rgba(0,0,0,0.5)] rounded-lg">
              <Loader />
            </div>
          )}
          {form.hunt ? (
            <img
              src={form.hunt}
              alt={form.prompt}
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={preview}
              alt="preview"
              className="w-full h-full object-contain opacity-40"
            />
          )}
          {form.tetris ? (
            <img
              src={form.tetris}
              alt={form.prompt}
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={preview}
              alt="preview"
              className="w-full h-full object-contain opacity-40"
            />
          )}
          {form.fish ? (
            <img
              src={form.fish}
              alt={form.prompt}
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={preview}
              alt="preview"
              className="w-full h-full object-contain opacity-40"
            />
          )}
          {form.door ? (
            <img
              src={form.door}
              alt={form.prompt}
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={preview}
              alt="preview"
              className="w-full h-full object-contain opacity-40"
            />
          )}
          {form.newton ? (
            <img
              src={form.newton}
              alt={form.prompt}
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={preview}
              alt="preview"
              className="w-full h-full object-contain opacity-40"
            />
          )} */}



          
          {generatingImg && (
            <div className="absolute inset-0 z-0 flex justify-center items-center bg-[rgba(0,0,0,0.5)] rounded-lg">
              <Loader />
            </div>
          )}
        </div>

{/* 
        <div className="mt-5 flex gap-5">
          <button
            type="button"
            onClick={generateImage}
            className=" text-white bg-green-700 font-medium rounded-md text-sm w-full sm:w-auto px-5 py-2.5 text-center"
          >
            {generatingImg ? 'Generating...' : 'Generate'}
          </button>
        </div> */}

        
      </div>



 
    </div>

    
          

  );
}

export default App;