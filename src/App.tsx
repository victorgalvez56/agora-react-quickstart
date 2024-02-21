// @ts-nocheck
import { CSSProperties, useEffect, useState } from "react";
import {
  AgoraRTCProvider,
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  usePublish,
  useRTCClient,
  useRemoteAudioTracks,
  useRemoteUsers,
  RemoteUser,
  LocalVideoTrack,
  useClientEvent,
  useScreenVideoTrack
} from "agora-rtc-react";
import AgoraRTC, { ILocalAudioTrack, ILocalVideoTrack } from "agora-rtc-sdk-ng";
import "./App.css";
import io from 'socket.io-client';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import { PhoneForwarded } from "@mui/icons-material";
import { Box, TextField } from "@mui/material";
import { Button, Modal } from "@mui/base";

// const socket = io('http://localhost:3005', { transports: ['websocket', 'polling', 'flashsocket'] });
const socket = io('https://calling.snapcode.app', { transports: ['websocket', 'polling', 'flashsocket'] });

function App() {
  const client = useRTCClient(AgoraRTC.createClient({ codec: "vp8", mode: "rtc" }));
  const [channelName, setChannelName] = useState('');
  const [AppID, setAppID] = useState("e083fa7320264dafacd225603c559330");
  const [token, setToken] = useState("");
  const [inCall, setInCall] = useState(false);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [llamadaEnCurso, setLlamadaEnCurso] = useState(false);
  const [idLlamada, setIdLlamada] = useState(null);
  const [idMySocket, setIdMySocket] = useState<string | undefined>('')
  const [usuariosConectados, setUsuariosConectados] = useState<{ id: string, name: string }[]>([]);
  const [userName, setUserName] = useState(null);
  const [showEnterUser, setShowEnterUser] = useState(true);
  const [llamadaEntrante, setLlamadaEntrante] = useState(false);
  const [modalCalling, setModalCalling] = useState(false);
  const [receptor, setReceptor] = useState('');
  const audioUrl = '/michi_llamada.mp3'; // Ruta relativa al archivo de audio
  const [dataCalling, setDataCalling] = useState<{
    emisor: { id: string, name: string },
    receptor: { id: string, name: string }
  }>()
  const [alert1, setAlert1] = useState(true);

  useEffect(() => {
    console.warn(socket)
    socket.on("connect", () => {
      setIdMySocket(socket.id);
    });
    socket.on('usuariosConectados', (usuarios) => {
      usuarios = usuarios.filter(objeto => objeto.id !== socket.id);
      setUsuariosConectados(usuarios);
    });
    socket.on('recibirRespuestaLlamada', (response) => {
      if (response.response == "yes") {
        setInCall(true)
        setDataCalling(response.dataCalling)
      } else {
        setLlamadaEntrante(false);
        setModalCalling(false)
        audio.pause();
        if (alert1) {
          alert("Se denegó la llamada por parte de " + response.dataCalling.receptor.name)
          setAlert1(false)
        }

      }
    });
    socket.emit('getUsuariosConectados');

    socket.on('llamadaEntrante', (data) => {
      setDataCalling(data)
      setLlamadaEntrante(true);
      setModalCalling(true)
      audio.play();
    });
    return () => {
      // socket.disconnect();
    };
  }, []);

  const conectarUsuario = (nombreUsuario) => {
    socket.emit('nuevoUsuario', nombreUsuario);
  };

  const notificarLlamada = (idReceptor) => {
    socket.emit('notificarLlamada', { receptor: idReceptor, emisor: idMySocket });
  };

  const responderLlamada = (response) => {
    socket.emit('responderLlamada', { dataCalling, response });
    if (response === 'yes') {
      setInCall(true)
    }
    audio.pause();
    setLlamadaEntrante(false)
    setModalCalling(false)
    // Continuar con la lógica de Agora para establecer la videollamada
    // ...
  };
  const handleLlamadaEntrante = () => {

  };
  const style = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    pt: 2,
    px: 4,
    pb: 3,
  };
  return (
    <>
      <audio id="audio" src={audioUrl}></audio>
      {llamadaEntrante ?
        <>
          <Modal
            open={modalCalling}
            onClose={() => setModalCalling(false)}
            aria-labelledby="parent-modal-title"
            aria-describedby="parent-modal-description"
          >
            <Box sx={{ ...style, width: 400, color: 'black' }}>
              <h2 id="parent-modal-title">LLamada entrante de : {dataCalling?.emisor.name}</h2>
              <Button style={{ backgroundColor: 'green' }} onClick={e => responderLlamada("yes")}>Contestar</Button>
              <Button style={{ backgroundColor: 'red' }} onClick={e => responderLlamada("no")}>Denegar</Button>
            </Box>
          </Modal>
        </>
        :
        <div style={styles.container}>
          <h1 style={{ color: 'black' }}>Agora React Videocall</h1>
          <div style={{ alignSelf: 'center', width: 500 }}>
            {
              !inCall ? (
                <>
                  {showEnterUser ?
                    <>
                      <h2 style={{ color: 'black' }}>Digite su nombre completo</h2>
                      <TextField id="outlined-basic" variant="outlined"
                        onChange={(e) => setUserName(e.target.value)}
                      />

                      <div style={{ marginTop: 10 }}>
                        <Button onClick={() => {
                          conectarUsuario(userName);
                          setShowEnterUser(false)
                        }} variant="contained">Conectar</Button>
                      </div>
                    </> :
                    <div >
                      <h2 style={{ color: 'black' }}>Usuarios Disponibles:  {usuariosConectados.length}</h2>
                      <h2 style={{ color: 'black' }}>{idMySocket}</h2>
                      <List sx={{
                        width: '100%',
                        maxWidth: 360,
                        paddingRight: 10,
                        paddingLeft: 10,
                        borderRadius: 10
                      }}>
                        {usuariosConectados.map((value) => (
                          <>
                            {idMySocket !== value.id &&
                              <ListItem
                                key={value.id}
                                disableGutters
                                secondaryAction={
                                  <IconButton aria-label="comment" onClick={() => {
                                    notificarLlamada(value.id);
                                    // (AppID ? setInCall(true) : alert("Please enter Agora App ID and Channel Name"))
                                  }}
                                  >
                                    <PhoneForwarded />
                                  </IconButton >
                                }
                              >
                                <ListItemText style={{ color: 'black' }} primary={`${value.name}`} />
                              </ListItem>
                            }
                          </>
                        ))}
                      </List>
                    </div>
                  }
                </>
              ) : (
                <>
                  <h4 style={{ color: 'black' }}>
                    {"Canal llamada : " + dataCalling?.emisor.id + dataCalling?.receptor.id}
                  </h4>
                  <AgoraRTCProvider client={client}>
                    <Videos channelName={dataCalling?.emisor.id + dataCalling?.receptor.id} AppID={AppID} token={token} />
                    <br />
                    <Button onClick={() => setInCall(false)}>End Call</Button>
                  </AgoraRTCProvider>
                </>
              )
            }
          </div >
          {/* <>
          {llamadaEnCurso && (
            <div>
              <p>Llamada en curso...</p>
              <button onClick={responderLlamada}>Responder</button>
            </div>
          )}
        </div>
        {
          !inCall ? (
            <Form
              AppID={AppID}
              setAppID={setAppID}
              channelName={channelName}
              setChannelName={setChannelName}
              token={token}
              setToken={setToken}
              setInCall={setInCall}
            />
          ) : (
            <AgoraRTCProvider client={client}>
              <Videos channelName={channelName} AppID={AppID} token={token} />
              <br />
              <button onClick={() => setInCall(false)}>End Call</button>
            </AgoraRTCProvider>
          )
        }
      </> */}
        </div >}
    </>
  );
}

