import {useCallback, useRef, useState} from "react";
import ErrorMessage from "./components/ErrorMessage.jsx";
import UploadIcon from "./components/UploadIcon.jsx";
import Spinner from "./components/Spinner.jsx";

const App = () => {
    // State to hold the uploaded file for preview
    const [uploadedImage, setUploadedImage] = useState(null);
    // State to hold the actual file object for sending to backend
    const [uploadedFile, setUploadedFile] = useState(null);
    // State to hold the final image from the AI
    const [generatedImage, setGeneratedImage] = useState(null);
    // State for the user's text prompt
    const [prompt, setPrompt] = useState('');
    // State to manage the loading status
    const [isLoading, setIsLoading] = useState(false);
    // State for handling errors
    const [error, setError] = useState(null);
    // Ref to access the hidden file input
    const fileInputRef = useRef(null);

    // Handler for file selection via button or drop
    const handleFileChange = (file) => {
        if (file && file.type.startsWith('image/')) {
            // Set the file object for the backend
            setUploadedFile(file);
            // Create a temporary URL to display the image preview
            setUploadedImage(URL.createObjectURL(file));
            setGeneratedImage(null); // Clear previous result
            setError(null); // Clear previous errors
        } else {
            setError("Please upload a valid image file.");
            setUploadedImage(null);
            setUploadedFile(null);
        }
    };

    // Drag and drop handlers
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileChange(files[0]);
        }
    }, []);

    // Handler for the "browse files" button click
    const onBrowseClick = () => {
        fileInputRef.current.click();
    };

    // Main function to call the backend
    const handleGenerate = async () => {
        if (!uploadedFile) {
            setError("Please upload an image first!");
            return;
        }

        setIsLoading(true);
        setGeneratedImage(null);
        setError(null);

        // Use FormData to package the image file and the prompt
        const formData = new FormData();
        formData.append('image', uploadedFile);
        formData.append('prompt', prompt);

        try {
            // The URL for your Spring Boot backend's endpoint
            const API_URL = 'http://localhost:8080/api/v1/generate';

            const response = await fetch(API_URL, {
                method: 'POST',
                body: formData,
                // Headers are not needed here, fetch sets multipart/form-data boundary automatically
            });

            if (!response.ok) {
                // Try to get a more detailed error from the backend
                const errorText = await response.text();
                throw new Error(`Network response was not ok. Status: ${response.status}. Message: ${errorText}`);
            }

            // The backend returns the image as a binary "blob"
            const resultBlob = await response.blob();

            // Create a temporary URL from the blob to display it in an <img> tag
            setGeneratedImage(URL.createObjectURL(resultBlob));

        } catch (error) {
            console.error('Error generating image:', error);
            setError("Failed to generate image. Please ensure the backend is running and check the console.");
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="bg-[#F5F3EF] min-h-screen font-sans text-gray-800 relative">
            {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

            {/* Header Navigation */}
            <header className="border-b border-gray-300">
                <nav className="container mx-auto flex justify-between items-center p-4 px-8">
                    <div className="text-xl font-bold tracking-wider">Ghibli AI</div>
                    <div className="hidden md:flex items-center space-x-8">
                        <a href="#" className="hover:text-gray-900">Home</a>
                        <a href="#" className="font-semibold text-gray-900">Create</a>
                        <a href="#" className="hover:text-gray-900">Features</a>
                        <a href="#" className="hover:text-gray-900">Gallery</a>
                        <a href="#" className="hover:text-gray-900">FAQ</a>
                    </div>
                    <button onClick={handleGenerate} disabled={isLoading || !uploadedFile} className="bg-orange-900 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {isLoading ? 'Creating...' : 'Create'}
                    </button>
                </nav>
            </header>

            {/* Main Content Area */}
            <main className="container mx-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Left Column: Uploader */}
                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg flex flex-col">
                    <h2 className="text-xl font-semibold mb-4">Upload Your Image for Ghibli Art Transformation</h2>
                    <div
                        className="flex-grow border-2 border-dashed border-gray-300 rounded-xl flex flex-col justify-center items-center text-center p-6 transition-colors"
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        {uploadedImage ? (
                            <img src={uploadedImage} alt="Uploaded preview" className="max-h-96 w-auto rounded-lg object-contain"/>
                        ) : (
                            <div>
                                <UploadIcon className="mx-auto mb-4" />
                                <p className="text-gray-600">Drag and drop your image here</p>
                                <p className="text-gray-500 text-sm my-2">or</p>
                                <button onClick={onBrowseClick} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                                    Browse files
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={(e) => handleFileChange(e.target.files[0])}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </div>
                        )}
                    </div>
                    <label htmlFor="prompt" className="text-md font-semibold mt-6 mb-2">Input prompt</label>
                    <textarea
                        id="prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-800 focus:border-transparent transition"
                        rows="3"
                        placeholder="Describe what kind of Ghibli art you want to create..."
                    ></textarea>
                </div>

                {/* Right Column: Result */}
                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg flex flex-col justify-center items-center">
                    <h2 className="text-xl font-semibold mb-4 self-start">Your Ghibli Image Result</h2>
                    <div className="w-full h-full flex justify-center items-center border-2 border-gray-200 rounded-xl bg-gray-50">
                        {isLoading ? (
                            <Spinner />
                        ) : generatedImage ? (
                            <img src={generatedImage} alt="Generated Ghibli art" className="max-h-[32rem] w-auto rounded-lg object-contain"/>
                        ) : (
                            <p className="text-center text-gray-500 max-w-sm">
                                Upload an image and click the Create button to start your Studio Ghibli art magical journey with our Ghibli generator.
                            </p>
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
}

export default App;