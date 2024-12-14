import './App.css';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import React, { useEffect, useState } from 'react';

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
// import { useNavigate } from 'react-router-dom';

import preview from './assets/preview.png';
import Loader from './components/Loader';
import { text } from 'stream/consumers';

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
    textBridge: '',
    textBraid: '',
    textFish: '',
    textNewton: '',
    modelBridge: '',
    modelBraid: '',
    modelFish: '',
    modelNewton: '',
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
  const [selectedImage, setSelectedImage] = useState('photo');

  const [color, setColor] = useState('');
  const [formality, setFormality] = useState('');
  const [style, setStyle] = useState('');


  useEffect(() => {
    if (selectedTheme) {
      generateImage();
    }
  }, [selectedTheme]);


  const [selectedRating, setSelectedRating] = useState(0);
  const [textRating, setTextRating] = useState(0);
  const [submittedRating, setSubmittedRating] = useState(0);
  const [submittedTextRating, setSubmittedTextRating] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [feedbackText, setFeedbackText] = useState('');

  const handleStarClick = (rating: number) => {
    setSelectedRating(rating);
  };

  const handleTextStarClick = (rating: number) => {
    setTextRating(rating);
  };


  const handleSubmit = async () => {
    if (selectedRating > 0) {
      setSubmittedRating(selectedRating);
      setSubmittedTextRating(textRating);
      setIsSubmitted(true);
    } else {
      alert('Please select a rating before submitting.');
    }

    let text = '';
    let model = '';

    if (selectedImage === 'photo') {
      text = form.textBridge;
      model = form.modelBridge;
    } else if (selectedImage === 'braid') {
      text = form.textBraid;
      model = form.modelBraid;
    } else if (selectedImage === 'fish') {
      text = form.textFish;
      model = form.modelFish;
    } else if (selectedImage === 'newton') {
      text = form.textNewton;
      model = form.modelNewton;
    }


    console.log(text, selectedImage);

    const feedbackData = {
      quote: form.prompt,
      theme: selectedTheme,
      style: style,
      color: color,
      formality: formality,
      visualRating: selectedRating,
      textRating: textRating,
      feedbackText: feedbackText,
      text: JSON.stringify(text),
      template: selectedImage,
      model: model,
    };

    console.log(JSON.stringify(feedbackData));
    console.log("Attempting to submit feedback");


    try {
      const response = await fetch('http://localhost:3333/api/submitFeedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      console.log('Feedback submitted successfully');
    } catch (error) {
      console.error('There was a problem with the submission:', error);
    }
  };

  const handleButtonClick = (theme: string) => {
    console.log('Button clicked with theme:', theme);
    setSelectedTheme(theme);
    // generateImage();
    // Add more actions here
    
    // You can add more actions as needed
  };

  const handleSave = () => {
    if (selectedImage && form[selectedImage]) {
      const link = document.createElement('a');
      link.href = form[selectedImage];
      link.download = 'image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error('No image selected');
    }
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
          body: JSON.stringify({ prompt: form.prompt, theme: selectedTheme, color: color, formality: formality, style: style }),  
        });
        const data = await response.json();
        setForm({ 
          ...form, photo: `data:image/jpeg;base64,${data.photo}`, braid: `data:image/jpeg;base64,${data.braid}`, iceberg: `data:image/jpeg;base64,${data.iceberg}`, insight: `data:image/jpeg;base64,${data.insight}`, hunt: `data:image/jpeg;base64,${data.hunt}`,
          tetris: `data:image/jpeg;base64,${data.tetris}`, fish: `data:image/jpeg;base64,${data.fish}`, door: `data:image/jpeg;base64,${data.door}`, newton: `data:image/jpeg;base64,${data.newton}`,
          textBridge: data.textBridge, textBraid: data.textBraid, textFish: data.textFish, textNewton: data.textNewton,
          modelBridge: data.modelBridge, modelBraid: data.modelBraid, modelFish: data.modelFish, modelNewton: data.modelNewton,
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

  const images = [
    { key: 'photo', src: form.photo, alt: 'Photo' },
    { key: 'braid', src: form.braid, alt: 'Braid' },
    { key: 'fish', src: form.fish, alt: 'Fish' },
    { key: 'newton', src: form.newton, alt: 'Newton' },
  ];
  

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
    <div className="w-full bg-violet-200 p-4 flex flex-col justify-center items-center">
      <img src="/src/assets/image.png" alt="Banner Image" className="h-16 mb-4" />
      <h1 className="text-3xl font-bold text-gray-800">Generate Beautiful Visuals From Text</h1>
    </div>
      <div className="w-full max-w-xl mt-3">
        <form className="flex items-center space-x-4 p-2">
          <Textarea
            ref={(textarea) => {
              if (textarea) {
                textarea.style.height = "0px";
                textarea.style.height = textarea.scrollHeight + "px";
              }
            }}
            placeholder="Quote..."
            className="flex-grow p-4 text-lg placeholder:text-lg border border-gray-300 rounded-lg"
            style={{ fontSize: '1rem' }}
            onChange={(e) => setForm({ ...form, prompt: e.target.value })}
          />
          <Button
            type="button"
            className="bg-blue-500 text-white p-4 text-lg rounded-lg hover:bg-blue-600 transition duration-300"
            onClick={generateTheme}
          >
            {generatingTheme ? 'Generating...' : 'Generate'}
          </Button>
        </form>
      </div>

      <div className="flex flex-col items-center space-y-4 mt-4">
        <div className="flex space-x-4">
          <Button
            className="bg-violet-300 text-white py-6 px-10 text-md rounded-lg hover:bg-purple-400 transition duration-300"
            onClick={() => handleButtonClick(themes.theme1)}
          >
            {themes.theme1 || 'Perspective 1'}
          </Button>
          <Button
            className="bg-violet-300 text-white py-6 px-10 text-md rounded-lg hover:bg-purple-400 transition duration-300"
            onClick={() => handleButtonClick(themes.theme2)}
          >
            {themes.theme2 || 'Perspective 2'}
          </Button>
          <Button
            className="bg-violet-300 text-white py-6 px-10 text-md rounded-lg hover:bg-purple-400 transition duration-300"
            onClick={() => handleButtonClick(themes.theme3)}
          >
            {themes.theme3 || 'Perspective 3'}
          </Button>
        </div>
      </div>

      <div className="flex mt-6">
        <div className="flex flex-col gap-4 p-4">
          <Select onValueChange={(value) => setStyle(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="sketch">Sketch</SelectItem>
              {/* <SelectItem value="system">System</SelectItem> */}
            </SelectContent>
          </Select>
          <Select onValueChange={(value) => setColor(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Text Colour" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blue">Blue</SelectItem>
              <SelectItem value="red">Red</SelectItem>
              <SelectItem value="green">Green</SelectItem>
              <SelectItem value="rgb(123, 104, 238)">Gradient</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Coming Soon</SelectItem>
              {/* <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem> */}
            </SelectContent>
          </Select>
          <Select onValueChange={(value) => setFormality(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Formality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="informal">Informal</SelectItem>
              <SelectItem value="formal">Formal</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-2">
            <Switch id="airplane-mode" />
            <Label htmlFor="airplane-mode">Display Quote</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="airplane-mode" />
            <Label htmlFor="airplane-mode">Display Summary</Label>
          </div>
          <Button className="bg-gray-500 text-white p-4 rounded-lg hover:bg-gray-600 transition duration-300" onClick={generateImage}>
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
        <div className="relative bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-96 p-3 h-96 flex justify-center items-center mt-4">
          {form[selectedImage] ? (
            <img
              src={form[selectedImage]}
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
        </div>

        <div className="pl-4">
          <div className="grid grid-cols-2 gap-4 mt-4">
            {images.map((image) => (
              <Button
                key={image.key}
                className={`w-32 h-32 m-0 p-2 bg-white ${selectedImage === image.key ? 'border-4 border-blue-500' : ''}`}
                onClick={() => setSelectedImage(image.key)}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                />
              </Button>
            ))}
          </div>
        </div>

      </div>

      <div className="flex space-x-4 mt-4">
        <Button
          className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition duration-300"
          onClick={handleSave}
        >
          Save
        </Button>

      </div>

      <div className="flex justify-center items-center mt-8">
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          {/* <h3 className="text-xl font-semibold mb-4">Provide your Feedback</h3> */}

          {isSubmitted && (
            <div id="result" className="mt-4 text-green-600 text-lg font-bold" aria-live="polite">
              Thank you! You rated: <span id="submitted-rating">{submittedRating}</span> and <span id="submitted-rating">{submittedTextRating}</span> stars.
            </div>
          )}

          <div id="rating-text" className="text-lg mb-4">
            <strong>How does it look?</strong> {selectedRating} star{selectedRating > 1 ? 's' : ''}
          </div>

          <div id="rating" className="flex space-x-2 mb-4">
            {[1, 2, 3, 4, 5].map((value) => (
              <svg
                key={value}
                className={`w-8 h-8 text-gray-400 hover:text-yellow-400 cursor-pointer ${selectedRating >= value ? 'text-yellow-400' : ''}`}
                fill="currentColor"
                viewBox="0 0 20 20"
                onClick={() => handleStarClick(value)}
                aria-label={`${value} star${value > 1 ? 's' : ''}`}
                role="button"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.95 4.146.018c.958.004 1.355 1.226.584 1.818l-3.36 2.455 1.287 3.951c.3.922-.756 1.688-1.541 1.125L10 13.011l-3.353 2.333c-.785.563-1.841-.203-1.541-1.125l1.287-3.951-3.36-2.455c-.77-.592-.374-1.814.584-1.818l4.146-.018 1.286-3.95z" />
              </svg>
            ))}
          </div>


          <div id="rating-text" className="text-lg mb-4">
            <strong>Does it make sense?</strong> {textRating} star{textRating > 1 ? 's' : ''}
          </div>

          <div id="rating" className="flex space-x-2 mb-4">
            {[1, 2, 3, 4, 5].map((value) => (
              <svg
                key={value}
                className={`w-8 h-8 text-gray-400 hover:text-yellow-400 cursor-pointer ${textRating >= value ? 'text-yellow-400' : ''}`}
                fill="currentColor"
                viewBox="0 0 20 20"
                onClick={() => handleTextStarClick(value)}
                aria-label={`${value} star${value > 1 ? 's' : ''}`}
                role="button"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.95 4.146.018c.958.004 1.355 1.226.584 1.818l-3.36 2.455 1.287 3.951c.3.922-.756 1.688-1.541 1.125L10 13.011l-3.353 2.333c-.785.563-1.841-.203-1.541-1.125l1.287-3.951-3.36-2.455c-.77-.592-.374-1.814.584-1.818l4.146-.018 1.286-3.95z" />
              </svg>
            ))}
          </div>

          <textarea
            id="feedback-text"
            className="w-full p-2 mb-4 border border-gray-300 rounded-md"
            rows="4"
            placeholder="Write details here. Dot points are good."
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
          ></textarea>

          <button
            id="submit-btn"
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
            onClick={handleSubmit}
            disabled={selectedRating === 0 || textRating === 0}
          >
            Submit Rating
          </button>


        </div>
      </div>

    </div>
  );
}

export default App;