const Videos = (props: { channelName: string; AppID: string; token: string }) => {
  const { AppID, channelName, token } = props;
  const client = useRTCClient();
  const { ready: audioReady, isLoading: isLoadingMic, localMicrophoneTrack } = useLocalMicrophoneTrack();
  const { ready: videoReady, isLoading: isLoadingCam, localCameraTrack } = useLocalCameraTrack();
  const remoteUsers = useRemoteUsers();
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localScreenTrack, setLocalScreenTrack] = useState<ILocalVideoTrack | null>(null);
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);

  useClientEvent(client, "user-published", (user) => {
    console.log(user);
  });

  // useClientEvent(client, "user-published", (user, mediaType) => {
  //   client.subscribe(user, mediaType);
  // });
  usePublish([localMicrophoneTrack, localCameraTrack]);


  // usePublish(localMicrophoneTrack ? [localMicrophoneTrack] : []);
  // usePublish(videoReady && !isScreenSharing ? [localVideoTrack] : []);
  // usePublish(isScreenSharing && localScreenTrack ? [localScreenTrack] : []);


  useJoin({
    appid: AppID,
    channel: channelName,
    token: token === "" ? null : token,
  });

  const startScreenShare = async () => {
    if (!isScreenSharing) {
      const screenTrack = await AgoraRTC.createScreenVideoTrack();
      setLocalScreenTrack(screenTrack);
      setIsScreenSharing(true);
      if (localCameraTrack) {
        await client.unpublish([localCameraTrack]);
      }
      await client.publish([screenTrack]);
    }
  };

  const stopScreenShare = async () => {
    if (isScreenSharing && localScreenTrack) {
      await client.unpublish([localScreenTrack]);
      localScreenTrack.close();
      setLocalScreenTrack(null);
      setIsScreenSharing(false);
      if (localVideoTrack) {
        await client.publish([localVideoTrack]);
      }
    }
  };

  const toggleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  // if (!audioReady || !videoReady) {
  //   return <h4 style={{ color: 'black' }}>
  //     Loading devices...
  //   </h4>
  // }

  const deviceLoading = isLoadingMic || isLoadingCam;
  if (deviceLoading) return <div style={styles.grid}>Loading devices...</div>;

  const deviceUnavailable = !localCameraTrack || !localMicrophoneTrack;
  if (deviceUnavailable) return <div style={styles.grid}>Please allow camera and microphone permissions</div>;
  return (
    <>
      <div style={{ ...styles.grid, ...returnGrid(remoteUsers) }}>
        <LocalVideoTrack track={localCameraTrack} play={true} style={styles.gridCell} />
        {remoteUsers.map((user) => (
          <RemoteUser user={user} style={styles.gridCell} />
        ))}
      </div>
      <br />
      <div style={styles.btnContainer}>
        <button onClick={() => void localMicrophoneTrack.setMuted(!localMicrophoneTrack.muted)}>Mute Mic</button>
        <button onClick={() => void localCameraTrack.setMuted(!localCameraTrack.muted)}>Mute Cam</button>
        <button onClick={toggleScreenShare}>{isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
        </button>
      </div>
    </>
  );
};

