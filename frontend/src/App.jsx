import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import SymptomSelector from './components/SymptomSelector.jsx';
import PredictionOutput from './components/PredictionOutput.jsx';
import SkeletonCard from './components/SkeletonCard.jsx';
import DiseaseDictionary from './components/DiseaseDictionary.jsx';
import Landing from './components/landing.jsx';
import './background.css';

const API_URL = 'http://127.0.0.1:5000';

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [allSymptoms, setAllSymptoms] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showLanding) {
      return;
    }
    const fetchSymptoms = async () => {
      console.log("Attempting to fetch symptoms...");
      try {
        const response = await axios.get(`${API_URL}/symptoms`);
        console.log("Symptoms response received:", response);
        console.log("Symptoms data:", response.data);
        setAllSymptoms(response.data);
      } catch (error) {
        console.error('Error fetching symptoms:', error);
      }
    };
    fetchSymptoms();
  }, [showLanding]);

  const handlePredict = async () => {
    if (selectedSymptoms.length === 0) {
      return;
    }
    setPredictions([]); // Clear previous predictions
    setLoading(true);
    try {
      // Simulate a network delay for visual effect
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      const response = await axios.post(`${API_URL}/predict`, {
        symptoms: selectedSymptoms,
      });
      setPredictions(response.data);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
    setLoading(false);
  };

  const handleClear = () => {
    setSelectedSymptoms([]);
    setPredictions([]);
  };

  if (showLanding) {
    return <Landing onLaunch={() => setShowLanding(false)} />;
  }

  return (
    <div id="app" className="min-h-screen text-text flex flex-col items-center py-10 px-4">
        <DiseaseDictionary />
        <div className="background">
           <span></span>
           <span></span>
           <span></span>
           <span></span>
           <span></span>
           <span></span>
           <span></span>
           <span></span>
           <span></span>
           <span></span>
        </div>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center mb-10"
      >
        <h1 className="text-5xl font-bold text-primary">CureCast</h1>
        <p className="mt-2 text-lg text-secondary">Your AI Disease Navigator</p>
      </motion.div>

      <div className="w-full max-w-lg p-8 glassmorphism-card">
        <SymptomSelector
          allSymptoms={allSymptoms}
          selectedSymptoms={selectedSymptoms}
          setSelectedSymptoms={setSelectedSymptoms}
        />
        <div className="flex gap-4">
        <motion.button
          onClick={handlePredict}
          disabled={loading || selectedSymptoms.length === 0}
          className="w-full mt-6 py-3 bg-primary text-background font-bold rounded-lg disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(0, 245, 195, 0.5)" }}
          whileTap={{ scale: 0.95 }}
        >
          {loading ? 'Analyzing...' : 'Get Prediction'}
        </motion.button>
        {selectedSymptoms.length > 0 && (
            <motion.button
              onClick={handleClear}
              className="w-full mt-6 py-3 bg-red-500 text-white font-bold rounded-lg transition-all duration-300"
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255, 0, 0, 0.5)" }}
              whileTap={{ scale: 0.95 }}
            >
              Clear
            </motion.button>
          )}
        </div>
      </div>

      {loading && (
        <div className="w-full max-w-md mx-auto mt-8">
           <h2 className="text-2xl font-bold text-center mb-4 text-primary">Top 3 Predictions</h2>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}
      
      {!loading && predictions.length > 0 && (
        <PredictionOutput predictions={predictions} />
      )}
    </div>
  );
}

export default App;
