import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SymptomSelector = ({ allSymptoms, selectedSymptoms, setSelectedSymptoms }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleToggleSymptom = (symptom) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const fuzzySearch = (term, items) => {
    if (!term) return [];
    
    const lowerCaseTerm = term.toLowerCase();
    
    const results = items
      .filter(item => !selectedSymptoms.includes(item))
      .map(item => {
        const lowerCaseItem = item.toLowerCase();
        let score = 0;

        if (lowerCaseItem.startsWith(lowerCaseTerm)) {
          score += 10;
        } else if (lowerCaseItem.includes(lowerCaseTerm)) {
          score += 5;
        }

        // Higher score for closer length
        score -= Math.abs(lowerCaseItem.length - lowerCaseTerm.length) * 0.1;

        return { item, score };
      })
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(result => result.item);

    return results;
  };

  const filteredSymptoms = fuzzySearch(searchTerm, allSymptoms);

  return (
    <div className="w-full mx-auto">
      {/* Selected Symptoms Tray */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-primary mb-2">
          Selected Symptoms ({selectedSymptoms.length})
        </h3>
        <div className="p-3 bg-gray-800/50 border border-gray-700/50 rounded-lg flex flex-wrap gap-2">
          <AnimatePresence>
            {selectedSymptoms.length > 0 ? selectedSymptoms.map((symptom) => (
              <motion.div
                key={symptom}
                layout
                initial={{ opacity: 0, y: -10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="bg-secondary/80 text-white px-3 py-1.5 rounded-full flex items-center gap-2 text-base"
              >
                <span>{symptom}</span>
                <button
                  onClick={() => handleToggleSymptom(symptom)}
                  className="bg-white/20 hover:bg-white/40 rounded-full w-5 h-5 flex items-center justify-center"
                >
                  &times;
                </button>
              </motion.div>
            )) : (
              <span className="text-gray-400 text-sm">No symptoms selected yet.</span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Search and Symptom List */}
      <div>
         <h3 className="text-lg font-semibold text-primary mb-2">Add Symptoms</h3>
        <input
          type="text"
          placeholder="Search for symptoms to add..."
          className="w-full px-4 py-2 mb-4 bg-gray-800/50 border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="max-h-64 overflow-y-auto flex flex-wrap gap-2 p-1">
          {searchTerm && filteredSymptoms.map((symptom) => (
            <motion.button
              key={symptom}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              onClick={() => handleToggleSymptom(symptom)}
              className="bg-gray-700/50 hover:bg-primary hover:text-background text-text px-3 py-1.5 rounded-full text-base transition-colors duration-200"
            >
              {symptom}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SymptomSelector;