/* Standard form to enter AppID and Channel Name */
function Form(props: {
  AppID: string;
  setAppID: React.Dispatch<React.SetStateAction<string>>;
  channelName: string;
  setChannelName: React.Dispatch<React.SetStateAction<string>>;
  token: string;
  setToken: React.Dispatch<React.SetStateAction<string>>;
  setInCall: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { AppID, setAppID, channelName, setChannelName, token, setToken, setInCall } = props;
  return (
    <div>
      <p>Please enter your Agora AppID and Channel Name</p>
      <label htmlFor="appid">Agora App ID: </label>
      <input id="appid" type="text" value={AppID} onChange={(e) => setAppID(e.target.value)} placeholder="required" />
      <br />
      <label htmlFor="channel">Channel Name: </label>
      <input
        id="channel"
        type="text"
        value={channelName}
        onChange={(e) => setChannelName(e.target.value)}
        placeholder="required"
      />
      <br />
      <label htmlFor="token">Channel Token: </label>
      <input id="token" type="text" value={token} onChange={(e) => setToken(e.target.value)} placeholder="optional" />
      <br />
      <button
        onClick={() => (AppID && channelName ? setInCall(true) : alert("Please enter Agora App ID and Channel Name"))}
      >
        Join
      </button>
    </div>
  );
}

export default App;

/* Style Utils */
const returnGrid = (remoteUsers: Array<unknown>) => {
  return {
    gridTemplateColumns:
      remoteUsers.length > 8
        ? unit.repeat(4)
        : remoteUsers.length > 3
          ? unit.repeat(3)
          : remoteUsers.length > 0
            ? unit.repeat(2)
            : unit,
  };
};
const unit = "minmax(0, 1fr) ";
const styles = {
  grid: {
    width: "100%",
    height: "100%",
    display: "grid",
  },
  gridCell: { height: "100%", width: "100%" },
  container: {
    display: "flex",
    flexDirection: "column" as CSSProperties["flexDirection"],
    flex: 1,
    justifyContent: "center",
  },
  btnContainer: {
    display: "flex",
    flexDirection: "row" as CSSProperties["flexDirection"],
    alignSelf: "center",
    width: "50%",
    justifyContent: "space-evenly",
  },
};
