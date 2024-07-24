import { Box, Button, Stack, TextField } from "@mui/material";
import { useState } from "react";
import MeetingV2 from "./meeting";

const App = () => {
  const [isStartCall, setIsStartCall] = useState<boolean>(false);
  const [roomInfo, setRoomInfo] = useState<{
    roomname: string;
    appId: string;
    name: string;
    sessionId: string;
    token: string;
  }>({
    roomname: "",
    appId: "",
    name: "",
    sessionId: "",
    token: "",
  });

  const handleJoinRoom = async () => {
    const res = await fetch(
      `http://localhost:4000/api/room/${roomInfo.roomname}`
    );
    const dataJson = await res.text();
    const data = JSON.parse(dataJson);
    setRoomInfo((prev) => ({
      ...prev,
      appId: data.apiKey,
      sessionId: data.sessionId,
      token: data.token,
    }));
    setIsStartCall(true);
  };

  return (
    <Stack
      flexDirection={"column"}
      justifyContent={"center"}
      alignItems={"center"}
      mt={10}
    >
      <Stack spacing={2} mb={1}>
        <TextField
          size="small"
          label="Name"
          onChange={(event) => {
            setRoomInfo((prev) => ({ ...prev, name: event.target.value }));
          }}
        />
        <TextField
          size="small"
          label="Roomname"
          onChange={(event) => {
            setRoomInfo((prev) => ({ ...prev, roomname: event.target.value }));
          }}
        />
      </Stack>
      <Box mb={1}>
        <Button variant="contained" color="info" onClick={handleJoinRoom}>
          Join room
        </Button>
      </Box>
      <MeetingV2
        setStartCallVideo={setIsStartCall}
        startCallVideo={isStartCall}
        appKey={roomInfo.appId}
        name={roomInfo.name}
        sessionId={roomInfo.sessionId}
        token={roomInfo.token}
      />
    </Stack>
  );
};
export default App;
