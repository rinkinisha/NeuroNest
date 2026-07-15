import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const SpeechToTextButton = ({ onTranscript, isListening, setIsListening }) => {
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript && onTranscriptRef.current) {
        onTranscriptRef.current(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      if (event.error !== 'no-speech') {
        setError(`Error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [setIsListening]);

  useEffect(() => {
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setError('');
      } catch (e) {
        console.error(e);
      }
    } else if (!isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const toggleListening = (e) => {
    e.preventDefault(); // Prevent form submission if inside a form
    if (error && !recognitionRef.current) {
      alert(error);
      return;
    }
    setIsListening(prev => !prev);
  };

  return (
    <div className="relative flex items-center justify-center">
      <button
        onClick={toggleListening}
        type="button"
        title="Use Voice Input"
        className={`p-3 rounded-full transition-all duration-300 shadow-md flex items-center justify-center ${
          isListening 
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.6)]' 
            : 'bg-dark-700 hover:bg-primary-600 text-dark-300 hover:text-white border border-dark-600'
        }`}
      >
        {isListening ? (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <Mic size={20} />
          </motion.div>
        ) : (
          <Mic size={20} />
        )}
      </button>
      
      {/* Ripple effect when listening */}
      {isListening && (
        <motion.div
          className="absolute inset-0 rounded-full border border-red-500"
          initial={{ opacity: 0.8, scale: 1 }}
          animate={{ opacity: 0, scale: 2 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
          style={{ pointerEvents: 'none' }}
        />
      )}
    </div>
  );
};

export default SpeechToTextButton;
