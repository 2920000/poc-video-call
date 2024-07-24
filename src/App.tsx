import { Box, Button, Stack, TextField } from "@mui/material";
import { useState } from "react";
import MeetingV2 from "./meeting";

const App = () => {
  const [isStartCall, setIsStartCall] = useState<boolean>(false);
  const [roomInfo, setRoomInfo] = useState<{
    appId: string;
    sessionId: string;
    token: string;
    name: string;
  }>({
    appId: "2183b19b-5bf1-4c54-ba21-9f77bc758362",
    sessionId:
      "1_MX40MmExMDRjYy1iYTM0LTQ3ODAtODU2Yy05OTVkNjg3ZmY5MTJ-fjE3MjE3MjM2MzQ5Nzl-ZWxsN051c2Q2WnRhZDBEdE11aStSTUVNfn5-",
    token:
      "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InNlc3Npb24uY29ubmVjdCIsInNlc3Npb25faWQiOiIxX01YNDBNbUV4TURSall5MWlZVE0wTFRRM09EQXRPRFUyWXkwNU9UVmtOamczWm1ZNU1USi1makUzTWpFM01qTTJNelE1TnpsLVpXeHNOMDUxYzJRMlduUmhaREJFZEUxMWFTdFNUVVZOZm41LSIsInJvbGUiOiJwdWJsaXNoZXIiLCJpbml0aWFsX2xheW91dF9jbGFzc19saXN0IjoiIiwiZXhwIjoxNzIxODEwMDM1LCJzdWIiOiJ2aWRlbyIsImFjbCI6eyJwYXRocyI6eyIvc2Vzc2lvbi8qKiI6e319fSwiY29ubmVjdGlvbl9kYXRhIjoicHVibGlzaGVyIiwianRpIjoiMmJhOWRiNzItZmY0YS00MDIyLTg1OWMtNDVkNTg4OGUyYjFlIiwiaWF0IjoxNzIxNzIzNjM0LCJhcHBsaWNhdGlvbl9pZCI6IjQyYTEwNGNjLWJhMzQtNDc4MC04NTZjLTk5NWQ2ODdmZjkxMiJ9.dFb7D3dAa3e78iiViNag2voTXVmpYwN0VH_JLTjiIG0m1HmKRDmrqMSsdqYKNvuw0mQr5L3vPnQKues6rNdepxXaRID535Y95uWJpkLcTDi2wqTQgxHopy_M4KTGYT3OsQikjT10MXOTzy788hNlssHondZRlqcZCe3mmQvuS4uOmeXMMDi34hHa7SGNdB7WaitTDLBmD7GahwEQ_djthqA27cUXUw3j5J5lutSNjkU5ff8kA1-apXJjwOegddPHmAe0TxpE7syGpzIwWCcBjSTj8VP4KQJK9ke4IDQb9i1BAE2-B0E7PqbyksUVt95UHz6lcpAwtV_3ka-n8m8vwg",
    name: "",
  });

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
          label="ApiId"
          onChange={(event) => {
            setRoomInfo((prev) => ({ ...prev, appId: event.target.value }));
          }}
          value={roomInfo.appId}
        />
        <TextField
          size="small"
          label="SessionId"
          onChange={(event) => {
            setRoomInfo((prev) => ({
              ...prev,
              sessionId: event.target.value,
            }));
          }}
          value={roomInfo.sessionId}
        />
        <TextField
          size="small"
          label="Token"
          onChange={(event) => {
            setRoomInfo((prev) => ({ ...prev, token: event.target.value }));
          }}
          value={roomInfo.token}
        />
        <TextField
          size="small"
          label="Name"
          onChange={(event) => {
            setRoomInfo((prev) => ({ ...prev, name: event.target.value }));
          }}
        />
      </Stack>
      <Box mb={1}>
        <Button
          variant="contained"
          color="info"
          onClick={() => setIsStartCall(true)}
        >
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
