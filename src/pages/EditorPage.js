import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import '../App.css';
import axios from 'axios';
const EditorPage = () => {
  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const location = useLocation();
  const { roomId } = useParams();
  const reactNavigator = useNavigate();
  const [clients, setClients] = useState([]);
  const [language, setLanguage] = useState('default');
  const [input, setInput] = useState('false');
  const [compilerData, setCompilerData] = useState([]);

  const handleSelectChange = (event) => {
    setLanguage(event.target.value);
    console.log('langyage',language);
  };
  const handleSelectChangeOnInput = (event) => {
    setInput(event.target.value);
    console.log(input);
  };

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on('connect_error', (err) => handleErrors(err));
      socketRef.current.on('connect_failed', (err) => handleErrors(err));

      function handleErrors(e) {
        console.log('socket error', e);
        toast.error('Socket connection failed, try again later.');
        reactNavigator('/');
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username,
      });

      // Listening for joined event
      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId }) => {
          if (username !== location.state?.username) {
            toast.success(`${username} joined the room.`);
            console.log(`${username} joined`);
          }
          setClients(clients);
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current,
            socketId,
          });
        }
      );

      // Listening for disconnected
      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room.`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });
    };
    init();
    // clearing listeners
    return () => {
      socketRef.current.disconnect();
      socketRef.current.off(ACTIONS.JOINED);
      socketRef.current.off(ACTIONS.DISCONNECTED);
    };
  }, []);

  async function copyRoomId() {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success('Room ID has been copied to your clipboard');
    } catch (err) {
      toast.error('Could not copy the Room ID');
      console.error(err);
    }
  }

  function downloadTextFile() {
    const content = codeRef.current;
    const fileName = 'code.txt';
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
  
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    
    element.click();
  
    document.body.removeChild(element);
  }

  async function getCompilerData(){
    setCompilerData('Loading...');
   
    

    var inputData="";
    if(input==='true')
    {
      inputData = window.prompt('Enter the input here');
    }
    console.log('inputData',codeRef.current);
    const data = {
      code:codeRef.current,
      inputRadio: input,
      lang: language,
      input: inputData
    }
    console.log(data);
    axios.post('http://localhost:5000/compile',data)
  .then(response => {
    // console.log("working",response.data);
    setCompilerData(response.data);
    console.log(compilerData);
  })
  .catch(error => {
    console.error(error);
  });
  console.log("btn working");
  }
  

  function leaveRoom() {
    reactNavigator('/');
  }

  if (!location.state) {
    return <Navigate to='/' />;
  }
  <Navigate />;

  return (
    
    <div className='mainWrap'>
    <div className='editorWrap'>
    <Editor
      socketRef={socketRef}
      roomId={roomId}
      onCodeChange={(code) => {
        codeRef.current = code;
      }}
    />
      <div className='compilerBody'>
      <div className='compiler'> Result: {compilerData}</div>
      <div className='selectOpt'>
        <select value={language} onChange={handleSelectChange} className='optionClass'>
          <option value='default' defaultChecked>Select Language</option>
          <option value='C++'>C++</option>
          <option value='Java'>Java</option>
          <option value='Python'>Python</option>
        </select>
      <div>Input: 
        <select value={input} onChange={handleSelectChangeOnInput}>
          <option value='false'>No</option>
          <option value='true'>Yes</option>
        </select>
      </div>
      </div>
      </div>
      </div>
      <div className='aside'>
        <div className='asideInner'>
          <div className='logo'>
            <h1>We code</h1>
          </div>
          <h3>Connected</h3>
          <div className='clientsList'>
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
        </div>
        <div className='buttons'>
        <button className='btn copyBtn' onClick={copyRoomId}>
          Copy Room ID
        </button>
        <button className='btn copyBtn' onClick={downloadTextFile}>
          Download Code
        </button>
        <button className='btn copyBtn' onClick={getCompilerData}>
          Compile Code
        </button>
        <button className='btn leaveBtn' onClick={leaveRoom}>
          Leave Room
        </button>
        </div>
      </div>
      
      
    </div>
  );
};

export default EditorPage;
