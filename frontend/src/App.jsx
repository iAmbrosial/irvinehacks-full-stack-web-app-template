import PoseTracker from './components/PoseTracker';
import './App.css';

function App() {
  return (
    <div className="App" style={{
      backgroundColor: '#282c34',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
    }}>
      <h1>ZotHacks AI Fitness Coach</h1>

      {/* 调用你辛苦写好的组件 */}
      <PoseTracker />

      <div style={{ marginTop: '20px', color: '#888' }}>
        Please allow your browser to access the camera.
      </div>
    </div>
  );
}

export default App;
